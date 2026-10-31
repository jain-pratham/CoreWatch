import React, { useState, useEffect, useCallback } from "react";
import ZoneCameraCanvas from "./ZoneCameraCanvas";
import ZoneList from "./ZoneList";
import ZoneForm from "./ZoneForm";
import DeleteZoneDialog from "./DeleteZoneDialog";
import ZoneEmptyState from "./ZoneEmptyState";
import CustomConfirmDialog from "../common/CustomConfirmDialog";
import { AlertCircle, CheckCircle, Video, Plus, Camera, VideoOff } from "lucide-react";
import { Point, IZone, ICamera, IUser } from "./types";

interface ZoneManagementViewProps {
  user: IUser | null;
  cameras: ICamera[];
  activeCameraKey: string;
  setActiveCameraKey: (key: string) => void;
  apiUrl: string;
  onNavigateToLiveCamera?: () => void;
}

export default function ZoneManagementView({
  user,
  cameras,
  activeCameraKey,
  setActiveCameraKey,
  apiUrl,
  onNavigateToLiveCamera,
}: ZoneManagementViewProps) {
  // Lists & Selected states
  const [zones, setZones] = useState<IZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<IZone | null>(null);
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingZoneToSelect, setPendingZoneToSelect] = useState<IZone | null>(null);

  // Drawing & Editing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newPoints, setNewPoints] = useState<Point[]>([]);
  const [editPoints, setEditPoints] = useState<Point[]>([]);

  // Permissions UX
  const canManage = user?.role === "admin" || user?.role === "user";

  // Ensure activeCameraKey is valid
  useEffect(() => {
    if (cameras.length > 0 && (!activeCameraKey || !cameras.some((c) => c.cameraKey === activeCameraKey))) {
      setActiveCameraKey(cameras[0].cameraKey);
    }
  }, [cameras, activeCameraKey, setActiveCameraKey]);

  const activeCamera = cameras.find((cam) => cam.cameraKey === activeCameraKey) || (cameras.length > 0 ? cameras[0] : null);
  const streamUrl = activeCamera?.streamUrl || (activeCamera ? `http://localhost:8000/api/camera/stream/${activeCamera.cameraKey}` : undefined);

  const showFeedback = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setSuccessMsg(null);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const fetchZones = useCallback(async () => {
    if (!activeCameraKey) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`${apiUrl}/api/zones?cameraId=${activeCameraKey}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setZones(data.data);
      } else {
        showFeedback("error", data.message || "Failed to retrieve zones.");
      }
    } catch (err) {
      console.error("Failed to fetch zones:", err);
      showFeedback("error", "Network error loading camera zones.");
    } finally {
      setLoading(false);
    }
  }, [activeCameraKey, apiUrl, user?.token]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (!active) return;
      fetchZones();
      // Reset states when camera switches
      setSelectedZone(null);
      setIsDrawing(false);
      setIsEditing(false);
      setNewPoints([]);
      setEditPoints([]);
    };
    load();

    return () => {
      active = false;
    };
  }, [activeCameraKey, fetchZones]);

  // CREATE ACTION
  const handleCreateZone = async (formData: Omit<IZone, "_id" | "cameraId" | "points">) => {
    setIsSaving(true);
    try {
      const payload = {
        cameraId: activeCameraKey,
        points: newPoints,
        ...formData,
      };

      const res = await fetch(`${apiUrl}/api/zones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setZones([...zones, data.data]);
        setSelectedZone(data.data);
        setIsDrawing(false);
        setNewPoints([]);
        showFeedback("success", "Security zone created successfully.");
      } else {
        showFeedback("error", data.message || "Validation failed.");
      }
    } catch (err) {
      console.error("Create zone error:", err);
      showFeedback("error", "Network error saving new zone.");
    } finally {
      setIsSaving(false);
    }
  };

  // UPDATE ACTION
  const handleUpdateZone = async (formData: Omit<IZone, "_id" | "cameraId" | "points">) => {
    if (!selectedZone) return;
    setIsSaving(true);
    try {
      const payload: Partial<IZone> = {
        ...formData,
      };
      
      // If we edited coordinates in edit mode, push the new points
      if (isEditing && editPoints.length >= 3) {
        payload.points = editPoints;
      }

      const res = await fetch(`${apiUrl}/api/zones/${selectedZone._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        // Map updated zones
        const updatedZones = zones.map((z) => (z._id === selectedZone._id ? data.data : z));
        setZones(updatedZones);
        setSelectedZone(data.data);
        setIsEditing(false);
        setEditPoints([]);
        showFeedback("success", "Zone changes saved successfully.");
      } else {
        showFeedback("error", data.message || "Validation failed.");
      }
    } catch (err) {
      console.error("Update zone error:", err);
      showFeedback("error", "Network error saving zone changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // DELETE ACTION
  const handleDeleteZone = async () => {
    if (!selectedZone) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/api/zones/${selectedZone._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.success) {
        setZones(zones.filter((z) => z._id !== selectedZone._id));
        setSelectedZone(null);
        setIsEditing(false);
        setEditPoints([]);
        setShowDeleteConfirm(false);
        showFeedback("success", "Security zone deleted successfully.");
      } else {
        showFeedback("error", data.message || "Failed to delete zone.");
      }
    } catch (err) {
      console.error("Delete zone error:", err);
      showFeedback("error", "Network error deleting zone.");
    } finally {
      setIsDeleting(false);
    }
  };

  // QUICK TOGGLE ENABLE
  const handleToggleEnable = async (zoneId: string, enabled: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/zones/${zoneId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setZones(zones.map((z) => (z._id === zoneId ? data.data : z)));
        if (selectedZone?._id === zoneId) {
          setSelectedZone(data.data);
        }
        showFeedback("success", `Zone ${enabled ? "activated" : "deactivated"}.`);
      } else {
        showFeedback("error", data.message || "Failed to toggle zone state.");
      }
    } catch (err) {
      console.error("Toggle zone enable error:", err);
      showFeedback("error", "Network error updating zone state.");
    }
  };

  // DRAWING MODES HANDLERS
  const startDrawing = () => {
    setSelectedZone(null);
    setIsEditing(false);
    setNewPoints([]);
    setEditPoints([]);
    setIsDrawing(true);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setNewPoints([]);
  };

  const completeDrawing = () => {
    if (newPoints.length < 3) {
      showFeedback("error", "A zone polygon must contain at least 3 points.");
      return;
    }
    // Triggers form state showing
    setIsDrawing(false);
  };

  const undoLastPoint = () => {
    setNewPoints(newPoints.slice(0, -1));
  };

  const clearPoints = () => {
    setNewPoints([]);
  };

  const handleSelectZone = (zone: IZone) => {
    // If drawing or editing another zone, prompt to discard
    if (isDrawing || isEditing) {
      setPendingZoneToSelect(zone);
      return;
    }

    setSelectedZone(zone);
    setIsDrawing(false);
    setIsEditing(false);
    setNewPoints([]);
    setEditPoints([]);
  };

  const confirmDiscardZoneChanges = () => {
    if (pendingZoneToSelect) {
      setSelectedZone(pendingZoneToSelect);
    }
    setIsDrawing(false);
    setIsEditing(false);
    setNewPoints([]);
    setEditPoints([]);
    setPendingZoneToSelect(null);
  };

  const startEditing = () => {
    if (!selectedZone) return;
    setEditPoints([...selectedZone.points]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditPoints([]);
  };

  return (
    <div className="space-y-6 flex flex-col h-full min-h-0 text-xs text-foreground">
      {/* 1. Header controls (Active camera selector) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">Security Inspection Zones</h2>
          <p className="text-xs text-muted-foreground">Manage active zones and rules on your camera streams.</p>
        </div>

        {cameras.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">Camera:</span>
            <select
              value={activeCameraKey}
              onChange={(e) => setActiveCameraKey(e.target.value)}
              className="flex-1 sm:w-60 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              {cameras.map((cam) => (
                <option key={cam._id} value={cam.cameraKey}>
                  {cam.locationName || cam.name} ({cam.cameraKey})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2 shrink-0 animate-fadeIn">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold flex items-center gap-2 shrink-0 animate-fadeIn">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main split work space */}
      {cameras.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 max-w-lg mx-auto my-12 space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/20">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">No Cameras Connected</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Security inspection zones, restricted areas, and perimeter rules require an active camera. Please connect an RTSP or IP camera to begin configuring safety zones.
            </p>
          </div>
          {onNavigateToLiveCamera && (
            <button
              onClick={onNavigateToLiveCamera}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs transition-all shadow-lg cursor-pointer flex items-center gap-2 mx-auto"
            >
              <Camera className="w-4 h-4" />
              <span>Connect Camera in Live Camera</span>
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
          <div className="w-8 h-8 border-3 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground font-mono text-[10px] uppercase">Retrieving camera configurations...</span>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden pb-4">
          
          {/* Main Visual SVG Drawing Layer (2/3 width on desktop) */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pr-1">
            <ZoneCameraCanvas
              activeCameraKey={activeCameraKey}
              streamUrl={streamUrl}
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={handleSelectZone}
              isDrawing={isDrawing}
              newPoints={newPoints}
              setNewPoints={setNewPoints}
              isEditing={isEditing}
              editPoints={editPoints}
              setEditPoints={setEditPoints}
              onCompleteDrawing={completeDrawing}
              onCancelDrawing={cancelDrawing}
              onUndoLastPoint={undoLastPoint}
              onClearPoints={clearPoints}
            />
          </div>

          {/* Right Control Panels (1/3 width on desktop) */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm min-h-0 overflow-y-auto flex flex-col">
            
            {/* If Drawing is in progress, block sidebar navigation and show drawing feedback */}
            {isDrawing && newPoints.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 select-none">
                <div className="w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center animate-pulse">
                  <Video className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Plotting Zone Coordinates</p>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Click points on the camera viewer to draw the boundary area. You have placed <strong>{newPoints.length}</strong> vertices.
                  </p>
                </div>
              </div>
            ) : isDrawing && newPoints.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 select-none">
                <div className="w-12 h-12 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center animate-ping">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Ready to Draw</p>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Click anywhere inside the camera viewer boundary to place the first point of the security zone.
                  </p>
                </div>
              </div>
            ) : selectedZone ? (
              /* If a zone is selected, show details / edit options */
              isEditing ? (
                <ZoneForm
                  initialData={selectedZone}
                  pointsCount={editPoints.length}
                  onSave={handleUpdateZone}
                  onCancel={cancelEditing}
                  isSaving={isSaving}
                />
              ) : (
                <div className="space-y-6">
                  {/* Selected zone details */}
                  <div className="flex justify-between items-start border-b border-border/40 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-foreground uppercase">{selectedZone.name}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{selectedZone.type.replace("_", " ")}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded font-black text-[9px] tracking-wider uppercase ${
                      selectedZone.enabled ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-zinc-500/20 text-zinc-400"
                    }`}>
                      {selectedZone.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  {/* Rules Overview */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Trigger Policies</span>
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-background/50 font-mono text-[10px]">
                      <div>
                        <span className="text-muted-foreground block mb-0.5">ALERT DELAY</span>
                        <span className="font-bold text-foreground">{selectedZone.rules?.alertAfterSeconds || 5} Seconds</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">TIMING POLICY</span>
                        <span className="font-bold text-foreground">
                          {selectedZone.rules?.afterHoursOnly ? "Outside Hours Only" : "24/7 Monitored"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {canManage && (
                    <div className="flex gap-2 justify-end border-t border-border/40 pt-4">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3.5 py-2 rounded-xl text-red-500 hover:bg-red-500/10 font-bold cursor-pointer transition-all"
                      >
                        Delete Zone
                      </button>
                      <button
                        onClick={startEditing}
                        className="px-4 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-light text-[#FAF6EE] font-bold cursor-pointer transition-all transform active:scale-98"
                      >
                        Edit Zone Details
                      </button>
                    </div>
                  )}

                  {/* Back button */}
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="w-full text-center py-2 text-[10px] text-muted-foreground hover:text-foreground font-bold tracking-wider uppercase border border-dashed border-border rounded-xl transition-all cursor-pointer"
                  >
                    ← Back to Zone List
                  </button>
                </div>
              )
            ) : newPoints.length >= 3 && !isDrawing ? (
              /* If polygon is closed/drawing finished but not saved, show input Form */
              <ZoneForm
                pointsCount={newPoints.length}
                onSave={handleCreateZone}
                onCancel={cancelDrawing}
                isSaving={isSaving}
              />
            ) : zones.length === 0 ? (
              /* If no zones configured, show Empty Onboarding State */
              <ZoneEmptyState onCreateClick={startDrawing} canManage={canManage} />
            ) : (
              /* Default display: Sidebar listing */
              <ZoneList
                zones={zones}
                selectedZone={selectedZone}
                onSelectZone={handleSelectZone}
                onToggleEnable={handleToggleEnable}
                onCreateClick={startDrawing}
                canManage={canManage}
              />
            )}

          </div>
        </div>
      )}

      {/* Delete Dialog Overlay */}
      <DeleteZoneDialog
        zoneName={selectedZone?.name || ""}
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteZone}
        isDeleting={isDeleting}
      />

      {/* Discard Drawing Changes Dialog */}
      <CustomConfirmDialog
        isOpen={!!pendingZoneToSelect}
        title="Discard Drawing Changes?"
        message="You have unsaved polygon points plotted on the camera viewer. Are you sure you want to discard these drawing changes?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        variant="warning"
        onConfirm={confirmDiscardZoneChanges}
        onCancel={() => setPendingZoneToSelect(null)}
      />
    </div>
  );
}
