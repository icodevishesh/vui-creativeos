"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, Save, Loader2 } from 'lucide-react';

interface Task {
  id: string;
  title: string;
}

interface WritingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  initialContent?: string;
  onSuccess?: () => void;
}

export const WritingModal: React.FC<WritingModalProps> = ({ 
  isOpen, 
  onClose, 
  task, 
  initialContent = "",
  onSuccess
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);

  useEffect(() => {
    if (task) {
        setContent(initialContent);
        setLastSavedContent(initialContent);
    }
  }, [task, initialContent]);

  const saveDraft = useCallback(async (currentContent: string, isAutoSave = false) => {
    if (!task || currentContent === lastSavedContent) return;

    if (!isAutoSave) setIsSaving(true);
    try {
      await fetch(`/api/tasks/${task.id}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            content: currentContent,
            status: 'IN_PROGRESS' 
        }),
      });
      setLastSavedContent(currentContent);
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  }, [task, lastSavedContent]);

  // Auto-save logic
  useEffect(() => {
    if (!isOpen || !task) return;

    const timer = setTimeout(() => {
      saveDraft(content, true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [content, isOpen, task, saveDraft]);

  const handleSubmit = async () => {
    if (!task) return;

    setIsSubmitting(true);
    try {
      await fetch(`/api/tasks/${task.id}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            content,
            status: 'INTERNAL_REVIEW' 
        }),
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to submit writing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{task.title}</h3>
            <p className="text-sm text-gray-400">Drafting Content</p>
          </div>
          <button 
            onClick={() => {
                saveDraft(content);
                onClose();
            }}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your content here..."
            className="w-full h-full text-lg text-gray-800 bg-transparent border-none outline-none resize-none leading-relaxed placeholder:text-gray-300"
            autoFocus
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-400 flex items-center gap-2">
            {isSaving ? (
                <><Loader2 size={14} className="animate-spin" /> Saving draft...</>
            ) : content !== lastSavedContent ? (
                <>Unsaved changes</>
            ) : (
                <><Save size={14} /> All changes saved</>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                saveDraft(content);
                onClose();
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Save & Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-100"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit for Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
