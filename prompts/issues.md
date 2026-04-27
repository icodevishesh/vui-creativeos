1. Currently a whole task is submitted for review, so all the copies are submitted wether they are already submitted or not. So when a copy is already submitted for review then it should not be submit again, after submiting a copy the submit button still shows on the copy card. And the submitted copies should show as history. Only new copies that will be created under that task's calendar should show submit button. solved

2. PATCH /api/tasks/cmo9ps3ce00033s8cc48hzvmo/designer-content 400 in 187ms (next.js: 25ms, proxy.ts: 18ms, application-code: 145ms)
[browser] Submission failed Error: Submission failed
    at handleSubmit (components/workspace/designer/UploadAndSubmitTab.tsx:207:26)
  205 |       });
  206 |
> 207 |       if (!res.ok) throw new Error('Submission failed');
      |                          ^
  208 |       toast.success('Design submitted for internal review');
  209 |       setFilesByPlatform({});
  210 |       setNotes(''); (components/workspace/designer/UploadAndSubmitTab.tsx:213:15)
 GET /workspace/designer 200 in 203ms (next.js: 47ms, proxy.ts: 24ms, application-code: 132ms)
 GET /api/auth/me 200 in 146ms (next.js: 22ms, proxy.ts: 38ms, application-code: 86ms)
 GET /api/workspace/designer 200 in 452ms (next.js: 17ms, proxy.ts: 36ms, application-code: 398ms)
 PATCH /api/tasks/cmo9ps3ce00033s8cc48hzvmo/designer-content 400 in 176ms (next.js: 19ms, proxy.ts: 5ms, application-code: 152ms)
[browser] Submission failed Error: Submission failed
    at handleSubmit (components/workspace/designer/UploadAndSubmitTab.tsx:207:26)
  205 |       });
  206 |
> 207 |       if (!res.ok) throw new Error('Submission failed');
      |                          ^
  208 |       toast.success('Design submitted for internal review');
  209 |       setFilesByPlatform({});
  210 |       setNotes(''); (components/workspace/designer/UploadAndSubmitTab.tsx:213:15)

  When designer tried to upload files for specific platforms, for example in the copy there are three platforms, instagram, facebook, twitter, when tried to upload for these three platforms only, then it is not submitting. Fix the issue and also state the explaination and logic.

3. Add the types in platforms, like instagram have post, story, reel.
facebook have post, story. twitter have posts and linkdin have posts.

So update the schema and all the pages that includes platforms accordingly. For eg when designer uploads a creative for a platform, the designer also have to mention the type of creative it is (eg post, story, reel).

If the platform is instagram and type is post then preview the image size ratio in 4:5, if the type is story then preview in 9:16, and if the type is reel then preview in 9:16.
If the platform is facebook or linkdin the image size ratio in 4:5
If the platform is twitter then preview the image size ratio in 16:9



4. There is an issue: For example a task is assigned to the writer, he creates a calendar and after it he creates copies under that calendar, for example he created 10 copies under that calendar and submit it for internal review, and his copies got approved but now if he want to add another copy after approval of other copies in that task, he submits that copy for review but the admin cannot approved that copy which is submitted later, and the status is showing as draft of that copy. So when the admin approves the calendar it is not sent to the client for approval. Fix this issue and state the logic and explanation.

5. when a user logged in initially it shows a account name as Admin User, Admin, after refreshing it once then it shows the actual user who logged in. Address this issue and state the logic and explanation.

6. When a user signed in for example i have signed in with visheshpurkait@gmail.com and usertype is content writer, but after sign in it redirect to the dashboard and showing other user of the same team kim, designer after manual refresh it shows correct signed in user. Fix this issue and state the logic and explanation.
This issue is similar to previous one, I have also added router.refresh() after successful sign in. But still issue perhaps. Please find the route cause and also explain why this is happening and how can i learn and take care of this in future.

7. Make a complete detailed documnets of all the features implemented so far.

