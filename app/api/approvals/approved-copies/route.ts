import { NextRequest, NextResponse } from "next/server";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { dispatchNotification } from "@/lib/notifications/dispatcher";
import { withApiLogging } from "@/lib/api-logging";

const ADMIN_ROLES = new Set(["ADMIN", "ADMIN_OWNER", "ACCOUNT_MANAGER", "TEAM_LEAD"]);
const VIDEO_MEDIA_TYPES = new Set(["VIDEO", "REEL"]);

type ApprovedCopyForBrief = {
  content?: string | null;
  caption?: string | null;
  hashtags?: string | null;
  mediaType?: string | null;
  platforms?: string[];
  publishDate?: Date | string | null;
  publishTime?: string | null;
  referenceUrl?: string | null;
};

type SourceTaskForApprovedCopy = {
  id: string;
  title: string;
  priority: TaskPriority;
  projectId: string;
  clientId: string;
  organizationId: string;
  calendarId: string | null;
  project: { id: string; name: string };
};

type ApprovedCopyRecord = {
  id: string;
  content: string;
  caption: string | null;
  hashtags: string | null;
  publishDate: Date | null;
  publishTime: string | null;
  platforms: string[];
  mediaType: string | null;
  referenceUrl: string | null;
  status: string;
  approvedBy: string | null;
  approvedDate: Date | null;
  bucketId: string;
  bucket: { id: string; name: string } | null;
  calendarId: string;
  calendar: {
    id: string;
    name: string;
    client: {
      id: string;
      companyName: string;
      organizationId: string;
    };
  } | null;
  designerTasks?: Array<{
    id: string;
    title: string;
    assignedTo: { id: string; name: string; roles: string[] } | null;
  }>;
};

function canManageApprovals(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return !!user && (
    user.userType === "ADMIN_OWNER" ||
    (user.membership?.roles ?? []).some((role) => ADMIN_ROLES.has(role))
  );
}

function normalizeMediaType(mediaType: string | null | undefined) {
  return mediaType?.trim().toUpperCase() ?? "";
}

function roleForMediaType(mediaType: string | null | undefined) {
  return VIDEO_MEDIA_TYPES.has(normalizeMediaType(mediaType)) ? "VIDEO_EDITOR" : "GRAPHIC_DESIGNER";
}

function copyBrief(copy: ApprovedCopyForBrief, description?: string | null) {
  return [
    description?.trim() || null,
    copy.content ? `Copy: ${copy.content}` : null,
    copy.caption ? `Caption: ${copy.caption}` : null,
    copy.hashtags ? `Hashtags: ${copy.hashtags}` : null,
    copy.mediaType ? `Media type: ${copy.mediaType}` : null,
    copy.platforms?.length ? `Platforms: ${copy.platforms.join(", ")}` : null,
    copy.publishDate ? `Publish date: ${new Date(copy.publishDate).toLocaleDateString("en-US")}` : null,
    copy.publishTime ? `Publish time: ${copy.publishTime}` : null,
    copy.referenceUrl ? `Reference: ${copy.referenceUrl}` : null,
  ].filter(Boolean).join("\n\n");
}

