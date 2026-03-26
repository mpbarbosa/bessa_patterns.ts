# Skills — bessa_patterns.ts

GitHub Copilot skills available in this repository.

| Skill | Description |
|-------|-------------|
| [`verify-workflow-efficacy`](.github/skills/verify-workflow-efficacy/SKILL.md) | Assess the efficacy of the most recent ai_workflow.js run from its log files and produce an efficacy score (0–100) before the audit pipeline proceeds. |
| [`sync-version`](.github/skills/sync-version/SKILL.md) | Audit and fix version strings across all files so they match `package.json`. |
| [`audit-and-fix`](.github/skills/audit-and-fix/SKILL.md) | Orchestrate the full log-audit pipeline in a single pass: validate-logs → fix-log-issues → purge-workflow-logs. |
| [`validate-logs`](.github/skills/validate-logs/SKILL.md) | Validate `.ai_workflow/logs/` against the live codebase and produce a structured `plan.md` of confirmed minor issues. |
| [`fix-log-issues`](.github/skills/fix-log-issues/SKILL.md) | Consume `.ai_workflow/plan.md` and apply every open fix, then update `docs/ROADMAP.md`. |
| [`purge-workflow-logs`](.github/skills/purge-workflow-logs/SKILL.md) | Delete all transient artefacts under `.ai_workflow/` (logs/, backlog/, summaries/). |
