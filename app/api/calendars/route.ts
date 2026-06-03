import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { withApiLogging } from '@/lib/api-logging';


export const GET = withApiLogging(async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');

  try {
    if (clientId) {
      // Admin / calendar view: return all calendars for a client with their copies
      const calendars = await prisma.calendar.findMany({
        where: { clientId },
        include: {
          client: { select: { companyName: true } },
          buckets: true,
          copies: {
            include: {
              frames: { orderBy: { frameNumber: 'asc' } },
              designerTasks: {
                include: {
                  attachments: {
                    select: {
                      id: true,
                      fileName: true,
                      fileUrl: true,
                      mimeType: true,
                    }
                  }
                },
                orderBy: { createdAt: 'desc' }
              }
            },
            orderBy: { publishDate: 'asc' }
          },
          _count: { select: { copies: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
      return NextResponse.json(calendars);
    }

    // Writer view: return only this writer's calendars (include copies so the workspace can render them)
    const calendars = await prisma.calendar.findMany({
      where: { writerId: user.id },
      include: {
        client: { select: { companyName: true } },
        buckets: true,
        copies: {
          include: {
            frames: { orderBy: { frameNumber: 'asc' } },
            designerTasks: {
              include: {
                attachments: {
                  select: {
                    id: true,
                    fileName: true,
                    fileUrl: true,
                    mimeType: true,
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { publishDate: 'asc' }
        },
        _count: { select: { copies: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(calendars);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
  }
});

export const POST = withApiLogging(async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    let { name, objective, clientId, taskId } = body;

    if (!clientId) {
      // Find the first client if none provided for testing
      const client = await prisma.clientProfile.findFirst();
      if (!client) return NextResponse.json({ error: 'No client found' }, { status: 400 });
      clientId = client.id;
    }

    // Check if task already contains a calendarId, or if a calendar already exists for this taskId
    let existingCalendar = null;
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { calendarId: true }
      });
      if (task?.calendarId) {
        existingCalendar = await prisma.calendar.findUnique({
          where: { id: task.calendarId },
          include: {
            client: { select: { companyName: true } },
            buckets: true,
            copies: {
              include: {
                frames: { orderBy: { frameNumber: 'asc' } },
                designerTasks: {
                  include: {
                    attachments: {
                      select: {
                        id: true,
                        fileName: true,
                        fileUrl: true,
                        mimeType: true,
                      }
                    }
                  },
                  orderBy: { createdAt: 'desc' }
                }
              },
              orderBy: { publishDate: 'asc' }
            },
            _count: { select: { copies: true } }
          }
        });
      }

      if (!existingCalendar) {
        existingCalendar = await prisma.calendar.findFirst({
          where: { taskId },
          include: {
            client: { select: { companyName: true } },
            buckets: true,
            copies: {
              include: {
                frames: { orderBy: { frameNumber: 'asc' } },
                designerTasks: {
                  include: {
                    attachments: {
                      select: {
                        id: true,
                        fileName: true,
                        fileUrl: true,
                        mimeType: true,
                      }
                    }
                  },
                  orderBy: { createdAt: 'desc' }
                }
              },
              orderBy: { publishDate: 'asc' }
            },
            _count: { select: { copies: true } }
          }
        });
      }
    }

    if (existingCalendar) {
      // Update name/objective on the existing calendar if they are changed or provided
      const updatedCalendar = await prisma.calendar.update({
        where: { id: existingCalendar.id },
        data: {
          name: name || existingCalendar.name,
          objective: objective !== undefined ? objective : existingCalendar.objective,
          clientId: clientId || existingCalendar.clientId,
          taskId: taskId || existingCalendar.taskId,
        },
        include: {
          client: { select: { companyName: true } },
          buckets: true,
          copies: {
            include: {
              frames: { orderBy: { frameNumber: 'asc' } },
              designerTasks: {
                include: {
                  attachments: {
                    select: {
                      id: true,
                      fileName: true,
                      fileUrl: true,
                      mimeType: true,
                    }
                  }
                },
                orderBy: { createdAt: 'desc' }
              }
            },
            orderBy: { publishDate: 'asc' }
          },
          _count: { select: { copies: true } }
        }
      });

      // Link task to the calendar if not already linked
      if (taskId) {
        await prisma.task.update({
          where: { id: taskId },
          data: { calendarId: updatedCalendar.id }
        });
      }

      return NextResponse.json(updatedCalendar);
    }

    const calendar = await prisma.calendar.create({
      data: {
        name,
        objective,
        clientId,
        writerId: user.id,
        status: 'DRAFT',
        taskId: taskId // Also stored here for reference
      }
    });

    // Link task to calendar if taskId was provided
    if (taskId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { calendarId: calendar.id }
      });
    }

    return NextResponse.json(calendar);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to create calendar' }, { status: 500 });
  }
});
