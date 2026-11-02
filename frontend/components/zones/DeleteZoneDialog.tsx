import React from "react";
import { AlertTriangle } from "lucide-react";

interface DeleteZoneDialogProps {
  zoneName: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteZoneDialog({
  zoneName,
  isOpen,
  onCancel,
  onConfirm,
  isDeleting,
}: DeleteZoneDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md p-6 rounded-2xl border border-[#27293d] bg-[#181926] shadow-2xl space-y-6 text-xs text-slate-100 z-10 animate-scaleIn">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">Delete Zone?</h3>
            <p className="text-slate-400 leading-normal">
              Are you sure you want to delete the security zone <strong className="text-white">&ldquo;{zoneName}&rdquo;</strong>? This action cannot be undone and will stop AI alerting for this region.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-[#27293d] bg-[#141624] hover:bg-[#1f2238] font-bold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-rose-950/40"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Zone</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
