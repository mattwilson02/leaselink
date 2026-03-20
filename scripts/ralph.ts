import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "child_process";
import { readFileSync, readdirSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";

// ─── Config ────────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, "..");
const SPRINTS_DIR = join(ROOT, "docs", "sprints");
const PRODUCT_SPEC = join(ROOT, "PRODUCT_SPEC.md");
const BASE_BRANCH = "dev";
const MAX_FIX_ATTEMPTS = 3;
const MAX_RESUME_ATTEMPTS = 3;

// Model allocation — Opus for high-leverage decisions, Sonnet for execution
const MODELS = {
  specWriter: "claude-opus-4-6",
  builder: "claude-sonnet-4-6",
  webAgent: "claude-sonnet-4-6",
  mobileAgent: "claude-sonnet-4-6",
  fixAgent: "claude-sonnet-4-6",
} as const;

// CLI args
const args = process.argv.slice(2);
const startSprint = Number(
  args.find((a) => a.startsWith("--start-sprint="))?.split("=")[1] ?? 2,
);
const singleMode = args.includes("--single");
const maxSprints = singleMode
  ? 1
  : Number(
      args.find((a: string) => a.startsWith("--max-sprints="))?.split("=")[1] ?? 10,
    );

// ─── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function run(cmd: string, cwd = ROOT): string {
  log(`  $ ${cmd}`);
  return execSync(cmd, { cwd, encoding: "utf-8", stdio: "pipe" }).trim();
}

function runSafe(cmd: string, cwd = ROOT): { ok: boolean; output: string } {
  try {
    return { ok: true, output: run(cmd, cwd) };
  } catch (e: any) {
    return {
      ok: false,
      output: ((e.stdout ?? "") + "\n" + (e.stderr ?? "")).trim(),
    };
  }
}

interface AgentResult {
  result: string;
  subtype: string;
  turns: number;
  cost: number;
  sessionId?: string;
}

/** Run an agent with automatic resumption on max_turns / context exhaustion */
async function runAgent(
  prompt: string,
  opts: Parameters<typeof query>[0]["options"],
): Promise<string> {
  let sessionId: string | undefined;
  let totalTurns = 0;
  let totalCost = 0;

  for (let attempt = 0; attempt <= MAX_RESUME_ATTEMPTS; attempt++) {
    const isResume = attempt > 0 && sessionId;
    const currentPrompt = isResume
      ? "You were interrupted because you ran out of turns. Continue exactly where you left off — do NOT restart or re-read files you already processed. Pick up the task and finish it."
      : prompt;

    const currentOpts = isResume
      ? { ...opts, sessionId, maxTurns: opts?.maxTurns }
      : opts;

    if (isResume) {
      log(`  ⚡ Resuming agent (attempt ${attempt + 1}/${MAX_RESUME_ATTEMPTS}, session: ${sessionId})`);
    }

    const { result, subtype, turns, cost } = await runAgentOnce(currentPrompt, currentOpts);

    totalTurns += turns;
    totalCost += cost;

    if (subtype === "success") {
      log(`  ✓ Agent completed (${totalTurns} turns, $${totalCost.toFixed(4)})`);
      return result;
    }

    if (subtype === "error_max_turns") {
      log(`  ⚠ Agent hit max turns (${totalTurns} total so far, $${totalCost.toFixed(4)})`);
      if (attempt === MAX_RESUME_ATTEMPTS) {
        log("  ✗ Agent exhausted all resume attempts — continuing with partial work");
        return result;
      }
      continue;
    }

    // Any other error — don't retry, just warn and return
    log(`  ⚠ Agent stopped with: ${subtype} (${totalTurns} turns, $${totalCost.toFixed(4)})`);
    return result;
  }

  return "";
}

/** Single agent invocation — returns structured result */
async function runAgentOnce(
  prompt: string,
  opts: Parameters<typeof query>[0]["options"],
): Promise<AgentResult> {
  let sessionId: string | undefined;
  let result = "";
  let subtype = "success";
  let turns = 0;
  let cost = 0;

  for await (const message of query({ prompt, options: opts })) {
    const msg = message as Record<string, unknown>;

    // Capture session ID for potential resumption
    if (msg.type === "system" && msg.subtype === "init" && typeof msg.session_id === "string") {
      sessionId = msg.session_id;
    }

    // Capture final result
    if (msg.type === "result") {
      result = typeof msg.result === "string" ? msg.result : "";
      subtype = typeof msg.subtype === "string" ? msg.subtype : "success";
      turns = typeof msg.num_turns === "number" ? msg.num_turns : 0;
      cost = typeof msg.total_cost_usd === "number" ? msg.total_cost_usd : 0;
    }
  }

  return { result, subtype, turns, cost, sessionId };
}

// ─── Sprint State Persistence ────────────────────────────────────────────────

type SprintPhase =
  | "spec"              // Phase 1: writing spec
  | "backend"           // Phase 2a: backend builder
  | "backend_verify"    // Phase 2b: backend verification gate
  | "frontend"          // Phase 2c: frontend builders
  | "contract_verify"   // Phase 2d: frontend/backend contract verification
  | "full_verify"       // Phase 3: full verification
  | "audit"             // Phase 3b: spec compliance audit
  | "pr";               // Phase 4: commit, push, PR

interface SprintState {
  sprint: number;
  phase: SprintPhase;
  specName?: string;
  specPath?: string;
  branchName?: string;
}

const STATE_FILE = join(ROOT, ".ralph-state.json");

