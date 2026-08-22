# Obsidian Backup

Copy what has accumulated in `.company/` — plus Claude's memory files and conversation
history — into an Obsidian vault. You get to read it outside Claude Code, with links,
search, and Dataview working as usual.

## Usage

```
> Back this up to Obsidian

Secretary: Where is your Obsidian vault?
You: ~/Documents/ObsidianVault

Secretary: What should I copy?
      ☑ Organization data (.company/)
      ☑ Memory (CLAUDE.md)
      ☑ Custom definitions (skills / agents / commands)
      ☐ Conversation history (this one is large)

→ Dry run first to show the counts → then the real run
```

"Copy to Obsidian" and "sync with Obsidian" trigger the same skill.

## What gets copied

| Category | Source | Default |
|----------|--------|---------|
| Organization data | `./.company/` (todos, notes, inbox, departments) | ✅ |
| Memory | `~/.claude/CLAUDE.md`, the project's `CLAUDE.md` | ✅ |
| Custom definitions | `skills`, `agents`, `commands` under `~/.claude/` and `.claude/` | ✅ |
| Conversation history | `~/.claude/projects/**/*.jsonl` rendered to Markdown | ⬜️ On request |

History is raw transcript data, so it is off by default and always confirmed with you first.

## Vault layout

```
<Vault>/Claude/
├── 000-Claude-MOC.md          ← start here
├── company/
│   ├── 000-company-MOC.md
│   └── secretary/{todos,notes,inbox}/…
├── memory/
├── custom/
└── history/                    ← only when history is included
```

Every note gets frontmatter:

```yaml
---
claude-source: ".company/secretary/notes/competitor-research.md"
claude-origin: company
claude-synced: "2026-08-22T05:00:00.000Z"
tags: [claude, company, secretary]
---
```

Existing frontmatter in the source file is preserved. An existing `tags:` is never overwritten.

### Dataview example

```dataview
TABLE claude-source AS "Source", claude-synced AS "Synced"
FROM "Claude/company"
WHERE claude-origin = "company"
SORT file.name DESC
```

## Safety model

- **Nothing is deleted.** The vault only gets additions and updates. Files removed on the
  source side stay in the vault
- **Hand edits are never overwritten.** A note you edited in the vault is reported as a
  conflict and only overwritten when you approve `--force`
- **Idempotent.** Unchanged content is not rewritten on a re-run
- **Dry run first**, always — you see the counts and destinations before anything is written

## Running it manually

You can call the script directly instead of going through the skill.

```bash
node ~/.claude/plugins/company/skills/obsidian-export/scripts/export-to-obsidian.mjs \
  --vault ~/Documents/ObsidianVault \
  --dry-run
```

| Option | Description |
|--------|-------------|
| `--vault <path>` | (required) Obsidian vault root |
| `--source <path>` | Project root to look for `.company/` in (default: cwd) |
| `--subfolder <name>` | Destination folder inside the vault (default: `Claude`) |
| `--include <list>` | Pick from `company,memory,custom,history` |
| `--history` | Include conversation history |
| `--dry-run` | Show the plan without writing |
| `--force` | Overwrite hand-edited notes |
| `--json` | Print the summary as JSON |

Requires Node.js 18+ (no dependencies).

## Scheduling it

Run it from cron or launchd with `--json` for a parseable log.

```bash
0 22 * * * cd ~/work/myproject && node ~/.claude/plugins/company/skills/obsidian-export/scripts/export-to-obsidian.mjs --vault ~/Documents/ObsidianVault --json >> ~/obsidian-sync.log 2>&1
```

## Multiple projects

Vary `--source` and `--subfolder` per project so they don't mix.

```bash
node export-to-obsidian.mjs --vault ~/Vault --source ~/work/a --subfolder "Claude/a"
node export-to-obsidian.mjs --vault ~/Vault --source ~/work/b --subfolder "Claude/b"
```

## Caveats

- If your vault syncs through iCloud, Dropbox, or Git, the copied information goes wherever
  that sync goes
- Renaming a note inside the vault is not tracked; a re-sync recreates it under the original name
- Non-Markdown text files (`.json`, `.yaml`, …) are wrapped in a code block and saved as `.md`
