'use client';

import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  CheckCircle2,
  X,
  Maximize2
} from 'lucide-react';

interface UserContentManagementViewProps {
  dbAlerts: any[];
}

export default function UserContentManagementView({ dbAlerts }: UserContentManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'gallery'>('alerts');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [selectedPreview, setSelectedPreview] = useState<any | null>(null);

  const mockGalleryItems = [
    {
      id: 'g-1',
      title: 'Roof Deck Surveillance',
      camera: 'CAM 07 - ROOF NE',
      date: '2026-10-25 13:48:15',
      src: '/uploads/sky.jpg',
      category: 'Perimeter Observation',
      resolution: '1920x1080'
    },
    {
      id: 'g-2',
      title: 'Tower Facade Inspection',
      camera: 'CAM 04 - TOWER',
      date: '2026-10-25 14:15:32',
      src: '/uploads/building.jpg',
      category: 'Structural Monitoring',
      resolution: '1920x1080'
    },
    {
      id: 'g-3',
      title: 'Warehouse Bay 1 & 2',
      camera: 'CAM 12 - DOCK B12',
      date: '2026-10-24 14:18:34',
      src: '/uploads/warehouse.jpg',
      category: 'Forklift Safety Zone',
      resolution: '1920x1080'
    },
    {
      id: 'g-4',
      title: 'Corporate Lobby Entrance',
      camera: 'CAM 04 - LOBBY',
      date: '2026-10-24 09:34:12',
      src: '/uploads/lobby.jpg',
      category: 'Visitor Access Log',
      resolution: '1920x1080'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27293d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Content Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Archived security incident captures, AI safety detections, and high-definition time lapse recordings.
          </p>
        </div>

        <div className="flex rounded-xl bg-[#1e2136] p-1 border border-[#2d3252] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AI Safety Incidents</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Snapshot Library</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: AI SAFETY INCIDENTS / ALERTS */}
      {activeTab === 'alerts' && (
        <div className="border border-[#27293d] bg-[#181926] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">
              Real-Time Security Event Stream
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Live automated detections
            </span>
          </div>

          <div className="space-y-3">
            {dbAlerts.length > 0 ? (
              dbAlerts.map((alert) => (
                <div 
                  key={alert._id} 
                  className="p-4 rounded-xl border border-[#27293d] bg-[#121422] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-xs hover:border-orange-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {alert.imageUrl ? (
                      <img 
                        src={alert.imageUrl} 
                        alt="Alert Snapshot" 
                        className="w-16 h-12 object-cover rounded-lg border border-[#2b2e46] shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-white truncate text-sm">
                        {alert.message || 'Safety Rule Violation Detected'}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] truncate">
                        Camera Key: <span className="text-orange-400 font-bold">{alert.cameraKey}</span> · {new Date(alert.timestamp).toLocaleTimeString()} ({new Date(alert.timestamp).toLocaleDateString()})
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full font-bold uppercase text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                    CRITICAL ALERT
                  </span>
                </div>
              ))
            ) : (
              // Default realistic alerts when database empty
              [
                {
                  id: 'mock-alt-1',
                  msg: 'CAM 03: PPE Non-Compliance — Missing Hard Hat in Construction Zone',
                  cam: 'CAM 03 (Fabrication Area)',
                  time: 'Today, 10:24 AM',
                  sev: 'HIGH'
                },
                {
                  id: 'mock-alt-2',
                  msg: 'CAM 01: Restricted Boundary Intrusion past 22:00 PM',
                  cam: 'CAM 01 (Entrance Perimeter)',
                  time: 'Today, 09:12 AM',
                  sev: 'HIGH'
                },
                {
                  id: 'mock-alt-3',
                  msg: 'CAM 02: Forklift Proximity Hazard within 1.5 meters of worker',
                  cam: 'CAM 02 (Warehouse Loading)',
                  time: 'Yesterday, 16:45 PM',
                  sev: 'HIGH'
                }
              ].map((alt) => (
                <div 
                  key={alt.id} 
                  className="p-4 rounded-xl border border-[#27293d] bg-[#121422] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-xs hover:border-orange-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-white truncate text-sm">
                        {alt.msg}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] truncate">
                        {alt.cam} · {alt.time}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full font-bold uppercase text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                    {alt.sev}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: SNAPSHOT & VIDEO ARCHIVES */}
      {activeTab === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockGalleryItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPreview(item)}
              className="group relative rounded-2xl overflow-hidden bg-[#181926] border border-[#27293d] shadow-xl hover:border-orange-500/60 transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="p-4 space-y-1 text-left">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {item.camera} · {item.date}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.resolution}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Preview */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#161826] border border-[#2b304c] rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b304c] bg-[#1a1d2e]">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedPreview.title}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedPreview.camera} · {selectedPreview.date}</p>
              </div>
              <button
                onClick={() => setSelectedPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black/60 flex items-center justify-center">
              <img
                src={selectedPreview.src}
                alt={selectedPreview.title}
                className="max-h-[65vh] w-auto rounded-lg object-contain border border-[#2b304c]"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