function saveState(state: SprintState) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadState(): SprintState | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function clearState() {
  try { unlinkSync(STATE_FILE); } catch {}
}

/** Load existing sprint spec files sorted by number */
function getExistingSprintSpecs(): { number: number; name: string; content: string }[] {
  if (!existsSync(SPRINTS_DIR)) return [];
  return readdirSync(SPRINTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const match = f.match(/^sprint-(\d+)/);
      return {
        number: match ? Number(match[1]) : 0,
        name: f.replace(/\.md$/, ""),
        content: readFileSync(join(SPRINTS_DIR, f), "utf-8"),
      };
    });
}

// ─── Phase 1: Spec Writer ──────────────────────────────────────────────────────

async function writeSprintSpec(sprintNumber: number): Promise<{ name: string; path: string }> {
  log(`\n📋 Phase 1: Writing spec for Sprint ${sprintNumber}...`);

  const productSpec = readFileSync(PRODUCT_SPEC, "utf-8");
  const previousSpecs = getExistingSprintSpecs();
  const previousSpecsSummary = previousSpecs
    .map((s) => `### ${s.name}\n${s.content}`)
    .join("\n\n---\n\n");

  const prompt = `You are the sprint planning agent for LeaseLink, a property management platform.

Your job: write a sprint spec for Sprint ${sprintNumber}.

## Context

### Product Spec
${productSpec}

### Previous Sprint Specs (already implemented)
${previousSpecsSummary || "Sprint 1 (foundation) has been implemented — shared types, enums, constants, Zod schemas, and Prisma schema updates are done."}

## Instructions

1. Read the product spec and previous sprints carefully
2. Read the EXISTING codebase (especially apps/api/CLAUDE.md) to understand established patterns
3. Determine what should be built NEXT — pick a logical, focused chunk of work

4. Write the spec with these sections:
   - **Overview** — goal and rationale for why this sprint comes next
   - **What Exists** — brief summary of relevant prior work
   - **Architectural Decisions** — cross-cutting decisions the builder and subagents MUST follow. Examples: "Use Kubb for API client generation (see apps/mobile/kubb.config.ts)", "Use React Query via generated hooks, not hand-written fetch wrappers", "Reuse the existing BlobStorage service for file uploads". These prevent agents from reinventing patterns that already exist in the codebase.
   - **Tasks** — broken down by agent (Backend, Web, Mobile), each with:
     - Objective
     - Files to create/modify (full paths)
     - Requirements — business rules, edge cases, relationships, validation rules
     - What patterns to follow (reference by name, e.g. "follow the Client entity pattern")
     - Acceptance criteria
     - Test cases (inputs/outputs)
   - **API Response Contracts** — for each new endpoint, specify the EXACT response shape that the controller will return (e.g. "GET /properties/:id returns { property: PropertyHttpResponse }"). Frontend builders MUST match these shapes exactly in their hooks. This prevents the most common integration bug: frontend assuming { data } when the API returns { entityName }.
   - **Business Rules & State Machines** — explicitly define entity status transitions, eligibility rules, and cross-entity constraints. For example: "Which property statuses allow lease creation? (VACANT, LISTED — not OCCUPIED or MAINTENANCE)". "When a lease is created, property status changes to OCCUPIED." These rules MUST be consistent between backend validation and frontend filtering — if the backend rejects a status, the frontend must not show it as an option. Never leave status eligibility to builder interpretation.
   - **Test Requirements** — for each use case and controller, specify required test files:
     - Unit test (.spec.ts) for EVERY use case — including getters/queries, not just mutations
     - E2E test (.e2e-spec.ts) for EVERY controller
     - List specific test scenarios (success, error cases, edge cases)
   - **Implementation order** and **Definition of Done**

5. **DO NOT write implementation code.** The builder agents can read the codebase and follow existing patterns. Instead, focus on:
   - WHAT to build (interfaces, relationships, fields, endpoints)
   - WHY (business rules, constraints, edge cases)
   - WHERE (file paths, which modules to wire into)
   - HOW it differs from existing patterns (only call out what's NEW or DIFFERENT)

   Bad: writing out a full entity class with every getter/setter
   Good: "Create Property entity following the Client entity pattern. Additional business logic: status transitions must follow PROPERTY_STATUS_TRANSITIONS from shared constants."

6. The spec should be split into sections for:
   - **Backend agent** — apps/api and packages/shared
   - **Web agent** — apps/web
   - **Mobile agent** — apps/mobile
   Mark each task clearly with which agent handles it.

7. The sprint should be sized for a few hours of agent work — not too small, not too large.

IMPORTANT: Write the spec file to docs/sprints/sprint-${sprintNumber}-<descriptive-name>.md
The filename should describe the sprint's focus (e.g., sprint-2-property-crud-api.md).

After writing the file, output ONLY the filename (e.g., "sprint-2-property-crud-api") on the last line.`;

  const result = await runAgent(prompt, {
    cwd: ROOT,
    model: MODELS.specWriter,
    allowedTools: ["Read", "Write", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 50,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append:
        "\nYou are writing a sprint spec. Focus on WHAT to build, WHY, and WHERE — not HOW. Never write implementation code in the spec. Reference existing patterns by name (e.g. 'follow the Client entity pattern') instead of rewriting them. The builder agents have full codebase access. Do NOT implement any code — only write the spec document.",
    },
  });

  // Find the spec file that was just created
  const specs = getExistingSprintSpecs();
  const newSpec = specs.find((s) => s.number === sprintNumber);
  if (!newSpec) {
    throw new Error(`Spec writer did not create a sprint-${sprintNumber}-*.md file`);
  }

  log(`  → Spec written: ${newSpec.name}`);
  return { name: newSpec.name, path: join(SPRINTS_DIR, `${newSpec.name}.md`) };
}

