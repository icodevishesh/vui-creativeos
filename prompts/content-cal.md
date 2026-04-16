Core functionalities for the content calendar:
Bucket management — create/edit/delete buckets as content categories (social post, reel, blog, etc.) with a calendar_id, linked client, and associated media pool. Buckets act as the organizational spine.
Task-to-calendar binding — each calendar slot maps to a task_id, pulling in status, type, assignee, and the latest approved version. Sub-tasks (subTask_id[]) represent content variations or revision rounds within the same deliverable.
Media versioning per task — each task carries media_id[] with a latest_version pointer. The calendar shows the current approved creative, not just a placeholder.
Status-driven cell rendering — cells visually reflect task status (OPEN → IN_PROGRESS → INTERNAL_REVIEW → CLIENT_REVIEW → APPROVED/REJECTED) so stakeholders see pipeline health at a glance.
Bucket-level scheduling — drag-and-drop or date-picker to assign a bucket (and its tasks) to specific calendar dates, generating the visual content plan.
Monthly objective layer — the existing objective textarea sets strategic context that sits above the calendar grid, framing every piece of scheduled content.
Client-scoped view — all data is filtered by clientId, with the client selector as the entry point (already in your current page).



Bucket zone is the organizational layer — it groups content by category (calendar_id) before any dates are touched. Think of buckets as slots (Reel, Carousel, Blog Post) and the calendar as where those slots land.
Task layer sits inside each bucket, handling the actual creative work — linking the task_id, attaching sub-tasks for revision rounds, versioning media (media_id[] + latest_version), and tracking the status pipeline.
The rejection loop (dashed, right side) feeds back directly into media versioning — a rejected piece triggers a new sub-task/version, not a new task from scratch.

model ContentBucket {
  id          String   @id @default(cuid()) @map("_id")
  name        String
  calendarId  String
  clientId    String
  mediaUrls   String[]
  tasks       Task[]
  client      ClientProfile @relation(...)
}