export const GET = withApiLogging(async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!canManageApprovals(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: user ? 403 : 401 });
    }

    const { searchParams } = new URL(req.url);
    const mediaType = normalizeMediaType(searchParams.get("mediaType"));

    const copies = await prisma.calendarCopy.findMany({
      where: {
        status: "APPROVED",
        ...(mediaType ? { mediaType } : {}),
      },
      include: {
        bucket: { select: { id: true, name: true } },
        calendar: {
          select: {
            id: true,
            name: true,
            client: { select: { id: true, companyName: true, organizationId: true } },
          },
        },
        designerTasks: {
          select: {
            id: true,
            title: true,
            assignedTo: { select: { id: true, name: true, roles: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { approvedDate: "desc" },
    });

    const typedCopies = copies as ApprovedCopyRecord[];
    const calendarIds = Array.from(new Set(typedCopies.map((copy) => copy.calendarId).filter(Boolean))) as string[];
    const sourceTasks = calendarIds.length
      ? await prisma.task.findMany({
          where: { calendarId: { in: calendarIds }, calendarCopyId: null },
          select: {
            id: true,
            title: true,
            priority: true,
            projectId: true,
            clientId: true,
            organizationId: true,
            calendarId: true,
            project: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const sourceTaskByCalendar = new Map<string, SourceTaskForApprovedCopy>();
    for (const task of sourceTasks) {
      if (task.calendarId && !sourceTaskByCalendar.has(task.calendarId)) {
        sourceTaskByCalendar.set(task.calendarId, task);
      }
    }

    return NextResponse.json(typedCopies.map((copy) => {
      const sourceTask = sourceTaskByCalendar.get(copy.calendarId) ?? null;
      return {
        id: copy.id,
        content: copy.content,
        caption: copy.caption,
        hashtags: copy.hashtags,
        platforms: copy.platforms,
        mediaType: copy.mediaType,
        publishDate: copy.publishDate,
        publishTime: copy.publishTime,
        approvedBy: copy.approvedBy,
        approvedDate: copy.approvedDate,
        referenceUrl: copy.referenceUrl,
        calendarId: copy.calendarId,
        calendarName: copy.calendar?.name ?? null,
        bucket: copy.bucket,
        client: copy.calendar?.client ?? null,
        project: sourceTask?.project ?? null,
        sourceTask,
        assignmentRole: roleForMediaType(copy.mediaType),
        assignedTask: copy.designerTasks?.[0] ?? null,
      };
    }));
  } catch (error) {
    console.error("[GET /api/approvals/approved-copies]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withApiLogging(async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!canManageApprovals(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: user ? 403 : 401 });
    }

    const body = await req.json();
    const { copyId, title, assignedToId, priority, dueDate, description } = body;

    if (!copyId || !title || !assignedToId || !priority || !dueDate) {
      return NextResponse.json(
        { error: "copyId, title, assignedToId, priority, and dueDate are required" },
        { status: 400 },
      );
    }

    if (!Object.values(TaskPriority).includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    const copy = await prisma.calendarCopy.findUnique({
      where: { id: copyId },
      include: {
        calendar: {
          include: {
            client: {
              select: { id: true, companyName: true, organizationId: true },
            },
          },
        },
        bucket: { select: { id: true, name: true } },
      },
    });

    if (!copy || copy.status !== "APPROVED") {
      return NextResponse.json({ error: "Approved copy not found" }, { status: 404 });
    }

    const existing = await prisma.task.findFirst({
      where: { calendarCopyId: copyId },
      select: { id: true, title: true },
    });
    if (existing) {
      return NextResponse.json({ error: "This copy already has an assigned task", task: existing }, { status: 409 });
    }

    const client = copy.calendar?.client;
    if (!client) {
      return NextResponse.json({ error: "Copy calendar client not found" }, { status: 404 });
    }

    const existingProject = await prisma.project.findFirst({
      where: { clientId: client.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });

    const project = existingProject ?? await prisma.project.create({
      data: {
        name: "General",
        clientId: client.id,
        organizationId: client.organizationId,
      },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });

    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, name: true, roles: true },
    });
    if (!assignee) {
      return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
    }

    const created = await prisma.task.create({
      data: {
        title: title.trim(),
        description: copyBrief(copy, description),
        status: TaskStatus.OPEN,
        priority,
        mediaUrls: [],
        feedbacks: [],
        projectId: project.id,
        clientId: client.id,
        organizationId: project.organizationId,
        createdById: user!.id,
        assignedToId,
        category: assignee.roles?.[0] ?? roleForMediaType(copy.mediaType),
        calendarId: copy.calendarId,
        calendarCopyId: copy.id,
        contentBucketId: copy.bucketId ?? null,
        startDate: new Date(),
        endDate: new Date(dueDate),
      },
      include: {
        assignedTo: { select: { id: true, name: true, roles: true } },
        project: { select: { name: true } },
        client: { select: { companyName: true } },
      },
    });

    await dispatchNotification({
      category: "TASK_ASSIGNED",
      recipientIds: [assignedToId],
      title: "New task assigned to you",
      message: `You have been assigned "${created.title}".`,
      link: `/tasks/${created.id}`,
    });

    return NextResponse.json({ success: true, task: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/approvals/approved-copies]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