// ─── Phase 2: Builder ─────────────────────────────────────────────────────────

async function runBackendBuilder(specPath: string) {
  log("\n🔨 Phase 2a: Running backend builder agent...");

  const sprintSpec = readFileSync(specPath, "utf-8");

  const prompt = `You are the backend builder agent for a sprint implementation.

## Your Scope
Implement ALL backend and shared-package work:
- packages/shared/ (types, enums, constants, validation schemas)
- apps/api/ (domain entities, use cases, controllers, repositories, tests)

## Rules
- Follow the existing DDD architecture in apps/api/ — read CLAUDE.md and existing code BEFORE writing
- **TEST COVERAGE IS MANDATORY:**
  - Every use case MUST have a corresponding .spec.ts unit test file
  - Every controller MUST have a corresponding .e2e-spec.ts E2E test file
  - Follow the existing test patterns — look at existing .spec.ts and .e2e-spec.ts files before writing new ones
  - Use in-memory repositories for unit tests, real DB (PrismaService) for E2E tests
  - Use JwtFactory for E2E auth tokens
  - Unit tests must cover: success case, each error case, edge cases
  - Do NOT skip getter/query use case tests — they need specs too
- **TEST QUALITY — READ THIS:**
  - After writing each test, re-read the use case code and verify your test assertions match the ACTUAL behavior
  - If the use case allows status X, your test must NOT assert that status X is rejected (and vice versa)
  - Tests must assert the correct response shape — if the use case returns { lease }, the test must check result.value.lease
  - Run tests after writing them. If a test fails, READ the use case again before "fixing" the test — the use case is probably right
  - Default status values come from the entity's create() method — read it before asserting initial status
- **ENV VARS:** If you add new env vars to src/infra/env/env.ts, they MUST be .optional().default('...') with sensible defaults so E2E tests and CI don't break. Never add required env vars without updating CI. Also update apps/api/.env.example with the new vars.
- **RESPONSE SHAPE CONSISTENCY:** When writing controllers, be consistent with response shapes. For single-entity endpoints, return { entityName: presenter.toHTTP(entity) } (e.g. { property: ... }, { lease: ... }). For list endpoints, return { data: presenter.toHTTPList(entities), meta: { page, pageSize, totalCount, totalPages } }. Frontend builders read your controller return statements to build their hooks — inconsistent shapes cause integration bugs.
- After ALL work is done, run these checks and fix any failures:
  1. cd packages/shared && npm run build
  2. cd apps/api && npx prisma generate
  3. cd apps/api && npm run format
  4. cd apps/api && npm run type-check
  5. cd apps/api && npm run test

## Sprint Spec

${sprintSpec}`;

  await runAgent(prompt, {
    cwd: ROOT,
    model: MODELS.builder,
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 200,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append:
        "\nYou are the backend builder in an automated sprint. Work autonomously. Only modify packages/shared/ and apps/api/.",
    },
  });

  log("  ✓ Backend builder finished");
}

