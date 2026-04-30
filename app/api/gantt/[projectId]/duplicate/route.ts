import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ projectId: string }> };

// POST /api/gantt/[projectId]/duplicate
// Body: { targetProjectId: string }
// Copies all gantt tasks + links from projectId into targetProjectId.
// Old task IDs are remapped to new IDs in all link source/target references.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { targetProjectId } = body;

    if (!targetProjectId) {
      return NextResponse.json({ error: 'targetProjectId is required' }, { status: 400 });
    }

    if (targetProjectId === projectId) {
      return NextResponse.json({ error: 'Cannot duplicate into the same project' }, { status: 400 });
    }

    const targetProject = await prisma.project.findUnique({
      where: { id: targetProjectId },
      select: { id: true, clientId: true },
    });

    if (!targetProject) {
      return NextResponse.json({ error: 'Target project not found' }, { status: 404 });
    }

    const [sourceTasks, sourceLinks] = await Promise.all([
      prisma.ganttTask.findMany({ where: { projectId }, orderBy: { orderId: 'asc' } }),
      prisma.ganttLink.findMany({ where: { projectId } }),
    ]);

    // Get the current max orderId in the target so we can append
    const existingTasks = await prisma.ganttTask.findMany({
      where: { projectId: targetProjectId },
      select: { orderId: true },
      orderBy: { orderId: 'desc' },
      take: 1,
    });
    const orderOffset = existingTasks.length > 0 ? existingTasks[0].orderId + 1 : 0;

    // Map old id → new id for link remapping
    const idMap = new Map<string, string>();

    // Create tasks one-by-one to get back the auto-generated IDs
    for (const task of sourceTasks) {
      const created = await prisma.ganttTask.create({
        data: {
          text: task.text,
          start: task.start,
          end: task.end ?? undefined,
          duration: task.duration,
          progress: task.progress,
          type: task.type,
          parent: task.parent ? idMap.get(task.parent) ?? null : null,
          orderId: task.orderId + orderOffset,
          projectId: targetProjectId,
          clientId: targetProject.clientId,
        },
      });
      idMap.set(task.id, created.id);
    }

    // Create links with remapped source/target IDs
    let copiedLinks = 0;
    for (const link of sourceLinks) {
      const newSource = idMap.get(link.source);
      const newTarget = idMap.get(link.target);
      if (newSource && newTarget) {
        await prisma.ganttLink.create({
          data: {
            source: newSource,
            target: newTarget,
            type: link.type,
            projectId: targetProjectId,
            clientId: targetProject.clientId,
          },
        });
        copiedLinks++;
      }
    }

    return NextResponse.json({
      success: true,
      copiedTasks: idMap.size,
      copiedLinks,
      targetProjectId,
    });
  } catch (error) {
    console.error('[GANTT_DUPLICATE_POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
