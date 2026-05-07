'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileImage,
  FileVideo,
  FileText,
  File as FileIcon,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { FileUploader } from 'react-drag-drop-files';
import { toast } from 'react-hot-toast';

type CreativeUploadRow = {
  id: string;
  assetName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number | null;
  uploadedAt: string;
  uploadedBy?: { name?: string | null; email?: string | null } | null;
  task?: { id: string; title: string } | null;
};

type UploadState = {
  fileName: string;
  progress: number;
  speed: number;
  eta: number | null;
  done: boolean;
  error: string | null;
};

const FILE_TYPES = ['JPG', 'PNG', 'GIF', 'PDF', 'ZIP', 'MP4', 'MKV', 'PPTX', 'DOCX', 'XLSX'];

const determineFileType = (mime: string): 'image' | 'video' | 'doc' | 'other' => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('officedocument')) return 'doc';
  return 'other';
};

const getFileIcon = (type: 'image' | 'video' | 'doc' | 'other') => {
  switch (type) {
    case 'image':
      return <FileImage className="w-5 h-5 text-gray-400" />;
    case 'video':
      return <FileVideo className="w-5 h-5 text-gray-400" />;
    case 'doc':
      return <FileText className="w-5 h-5 text-gray-400" />;
    default:
      return <FileIcon className="w-5 h-5 text-gray-400" />;
  }
};

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatEta(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds)) return '--';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export default function PortalCreativeUploadsPage() {
  const queryClient = useQueryClient();
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['portal-creative-uploads'],
    queryFn: async () => {
      const res = await fetch('/api/portal/creative-uploads');
      if (!res.ok) throw new Error('Failed to load creative uploads');
      return res.json() as Promise<{ clientId: string; clientName: string; assets: CreativeUploadRow[] }>;
    },
  });

  const assets = useMemo(() => {
    if (!data?.assets) return [];
    return data.assets.map((asset) => ({
      ...asset,
      type: determineFileType(asset.fileType || ''),
      date: new Date(asset.uploadedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [data]);

  const handleUpload = (selected: File | File[]) => {
    const file = Array.isArray(selected) ? selected[0] : selected;
    if (!file) return;
    if (!data?.clientId) {
      toast.error('Client context is still loading');
      return;
    }

    xhrRef.current?.abort();
    setUploadState({
      fileName: file.name,
      progress: 0,
      speed: 0,
      eta: null,
      done: false,
      error: null,
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', data.clientId);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = (event.loaded / event.total) * 100;
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? event.loaded / elapsed : 0;
      const eta = speed > 0 ? (event.total - event.loaded) / speed : null;

      setUploadState((current) => current && { ...current, progress, speed, eta });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadState((current) => current && { ...current, progress: 100, done: true, eta: null });
        toast.success('File uploaded successfully');
        queryClient.invalidateQueries({ queryKey: ['portal-creative-uploads'] });
      } else {
        let message = 'Upload failed';
        try {
          const response = JSON.parse(xhr.responseText);
          message = response.error || message;
        } catch {
          // keep default
        }
        setUploadState((current) => current && { ...current, error: message });
        toast.error(message);
      }
    };

    xhr.onerror = () => {
      setUploadState((current) => current && { ...current, error: 'Network error occurred' });
      toast.error('Network error occurred');
    };

    xhr.open('POST', '/api/creative-upload');
    xhr.send(formData);
  };

  const uploading = !!uploadState && !uploadState.done && !uploadState.error;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
            <UploadCloud className="w-4 h-4" />
            Creative Uploads
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Shared creative assets</h1>
          <p className="text-gray-400 text-sm">
            Upload files to your client folder and view the shared history below.
          </p>
        </div>

        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none mb-1">
            Client Folder
          </p>
          <p className="text-[11px] font-medium text-primary leading-none">
            {data?.clientName || 'Portal'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Upload files</h2>
            <p className="text-xs text-gray-500">Files are stored in the folder for this client.</p>
          </div>
          {data?.clientName && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none mb-1">
                Target Folder
              </p>
              <p className="text-[11px] font-medium text-primary leading-none">
                /uploads/{data.clientName.toLowerCase().replace(/ /g, '_')}
              </p>
            </div>
          )}
        </div>

        <FileUploader
          handleChange={handleUpload}
          name="file"
          types={FILE_TYPES}
          disabled={!data?.clientId || uploading}
        >
          <div
            className={`relative group transition-all ${
              !data?.clientId || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="absolute inset-0 bg-primary/20 rounded-lg -m-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative border-2 border-dashed border-gray-100 rounded-lg bg-gray-50/50 p-12 text-center hover:border-primary/30 transition-all">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <UploadCloud className="w-12 h-12 text-primary" />
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {uploading
                  ? 'Uploading your file...'
                  : !data?.clientId
                    ? 'Loading client context...'
                    : 'Drop files here or click to upload'}
              </h3>
              <p className="text-[11px] font-medium text-gray-400">
                {uploading
                  ? `${Math.round(uploadState!.progress)}% complete`
                  : 'JPG, PNG, MP4, PDF, ZIP and more'}
              </p>
            </div>
          </div>
        </FileUploader>

        {uploadState && (
          <div
            className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
              uploadState.done ? 'border-emerald-100' : uploadState.error ? 'border-red-100' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    uploadState.done ? 'bg-emerald-50' : uploadState.error ? 'bg-red-50' : 'bg-primary/10'
                  }`}
                >
                  {uploadState.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : uploadState.error ? (
                    <X className="w-5 h-5 text-red-400" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{uploadState.fileName}</p>
                  <p
                    className={`text-xs font-medium mt-0.5 ${
                      uploadState.done ? 'text-emerald-600' : uploadState.error ? 'text-red-500' : 'text-gray-400'
                    }`}
                  >
                    {uploadState.done
                      ? 'Upload complete'
                      : uploadState.error
                        ? uploadState.error
                        : `${Math.round(uploadState.progress)}% · ${formatBytes(uploadState.speed)}/s · ${formatEta(uploadState.eta ?? Infinity)} left`}
                  </p>
                </div>
              </div>

              {(uploadState.done || uploadState.error) && (
                <button
                  onClick={() => setUploadState(null)}
                  className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  uploadState.done ? 'bg-emerald-500' : uploadState.error ? 'bg-red-400' : 'bg-primary'
                }`}
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>

            {!uploadState.done && !uploadState.error && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  Speed: {formatBytes(uploadState.speed)}/s
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  ETA: {formatEta(uploadState.eta ?? Infinity)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Assets</h2>
            <span className="text-[10px] font-medium text-gray-400">{assets.length} items</span>
          </div>

          {assets.length === 0 ? (
            <div className="bg-white rounded-lg border border-dashed border-gray-200 p-12 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-900">No creative uploads yet</p>
              <p className="mt-2 text-xs text-gray-400">
                Your team&apos;s shared files will appear here after they upload them.
              </p>
            </div>
          ) : (
            assets.map((asset) => {
              const downloadHref = asset.fileUrl.includes('?')
                ? `${asset.fileUrl}&download=${encodeURIComponent(asset.assetName)}`
                : `${asset.fileUrl}?download=${encodeURIComponent(asset.assetName)}`;

              return (
                <div
                  key={asset.id}
                  className="group relative bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-between transition-all hover:shadow-md hover:shadow-primary/50 hover:border-primary/20"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-gray-50 group-hover:border-primary/20">
                      {getFileIcon(asset.type)}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
                        {asset.assetName}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                        <span>Uploaded by:</span>
                        <span className="text-gray-900 leading-none truncate">
                          {asset.uploadedBy?.name || asset.uploadedBy?.email || 'Team member'}
                        </span>
                      </div>
                      {asset.task?.title && (
                        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                          <span>Linked to:</span>
                          <span className="text-gray-900 leading-none truncate">{asset.task.title}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Uploaded</p>
                      <p className="text-xs font-medium text-gray-900 tabular-nums">
                        {new Date(asset.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 tabular-nums">
                        {formatBytes(asset.fileSize || 0)}
                      </p>
                    </div>

                    <a
                      href={downloadHref}
                      className="w-7 h-7 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                      aria-label={`Open ${asset.assetName}`}
                      title="Open or download"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