async function runFrontendBuilders(specPath: string) {
  log("\n🔨 Phase 2c: Running frontend builder agents...");

  const sprintSpec = readFileSync(specPath, "utf-8");

  // Check if the sprint has web/mobile tasks by looking for keywords
  const specContent = sprintSpec.toLowerCase();
  const hasWebTasks = specContent.includes("apps/web") || specContent.includes("web agent") || specContent.includes("web dashboard");
  const hasMobileTasks = specContent.includes("apps/mobile") || specContent.includes("mobile agent") || specContent.includes("mobile app");

  if (!hasWebTasks && !hasMobileTasks) {
    log("  → No frontend tasks in this sprint, skipping");
    return;
  }

  // Spawn a coordinator that delegates to web/mobile subagents in parallel
  const prompt = `You are the frontend coordinator for a sprint. The backend work is ALREADY DONE.

Your job: spawn web and mobile subagents IN PARALLEL using the Agent tool.
${hasWebTasks ? '- Spawn a "web" subagent for apps/web/ work' : "- No web tasks in this sprint"}
${hasMobileTasks ? '- Spawn a "mobile" subagent for apps/mobile/ work' : "- No mobile tasks in this sprint"}

Include the full sprint spec in each subagent's prompt so they know what to build.
Include any Architectural Decisions from the spec so they follow the same conventions.

## Sprint Spec

${sprintSpec}`;

  await runAgent(prompt, {
    cwd: ROOT,
    model: MODELS.builder,
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Agent"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 100,
    agents: {
      web: {
        description: "Web dashboard builder for apps/web/",
        model: MODELS.webAgent,
        prompt: `You build the Next.js web dashboard. Only modify files in apps/web/. You CAN import from @leaselink/shared.

CRITICAL — API CONTRACT ALIGNMENT (DO THIS FIRST OR YOU WILL BREAK THE BUILD):
Before writing ANY hook or API call, you MUST:
1. Find the controller: Glob for apps/api/src/infra/http/controllers/**/*.controller.ts matching the endpoint name
2. READ the controller's handle() method — note the EXACT return statement
3. If it uses a presenter, READ the presenter file too — it transforms field names
4. Your hook's response type MUST match the controller's return shape EXACTLY

MANDATORY WORKFLOW for each hook:
1. Read the controller file
2. Copy the response shape into a comment in your hook file (e.g. // Controller returns: { property: PropertyHttpResponse })
3. Define your TypeScript interface to match that exact shape
4. Only then write the hook logic

Common patterns from this codebase:
- Single entity: { entityName: ... } (e.g. { property }, { lease }, { payment })
- List endpoints: { data: [...], meta: { page, pageSize, totalCount, totalPages } } OR { entityNamePlural: [...], totalCount }
- Downloads: { downloadUrl, blobName, expiresOn }
- NEVER assume { data } — always verify

VALIDATION CHECKLIST (run before finishing):
1. cd apps/web && npm run build — must pass
2. For EVERY hook you wrote, grep the controller to confirm the response shape matches
3. Check that status filters/dropdowns use the same values the backend validates against (read the use case)`,
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      },
      mobile: {
        description: "Mobile app builder for apps/mobile/",
        model: MODELS.mobileAgent,
        prompt: `You build the Expo React Native mobile app. Only modify files in apps/mobile/. You CAN import from @leaselink/shared.

CRITICAL — API CONTRACT ALIGNMENT (DO THIS FIRST OR YOU WILL BREAK THE BUILD):
Before writing ANY API call or hook, you MUST:
1. Find the controller: Glob for apps/api/src/infra/http/controllers/**/*.controller.ts matching the endpoint name
2. READ the controller's handle() method — note the EXACT return statement
3. If it uses a presenter, READ the presenter file too
4. Your hook's response type MUST match the controller's return shape EXACTLY

MANDATORY WORKFLOW for each hook:
1. Read the controller file
2. Copy the response shape into a comment in your hook file
3. Define your TypeScript interface to match that exact shape
4. Only then write the hook logic

Common patterns from this codebase:
- Single entity: { entityName: ... } (e.g. { property }, { lease }, { payment })
- List endpoints: { data: [...], meta: { page, pageSize, totalCount, totalPages } } OR { entityNamePlural: [...], totalCount }
- Blob storage URLs: replace 'backend-blob-storage' with 'localhost' for mobile access
- NEVER assume { data } — always verify

VALIDATION CHECKLIST (run before finishing):
1. cd apps/mobile && npx tsc --noEmit — must pass
2. For EVERY hook you wrote, grep the controller to confirm the response shape matches
3. Check field names match exactly (e.g. photos vs photoUrls, blobName vs name)`,
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      },
    },
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append:
        "\nYou are the frontend coordinator. Spawn web and mobile subagents in parallel. Do NOT implement anything yourself.",
    },
  });

  log("  ✓ Frontend builders finished");
}

// ─── Phase 2d: Contract Verification ─────────────────────────────────────────

async function verifyContracts(specPath: string) {
  log("\n🔗 Phase 2d: Verifying frontend/backend contracts...");

  const sprintSpec = readFileSync(specPath, "utf-8");

  const prompt = `You are a contract verification agent. Your ONLY job: verify that every frontend hook matches its corresponding API controller response shape.

## Sprint Spec (for context on what was built)
${sprintSpec}

## Instructions
1. Find all hook files modified or created in this sprint:
   - apps/web/src/hooks/
   - apps/mobile/src/hooks/
2. For EACH hook that makes an API call:
   a. Read the hook — note what response shape it expects (the TypeScript interface/type)
   b. Find and read the corresponding controller in apps/api/src/infra/http/controllers/
   c. If the controller uses a presenter, read the presenter too
   d. Compare: do the property names match EXACTLY?
3. Common mismatches to check:
   - Hook expects \`response.data\` but controller returns \`{ entityName: ... }\`
   - Hook expects \`photoUrls\` but API returns \`photos\`
   - Hook expects \`{ data: [...] }\` but controller returns \`{ entityPlural: [...], totalCount }\`
   - Hook uses wrong field for file type detection (e.g. blobName instead of name)
4. If you find mismatches: FIX THEM in the frontend hooks to match the controller
5. After fixes, run: cd apps/web && npm run build && cd ../mobile && npx tsc --noEmit

If everything matches, just confirm and exit.`;

  await runAgent(prompt, {
    cwd: ROOT,
    model: MODELS.specWriter, // Opus for accuracy
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 50,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: "\nYou verify and fix frontend/backend contract mismatches. Be thorough — read every hook and its corresponding controller.",
    },
  });

  log("  ✓ Contract verification finished");
}

// ─── Phase 3: Test & Fix ──────────────────────────────────────────────────────

interface VerifyResult {
  passed: boolean;
  output: string;
}

// Dummy env vars for boot smoke test — doesn't need real services, just module resolution
const BOOT_SMOKE_ENV = [
  "DATABASE_URL=postgresql://x:x@localhost:5432/x",
  "BLOB_STORAGE_ACCOUNT_NAME=x",
  "BLOB_STORAGE_ACCOUNT_KEY=x",
  "BLOB_STORAGE_CONTAINER_NAME=x",
  "BLOB_STORAGE_ENDPOINT=http://localhost:10000",
  "BLOB_STORAGE_CONNECTION_STRING=x",
  "TWILIO_ACCOUNT_SID=x",
  "TWILIO_AUTH_TOKEN=x",
  'TWILIO_PHONE_NUMBER="+10000000000"',
  "SMTP_HOST=localhost",
  "SMTP_PORT=587",
  "SMTP_USER=x",
  "SMTP_PASSWORD=x",
  "SMTP_FROM_EMAIL=x@x.com",
  "APP_NAME=LeaseLink",
  "AZURE_AD_CLIENT_ID=x",
  "AZURE_AD_CLIENT_SECRET=x",
  "AZURE_AD_TENANT_ID=x",
  "STRIPE_SECRET_KEY=sk_test_placeholder",
  "STRIPE_WEBHOOK_SECRET=whsec_placeholder",
  "STRIPE_SUCCESS_URL=http://localhost:3333/payments/checkout/success",
  "STRIPE_CANCEL_URL=http://localhost:3333/payments/checkout/cancel",
].join(" ");

