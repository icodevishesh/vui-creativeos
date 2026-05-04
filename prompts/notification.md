1. Architectural Overview: The Event-Driven Model
   Instead of sending a notification directly within a function (e.g., createTask()), you should emit an Event. This allows you to process notifications in the background.

The Trigger: An action occurs in your Next.js API or Server Action.

The Queue: The event is pushed to a message broker (like Redis or BullMQ).

The Worker: A background process picks up the event, determines who needs to be notified, checks their preferences, and sends the payload.

Notification category
TASK ASSIGNED / INTERNAL REVIEW / CLIENT REVIEW / APPROVED / FEEDBACK
CLIENT_ONBOARDED / SCOPE_OF_WORK / DOCUMENT UPLOADED / MEETING LOGS
GANTCHART CREATION / UPDATE
CREATIVE UPLOADED
COPYWRITE FINISHED

// Notification Log
model Notification {
id String @id @default(uuid())
userId String // Recipient
title String
message String
type String // 'IN_APP' | 'EMAIL' | 'PUSH'
category String // 'TASK_ASSIGNED' | 'CLIENT_ONBOARDED'
status String // 'UNREAD' | 'READ'
link String? // Deep link to the task/client
createdAt DateTime @default(now())
}

// User Settings
model NotificationPreference {
id String @id @default(uuid())
userId String
category String // e.g., 'TASK_COMPLETED'
email Boolean @default(true)
inApp Boolean @default(true)
push Boolean @default(true)
}

// lib/notifications/dispatcher.ts
export async function dispatchNotification(event: string, payload: any) {
// 1. Fetch relevant users based on the event (Team Leads, Admins, etc.)
const recipients = await getRecipientsForEvent(event, payload);

for (const user of recipients) {
// 2. Check User Preferences
const prefs = await db.notificationPreference.findFirst({
where: { userId: user.id, category: event }
});

    // 3. Send to enabled channels
    if (prefs?.inApp) {
      await createInAppNotification(user.id, payload);
    }
    if (prefs?.email) {
      await queueEmailTask(user.email, payload);
    }

}
}

Trigger Event Recipients Message Logic  
CLIENT_ONBOARDED Team Members "New client onboarded and allocated to you..."
TASK_COMPLETED Team Lead + Admin "{User} submitted {Task} for internal review."
CLIENT_FEEDBACK Assignee + AM "The client has shared feedback."

User Settings Page
Provide a matrix where users can toggle notifications. This is crucial for reducing "notification fatigue"—a hallmark of well-designed professional software.
