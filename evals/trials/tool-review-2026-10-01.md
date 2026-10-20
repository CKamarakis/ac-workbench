# Tool review: the user's original list (2026-10-01)

The user's list (2026-09-29 session `61223285`): obra/superpowers, emilkowalski/skills, playwright.dev, gztchan/awesome-design, thedotmack/claude-mem, affaan-m/ecc, rebelytics/one-skill-to-rule-them-all, plus the Notion MCP links from the first message. Later additions: pbakaus/impeccable, Figma/Miro MCP.

**Method:**
- Full READMEs fetched with `gh api repos/<r>/readme` (raw text, not summaries).
- Licenses from `gh api repos/<r>/license`.
- Notion's hosted MCP docs from developers.notion.com.
- The 2026-09-29 session had only read model summaries of each front page.

| Tool | What it is | Workflow stage | Per project? | License / cost | Verdict |
|---|---|---|---|---|---|
| Notion MCP (hosted) `https://mcp.notion.com/mcp` | Search, fetch, create and update pages, databases, views and comments over OAuth. The local `@notionhq/notion-mcp-server` is deprecated by Notion | 3 context store | `claude mcp add --transport http notion https://mcp.notion.com/mcp`; `--scope local` is the default (private, this project) | Core tools free. `notion-ai-search`, meeting notes and custom agents need Notion AI or Business. Search: 20 calls/10 s | **adopt** (prd-pipeline) |
| makenotion/claude-code-notion-plugin | Hosted MCP + 4 skills (Knowledge Capture, Meeting Intelligence, Research Documentation, Spec to Implementation) + `/Notion:*` commands | 2–3 PRD ↔ Notion | plugin, `--scope project` | **No LICENSE file**; last push 2026-01-22 | **trial**; read its skills before writing our own |
| obra/superpowers | 14 skills: TDD, systematic debugging, brainstorming, writing and executing plans, worktrees, subagent-driven development, code review | 6 build (via SuperSpec) | tested: per-project `enabledPlugins` works | MIT, free | **trial** (A/B: same result at ~4× time and ~5× cost on a small change). Now also `superpowers@claude-plugins-official` |
| emilkowalski/skills | 13 skills: emil-design-eng, animate, review-/improve-animations, find-animation-opportunities, apple-design, pick-ui-library, prototype, mobile-native… | 7 design (motion) | `npx skills@latest add emilkowalski/skills` | MIT, free | **trial** for `web-ui`, motion and animation only |
| pbakaus/impeccable | 1 skill, 24 commands (init → PRODUCT.md, shape, critique, audit, polish, harden…), 61 deterministic detector rules, live browser mode | 7 design | `npx impeccable install --providers=claude --scope=project`; installs edit hooks | Apache-2.0, free | **trial** for `web-ui`; owner of `ui-polish` |
| Playwright CLI (`@playwright/cli`) | Browser automation CLI + skills (`playwright-cli install --skills`). Its docs prefer CLI+skills over MCP for coding agents (token cost) | 8 UI testing | skills install locally | Apache-2.0, free | **trial** for `web-ui` (was later) |
| upstash/context7 | Up-to-date library docs: `ctx7` CLI + skill or MCP (`https://mcp.context7.com/mcp`) | 6 build | `npx ctx7 setup --claude` | MIT; free API key for higher limits | **trial** (was later) |
| rebelytics/one-skill-to-rule-them-all (task-observer) | Meta-skill: logs corrections, proposes skill improvements for you to approve | kit improvement loop | `.claude/skills/task-observer/` | CC BY 4.0, free | **later**: its README says the value compounds with many skills |
| affaan-m/ecc | 68 agents, 293 skills, 94 commands, hooks, rules, AgentShield; `--profile minimal/core` | many (overlaps all) | partly | MIT, free | **pieces only**: candidates AgentShield (security), TDD rules. Never a bulk install |
| thedotmack/claude-mem | Hook-based auto-memory (SQLite + Chroma, Bun, uv). Hosted observer is a 14-day trial, then **uses your Anthropic plan**; a crypto token ("CMEM") is endorsed by the author | memory | yes | Apache-2.0 | **drop**: cost and trust; Notion (context) + Claude memory cover the need |
| gztchan/awesome-design | Curated design resource links; last push **2024-07-04** | the user, not the agent | — | no LICENSE | **bookmark only** |
| Figma / Miro MCP | not reviewed | 7 design input | per project | — | later, when a project needs them |

## Overlaps to resolve in the registry

- `ui-polish`: Impeccable owns it. Emil's skills record the overlap and handle motion only.
- Context7 vs. reading the docs by hand: no conflict. It's a source, not a phase owner.

## Thin intel (not fully read)

- ECC: only the structure and install sections of its 2,048-line README.
- The docs sites of claude-mem, Impeccable and Context7, beyond their READMEs.
- Notion free-plan limits beyond the documented 20 calls/10 s on search and query.
- Figma and Miro MCP: not looked at.