4/23/2026
bugs:
1. managed by is not updating after adding team lead to a client, if a team lead is added under a client's team then automatically it should show managed by "team lead name"
2. Meeting log is not creating thorws error " POST /api/clients/cmobbldd400023scsk8aeu417/meetings 400 in 34ms (next.js: 16ms, proxy.ts: 5ms, application-code: 14ms)"
3. Add react hot toast success msg after successfully creation of project and refresh the page.
4. critical issue: I have created a task calendar and added 2 buckets and 2 copies of that calendar, after navigate back to allocated task tab and clicking to the task, it should show "continue calendar" and "submit" button to send task's calendar for approval. But nothing is showing it showing create calendar button again and no created copies showing, but in db both copies are showing with the respected calendar id and also the calendar is showing created for that task.


24/04/2026
bugs:
1. Admin reject a task then is reassigned to the writer, and status changed to open again. When the writer tries to delete the previous copy of the calendar it is not deleting and throwing error "Delete Failed".
DELETE /api/calendars/cmobel3i200013so8yqj5cro2/copies/cmobeqe9y00073so8twlbf3ft 404 in 295ms (next.js: 154ms, proxy.ts: 14ms, application-code: 126ms) fix this issue and explain me the reason.

2. When write creates a calendar, also give option to name that calendar else the default name will be task's name. Right now every calendar name shown as "Techflow".
3. When admin/team lead approved a calendar after which it sent to the client for approval, the approve button should disable, current after approving a calendar it shows approve and publish button which is not correct.
4. if a task rejected a revision required message is shown to the writer, but after he deleted the rejected copy and created new copy and submit and also got approved still the message is showing as "revision required" after approval. check uploaded screenshot on code\prompts\image.png
5. In designer's workspace when a designer upload design files/images/video respective to a platform he can upload multiple files/images/videos with different types, like there are 2 platforms: insta and linkdin so desginer need to upload 2 images for instagram post, and for story and both has different ratios so make sure he can select the type for different image/videos, right now the issue is when designer upload two images he can only select one type, but what is he wants one image for post and another for story so both have different ratios and both will be displayed in different ratios.



Please fix the following issues:

1. Calendar naming on creation
When a writer creates a calendar, provide an option to enter a custom calendar name.

If no name is provided, the calendar name should default to the task name.

Currently, every calendar is being displayed with the harcoded name "Techflow", which is incorrect.

2. Approval button state after admin/team lead approval
Once an admin or team lead approves a calendar and it is sent to the client for approval, the Approve button should be disabled or hidden.

Currently, after approval, Approve buttom still visible as "Approve and publish", which is incorrect.

3. Incorrect "Revision Required" status after resubmission
If a task is rejected, the writer correctly sees a "Revision Required" message.

However, after the writer deletes the rejected copy, creates a new one, resubmits it, and it gets approved, it still shows "Revision Required" message on task card.

This should be cleared once the new submission is approved.

Please refer to the screenshot at: code\prompts\image.png

4. Multiple file uploads with platform-specific content types in designer workspace
In the designer workspace, designers should be able to upload multiple files (images/videos) for each platform and assign a different content type to each file.

Example:

Platforms: Instagram and LinkedIn
For Instagram, a designer may need to upload:
1 image for Post
1 image for Story
Since Post and Story have different ratios, each uploaded file should allow its own type selection.

Current issue:
When a designer uploads two images, they can only select one type for both files.

Expected behavior:
Each uploaded file should have its own selectable type (e.g. Post, Story, Reel, etc.), so files can be displayed in the correct ratio and context.


Please update the gantt chart view and gantt chart page view. Except admin/team lead/ account manager, dont show the "new project" button, "new task" button and hide the edit grid view only show the gantt chart view to them, no access to edit it. Refer to screenshot "C:\elevana_projects\vui-creativeos\code\prompts\image.png"

Can we also remove this "+" for readOnly. refer uploaded screenshot in C:\elevana_projects\vui-creativeos\code\prompts\image.png


Show all the tasks with their latest approved and rejected designes under Work History tab in designer workspace. Currently it is not showing approved and rejected designes so user cannot track it.