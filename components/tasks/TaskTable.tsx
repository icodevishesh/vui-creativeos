"use client";

import { useMemo } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Clock, AlertCircle, CheckCircle2, MoreVertical, Layout, FileText, User } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  endDate?: string;
  clientId: string;
  projectId: string;
  organizationId: string;
  countSubTask: number;
  project: { name: string };
  client: { companyName: string };
  assignedTo?: { id: string; name: string };
  feedbacks: string[];
  mediaUrls?: string[];
  _count?: any;
}

const STATUS_MAP: Record<TaskStatus, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Open", color: "text-green-600 bg-green-100", icon: Clock },
  OPENED: { label: "Opened", color: "text-teal-600 bg-teal-50", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600 bg-blue-50", icon: Clock },
  INTERNAL_REVIEW: { label: "Internal Review", color: "text-violet-600 bg-violet-50", icon: AlertCircle },
  CLIENT_REVIEW: { label: "Client Review", color: "text-amber-600 bg-amber-50", icon: AlertCircle },
  APPROVED: { label: "Approved", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "text-red-600 bg-red-50", icon: AlertCircle },
};

interface TaskTableProps {
  data: Task[];
  onRowClick: (task: Task) => void;
  isLoading: boolean;
}

export function TaskTable({ data, onRowClick, isLoading }: TaskTableProps) {
  const columns = useMemo<MRT_ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Task',
        size: 250,
        Cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-xs">
                {task.title}
              </span>
              <div className="flex items-center gap-2">
                {task.countSubTask > 0 && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-lg">
                    <Layout className="w-3 h-3" />
                    {task.countSubTask}
                  </div>
                )}
                {task.feedbacks && task.feedbacks.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-lg">
                    <FileText className="w-3 h-3" />
                    {task.feedbacks.length}
                  </div>
                )}
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 140,
        Cell: ({ cell }) => {
          const statusVal = cell.getValue<TaskStatus>();
          const status = STATUS_MAP[statusVal] || STATUS_MAP.OPEN;
          const StatusIcon = status.icon;
          return (
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider px-2.5 py-1 rounded-full ${status.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </span>
          );
        }
      },
      {
        id: 'projectName',
        accessorFn: (row) => row.project?.name,
        header: 'Project',
        size: 150,
        Cell: ({ cell }) => {
          const val = cell.getValue<string | undefined>();
          return val ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium text-xs">
              {val}
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic">Unassigned</span>
          );
        }
      },
      {
        id: 'assignedToName',
        accessorFn: (row) => row.assignedTo?.name,
        header: 'Assignee',
        size: 150,
        Cell: ({ cell }) => {
          const val = cell.getValue<string | undefined>();
          return val ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium text-xs">
              {val}
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic">Unassigned</span>
          );
        }
      },
      {
        accessorFn: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : '—',
        id: 'assignedDate',
        header: 'Assigned Date',
        size: 120,
        Cell: ({ cell }) => {
          const val = cell.getValue<string | undefined>();
          return val ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium text-xs">
              {val}
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic">-</span>
          );
        }
      },
      {
        accessorFn: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString() : '—',
        id: 'dueDate',
        header: 'Due Date',
        size: 120,
        Cell: ({ cell }) => {
          const val = cell.getValue<string | undefined>();
          return val ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium text-xs">
              {val}
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic">-</span>
          );
        }
      },
      {
        id: 'clientCompanyName',
        accessorFn: (row) => row.client?.companyName,
        header: 'Client',
        size: 150,
        Cell: ({ cell }) => {
          const val = cell.getValue<string | undefined>();
          return val ? (
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium text-xs">
              {val}
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic">-</span>
          );
        }
      },
      {
        accessorKey: 'feedbacks',
        header: 'Feedback',
        size: 150,
        Cell: ({ cell }) => {
          const feedbacks = cell.getValue<string[]>();
          return feedbacks && feedbacks.length > 0 ? (
            <div
              className="flex items-center gap-2 text-xs text-gray-700 font-medium truncate max-w-[150px]"
              title={feedbacks[0]}
            >
              {feedbacks[0]}
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic">No feedback</span>
          );
        }
      }
    ],
    [],
  );

  const table = useMantineReactTable({
    columns,
    data,
    // isLoading is handled outside the table to avoid mantine-react-table beta
    // passing in={true} (boolean) to a DOM element, which React 19 rejects.
    enableFullScreenToggle: false,
    enableDensityToggle: false,
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => onRowClick(row.original),
      style: { cursor: 'pointer' },
    }),
    mantinePaperProps: {
      shadow: 'sm',
      radius: 'lg',
      withBorder: false,
      style: { border: '1px solid #f3f4f6' },
    },
    initialState: {
      showGlobalFilter: true,
      pagination: { pageSize: 15, pageIndex: 0 },
    },
    positionGlobalFilter: 'left',
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <MantineReactTable table={table} />
    </div>
  );
}