/**
 * Boot smoke test — builds the API and tries to start it.
 * Catches module resolution errors (ERR_MODULE_NOT_FOUND) that tsc --noEmit misses.
 * Passes if the process fails for non-module reasons (e.g. DB connection refused).
 */
function bootSmokeTest(): { ok: boolean; output: string } {
  log("  ⏳ Boot Smoke Test (module resolution)...");

  // Build the API
  const build = runSafe("npm run build", join(ROOT, "apps/api"));
  if (!build.ok) {
    return { ok: false, output: `nest build failed:\n${build.output}` };
  }

  // Try to start — kill after 15s. We only care if it crashes on module resolution.
  const { ok, output } = runSafe(
    `${BOOT_SMOKE_ENV} timeout 15 node dist/main.js 2>&1 || true`,
    join(ROOT, "apps/api"),
  );

  // These indicate broken module graph — real failures
  const moduleErrors = [
    "ERR_MODULE_NOT_FOUND",
    "Cannot find module",
    "ERR_UNSUPPORTED_DIR_IMPORT",
    "ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX",
  ];

  const combined = output || "";
  const hasModuleError = moduleErrors.some((e) => combined.includes(e));

  if (hasModuleError) {
    return { ok: false, output: `Boot smoke test FAILED — module resolution error:\n${combined}` };
  }

  log("  ✓ Boot Smoke Test (module resolution OK)");
  return { ok: true, output: "" };
}

/** Run a subset of checks (backend-only or full) */
function verify(scope: "backend" | "full" = "full"): VerifyResult {
  log(`\n🔍 Running verification (${scope})...`);

  const backendChecks = [
    { name: "Shared Build", cmd: "npm run build", cwd: join(ROOT, "packages/shared") },
    { name: "Prisma Generate", cmd: "npx prisma generate", cwd: join(ROOT, "apps/api") },
    { name: "API Format", cmd: "npm run format", cwd: join(ROOT, "apps/api") },
    { name: "API Type Check", cmd: "npm run type-check", cwd: join(ROOT, "apps/api") },
    { name: "API Unit Tests", cmd: "npm run test", cwd: join(ROOT, "apps/api") },
    { name: "API Boot Smoke Test", cmd: "__BOOT_SMOKE__", cwd: "" },
  ];

  const e2eChecks = [
    { name: "API E2E Tests", cmd: "npm run test:e2e", cwd: join(ROOT, "apps/api") },
  ];

  const frontendChecks = [
    { name: "Web Build", cmd: "npm run build", cwd: join(ROOT, "apps/web") },
    { name: "Mobile Type Check", cmd: "npx tsc --noEmit", cwd: join(ROOT, "apps/mobile") },
  ];

  const checks = scope === "backend" ? backendChecks : [...backendChecks, ...e2eChecks, ...frontendChecks];

  const results: string[] = [];
  let allPassed = true;

  for (const check of checks) {
    // Special case: boot smoke test
    if (check.cmd === "__BOOT_SMOKE__") {
      const smoke = bootSmokeTest();
      if (smoke.ok) {
        results.push(`✓ ${check.name}`);
      } else {
        allPassed = false;
        results.push(`✗ ${check.name}\n${smoke.output}`);
        log(`  ✗ ${check.name} FAILED`);
      }
      continue;
    }

    const { ok, output } = runSafe(check.cmd, check.cwd);
    if (ok) {
      results.push(`✓ ${check.name}`);
      log(`  ✓ ${check.name}`);
    } else {
      allPassed = false;
      results.push(`✗ ${check.name}\n${output}`);
      log(`  ✗ ${check.name} FAILED`);
    }
  }

  return { passed: allPassed, output: results.join("\n\n") };
}

// ─── Spec Compliance Audit ────────────────────────────────────────────────────

interface AuditResult {
  complete: boolean;
  missing: string[];
  summary: string;
}

