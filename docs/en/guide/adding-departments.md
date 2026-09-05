# Adding Departments

This is the core feature of cc-company. As you use it, the secretary suggests adding departments.

## Suggestions from the Secretary

When tasks in the same area are repeated, the secretary suggests a new department.

```
> Research competitors for me
Secretary: Sure, I'll look into it.
  → Saved to secretary/notes/2026-03-19-competitor-research.md

(A few days later...)

> I'd also like to know about overseas trends
Secretary: Research requests are increasing.
           Shall I create a Research department?
           It can systematically manage research results in a dedicated folder.

You: Yes, create it

→ research/ is automatically generated
```

::: tip Note
If a department doesn't exist yet, the secretary saves results in `secretary/notes/`. Once a department is created, it gets its own dedicated management.
:::

## Direct Requests

Of course, you can also request directly.

```
> Create a PM department
Secretary: Creating a PM department now!

→ pm/ is automatically generated
```

## What Gets Created

When a department is added, the following are auto-generated:

- **Department folder** — `.company/[department]/`
- **Department CLAUDE.md** — Rules and behavior for that department
- **Subfolders** — For file management
- **Templates** — For creating new files

For example, adding a Research department:

```
.company/
├── CLAUDE.md              ← Department list gets updated
├── secretary/
└── research/              ← Newly added
    ├── CLAUDE.md           ← Research rules
    └── topics/             ← Research topic management
```

## Available Departments

| Department | Area |
|-----------|------|
| PM | Project progress, ticket management |
| Research | Market research, competitive analysis, tech research |
| Marketing | Content planning, SNS, campaigns |
| Engineering | Technical docs, design, debugging |
| Finance | Invoices, expenses, revenue management |
| Sales | Client management, proposals |
| Creative | Design briefs, brand management |
| HR | Recruitment, team management |
| Affiliate Operations | Product research, article writing, link placement, reviewing the numbers |

See the [Departments Reference](/en/reference/departments) for details.

## Assigning Roles (Role Packs)

To split the work inside a department into named roles, use a role pack.

```
> Create four roles to run my Amazon affiliate site
Secretary: There's a role pack for that. I'll create the Affiliate
           Operations department and put the four role files in roles/.

→ Four role files are generated under affiliate/roles/
```

Each role file is only four lines.

1. **What this role does** — its scope
2. **What you hand it** — the input
3. **The shape you want back** — the output format (tables, row counts, columns)
4. **What it must not do** — the prohibitions

::: warning Fill in the genre-specific prohibitions yourself
In the fourth line, the general program-terms and advertising-law prohibitions come filled in, but **the ones specific to your genre are left blank**. Only someone who knows the field can write those, so fill them in before you start.
:::
