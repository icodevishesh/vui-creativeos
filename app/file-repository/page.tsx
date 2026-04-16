"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Folder,
  FileImage,
  FileVideo,
  FileText,
  File as FileIcon,
  ChevronRight,
  Loader2,
  Upload,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RepositoryFolder {
  id: string;
  name: string;
  fileCount: number;
}

interface RepositoryFile {
  id: string;
  name: string;
  clientName: string;
  size: number | null;
  date: string;
  url: string;
  mimeType: string | null;
}

const fetchRepositoryData = async () => {
  const res = await fetch("/api/repository");
  if (!res.ok) throw new Error("Failed to fetch repository data");
  return res.json();
};

export default function FileRepositoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["repository"],
    queryFn: fetchRepositoryData,
  });

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileIcon className="w-5 h-5 text-gray-400" />;
    if (mimeType.startsWith("image/")) return <FileImage className="w-5 h-5 text-gray-400" />;
    if (mimeType.startsWith("video/")) return <FileVideo className="w-5 h-5 text-gray-400" />;
    if (mimeType.includes("pdf") || mimeType.includes("word")) return <FileText className="w-5 h-5 text-gray-400" />;
    return <FileIcon className="w-5 h-5 text-gray-400" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return "Unknown";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredFolders = data?.folders?.filter((f: RepositoryFolder) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredFiles = data?.recentFiles?.filter((f: RepositoryFile) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Inventorying your terminal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            File Repository
          </h1>
          <p className="text-gray-400 text-sm">
            All project assets organized by client
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-black rounded-lg hover:bg-black/80 transition-all">
          <Upload className="w-4 h-4" />
          Upload
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-md border rounded-lg border-gray-200">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border border-transparent px-8 py-2 text-sm font-medium rounded-lg focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all outline-none text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Folders Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
          Folders
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {filteredFolders.map((folder: RepositoryFolder) => (
            <div
              key={folder.id}
              className="group cursor-pointer bg-white border border-gray-100 p-5 rounded-2xl flex flex-col items-center text-center gap-2.5 transition-all hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 hover:-translate-y-1 h-36 justify-center"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                <Folder className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {folder.name}
                </h3>
                <p className="text-xs font-medium text-gray-400">
                  {folder.fileCount} files
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Files Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
          Recent Files
        </h2>
        <div className="space-y-3">
          {filteredFiles.map((file: RepositoryFile) => (
            <div
              key={file.id}
              className="group bg-white border border-gray-100 p-4 rounded-lg flex items-center justify-between transition-all hover:shadow-lg hover:shadow-indigo-50/50 hover:border-indigo-100"
            >
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  {getFileIcon(file.mimeType)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {file.name}
                  </h4>
                  <p className="text-[11px] font-medium text-gray-400">
                    {file.clientName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-900 tabular-nums">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="text-right sm:w-20">
                  <p className="text-xs font-medium text-gray-400 tabular-nums">
                    {new Date(file.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