async function auditSpecCompliance(specPath: string): Promise<AuditResult> {
  log("\n🔎 Auditing spec compliance...");

  const sprintSpec = readFileSync(specPath, "utf-8");
  const diff = runSafe("git diff --stat HEAD~1", ROOT).output;

  const prompt = `You are a strict sprint auditor. Your job: determine if the sprint spec was FULLY implemented.

## Sprint Spec
${sprintSpec}

## Files Changed (git diff --stat)
${diff}

## Instructions
1. Read the sprint spec carefully — extract every task, endpoint, entity, test, and acceptance criterion
2. Check the actual codebase to verify each item was implemented
3. Be thorough — check that entities exist, use cases are wired, controllers are registered, tests are written
4. Do NOT count optional/stretch goals as missing
5. **TEST COVERAGE AUDIT (CRITICAL):**
   - For EVERY use case file in the sprint's domain(s), verify a corresponding .spec.ts exists
   - For EVERY controller file in the sprint, verify a corresponding .e2e-spec.ts exists
   - If any use case or controller is missing its test file, list it as a missing item
   - This is a hard requirement — incomplete test coverage = incomplete sprint
   - **TEST QUALITY CHECK:** For each test file, read both the test AND its use case. Verify:
     - Tests assert what the code actually does (e.g. if use case allows VACANT status, test must NOT assert it's rejected)
     - Default entity status in tests matches the entity's create() method
     - Response shape in test assertions matches the use case return type
     - If a test contradicts the use case logic, flag it as a missing item
6. **ENV VAR AUDIT:** Check if any new env vars were added to src/infra/env/env.ts. If they are required (not .optional().default()), flag as missing — all new env vars must have defaults. Also check that apps/api/.env.example includes them.
7. **API CONTRACT AUDIT (CRITICAL):** For each new controller endpoint, verify that the frontend hooks (apps/web/src/hooks/ and apps/mobile/) use the EXACT response property names from the controller's return statement. For example, if a controller returns { property: ... }, the hook must access response.property, NOT response.data. Check every hook that calls a new endpoint — mismatched response shapes are a critical integration bug.
8. **BUSINESS RULE CONSISTENCY AUDIT:** Verify that backend validation rules (use case guards, status checks, eligibility logic) are mirrored in the frontend. For example: if the backend only allows creating a lease for VACANT or LISTED properties, the frontend form must filter to those same statuses — not a different set. Check every status filter, dropdown filter, and conditional UI against the corresponding use case validation.

Respond with EXACTLY this JSON format and nothing else:
\`\`\`json
{
  "complete": true/false,
  "missing": ["description of missing item 1", "description of missing item 2"],
  "summary": "one sentence overall assessment"
}
\`\`\`

If everything in the spec was implemented, set complete=true and missing=[].
Be strict but fair — if a feature works but was implemented slightly differently than spec'd, that's fine.`;

  const result = await runAgent(prompt, {
    cwd: ROOT,
    model: MODELS.specWriter, // Opus for judgment calls
    allowedTools: ["Read", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 30,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: "\nYou are an auditor. Read code to verify implementation completeness. Do NOT modify any files. Output only the JSON result.",
    },
  });

  // Parse the JSON from the agent's response
  try {
    const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{[\s\S]*"complete"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      log(`  ${parsed.complete ? "✓" : "✗"} Audit: ${parsed.summary}`);
      if (!parsed.complete && parsed.missing?.length > 0) {
        for (const item of parsed.missing) {
          log(`    → Missing: ${item}`);
        }
      }
      return {
        complete: parsed.complete ?? false,
        missing: parsed.missing ?? [],
        summary: parsed.summary ?? "",
      };
    }
  } catch {
    log("  ⚠ Could not parse audit result — treating as incomplete");
  }

  return { complete: false, missing: ["Audit result could not be parsed"], summary: "Audit failed" };
}

// ─── Fix Agent ───────────────────────────────────────────────────────────────

async function fixErrors(verifyOutput: string, attempt: number): Promise<void> {
  log(`\n🔧 Fix attempt ${attempt}/${MAX_FIX_ATTEMPTS}...`);

  const prompt = `The verification suite FAILED after a sprint implementation. Fix ALL the errors below.
Do NOT change the sprint's intended functionality — only fix type errors, lint issues, and failing tests.

Read the error output carefully. Look at the actual files to understand the context before making changes.
After fixing, run the failing checks again to verify your fixes work.

VERIFICATION OUTPUT:
---
${verifyOutput}`;

  await runAgent(prompt, {
    cwd: ROOT,
    model: MODELS.fixAgent,
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 100,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: "\nYou are a fix agent. Only fix errors — do not add features or change functionality.",
    },
  });
}

// ─── Phase 3c: Human Action Items ──────────────────────────────────────────

async function generateHumanActions(sprintNumber: number, specPath: string): Promise<string> {
  log("\n📋 Generating human action items...");

  const sprintSpec = readFileSync(specPath, "utf-8");
  const diff = runSafe("git diff --stat HEAD~1", ROOT).output;
  const envFile = runSafe("cat apps/api/src/infra/env/env.ts", ROOT).output;

  const prompt = `You are scanning a sprint implementation for anything that requires HUMAN intervention — things an automated agent cannot do.

## Sprint Spec
${sprintSpec}

## Files Changed
${diff}

## Current env.ts
${envFile}

## What to look for
Scan the codebase changes and identify items that need a human to:
1. **External service setup** — API keys, webhook URLs, dashboard configurations (e.g., Stripe webhook endpoint, Twilio phone number purchase, OAuth app registration)
2. **CI/CD secrets** — new env vars that need real values in GitHub Secrets or deployment configs
3. **Database migrations** — if Prisma schema changed, migrations need to be run against staging/production
4. **Third-party integrations** — anything requiring account setup, API access approval, or manual configuration
5. **DNS/Infrastructure** — domain changes, SSL certs, load balancer config
6. **Manual testing** — flows that can't be fully E2E tested (e.g., OAuth flows, payment flows with real cards)

If there are NO human actions needed, respond with just: NONE

Otherwise respond with a markdown checklist like:
- [ ] **Stripe webhook**: Configure webhook endpoint in Stripe Dashboard pointing to /api/payments/stripe-webhook for events: checkout.session.completed
- [ ] **CI Secret**: Add STRIPE_SECRET_KEY to GitHub Actions secrets for production deployment

Be specific — include URLs, exact steps, and what values are needed. Do NOT list things the agent already handled (like code changes or test writing).`;

  const result = await runAgent(prompt, {
    cwd: ROOT,
    model: MODELS.specWriter,
    allowedTools: ["Read", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 20,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: "\nYou are scanning for human action items. Read code to check what external setup is needed. Do NOT modify any files. Be concise and specific.",
    },
  });

  if (result.trim() === "NONE" || result.trim().length === 0) {
    log("  ✓ No human actions needed");
    return "";
  }

  // Write to docs/sprints/sprint-N-human-actions.md
  const actionsPath = join(SPRINTS_DIR, `sprint-${sprintNumber}-human-actions.md`);
  writeFileSync(actionsPath, `# Sprint ${sprintNumber} — Human Action Items\n\n${result}\n`);
  log(`  → Human actions written to ${actionsPath}`);
  return result;
}

