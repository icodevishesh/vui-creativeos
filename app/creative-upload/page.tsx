"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UploadCloud,
  FileImage,
  FileVideo,
  FileText,
  File as FileIcon,
  ArrowUpRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { FileUploader } from "react-drag-drop-files";
import { toast } from "react-hot-toast";

const FILE_TYPES = ["JPG", "PNG", "MP4", "PDF"];

interface Client {
  id: string;
  companyName: string;
}

interface Asset {
  id: string;
  name: string;
  mappedTo: string;
  type: "image" | "video" | "doc" | "other";
  date: string;
  url: string;
}

export default function CreativeUploadPage() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: "1",
      name: "spring-carousel-v3.png",
      mappedTo: "IG Carousel — Spring",
      type: "image",
      date: "Apr 2",
      url: "#",
    },
    {
      id: "2",
      name: "product-reel-final.mp4",
      mappedTo: "IG Reel — Product Launch",
      type: "video",
      date: "Apr 1",
      url: "#",
    },
    {
      id: "3",
      name: "linkedin-ad-copy.docx",
      mappedTo: "LinkedIn Ad — Q2",
      type: "doc",
      date: "Mar 30",
      url: "#",
    },
  ]);

  // Fetch Clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => fetch("/api/clients").then((res) => res.json()),
  });

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="w-5 h-5 text-gray-400" />;
      case "video":
        return <FileVideo className="w-5 h-5 text-gray-400" />;
      case "doc":
        return <FileText className="w-5 h-5 text-gray-400" />;
      default:
        return <FileIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const determineFileType = (mime: string): Asset["type"] => {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.includes("pdf") || mime.includes("word") || mime.includes("officedocument")) return "doc";
    return "other";
  };

  const handleUpload = (file: File) => {
    if (!selectedClientId) {
      toast.error("Please select a client first");
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderName", selectedClient?.companyName || "general");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/file/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = (event.loaded / event.total) * 100;
        setProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        const newAsset: Asset = {
          id: Math.random().toString(36).substr(2, 9),
          name: response.name,
          mappedTo: "Unmapped",
          type: determineFileType(response.mimeType),
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          url: response.url,
        };
        setAssets((prev) => [newAsset, ...prev]);
        toast.success("File uploaded successfully");
      } else {
        toast.error("Upload failed");
      }
      setUploading(false);
      setProgress(0);
    };

    xhr.onerror = () => {
      toast.error("Network error occurred");
      setUploading(false);
    };

    xhr.send(formData);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">
            Creative Upload
          </h1>
          <p className="text-gray-400 text-xs font-medium">
            Upload and manage creative assets
          </p>
        </div>

        {/* Compact Client Selector */}
        <div className="flex items-center gap-4">
          {selectedClient && (
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest leading-none mb-1">Target Folder</p>
                <p className="text-[11px] font-medium text-indigo-600 leading-none">/uploads/{selectedClient.companyName.toLowerCase().replace(/ /g, "_")}</p>
             </div>
          )}
          <div className="relative group w-48">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              disabled={clientsLoading}
              className="w-full appearance-none bg-white border border-gray-200 text-[11px] font-medium text-gray-900 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block px-4 py-1.5 pr-8 cursor-pointer transition-all hover:border-indigo-300 shadow-sm"
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.companyName}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              {clientsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Dropzone */}
        <div className="relative">
          <FileUploader
            handleChange={handleUpload}
            name="file"
            types={FILE_TYPES}
            disabled={!selectedClientId || uploading}
          >
            <div className={`relative group transition-all ${(!selectedClientId || uploading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="absolute inset-0 bg-indigo-50/20 rounded-3xl -m-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative border-2 border-dashed border-gray-100 rounded-3xl bg-white p-12 text-center transition-all hover:border-indigo-200">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  {uploading ? (
                    <div className="relative">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  ) : (
                    <UploadCloud className={`w-6 h-6 ${!selectedClientId ? 'text-gray-300' : 'text-gray-400'}`} />
                  )}
                </div>
                <h3 className="text-xs font-medium text-gray-900 mb-1">
                  {uploading 
                    ? "Uploading your file..." 
                    : !selectedClientId 
                      ? "Select a client to enable upload" 
                      : "Drop files here or click to upload"
                  }
                </h3>
                <p className="text-[11px] font-medium text-gray-400">
                  {uploading 
                    ? `${Math.round(progress)}% complete` 
                    : !selectedClientId 
                      ? "The file picker is locked" 
                      : "PNG, JPG, MP4, PDF up to 50MB"
                  }
                </p>

                {uploading && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50 rounded-b-3xl overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </FileUploader>
        </div>

        {/* Asset List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Recent Assets
            </h2>
            <span className="text-[10px] font-medium text-gray-400">
              {assets.length} items
            </span>
          </div>
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between transition-all hover:shadow-md hover:shadow-indigo-50/50 hover:border-indigo-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors border border-gray-50 group-hover:border-indigo-100">
                  {getFileIcon(asset.type)}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {asset.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                    <span>Mapped to:</span>
                    <span className="text-gray-900 leading-none">
                      {asset.mappedTo}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                    Uploaded
                  </p>
                  <p className="text-xs font-medium text-gray-900 tabular-nums">
                    {asset.date}
                  </p>
                </div>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
