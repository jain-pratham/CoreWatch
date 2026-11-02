import React, { useState, useEffect } from "react";
import { Trash2, Check, AlertCircle } from "lucide-react";
import { IZone } from "./types";

interface ZoneFormProps {
  initialData?: IZone;
  pointsCount: number;
  onSave: (formData: Omit<IZone, "_id" | "cameraId" | "points">) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSaving: boolean;
}

const ZONE_TYPES = [
  { value: "RESTRICTED", label: "Restricted Area", desc: "No unauthorized personnel entries permitted." },
  { value: "VALUABLE", label: "Valuable Asset", desc: "Monitors high-value goods, vaults, or servers." },
  { value: "CASH_COUNTER", label: "Cash Counter", desc: "Cash drawer, registers, or billing desk." },
  { value: "STORAGE", label: "Storage Bay", desc: "Inventory racks, warehouses, or bays." },
  { value: "DOOR", label: "Access Door", desc: "Main entryways, exits, or fire escapes." },
  { value: "CUSTOM", label: "Custom Area", desc: "Tailored operations and custom detections." },
];

export default function ZoneForm({
  initialData,
  pointsCount,
  onSave,
  onCancel,
  onDelete,
  isSaving,
}: ZoneFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<IZone["type"]>("RESTRICTED");
  const [enabled, setEnabled] = useState(true);
  const [alertAfterSeconds, setAlertAfterSeconds] = useState(5);
  const [afterHoursOnly, setAfterHoursOnly] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const updateForm = async () => {
      await Promise.resolve();
      if (!active) return;
      if (initialData) {
        setName(initialData.name || "");
        setType(initialData.type || "RESTRICTED");
        setEnabled(initialData.enabled !== undefined ? initialData.enabled : true);
        if (initialData.rules) {
          setAlertAfterSeconds(initialData.rules.alertAfterSeconds || 5);
          setAfterHoursOnly(initialData.rules.afterHoursOnly || false);
        }
      } else {
        setName("");
        setType("RESTRICTED");
        setEnabled(true);
        setAlertAfterSeconds(5);
        setAfterHoursOnly(false);
      }
    };
    updateForm();
    return () => {
      active = false;
    };
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Zone name is required";
    }
    
    if (pointsCount < 3) {
      newErrors.points = "Polygon must contain at least 3 points";
    }

    if (alertAfterSeconds < 1 || alertAfterSeconds > 300) {
      newErrors.alertAfterSeconds = "Alert delay must be between 1 and 300 seconds";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave({
      name: name.trim(),
      type,
      enabled,
      rules: {
        alertAfterSeconds,
        enabled,
        afterHoursOnly,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-100">
      {/* Title */}
      <h3 className="text-sm font-bold text-white tracking-wide">
        {initialData ? "Modify Security Zone" : "Configure New Zone"}
      </h3>

      <div className="space-y-4">
        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Zone Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Back Alley Storage"
            className="w-full px-3 py-2.5 rounded-xl border border-[#27293d] bg-[#161826] text-white text-xs font-semibold placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
          />
          {errors.name && (
            <p className="text-[10px] text-rose-400 font-bold mt-1">
              ⚠️ {errors.name}
            </p>
          )}
        </div>

        {/* Type select */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Detection Zone Type <span className="text-rose-400">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as IZone["type"])}
            className="w-full px-3 py-2.5 rounded-xl border border-[#27293d] bg-[#161826] text-white text-xs font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 cursor-pointer"
          >
            {ZONE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 leading-normal pt-0.5">
            {ZONE_TYPES.find((t) => t.value === type)?.desc}
          </p>
        </div>

        {/* Canvas points validation error indicator */}
        {pointsCount < 3 && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 flex items-start gap-2 leading-relaxed font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase font-bold">Incomplete Polygon</p>
              <p className="text-[10px] font-normal text-slate-400 mt-0.5">
                Please click on the camera preview canvas to add vertices. You need at least 3 points to define a valid zone area.
              </p>
            </div>
          </div>
        )}

        {/* Enabled Status checkbox */}
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="zone-enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded accent-orange-500 bg-[#161826] border-[#27293d] text-orange-500 cursor-pointer"
          />
          <label htmlFor="zone-enabled" className="text-xs font-bold text-slate-200 cursor-pointer">
            Activate this zone immediately
          </label>
        </div>

        {/* Rules Card */}
        <div className="p-4 rounded-xl border border-[#27293d] bg-[#161826]/70 space-y-4">
          <div className="font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-1.5 border-b border-[#27293d]">
            Security Rules Configuration
          </div>

          {/* alertAfterSeconds */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 block mb-1">
              Alert Trigger Delay (Seconds)
            </label>
            <input
              type="number"
              min={1}
              max={300}
              value={alertAfterSeconds}
              onChange={(e) => setAlertAfterSeconds(parseInt(e.target.value, 10) || 5)}
              className="w-full px-3 py-2 rounded-xl border border-[#27293d] bg-[#121422] text-white text-xs font-mono font-bold focus:outline-none focus:border-orange-500"
            />
            <span className="text-[9px] text-slate-400 leading-normal block">
              Raises alert if intrusion/compliance violation persists for this duration (seconds).
            </span>
            {errors.alertAfterSeconds && (
              <p className="text-[10px] text-rose-400 font-bold mt-1">
                ⚠️ {errors.alertAfterSeconds}
              </p>
            )}
          </div>

          {/* afterHoursOnly */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="rules-afterhours"
              checked={afterHoursOnly}
              onChange={(e) => setAfterHoursOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-orange-500 bg-[#121422] border-[#27293d] text-orange-500 cursor-pointer"
            />
            <label htmlFor="rules-afterhours" className="text-xs font-bold text-slate-200 cursor-pointer">
              After hours only (monitoring active outside business hours)
            </label>
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center justify-between border-t border-[#27293d] pt-4">
        {onDelete && initialData ? (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Zone</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[#27293d] hover:bg-white/5 text-slate-300 font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || pointsCount < 3}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-950/40 transform active:scale-98"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{initialData ? "Save Changes" : "Create Zone"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
