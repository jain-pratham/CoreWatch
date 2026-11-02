import React from "react";
import { Shield, Plus } from "lucide-react";

interface ZoneEmptyStateProps {
  onCreateClick: () => void;
  canManage: boolean;
}

export default function ZoneEmptyState({ onCreateClick, canManage }: ZoneEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center border border-dashed border-[#27293d] rounded-2xl bg-[#161826]/70 backdrop-blur-sm space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-inner">
        <Shield className="w-8 h-8" />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h3 className="text-sm font-bold text-white tracking-wide">No Security Zones Configured</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Security zones define restricted areas, cash counters, or high-value locations on a camera feed. 
          CoreWatch monitors these regions and triggers real-time alerts if safety or security policies are breached.
        </p>
      </div>

      {canManage && (
        <button
          onClick={onCreateClick}
          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs tracking-wide transition-all duration-200 cursor-pointer shadow-lg shadow-orange-950/40 flex items-center gap-2 transform active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Create Security Zone</span>
        </button>
      )}
    </div>
  );
}
