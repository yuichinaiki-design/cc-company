# Departments

Details of each department and the folder structure generated when added.

## Secretary's Office (Always Present)

Gateway and advisor. Automatically created during initial setup.

**Handles:** TODO management, brainstorming, notes, consultation, dashboard

```
secretary/
├── CLAUDE.md
├── inbox/          ← Quick capture (when in doubt, put it here)
├── todos/          ← Daily task management (1 file per day)
│   └── YYYY-MM-DD.md
└── notes/          ← Brainstorming notes & decision logs
```

**File naming:**
- TODOs: `todos/YYYY-MM-DD.md`
- Inbox: `inbox/YYYY-MM-DD.md`
- Notes: `notes/kebab-case-topic.md`
- Decisions: `notes/YYYY-MM-DD-decisions.md`

---

## PM (Project Management)

**Handles:** Project progress, milestones, ticket management

```
pm/
├── CLAUDE.md
├── projects/       ← 1 file per project
└── tickets/        ← 1 file per ticket
```

**Statuses:**
- Projects: `planning` → `in-progress` → `review` → `completed` → `archived`
- Tickets: `open` → `in-progress` → `done`

---

## Research

**Handles:** Market research, competitive analysis, tech research

```
research/
├── CLAUDE.md
└── topics/         ← 1 file per topic
```

**Status:** `planning` → `in-progress` → `completed`

---

## Marketing

**Handles:** Content planning, SNS strategy, campaign management

```
marketing/
├── CLAUDE.md
├── content-plan/   ← 1 file per content piece
└── campaigns/      ← 1 file per campaign
```

**Statuses:**
- Content: `draft` → `writing` → `review` → `published`
- Campaigns: `planning` → `active` → `completed` → `reviewed`

---

## Engineering

**Handles:** Technical documents, design docs, debug logs

```
engineering/
├── CLAUDE.md
├── docs/           ← Technical docs & design specs
└── debug-log/      ← Bug investigation logs
```

**Status (debug):** `open` → `investigating` → `resolved` → `closed`

---

## Finance

**Handles:** Invoices, expenses, revenue management

```
finance/
├── CLAUDE.md
├── invoices/       ← 1 file per invoice
└── expenses/       ← By month or category
```

**Status (invoices):** `draft` → `sent` → `paid` → `overdue`

---

## Sales

**Handles:** Client management, proposals, deal pipeline

```
sales/
├── CLAUDE.md
├── clients/        ← 1 file per client
└── proposals/      ← 1 file per proposal
```

**Statuses:**
- Clients: `prospect` → `active` → `inactive`
- Proposals: `draft` → `sent` → `accepted` → `rejected`

---

## Creative

**Handles:** Design briefs, brand management, asset management

```
creative/
├── CLAUDE.md
├── briefs/         ← 1 file per project
└── assets/         ← Asset list
```

**Status:** `draft` → `approved` → `in-production` → `delivered`

---

## HR

**Handles:** Recruitment, onboarding, team management

```
hr/
├── CLAUDE.md
└── hiring/         ← 1 file per position
```

**Status:** `open` → `screening` → `interviewing` → `offered` → `filled` → `closed`

---

## Affiliate Operations

**Handles:** Product research, article writing, link placement, reviewing the numbers

```
affiliate/
├── CLAUDE.md
├── roles/          ← Role definitions (copied from a role pack)
├── research/       ← Candidate tables (1 file per round)
├── articles/       ← Articles (1 file per article)
└── reports/        ← Monthly numbers (1 file per month)
```

**Status (article):** `draft` → `writing` → `linked` → `published`

`linked` means the link role has finished inserting the affiliate links and disclosures. The writing role and the link role hand off the same file.

**Roles (role pack):**

This department is run by four roles. Their definitions live in `roles/`.

| Role | Handles |
|------|---------|
| Research | Decides the next product and keywords |
| Writer | Turns it into an article the reader can choose from |
| Link | Inserts affiliate links, disclosures and buttons |
| Numbers | Reads the numbers and picks the one thing to fix next |

Each role file is four lines: what this role does / what you hand it / the shape you want back / what it must not do.
In the fourth line, the genre-specific prohibitions are left blank on purpose — fill those in yourself.
