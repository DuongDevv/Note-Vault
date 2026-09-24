# Issue Tracker & Project Management

## Issue Tracker Surface: GitHub Issues

NoteVault uses **GitHub Issues** as the single source of truth for all bug reports, technical specs, and feature requests. All operations are executed using the `gh` CLI.

## Conventions

- **Create**: `gh issue create --title "<type>: <concise description>" --body "..."`
- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state open --json number,title,body,labels,comments`
- **Comment**: `gh issue comment <number> --body "..."`
- **Close**: `gh issue close <number> --reason "completed"`
- **PRs as a request surface**: `no`

## Triage Label Vocabulary

| Label             | Meaning                                  | Action Required                               |
| :---------------- | :--------------------------------------- | :-------------------------------------------- |
| `needs-triage`    | Newly created, unreviewed issue          | Lead reviewer triages and assigns priority    |
| `needs-info`      | Incomplete reproduction steps or context | Blocked until creator supplies missing detail |
| `ready-for-agent` | Specification clear, verified boundaries | Agent can claim and implement                 |
| `ready-for-human` | Requires design call or manual judgment  | Human developer review needed                 |
| `wontfix`         | Out of scope or invalid report           | Closed with explanation                       |

## Wayfinding Operations (`/wayfinder`)

- **Map Ticket**: Single GitHub issue labeled `wayfinder:map`.
- **Child Task**: Sub-issue linked to map with label `wayfinder:<type>` (`research`/`prototype`/`task`).
- **Claim & Resolve**: `gh issue edit <n> --add-assignee @me` $\rightarrow$ close upon PR merge and link in map.
