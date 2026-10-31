import React, { useRef, useState, useEffect } from "react";
import { Undo2, X, Check, Trash2, VideoOff, RotateCw } from "lucide-react";

import { Point, IZone } from "./types";

interface ZoneCameraCanvasProps {
  activeCameraKey: string;
  streamUrl?: string;
  zones: IZone[];
  selectedZone: IZone | null;
  onSelectZone: (zone: IZone) => void;
  isDrawing: boolean;
  newPoints: Point[];
  setNewPoints: (pts: Point[]) => void;
  isEditing: boolean;
  editPoints: Point[];
  setEditPoints: (pts: Point[]) => void;
  onCompleteDrawing: () => void;
  onCancelDrawing: () => void;
  onUndoLastPoint: () => void;
  onClearPoints: () => void;
}

const ZONE_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  RESTRICTED: { fill: "rgba(239, 68, 68, 0.12)", stroke: "#EF4444", glow: "rgba(239, 68, 68, 0.4)" },
  VALUABLE: { fill: "rgba(59, 130, 246, 0.12)", stroke: "#3B82F6", glow: "rgba(59, 130, 246, 0.4)" },
  CASH_COUNTER: { fill: "rgba(245, 158, 11, 0.12)", stroke: "#F59E0B", glow: "rgba(245, 158, 11, 0.4)" },
  STORAGE: { fill: "rgba(139, 92, 246, 0.12)", stroke: "#8B5CF6", glow: "rgba(139, 92, 246, 0.4)" },
  DOOR: { fill: "rgba(16, 185, 129, 0.12)", stroke: "#10B981", glow: "rgba(16, 185, 129, 0.4)" },
  CUSTOM: { fill: "rgba(6, 182, 212, 0.12)", stroke: "#06B6D4", glow: "rgba(6, 182, 212, 0.4)" },
};