// ─── Phase 4: Commit, Push, PR, Merge ─────────────────────────────────────────

function commitAndPR(sprintNumber: number, sprintName: string, branchName: string, humanActions: string) {
  log(`\n📦 Phase 4: Committing and opening PR...`);

  // Stage and commit
  run("git add -A");
  const title = sprintName.replace(/^sprint-\d+-/, "").replace(/-/g, " ");
  const commitMsg = `feat(sprint-${sprintNumber}): ${title}`;
  runSafe(
    `git commit -m "${commitMsg}\n\nAutomated sprint implementation.\n\nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"`,
  );

  // Push
  run(`git push -u origin ${branchName}`);

  // Create PR — use writeFileSync to avoid shell escaping issues with spec content
  const prTitle = `[Sprint ${sprintNumber}] ${title}`;
  const specContent = readFileSync(
    join(SPRINTS_DIR, `${sprintName}.md`),
    "utf-8",
  );
  const specPreview = specContent.split("\n").slice(0, 50).join("\n");

  const humanActionsSection = humanActions
    ? `\n\n## ⚠️ Human Action Items\n\n${humanActions}`
    : "";
  const prBody = `## Sprint ${sprintNumber}\n\n${specPreview}${humanActionsSection}\n\n---\nAutomated sprint implementation by Claude Code sprint runner.`;
  const prBodyFile = join(ROOT, ".pr-body.tmp.md");
  writeFileSync(prBodyFile, prBody);

  const { ok, output: prUrl } = runSafe(
    `gh pr create --title "${prTitle}" --base ${BASE_BRANCH} --body-file "${prBodyFile}"`,
  );

  try { unlinkSync(prBodyFile); } catch {};

  if (ok) {
    log(`  → PR created: ${prUrl}`);

    // Auto-merge
    const { ok: mergeOk } = runSafe(`gh pr merge --auto --squash`);
    if (mergeOk) {
      log(`  → Auto-merge enabled`);
    }
  } else {
    log(`  ⚠ PR creation failed: ${prUrl}`);
  }
}

// ─── Main Loop ─────────────────────────────────────────────────────────────────

