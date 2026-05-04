'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  MessageSquare,
  X,
  Globe,
  Hash,
  Calendar,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Building2,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  ImageIcon,
  Send,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CopyBucket {
  id: string;
  name: string;
}

interface CarouselFrame {
  id: string;
  frameNumber: number;
  caption?: string;
  hashtags?: string;
  creativeUrl?: string;
  creativeStatus: string;
}

interface CalendarCopy {
  id: string;
  content: string;
  caption?: string;
  hashtags?: string;
  publishDate?: string;
  publishTime?: string;
  platforms?: string[];
  mediaType?: string;
  referenceUrl?: string;
  isCarousel?: boolean;
  frameCount?: number;
  frames?: CarouselFrame[];
  status: string;
  bucketId: string;
  bucket?: CopyBucket | null;
}

interface CalendarBucket {
  id: string;
  name: string;
  description?: string;
}

interface CalendarDetail {
  id: string;
  name: string;
  objective?: string;
  status?: string;
  client: { id: string; companyName: string };
  writer: { id: string; name: string };
  buckets: CalendarBucket[];
  copies: CalendarCopy[];
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

const fetchCalendar = async (id: string): Promise<CalendarDetail> => {
  const res = await fetch(`/api/portal/calendars/${id}`);
  if (!res.ok) throw new Error('Failed to fetch calendar');
  return res.json();
};

// ─── Platform Colors ───────────────────────────────────────────────────────────

const platformColors: Record<string, string> = {
  Instagram: 'bg-pink-50 text-pink-600 border-pink-100',
  LinkedIn: 'bg-blue-50 text-blue-700 border-blue-100',
  Twitter: 'bg-sky-50 text-sky-600 border-sky-100',
  Facebook: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-gray-50 text-gray-600 border-gray-200',
    IN_REVIEW: 'bg-amber-50 text-amber-600 border-amber-100',
    CLIENT_REVIEW: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    IN_REVIEW: 'In Review',
    CLIENT_REVIEW: 'Awaiting Review',
    APPROVED: 'Approved',
    PUBLISHED: 'Published',
    REJECTED: 'Rejected',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Copy Card ─────────────────────────────────────────────────────────────────

function CopyCard({
  copy,
  calendarId,
}: {
  copy: CalendarCopy;
  calendarId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/portal/calendars/${calendarId}/copies/${copy.id}/approve`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to approve copy');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Copy approved!');
      queryClient.invalidateQueries({ queryKey: ['portal-calendar', calendarId] });
    },
    onError: () => toast.error('Failed to approve copy'),
  });

  const requestChangeMutation = useMutation({
    mutationFn: async (feedback: string) => {
      const res = await fetch(`/api/portal/calendars/${calendarId}/copies/${copy.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Feedback submitted!');
      queryClient.invalidateQueries({ queryKey: ['portal-calendar', calendarId] });
    },
    onError: () => toast.error('Failed to submit feedback'),
  });

  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  const mainPlatform = copy.platforms?.[0] || 'Social';
  const platformClass = platformColors[mainPlatform] || 'bg-gray-50 text-gray-600 border-gray-200';

  const canApprove = copy.status === 'CLIENT_REVIEW' || copy.status === 'IN_REVIEW';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${platformClass}`}>
                <Globe className="w-3 h-3 mr-1" />
                {mainPlatform}
              </span>
              {copy.mediaType && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600 border border-violet-100">
                  <ImageIcon className="w-3 h-3 mr-1" />
                  {copy.mediaType}
                </span>
              )}
              {copy.bucket && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                  <Hash className="w-3 h-3 mr-1" />
                  {copy.bucket.name}
                </span>
              )}
              <StatusBadge status={copy.status} />
            </div>

            {copy.publishDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Calendar className="w-4 h-4" />
                <span>{format(parseISO(copy.publishDate), 'MMMM d, yyyy')}</span>
                {copy.publishTime && (
                  <>
                    <span className="text-gray-300">·</span>
                    <Clock className="w-4 h-4" />
                    <span>{copy.publishTime}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {canApprove && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowFeedbackInput(!showFeedbackInput)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Feedback
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
            </div>
          )}
        </div>

        {/* Feedback Input */}
        {showFeedbackInput && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter your feedback or change requests..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => setShowFeedbackInput(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (feedbackText.trim()) {
                    requestChangeMutation.mutate(feedbackText);
                    setFeedbackText('');
                    setShowFeedbackInput(false);
                  }
                }}
                disabled={requestChangeMutation.isPending || !feedbackText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                {requestChangeMutation.isPending ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Creative Copy */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Creative Copy</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{copy.content}</p>
          </div>
        </div>

        {/* Caption */}
        {copy.caption && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Caption</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 italic whitespace-pre-wrap leading-relaxed">{copy.caption}</p>
            </div>
          </div>
        )}

        {/* Hashtags */}
        {copy.hashtags && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hashtags</h4>
            <p className="text-sm text-indigo-600 font-medium">{copy.hashtags}</p>
          </div>
        )}

        {/* Carousel Frames */}
        {copy.isCarousel && copy.frames && copy.frames.length > 0 && (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Carousel Frames ({copy.frames.length})
            </button>
            {isExpanded && (
              <div className="mt-3 space-y-3">
                {copy.frames.map((frame) => (
                  <div key={frame.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">Frame {frame.frameNumber}</span>
                      <StatusBadge status={frame.creativeStatus} />
                    </div>
                    {frame.caption && (
                      <p className="text-sm text-gray-600 mb-2">{frame.caption}</p>
                    )}
                    {frame.hashtags && (
                      <p className="text-sm text-indigo-600">{frame.hashtags}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortalCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: calendar, isLoading, error } = useQuery({
    queryKey: ['portal-calendar', id],
    queryFn: () => fetchCalendar(id),
  });

  // Bulk approve all pending copies
  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/portal/calendars/${id}/approve-all`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to approve all');
      return res.json();
    },
    onSuccess: () => {
      toast.success('All copies approved!');
      queryClient.invalidateQueries({ queryKey: ['portal-calendar', id] });
    },
    onError: () => toast.error('Failed to approve all copies'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !calendar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load calendar</h2>
          <p className="text-sm text-gray-500 mb-4">{(error as Error)?.message || 'Calendar not found'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const pendingCopies = calendar.copies.filter(
    (c) => c.status === 'CLIENT_REVIEW' || c.status === 'IN_REVIEW'
  );
  const hasPendingCopies = pendingCopies.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{calendar.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{calendar.client.companyName}</span>
                  <span className="text-gray-300">·</span>
                  <User className="w-4 h-4" />
                  <span>{calendar.writer.name}</span>
                </div>
              </div>
            </div>

            {hasPendingCopies && (
              <button
                onClick={() => bulkApproveMutation.mutate()}
                disabled={bulkApproveMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <ThumbsUp className="w-4 h-4" />
                {bulkApproveMutation.isPending ? 'Approving...' : `Approve All (${pendingCopies.length})`}
              </button>
            )}
          </div>

          {calendar.objective && (
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Objective</p>
              <p className="text-sm text-indigo-900">{calendar.objective}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Copies</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{calendar.copies.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCopies.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {calendar.copies.filter((c) => c.status === 'APPROVED' || c.status === 'PUBLISHED').length}
            </p>
          </div>
        </div>

        {/* Copies List */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Content Copies
          </h2>

          {calendar.copies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No copies yet</h3>
              <p className="text-sm text-gray-500">This calendar doesn&apos;t have any content copies.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calendar.copies.map((copy) => (
                <CopyCard key={copy.id} copy={copy} calendarId={id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
