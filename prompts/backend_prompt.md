You are implementing backend features for a creative project management platform. The frontend already exists. Your job is to build the necessary **API routes**, **database models**, and **cross-module linkages** only — no frontend changes, no redundant code.

---

## Global Rules (apply to every module)

- Input sanitisation on all endpoints
- Consistent error handling (`try/catch`, meaningful HTTP status codes)
- Lean query design — avoid N+1s, use indexed fields
- Role and auth checks on every protected route
- All DB schemas must be relationally linked where specified

---

## Module 1 — Workplaces (Writer + Designer)

**Writer's Workplace** — visible only to users whose `role` is `writer`, `copywriter`, or `content writer`.

**Designer's Workplace** — visible only to users whose `role` is `designer` or `graphic designer`.

Both workplaces share identical logic:
- Return only tasks assigned to the requesting user, filtered by allowed roles
- Each task must include a `versionHistory` field, populated if the task has any subtasks or feedback entries
- `versionHistory` = ordered list of versions derived from subtasks/feedbacks on that task

---

## Module 2 — Approvals

Tabs and their data sources:
- **Internal review tab** → tasks with `status === "internal_review"`
- **Client review tab** → tasks with `status === "client_review"`

Actions:

| Trigger | Outcome |
|---|---|
| Reviewer approves | `task.status` → `"approved"` |
| Reviewer rejects | `task.status` → `"rejected"` + create a subtask assigned as `v2` |
| Feedback submitted | `task.status` → `"open"` + increment task version to `v2` |

Linkage: Approvals must read and write the same task records used by the Workplaces — no duplicated task data.

---

## Module 3 — Creative Upload

- Endpoint accepts: `clientId` (from dropdown) + file upload
- File is saved into the client's designated folder in the repository (see Module 4)
- After save, the asset record is written with: `assetName`, `clientId`, `uploadedAt`, `uploadedBy`, `fileType`, `fileSize`

**Recent assets** endpoint: return the 5 most recently uploaded assets for the authenticated user, with all the above fields plus `clientName`.

---

## Module 4 — File Repository

- One folder per client. Folder is auto-created when a new client is onboarded.
- Files land in the correct client folder in two cases:
  1. A designer uploads a file while working on a task linked to a client
  2. A file is uploaded via Creative Upload (Module 3)
- Both cases write to the same `assets` table and the same folder structure — no separate storage logic per source.

**Recent assets** endpoint: same shape as Module 3's recent assets — reuse or expose the same route.

---

## Schema Linkage

```
User ──< Task ──< Subtask
Task ──< Feedback
Task >── Client
Asset >── Client
Asset >── User (uploadedBy)
Client ──< Folder (auto-created on client creation)
```

---

## Deliverables

1. DB models for: `User`, `Task`, `Subtask`, `Feedback`, `Client`, `Asset`, `Folder`
2. API routes for all modules above
3. Shared service/utility for: role-gating, version resolution, file storage routing
4. No UI code. No placeholder TODOs. Clean, production-ready structure.
