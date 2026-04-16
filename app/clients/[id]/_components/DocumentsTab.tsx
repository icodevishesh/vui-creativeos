'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, X, Download, FileJson, FileCode, FileImage, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DocumentType } from '@prisma/client';
import Upload from '../../../../components/Upload';

interface DocumentsTabProps {
  clientId: string;
  companyName: string;
}

export function DocumentsTab({ clientId, companyName }: DocumentsTabProps) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    fileName: '',
    type: 'OTHER' as DocumentType,
  });
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['client-docs', clientId],
    queryFn: () => fetch(`/api/clients/${clientId}/documents`).then(res => res.json()),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/clients/${clientId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Document added successfully!');
      queryClient.invalidateQueries({ queryKey: ['client-docs', clientId] });
      setIsUploading(false);
      setFormData({ fileName: '', type: 'OTHER' });
      setUploadedFileData(null);
    },
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'BRAND_GUIDELINES': return <FileImage className="w-4 h-4 text-indigo-500" />;
      case 'STRATEGY_DECK': return <FileCode className="w-4 h-4 text-amber-500" />;
      case 'CONTRACT': return <FileText className="w-4 h-4 text-emerald-500" />;
      default: return <FileJson className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) return (
    <div className="flex justify-center p-20">
      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Client Resources</h2>
          <p className="text-sm text-gray-500 font-medium">All brand assets, strategies, and legal documents.</p>
        </div>
        <button
          onClick={() => setIsUploading(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Document
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">File Name</th>
              <th className="px-8 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Category</th>
              <th className="px-8 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Date Added</th>
              <th className="px-8 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents?.map((doc: any) => (
              <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                      {getFileIcon(doc.type)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{doc.fileName}</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <span className="px-2.5 py-1 bg-gray-100 text-[10px] font-semibold uppercase tracking-widest text-gray-500 rounded-lg">
                    {doc.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500 font-normal">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right">
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {documents?.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 font-medium italic">No documents uploaded yet.</p>
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-lg p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Log Document</h3>
              <button
                onClick={() => setIsUploading(false)}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Document Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Strategy Deck.pptx"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={formData.fileName}
                  onChange={(e) => setFormData(p => ({ ...p, fileName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Category</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={formData.type}
                  onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as DocumentType }))}
                >
                  {Object.values(DocumentType).map((type) => (
                    <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="w-full pt-2">
                <Upload
                  folderName={companyName}
                  disabled={!formData.fileName || !formData.type}
                  onUploadComplete={(fileData) => {
                    setUploadedFileData(fileData);
                    toast.success("File uploaded to server. Click Submit Document to save.");
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    mutation.mutate({
                      fileName: formData.fileName || uploadedFileData.name,
                      type: formData.type,
                      fileUrl: uploadedFileData.url,
                      fileSize: uploadedFileData.size,
                      mimeType: uploadedFileData.mimeType
                    });
                  }}
                  disabled={!uploadedFileData || mutation.isPending}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? 'Saving...' : 'Submit Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
