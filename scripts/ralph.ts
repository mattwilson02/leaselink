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
  | "spec"           // Phase 1: writing spec
  | "backend"        // Phase 2a: backend builder
  | "backend_verify" // Phase 2b: backend verification gate
  | "frontend"       // Phase 2c: frontend builders
  | "full_verify"    // Phase 3: full verification
  | "audit"          // Phase 3b: spec compliance audit
  | "pr";            // Phase 4: commit, push, PR

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
- Every new feature must have unit tests
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
        prompt:
          "You build the Next.js web dashboard. Only modify files in apps/web/. You CAN import from @leaselink/shared. Read existing code patterns before writing. After implementation verify: cd apps/web && npm run build",
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      },
      mobile: {
        description: "Mobile app builder for apps/mobile/",
        model: MODELS.mobileAgent,
        prompt:
          "You build the Expo React Native mobile app. Only modify files in apps/mobile/. You CAN import from @leaselink/shared. Read existing code patterns before writing. After implementation verify: cd apps/mobile && npx tsc --noEmit",
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

// ─── Phase 4: Commit, Push, PR, Merge ─────────────────────────────────────────

function commitAndPR(sprintNumber: number, sprintName: string, branchName: string) {
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

  const prBody = `## Sprint ${sprintNumber}\n\n${specPreview}\n\n---\nAutomated sprint implementation by Claude Code sprint runner.`;
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

        // ── Phase 1: Write spec
        saveState({ sprint, phase: "spec" });
        const spec = await writeSprintSpec(sprint);
        sprintName = spec.name;
        specPath = spec.path;

        run("git add -A");
        runSafe(`git commit -m "docs: add ${sprintName} spec"`);

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

      // ── Phase 4: Commit, Push, PR
      saveState({ sprint, phase: "pr", specName: sprintName, specPath, branchName });
      commitAndPR(sprint, sprintName, branchName);

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
