'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react';

export interface CustomConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode | string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  hideCancel?: boolean;
}

export default function CustomConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
  hideCancel = false,
}: CustomConfirmDialogProps) {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'success':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-500 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'info':
      default:
        return 'bg-orange-500 hover:bg-orange-400 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isLoading && onCancel) {
            onCancel();
          }
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md p-6 rounded-2xl border border-border bg-card shadow-2xl space-y-6 text-xs text-foreground z-10 animate-scaleIn">
        <div className="flex gap-4">
          {renderIcon()}
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{title}</h3>
            <div className="text-muted-foreground leading-normal">
              {message}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {!hideCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-bold text-foreground transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${getConfirmButtonClass()}`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText || (hideCancel ? 'OK' : 'Confirm')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

