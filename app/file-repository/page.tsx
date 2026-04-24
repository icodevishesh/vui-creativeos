'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  Folder,
  FolderOpen,
  FileImage,
  FileVideo,
  FileText,
  File as FileIcon,
  Download,
  ChevronRight,
  ArrowLeft,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────

interface RepoFolder {
  id: string;
  clientId: string;
  name: string;
  fileCount: number;
}

interface RepoFile {
  id: string;
  name: string;
  clientName?: string;
  clientId?: string;
  size: number | null;
  date: string;
  url: string;
  mimeType: string | null;
  taskId?: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getTypeLabel(mimeType: string | null) {
  if (!mimeType) return 'File';
  if (mimeType.startsWith('image/')) return mimeType.split('/')[1]?.toUpperCase() ?? 'Image';
  if (mimeType.startsWith('video/')) return mimeType.split('/')[1]?.toUpperCase() ?? 'Video';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'XLSX';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'ZIP';
  return 'File';
}

function FileTypeIcon({ mimeType, className }: { mimeType: string | null; className: string }) {
  if (mimeType?.startsWith('image/')) return <FileImage className={`${className} text-emerald-500`} />;
  if (mimeType?.startsWith('video/')) return <FileVideo className={`${className} text-purple-500`} />;
  if (mimeType?.includes('pdf')) return <FileText className={`${className} text-red-500`} />;
  if (mimeType?.includes('word') || mimeType?.includes('document'))
    return <FileText className={`${className} text-blue-500`} />;
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
    return <FileText className={`${className} text-green-600`} />;
  return <FileIcon className={`${className} text-gray-400`} />;
}

function fileIconBg(mimeType: string | null) {
  if (mimeType?.startsWith('image/')) return 'bg-emerald-50';
  if (mimeType?.startsWith('video/')) return 'bg-purple-50';
  if (mimeType?.includes('pdf')) return 'bg-red-50';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return 'bg-blue-50';
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return 'bg-green-50';
  return 'bg-gray-50';
}

// ── Main Component ──────────────────────────────────────────────────────

export default function FileRepositoryPage() {
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Root data (folders + recent files)
  const { data: rootData, isLoading: rootLoading } = useQuery({
    queryKey: ['repository'],
    queryFn: async () => {
      const res = await fetch('/api/repository');
      if (!res.ok) throw new Error('Failed to fetch repository data');
      return res.json() as Promise<{ folders: RepoFolder[]; recentFiles: RepoFile[] }>;
    },
  });

  // Files for a specific client
  const { data: clientFiles, isLoading: filesLoading } = useQuery({
    queryKey: ['repository', selectedClient?.id],
    queryFn: async () => {
      const res = await fetch(`/api/repository?clientId=${selectedClient!.id}`);
      if (!res.ok) throw new Error('Failed to fetch client files');
      return res.json() as Promise<RepoFile[]>;
    },
    enabled: !!selectedClient,
  });

  const openFolder = (folder: RepoFolder) => {
    setSelectedClient({ id: folder.clientId, name: folder.name });
    setSearchQuery('');
  };

  const goBack = () => {
    setSelectedClient(null);
    setSearchQuery('');
    setSortBy('date');
  };

  // Filtered + sorted files in client view
  const processedFiles = useMemo(() => {
    if (!clientFiles) return [];
    let list = clientFiles.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortBy === 'date') list = [...list].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'size') list = [...list].sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
    return list;
  }, [clientFiles, searchQuery, sortBy]);

  const filteredFolders = useMemo(
    () =>
      (rootData?.folders ?? []).filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [rootData, searchQuery]
  );

  // ── Loading (initial root load) ──────────────────────────────────────
  if (rootLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading file repository…</p>
      </div>
    );
  }

  // ── Client folder view ───────────────────────────────────────────────
  if (selectedClient) {
    return (
      <div className="max-w-7xl mx-auto pb-20 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm mb-1">
              <button
                onClick={goBack}
                className="text-gray-400 hover:text-indigo-600 font-medium transition-colors"
              >
                File Repository
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-gray-700 font-semibold">{selectedClient.name}</span>
            </nav>
            <h1 className="text-2xl font-semibold text-gray-900">{selectedClient.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {filesLoading ? '…' : `${processedFiles.length} file${processedFiles.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <button
            onClick={goBack}
            className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2 text-sm font-medium rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
            className="h-9 pl-3 pr-7 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
          >
            <option value="date">Newest first</option>
            <option value="name">Name A–Z</option>
            <option value="size">Largest first</option>
          </select>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {filesLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : processedFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <FolderOpen className="w-14 h-14 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">
              {searchQuery ? 'No files match your search' : 'No files uploaded yet'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {/* Header row */}
            <div className="grid grid-cols-[minmax(0,1fr)_80px_100px_140px_44px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Name</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Size</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Uploaded</span>
              <span />
            </div>

            {processedFiles.map((file, i) => (
              <div
                key={file.id}
                className={`group grid grid-cols-[minmax(0,1fr)_80px_100px_140px_44px] gap-4 px-5 py-3.5 items-center hover:bg-indigo-50/30 transition-colors ${i !== 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${fileIconBg(file.mimeType)}`}>
                    <FileTypeIcon mimeType={file.mimeType} className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400">{getTypeLabel(file.mimeType)}</span>
                <span className="text-xs font-medium text-gray-600 tabular-nums">{formatFileSize(file.size)}</span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {formatDistanceToNow(new Date(file.date), { addSuffix: true })}
                </span>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          // Grid view
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {processedFiles.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-3 hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 hover:-translate-y-0.5 transition-all text-center"
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${fileIconBg(file.mimeType)} group-hover:scale-105 transition-transform`}>
                  <FileTypeIcon mimeType={file.mimeType} className="w-7 h-7" />
                </div>
                <div className="w-full min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Root view (folders) ──────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">File Repository</h1>
        <p className="text-sm text-gray-400">All project assets organized by client</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search clients…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2 text-sm font-medium rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400 transition-all"
        />
      </div>

      {/* Folders */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Clients &mdash; {filteredFolders.length} folder{filteredFolders.length !== 1 ? 's' : ''}
        </h2>

        {filteredFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No clients found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFolders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => openFolder(folder)}
                className="group bg-white border border-gray-100 p-5 rounded-2xl flex flex-col items-center text-center gap-3 transition-all hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 hover:-translate-y-1 min-h-[130px] justify-center w-full"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                  <Folder className="w-7 h-7" />
                </div>
                <div className="w-full min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate" title={folder.name}>
                    {folder.name}
                  </h3>
                  <p className="text-xs font-medium text-gray-400 mt-0.5">
                    {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Files */}
      {(rootData?.recentFiles?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Recent Files
          </h2>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_160px_80px_100px_140px_44px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Name</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Client</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Size</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Uploaded</span>
              <span />
            </div>

            {rootData!.recentFiles.map((file, i) => (
              <div
                key={file.id}
                className={`group grid grid-cols-[minmax(0,1fr)_160px_80px_100px_140px_44px] gap-4 px-5 py-3.5 items-center hover:bg-indigo-50/30 transition-colors ${i !== 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${fileIconBg(file.mimeType)}`}>
                    <FileTypeIcon mimeType={file.mimeType} className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (file.clientId) {
                      setSelectedClient({ id: file.clientId, name: file.clientName ?? '' });
                      setSearchQuery('');
                    }
                  }}
                  className="text-xs font-medium text-gray-500 hover:text-indigo-600 truncate text-left transition-colors"
                  title={file.clientName}
                >
                  {file.clientName}
                </button>
                <span className="text-xs font-medium text-gray-400">{getTypeLabel(file.mimeType)}</span>
                <span className="text-xs font-medium text-gray-600 tabular-nums">{formatFileSize(file.size)}</span>
                <span className="text-xs text-gray-400 tabular-nums">
                  {formatDistanceToNow(new Date(file.date), { addSuffix: true })}
                </span>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