export default function ZoneCameraCanvas({
  activeCameraKey,
  streamUrl,
  zones,
  selectedZone,
  onSelectZone,
  isDrawing,
  newPoints,
  setNewPoints,
  isEditing,
  editPoints,
  setEditPoints,
  onCompleteDrawing,
  onCancelDrawing,
  onUndoLastPoint,
  onClearPoints,
}: ZoneCameraCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [streamOffline, setStreamOffline] = useState(false);

  useEffect(() => {
    setStreamOffline(false);
  }, [streamUrl, activeCameraKey]);

  const getNormalizedCoords = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;
    
    // Clamp to [0, 1]
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    
    return { x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const { x, y } = getNormalizedCoords(e);

    // Check if clicking near the first point to close (snap radius = 3%)
    if (newPoints.length >= 3) {
      const fp = newPoints[0];
      const distance = Math.sqrt(Math.pow(x - fp.x, 2) + Math.pow(y - fp.y, 2));
      if (distance < 0.03) {
        onCompleteDrawing();
        return;
      }
    }

    setNewPoints([...newPoints, { x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const { x, y } = getNormalizedCoords(e);

    if (isDrawing && newPoints.length > 0) {
      setMousePos({ x, y });
    } else {
      setMousePos(null);
    }

    if (draggedPointIndex !== null && isEditing && editPoints.length > 0) {
      const updated = [...editPoints];
      updated[draggedPointIndex] = { x, y };
      setEditPoints(updated);
    }
  };

  const handleVertexPointerDown = (e: React.PointerEvent<SVGCircleElement>, index: number) => {
    e.stopPropagation();
    setDraggedPointIndex(index);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleVertexPointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDraggedPointIndex(null);
  };

  // Convert normalized points string for SVG rendering
  const getSvgPointsString = (pointsList: Point[]) => {
    return pointsList.map(p => `${p.x * 1600},${p.y * 900}`).join(" ");
  };

  return (
    <div className="space-y-4">
      {/* 16:9 Aspect Video Container with Overlay */}
      <div className="relative aspect-video w-full rounded-2xl border border-border bg-[#020415] overflow-hidden shadow-2xl group select-none">
        
        {/* CCTV Scanline/Grid CSS Effects */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-40"></div>
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>

        {/* High-tech security grid when empty */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,93,50,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,93,50,0.06)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        {/* Camera Live Stream OR Clean Offline State (No fake demo fallback) */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#070913] overflow-hidden">
          {streamUrl && !streamOffline ? (
            <img
              src={streamUrl}
              alt={`Live Camera Feed - ${activeCameraKey}`}
              className="w-full h-full object-contain"
              onError={() => setStreamOffline(true)}
              onLoad={() => setStreamOffline(false)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-3 select-none relative z-0">
              <div className="w-14 h-14 rounded-2xl bg-[#121424] border border-orange-500/20 text-orange-400 flex items-center justify-center shadow-lg">
                <VideoOff className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[9px] font-mono font-bold tracking-wider uppercase mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Camera Feed Inactive
                </div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  {activeCameraKey ? `Stream Signal Offline (${activeCameraKey})` : "No Stream Available"}
                </h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Live RTSP / MJPEG feed is not transmitting frames. Security inspection zones can still be plotted, calibrated, and saved on this coordinate grid.
                </p>
              </div>
              {streamUrl && (
                <button
                  type="button"
                  onClick={() => setStreamOffline(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#181a2e] hover:bg-[#20233d] border border-[#2b2f4c] text-zinc-300 hover:text-white text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Retry Stream Connection</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* CCTV Stream details overlay */}
        <div className="absolute top-4 left-4 font-mono text-[9px] text-zinc-400 bg-[#0A0B0E]/85 border border-[#16171D] px-2.5 py-1.5 rounded-lg z-20 space-y-0.5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-1.5 font-bold text-zinc-100">
            <span className={`w-1.5 h-1.5 rounded-full ${!streamOffline && streamUrl ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
            <span>CCTV STREAM: {activeCameraKey || "UNASSIGNED"}</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${!streamOffline && streamUrl ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border border-amber-500/20"}`}>
              {!streamOffline && streamUrl ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <div>1920 × 1080 @ 30FPS · RTSP/MJPEG</div>
          <div>UTC ZONE LOGGING ENGINE v1.4</div>
        </div>

        {/* Dynamic Canvas Workspace */}
        <svg
          ref={svgRef}
          viewBox="0 0 1600 900"
          className="absolute inset-0 w-full h-full z-20 cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        >
          {zones.map((zone) => {
            if (!zone.points || zone.points.length < 3) return null;
            const isSelected = selectedZone?._id === zone._id;
            const style = ZONE_COLORS[zone.type] || { fill: "rgba(100,116,139,0.12)", stroke: "#64748b", glow: "rgba(100,116,139,0.2)" };
            const pointsStr = getSvgPointsString(zone.points);
            
            return (
              <g key={zone._id} className="cursor-pointer" onClick={() => onSelectZone(zone)}>
                <polygon
                  points={pointsStr}
                  fill={style.fill}
                  stroke={isSelected ? "#785D32" : style.stroke}
                  strokeWidth={isSelected ? "5" : "2"}
                  className="transition-all duration-300"
                  style={{
                    filter: isSelected ? `drop-shadow(0 0 12px ${style.glow})` : "none",
                    opacity: !zone.enabled && !isSelected ? 0.35 : 1,
                  }}
                />
                
                {/* Visual Label overlay inside SVG for Selected/Hovered Zones */}
                {isSelected && (
                  <foreignObject
                    x={zone.points[0].x * 1600}
                    y={Math.max(20, zone.points[0].y * 900 - 45)}
                    width="220"
                    height="40"
                  >
                    <div className="bg-[#0A0B0E] border border-brand-gold text-[10px] px-2 py-1 rounded shadow-lg text-brand-cream uppercase font-bold tracking-wider inline-block">
                      {zone.name}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Render Drawing Zone Points & Lines */}
          {isDrawing && newPoints.length > 0 && (
            <g>
              <polyline
                points={getSvgPointsString(newPoints)}
                fill="rgba(120,93,50,0.1)"
                stroke="#C0A06E"
                strokeWidth="3"
                strokeDasharray="4,4"
              />
              
              {/* Line from last point to cursor */}
              {mousePos && (
                <line
                  x1={newPoints[newPoints.length - 1].x * 1600}
                  y1={newPoints[newPoints.length - 1].y * 900}
                  x2={mousePos.x * 1600}
                  y2={mousePos.y * 900}
                  stroke="#C0A06E"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />
              )}

              {/* Point Handles */}
              {newPoints.map((pt, idx) => {
                const isFirst = idx === 0;
                return (
                  <circle
                    key={idx}
                    cx={pt.x * 1600}
                    cy={pt.y * 900}
                    r={isFirst ? "10" : "7"}
                    fill={isFirst ? "#785D32" : "#C0A06E"}
                    stroke="#FAF6EE"
                    strokeWidth="2"
                    className={isFirst ? "animate-pulse cursor-pointer" : ""}
                  />
                );
              })}
            </g>
          )}

          {/* Render Edit Handles */}
          {isEditing && editPoints.length > 0 && (
            <g>
              <polygon
                points={getSvgPointsString(editPoints)}
                fill="rgba(120,93,50,0.15)"
                stroke="#C0A06E"
                strokeWidth="3"
              />
              {editPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x * 1600}
                  cy={pt.y * 900}
                  r="9"
                  fill="#FAF6EE"
                  stroke="#785D32"
                  strokeWidth="3"
                  className="cursor-move select-none"
                  onPointerDown={(e) => handleVertexPointerDown(e, idx)}
                  onPointerUp={handleVertexPointerUp}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Safe Area Guides HUD info */}
        {isDrawing && (
          <div className="absolute bottom-4 right-4 bg-black/60 border border-border px-3 py-1.5 rounded-lg text-[10px] text-brand-cream/80 font-bold z-20 select-none animate-pulse">
            Drawing Mode Active · Click Canvas to Plot · Click first point to Close
          </div>
        )}
      </div>

      {/* Interactive HUD drawing controls bar */}
      {isDrawing && (
        <div className="flex gap-2 justify-end text-xs shrink-0 select-none">
          <button
            onClick={onUndoLastPoint}
            disabled={newPoints.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted font-bold text-foreground cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Point</span>
          </button>
          <button
            onClick={onClearPoints}
            disabled={newPoints.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border hover:bg-muted text-red-500 font-bold cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Grid</span>
          </button>
          <button
            onClick={onCancelDrawing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted font-bold cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <button
            onClick={onCompleteDrawing}
            disabled={newPoints.length < 3}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-[#FAF6EE] font-bold cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Complete Zone</span>
          </button>
        </div>
      )}
    </div>
  );
}
