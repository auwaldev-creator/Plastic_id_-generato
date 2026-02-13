"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload, Trash2, Plus } from "lucide-react";
import type { FieldPositions, MaskRect, Preset } from "@/lib/types";

interface PositionEditorProps {
  positions: FieldPositions;
  masks: MaskRect[];
  onPositionsChange: (p: FieldPositions) => void;
  onMasksChange: (m: MaskRect[]) => void;
}

const FIELD_LABELS: Record<string, string> = {
  photo: "Photo",
  surname: "Surname",
  givenNames: "Given Names",
  nin: "NIN",
  dateOfBirth: "Date of Birth",
  sex: "Sex",
};

const PRESET_KEY = "docgen_presets";

function getPresets(): Preset[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PRESET_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePresets(presets: Preset[]) {
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
}

export function PositionEditor({
  positions,
  masks,
  onPositionsChange,
  onMasksChange,
}: PositionEditorProps) {
  const [presets, setPresets] = useState<Preset[]>(getPresets());
  const [presetName, setPresetName] = useState("");

  const updateField = useCallback(
    (field: string, prop: string, value: number) => {
      const updated = { ...positions };
      (updated as Record<string, Record<string, number>>)[field][prop] = value;
      onPositionsChange(updated as FieldPositions);
    },
    [positions, onPositionsChange],
  );

  const savePreset = useCallback(() => {
    if (!presetName.trim()) return;
    const newPreset: Preset = {
      name: presetName.trim(),
      positions: { ...positions },
      masks: [...masks],
    };
    const updated = [...presets.filter((p) => p.name !== newPreset.name), newPreset];
    setPresets(updated);
    savePresets(updated);
    setPresetName("");
  }, [presetName, positions, masks, presets]);

  const loadPreset = useCallback(
    (preset: Preset) => {
      onPositionsChange(preset.positions);
      onMasksChange(preset.masks);
    },
    [onPositionsChange, onMasksChange],
  );

  const deletePreset = useCallback(
    (name: string) => {
      const updated = presets.filter((p) => p.name !== name);
      setPresets(updated);
      savePresets(updated);
    },
    [presets],
  );

  const addMask = useCallback(() => {
    onMasksChange([...masks, { x: 50, y: 50, width: 100, height: 20 }]);
  }, [masks, onMasksChange]);

  const updateMask = useCallback(
    (idx: number, prop: keyof MaskRect, value: number) => {
      const updated = [...masks];
      updated[idx] = { ...updated[idx], [prop]: value };
      onMasksChange(updated);
    },
    [masks, onMasksChange],
  );

  const removeMask = useCallback(
    (idx: number) => {
      onMasksChange(masks.filter((_, i) => i !== idx));
    },
    [masks, onMasksChange],
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="fields" className="flex-1">
            Field Positions
          </TabsTrigger>
          <TabsTrigger value="masks" className="flex-1">
            White Masks
          </TabsTrigger>
          <TabsTrigger value="presets" className="flex-1">
            Presets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-3 pt-2">
          {Object.entries(FIELD_LABELS).map(([field, label]) => {
            const isPhoto = field === "photo";
            const pos = (positions as Record<string, Record<string, number>>)[field];
            return (
              <div key={field} className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-card-foreground uppercase tracking-wide">
                  {label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">X</Label>
                    <Input
                      type="number"
                      value={pos.x}
                      onChange={(e) => updateField(field, "x", Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">Y</Label>
                    <Input
                      type="number"
                      value={pos.y}
                      onChange={(e) => updateField(field, "y", Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                  {isPhoto && (
                    <>
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Width</Label>
                        <Input
                          type="number"
                          value={pos.width}
                          onChange={(e) => updateField(field, "width", Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Height</Label>
                        <Input
                          type="number"
                          value={pos.height}
                          onChange={(e) => updateField(field, "height", Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </>
                  )}
                  {!isPhoto && (
                    <>
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Font Size</Label>
                        <Input
                          type="number"
                          value={pos.fontSize}
                          onChange={(e) => updateField(field, "fontSize", Number(e.target.value))}
                          className="h-7 text-xs"
                          min={6}
                          max={72}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Color</Label>
                        <Input
                          type="color"
                          value={pos.fontColor}
                          onChange={(e) =>
                            updateField(
                              field,
                              "fontColor",
                              e.target.value as unknown as number,
                            )
                          }
                          className="h-7 w-full cursor-pointer p-0.5"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="masks" className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Add white rectangles to mask existing text on the template before
            overlaying new data.
          </p>
          {masks.map((mask, idx) => (
            <div
              key={`mask-${idx}`}
              className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-card-foreground">
                  Mask {idx + 1}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeMask(idx)}
                  aria-label={`Remove mask ${idx + 1}`}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["x", "y", "width", "height"] as const).map((prop) => (
                  <div key={prop} className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground capitalize">
                      {prop}
                    </Label>
                    <Input
                      type="number"
                      value={mask[prop]}
                      onChange={(e) => updateMask(idx, prop, Number(e.target.value))}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={addMask}>
            <Plus className="mr-1 h-3 w-3" />
            Add Mask
          </Button>
        </TabsContent>

        <TabsContent value="presets" className="space-y-3 pt-2">
          <div className="flex gap-2">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name"
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              className="h-8 shrink-0"
              onClick={savePreset}
              disabled={!presetName.trim()}
            >
              <Save className="mr-1 h-3 w-3" />
              Save
            </Button>
          </div>
          {presets.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No saved presets yet.
            </p>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.name}
                  className="flex items-center gap-2 rounded-md border border-border p-2"
                >
                  <span className="flex-1 truncate text-xs text-card-foreground font-medium">
                    {preset.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] bg-transparent"
                    onClick={() => loadPreset(preset)}
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => deletePreset(preset.name)}
                    aria-label={`Delete preset ${preset.name}`}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
