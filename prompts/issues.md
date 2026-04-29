Follow these rules:

- Do NOT break existing functionality
- Ensure backward compatibility where possible
- Update schema, backend logic, and frontend where required
- Handle edge cases and validation properly
- Ensure persistence issues (refresh/state loss) are fixed
- Maintain clean, scalable code

bug:

signin page:
add validation in email, email is case sensitive ✅

client onboarding:

- Add validation in email and phone number accepts 10 digites with +91 and indian flag icon.✅
- missing services in dropdown (whatsapp marketing, seo) and update schema
- services added while onboarding not display on client page, scope of work tab, and social media service is always showing by default even if the admin not chosen it while onboarding

clients:

- scope of work tab:
  - give dropdown in monthly budget estimate field to select currency type ($, ₹)
  - Adding a new service gets removed/not showing after refresh.
  - make the description field as optional

Team Members:

- admin can assign a member roles > 1 && <= 2 (dual roles)
  -> need to update the schema and the authorization logic for dual role user.
- creating a custom role and assign permissions is not working.

Projects:

- make the projects view in row wise instead of grid/box wise
- Give edit button in project card.
- fix the delete button
- Give option to change the status of the project, default is planning if the project is completed then admin can change the status to completed the status bar should be a dropdown to change status dynamically.
- Also add created by (user's name) when a user creates a project.

Gantt chart:

- bug: sometimes gantt page shows a dialouge box which not get removed but after refresh it get removed
- feat: option to duplicate a gantt chart from a project to another project, copy all the details of gantt chart including tasks and subtasks.
- feat: highlight weekends in gantt chart
- feat: if start date and end date is same, it should show 1 day only. for eg (28 aprl 2026 - 28 aprl 2026) it should show as a single day.

Content calendar:

- add tooltip to show all the details (date, status, bucket name etc) when hovering over the card.

Task board:

- team members (assigned for the task) can update task status: open, in progress, hold + reason of holding, completed.
- remove "+ new task button" from team member's interface

Approvals:

- add record (approved by "name", "role") as Team lead, account manager or admin, anyone could be approver.
- under calendar, also show bucket description with the name.
- tasks status and copies status are not synced properly.

Writer workspace:

- after creating copies also give option to edit it after submit it
- If writer chose media type as carousal while creating a copy then, next give option to choose frames (2,3,4...), If the write chose 3 frames so 3 new copies will be created with respect to carousal and everything should be synced. for eg instagram has carousal view (slides) which contains different images and description, so like that if writer choose carousal with 3 or 4 frames that much copies will be created respected to that.
- service sync with client onboarding in copies when selecting platform for example, if client has social media service with 2 platforms: instagram and linkdin so only only those 2 platform should show when creating the copies with the respected to that client.
- Give option to add refrence url in respective to copies. A field to add url which will store it as string. (update the schema accordingly)

Client interface:

- show the task preview in approvals page same as admin UI
- clients can also add task and admin can accept or reject the task if accept then admin will assign it to a team member if not auto assgined and it will be appear on task board and to the respected team member.

Designer workspace:

- editor -> if copy has video the it will assign to editor of the team (editor is for video editing not graphic deisgner)
- desginer -> if copy contains only image and text/graphics the it will assign to designer