async function main() {
  log("═══════════════════════════════════════════════════════════");
  log("  LeaseLink Sprint Runner");
  log(`  Base branch: ${BASE_BRANCH}`);
  log(`  Starting at sprint: ${startSprint}`);
  log(`  Max sprints: ${maxSprints}`);
  log("═══════════════════════════════════════════════════════════");

  for (
    let sprint = startSprint;
    sprint < startSprint + maxSprints;
    sprint++
  ) {
    const sprintStart = Date.now();
    log(`\n${"═".repeat(60)}`);
    log(`  SPRINT ${sprint}`);
    log(`${"═".repeat(60)}`);

    try {
      // ── Check for interrupted sprint state
      const savedState = loadState();
      let resumePhase: SprintPhase = "spec";
      let sprintName = "";
      let specPath = "";
      let branchName = "";

      if (savedState && savedState.sprint === sprint) {
        resumePhase = savedState.phase;
        sprintName = savedState.specName ?? "";
        specPath = savedState.specPath ?? "";
        branchName = savedState.branchName ?? "";
        log(`\n🔄 Resuming interrupted sprint ${sprint} from phase: ${resumePhase}`);
        log(`   Branch: ${branchName}`);

        // Checkout the existing branch with partial work
        runSafe(`git checkout ${branchName}`);
      } else {
        // Fresh sprint — branch off current HEAD (may be previous sprint's branch)
        // PRs target BASE_BRANCH for human review; we keep building forward

        const tempBranch = `sprint/${sprint}`;
        const { ok } = runSafe(`git checkout -b ${tempBranch}`);
        if (!ok) {
          run(`git checkout ${tempBranch}`);
        }

        // ── Check for pre-written spec (skip Phase 1 if spec already exists)
        const existingSpec = getExistingSprintSpecs().find((s) => s.number === sprint);

        if (existingSpec) {
          log(`\n📋 Phase 1: Using pre-written spec: ${existingSpec.name}`);
          sprintName = existingSpec.name;
          specPath = join(SPRINTS_DIR, `${existingSpec.name}.md`);
        } else {
          // ── Phase 1: Write spec
          saveState({ sprint, phase: "spec" });
          const spec = await writeSprintSpec(sprint);
          sprintName = spec.name;
          specPath = spec.path;

          run("git add -A");
          runSafe(`git commit -m "docs: add ${sprintName} spec"`);
        }

        branchName = `sprint/${sprintName}`;
        if (branchName !== tempBranch) {
          run(`git branch -m ${tempBranch} ${branchName}`);
        }

        resumePhase = "backend";
      }

      // ── Phase 2a: Backend build
      if (resumePhase === "backend" || resumePhase === "spec") {
        saveState({ sprint, phase: "backend", specName: sprintName, specPath, branchName });
        await runBackendBuilder(specPath);
        resumePhase = "backend_verify";
      }

      // ── Phase 2b: Backend verification gate
      if (resumePhase === "backend_verify") {
        saveState({ sprint, phase: "backend_verify", specName: sprintName, specPath, branchName });
        log("\n🔍 Phase 2b: Backend verification gate...");
        let { passed, output } = verify("backend");
        let fixAttempt = 0;

        while (!passed && fixAttempt < MAX_FIX_ATTEMPTS) {
          fixAttempt++;
          await fixErrors(output, fixAttempt);
          ({ passed, output } = verify("backend"));
        }

        if (!passed) {
          log(`\n❌ Sprint ${sprint} backend failed verification after ${MAX_FIX_ATTEMPTS} fix attempts.`);
          log("Stopping. Re-run ralph to resume from backend_verify phase.");
          process.exit(1);
        }

        log("\n✅ Backend verification passed — safe to start frontend work");
        resumePhase = "frontend";
      }

      // ── Phase 2c: Frontend build
      if (resumePhase === "frontend") {
        saveState({ sprint, phase: "frontend", specName: sprintName, specPath, branchName });
        await runFrontendBuilders(specPath);
        resumePhase = "contract_verify";
      }

      // ── Phase 2d: Contract verification
      if (resumePhase === "contract_verify") {
        saveState({ sprint, phase: "contract_verify", specName: sprintName, specPath, branchName });
        await verifyContracts(specPath);
        resumePhase = "full_verify";
      }

      // ── Phase 3: Full verification
      let passed = false;
      let output = "";
      let fixAttempt = 0;

      if (resumePhase === "full_verify") {
        saveState({ sprint, phase: "full_verify", specName: sprintName, specPath, branchName });
        ({ passed, output } = verify("full"));

        while (!passed && fixAttempt < MAX_FIX_ATTEMPTS) {
          fixAttempt++;
          await fixErrors(output, fixAttempt);
          ({ passed, output } = verify("full"));
        }

        if (!passed) {
          log(`\n❌ Sprint ${sprint} failed full verification after ${MAX_FIX_ATTEMPTS} fix attempts.`);
          log("Stopping. Re-run ralph to resume from full_verify phase.");
          process.exit(1);
        }

        log(`\n✅ Sprint ${sprint} full verification passed!`);
        resumePhase = "audit";
      }

      // ── Phase 3b: Spec compliance audit
      if (resumePhase === "audit") {
        saveState({ sprint, phase: "audit", specName: sprintName, specPath, branchName });
        const audit = await auditSpecCompliance(specPath);

        if (!audit.complete) {
          log(`\n⚠ Spec audit found ${audit.missing.length} missing item(s) — sending builder back in`);

          const missingList = audit.missing.map((m, i) => `${i + 1}. ${m}`).join("\n");
          await runAgent(
            `The spec compliance audit found these items were NOT implemented:\n\n${missingList}\n\nImplement the missing items now. The sprint spec is at: ${specPath}\nRead the spec and the existing code, then fill in the gaps. Run verification checks after.`,
            {
              cwd: ROOT,
              model: MODELS.builder,
              allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
              permissionMode: "bypassPermissions",
              allowDangerouslySkipPermissions: true,
              maxTurns: 150,
              systemPrompt: {
                type: "preset",
                preset: "claude_code",
                append: "\nYou are a builder fixing missing sprint items. Implement only what's listed as missing. Run checks after.",
              },
            },
          );

          ({ passed, output } = verify("full"));
          if (!passed) {
            fixAttempt = 0;
            while (!passed && fixAttempt < MAX_FIX_ATTEMPTS) {
              fixAttempt++;
              await fixErrors(output, fixAttempt);
              ({ passed, output } = verify("full"));
            }
            if (!passed) {
              log(`\n❌ Sprint ${sprint} failed verification after gap-fill.`);
              log("Stopping. Re-run ralph to resume from audit phase.");
              process.exit(1);
            }
          }

          const reaudit = await auditSpecCompliance(specPath);
          if (!reaudit.complete) {
            log(`\n⚠ Still ${reaudit.missing.length} missing item(s) after gap-fill — proceeding with partial sprint`);
          }
        }

        resumePhase = "pr";
      }

      // ── Phase 3c: Human action items
      const humanActions = await generateHumanActions(sprint, specPath);

      // ── Phase 4: Commit, Push, PR
      saveState({ sprint, phase: "pr", specName: sprintName, specPath, branchName });
      commitAndPR(sprint, sprintName, branchName, humanActions);

      // Sprint done — PR is up for human review, continue from this branch
      clearState();
      log(`  → PR open for review — next sprint branches off ${branchName}`);

      const elapsed = Math.round((Date.now() - sprintStart) / 60_000);
      log(`\n✅ Sprint ${sprint} complete! (${elapsed} min)\n`);
    } catch (e: any) {
      log(`\n❌ Sprint ${sprint} failed with error: ${e.message}`);
      log("State saved — re-run ralph to resume from where it crashed.");
      process.exit(1);
    }
  }

  log("\n🎉 All sprints complete!\n");
}

main().catch((e) => {
  log(`Fatal: ${e.message}`);
  process.exit(1);
});
