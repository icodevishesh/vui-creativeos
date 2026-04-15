"use client";

import React, { useState } from 'react';
import { FileText, Upload, Send, File, X, Image as ImageIcon, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  client?: {
    companyName: string;
  };
  endDate?: string | Date;
  status: string;
  attachments?: any[];
}

interface UploadAndSubmitTabProps {
  task: Task | null;
  onSuccess?: () => void;
}

export const UploadAndSubmitTab: React.FC<UploadAndSubmitTabProps> = ({ task, onSuccess }) => {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
     if (!task) return;
     setIsSubmitting(true);
     try {
        const formData = new FormData();
        files.forEach((file) => formData.append('file', file));
        if (notes.trim()) formData.append('notes', notes);
        formData.append('status', 'INTERNAL_REVIEW');

        const res = await fetch(`/api/tasks/${task.id}/designer-content`, {
            method: 'PATCH',
            body: formData,
        });

        if (!res.ok) throw new Error('Submission failed');
        onSuccess?.();
     } catch (err) {
        console.error("Submission failed", err);
     } finally {
        setIsSubmitting(false);
     }
  };

  if (!task) return (
     <div className="bg-white border border-gray-100 rounded-lg p-12 text-center flex flex-col items-center">
        <Upload size={32} className="text-gray-300 mb-4" />
        <h3 className="font-bold text-gray-900">Select a task first</h3>
        <p className="text-gray-500 text-sm">Expand a task from the list and click "Upload Design"</p>
     </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      {/* Left Column: Brief & Assets */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-8 h-fit">
        <div>
           <h3 className="text-xl font-bold text-gray-900 mb-1">Design Brief</h3>
           <p className="text-sm font-medium text-gray-400">{task.title} — {task.client?.companyName}</p>
        </div>

        <div>
           <p className="text-sm text-gray-600 leading-relaxed font-medium">
             {task.description || "No specific requirements provided."}
           </p>
        </div>

        <div>
           <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assets</h4>
           <div className="flex flex-wrap gap-2">
              {task.attachments && task.attachments.length > 0 ? (
                task.attachments.map((asset: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-100">
                    <FileText size={14} className="text-gray-400" />
                    {asset.fileName}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No assets provided.</p>
              )}
           </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-50 pt-6">
           {task.endDate && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                 <Clock size={14} />
                 Due {new Date(task.endDate).toLocaleDateString()}
              </div>
           )}
           <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
              {task.status.replace(/_/g, ' ')}
           </span>
        </div>
      </div>

      {/* Right Column: Upload & Submit */}
      <div className="space-y-6">
         <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col gap-6">
            <div>
               <h3 className="text-xl font-bold text-gray-900 mb-1">Upload & Submit</h3>
               <p className="text-sm font-medium text-gray-400">Upload your design files and submit for review</p>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-gray-100 rounded-lg p-10 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50 group hover:border-blue-200 transition-all cursor-pointer relative">
               <input 
                 type="file" 
                 multiple 
                 onChange={handleFileUpload}
                 className="absolute inset-0 opacity-0 cursor-pointer"
               />
               <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} className="text-gray-300 group-hover:text-blue-500" />
               </div>
               <p className="text-sm font-bold text-gray-900 mb-1">Drag & drop design files here</p>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">PNG, JPG, PSD, AI, Figma link</p>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
               <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Files Selected</p>
                  <div className="flex flex-wrap gap-2">
                     {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 animate-in zoom-in duration-200">
                           <File size={14} />
                           {file.name}
                           <button onClick={() => removeFile(idx)} className="ml-1 hover:text-blue-900">
                             <X size={14} />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Design Notes</p>
               <textarea
                 value={notes}
                 onChange={(e) => setNotes(e.target.value)}
                 placeholder="Design notes (e.g., changes made, rationale)..."
                 className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
               />
            </div>

            <button
               onClick={handleSubmit}
               disabled={isSubmitting || (files.length === 0 && !notes.trim()) || !task}
               className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
            >
               {isSubmitting ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <Send size={18} />
               )}
               Submit for Internal Review
            </button>
         </div>
      </div>
    </div>
  );
};
