import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "child_process";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, resolve } from "path";

// ─── Config ────────────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, "..");
const SPRINTS_DIR = join(ROOT, "docs", "sprints");
const PRODUCT_SPEC = join(ROOT, "PRODUCT_SPEC.md");
const BASE_BRANCH = "dev";
const MAX_FIX_ATTEMPTS = 3;

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

/** Collect all agent output text */
async function runAgent(
  prompt: string,
  opts: Parameters<typeof query>[0]["options"],
): Promise<string> {
  let result = "";
  for await (const message of query({ prompt, options: opts })) {
    if ("result" in message) {
      result = message.result;
    }
  }
  return result;
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

Your job: write a DETAILED sprint spec for Sprint ${sprintNumber}.

## Context

### Product Spec
${productSpec}

### Previous Sprint Specs (already implemented)
${previousSpecsSummary || "Sprint 1 (foundation) has been implemented — shared types, enums, constants, Zod schemas, and Prisma schema updates are done."}

## Instructions

1. Read the product spec and previous sprints carefully
2. Determine what should be built NEXT — pick a logical, focused chunk of work
3. Write a detailed sprint spec following the EXACT same format as sprint-1-foundation.md:
   - Overview with clear goal
   - Codebase context (what exists, what's new)
   - Tasks with detailed requirements, files to create/modify, code examples
   - Acceptance criteria for each task
   - Test cases
   - Implementation order
   - Definition of Done

4. The spec must be split into sections that can be independently handled by:
   - **Backend agent** — works on apps/api and packages/shared
   - **Web agent** — works on apps/web
   - **Mobile agent** — works on apps/mobile

   Mark each task clearly with which agent handles it.

5. Be EXTREMELY specific — include file paths, interface definitions, function signatures, SQL migrations, test cases with expected inputs/outputs. An agent reading this spec should have zero ambiguity.

6. The sprint should be sized for a few hours of agent work — not too small, not too large.

IMPORTANT: Write the spec file to docs/sprints/sprint-${sprintNumber}-<descriptive-name>.md
The filename should describe the sprint's focus (e.g., sprint-2-property-crud-api.md).

After writing the file, output ONLY the filename (e.g., "sprint-2-property-crud-api") on the last line.`;

  const result = await runAgent(prompt, {
    cwd: ROOT,
    allowedTools: ["Read", "Write", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 50,
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append:
        "\nYou are writing a sprint spec. Be extremely detailed. Follow the format of docs/sprints/sprint-1-foundation.md exactly. Do NOT implement any code — only write the spec document.",
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

async function runBuilder(specPath: string) {
  log(`\n🔨 Phase 2: Running builder agent...`);

  const sprintSpec = readFileSync(specPath, "utf-8");

  const prompt = `You are the lead builder agent for a sprint implementation.

## Your Workflow

1. **First**, implement all backend work yourself:
   - packages/shared/ (types, enums, constants, validation schemas)
   - apps/api/ (domain entities, use cases, controllers, repositories, tests)
   - Follow the existing DDD architecture in apps/api/
   - Read existing code patterns before writing new code
   - After backend work, verify: cd apps/api && npx prisma generate && npm run format && npm run type-check && npm run test

2. **Then**, delegate frontend work using the Agent tool to spawn subagents IN PARALLEL:
   - Spawn a "web" subagent for apps/web/ work (if the sprint has web tasks)
   - Spawn a "mobile" subagent for apps/mobile/ work (if the sprint has mobile tasks)
   - These subagents will see your backend/shared changes since they share the filesystem
   - If there is no web or mobile work in this sprint, skip those subagents

3. **Finally**, do a final verification across all apps

## Rules
- Read existing code to understand patterns BEFORE writing new code
- Every new feature must have unit tests
- Fix any errors before finishing

## Sprint Spec

${sprintSpec}`;

  await runAgent(prompt, {
    cwd: ROOT,
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Agent"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 200,
    agents: {
      web: {
        description: "Web dashboard builder for apps/web/",
        prompt:
          "You build the Next.js web dashboard. Only modify files in apps/web/. You CAN import from @leaselink/shared. Read existing code patterns before writing. After implementation verify: cd apps/web && npm run build",
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      },
      mobile: {
        description: "Mobile app builder for apps/mobile/",
        prompt:
          "You build the Expo React Native mobile app. Only modify files in apps/mobile/. You CAN import from @leaselink/shared. Read existing code patterns before writing. After implementation verify: cd apps/mobile && npx tsc --noEmit",
        tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      },
    },
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append:
        "\nYou are the lead builder in an automated sprint. Work autonomously. Do backend/shared work first, then delegate web and mobile to subagents in parallel using the Agent tool.",
    },
  });

  log(`  ✓ Builder finished`);
}

// ─── Phase 3: Test & Fix ──────────────────────────────────────────────────────

interface VerifyResult {
  passed: boolean;
  output: string;
}

function verify(): VerifyResult {
  log(`\n🔍 Phase 3: Running verification...`);

  const checks = [
    { name: "Prisma Generate", cmd: "npx prisma generate", cwd: join(ROOT, "apps/api") },
    { name: "API Format", cmd: "npm run format", cwd: join(ROOT, "apps/api") },
    { name: "API Type Check", cmd: "npm run type-check", cwd: join(ROOT, "apps/api") },
    { name: "API Unit Tests", cmd: "npm run test", cwd: join(ROOT, "apps/api") },
    { name: "Web Build", cmd: "npm run build", cwd: join(ROOT, "apps/web") },
  ];

  const results: string[] = [];
  let allPassed = true;

  for (const check of checks) {
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

  // Create PR
  const prTitle = `[Sprint ${sprintNumber}] ${title}`;
  const specContent = readFileSync(
    join(SPRINTS_DIR, `${sprintName}.md`),
    "utf-8",
  );
  const specPreview = specContent.split("\n").slice(0, 50).join("\n");

  const { ok, output: prUrl } = runSafe(
    `gh pr create --title "${prTitle}" --base ${BASE_BRANCH} --body "## Sprint ${sprintNumber}

${specPreview}

---
Automated sprint implementation by Claude Code sprint runner."`,
  );

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
      // ── Checkout latest base branch
      run(`git checkout ${BASE_BRANCH}`);
      run(`git pull origin ${BASE_BRANCH}`);

      // ── Create sprint branch
      const tempBranch = `sprint/${sprint}`;
      const { ok } = runSafe(`git checkout -b ${tempBranch}`);
      if (!ok) {
        // Branch exists, reset it
        run(`git checkout ${tempBranch}`);
        run(`git reset --hard ${BASE_BRANCH}`);
      }

      // ── Phase 1: Write spec
      const { name: sprintName, path: specPath } = await writeSprintSpec(sprint);

      // Commit the spec before building
      run("git add -A");
      runSafe(`git commit -m "docs: add ${sprintName} spec"`);

      // Rename branch to include the spec name
      const branchName = `sprint/${sprintName}`;
      if (branchName !== tempBranch) {
        run(`git branch -m ${tempBranch} ${branchName}`);
      }

      // ── Phase 2: Build
      await runBuilder(specPath);

      // ── Phase 3: Test & Fix
      let { passed, output } = verify();
      let fixAttempt = 0;

      while (!passed && fixAttempt < MAX_FIX_ATTEMPTS) {
        fixAttempt++;
        await fixErrors(output, fixAttempt);
        ({ passed, output } = verify());
      }

      if (!passed) {
        log(`\n❌ Sprint ${sprint} failed verification after ${MAX_FIX_ATTEMPTS} fix attempts.`);
        log("Stopping. Fix manually and re-run with --start-sprint=" + sprint);
        process.exit(1);
      }

      log(`\n✅ Sprint ${sprint} verification passed!`);

      // ── Phase 4: Commit, Push, PR
      commitAndPR(sprint, sprintName, branchName);

      // ── Wait for merge, then pull
      log("  Waiting for PR merge...");
      // Give auto-merge a moment, then poll
      await new Promise((r) => setTimeout(r, 10_000));

      // Poll for merge (max 5 min)
      let merged = false;
      for (let i = 0; i < 30; i++) {
        const { output: state } = runSafe(`gh pr view ${branchName} --json state -q .state`);
        if (state.includes("MERGED")) {
          merged = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 10_000));
      }

      if (!merged) {
        // Force merge if auto-merge didn't kick in (no CI required on dev)
        runSafe(`gh pr merge --squash --admin`);
        log("  → Force merged via --admin");
      }

      run(`git checkout ${BASE_BRANCH}`);
      run(`git pull origin ${BASE_BRANCH}`);

      const elapsed = Math.round((Date.now() - sprintStart) / 60_000);
      log(`\n✅ Sprint ${sprint} complete! (${elapsed} min)\n`);
    } catch (e: any) {
      log(`\n❌ Sprint ${sprint} failed with error: ${e.message}`);
      log("Stopping. Fix and re-run with --start-sprint=" + sprint);
      process.exit(1);
    }
  }

  log("\n🎉 All sprints complete!\n");
}

main().catch((e) => {
  log(`Fatal: ${e.message}`);
  process.exit(1);
});
