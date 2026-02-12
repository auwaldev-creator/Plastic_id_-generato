"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Download, Loader2, Settings2, FileInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AppHeader } from "@/components/app-header";
import { TemplateUpload } from "@/components/template-upload";
import { DataForm } from "@/components/data-form";
import { PositionEditor } from "@/components/position-editor";
import { PdfPreview } from "@/components/pdf-preview";
import {
  DEFAULT_POSITIONS,
  type FieldPositions,
  type FormData,
  type MaskRect,
} from "@/lib/types";

export default function Page() {
  const [templateData, setTemplateData] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    surname: "",
    givenNames: "",
    nin: "",
    dateOfBirth: "",
    sex: "",
    photo: null,
  });
  const [positions, setPositions] = useState<FieldPositions>(DEFAULT_POSITIONS);
  const [masks, setMasks] = useState<MaskRect[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [positionsOpen, setPositionsOpen] = useState(false);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.surname.trim()) errs.surname = "Surname is required";
    if (!formData.givenNames.trim())
      errs.givenNames = "Given names are required";
    if (!formData.nin.trim()) errs.nin = "NIN is required";
    if (formData.nin.trim().length < 5)
      errs.nin = "NIN must be at least 5 characters";
    if (!formData.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
    if (!formData.sex) errs.sex = "Sex is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

  const handleGenerate = useCallback(async () => {
    if (!validate()) {
      toast.error("Please fix the form errors before generating.");
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        ...formData,
        positions,
        masks,
        templateData: templateData || undefined,
      };

      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `generated_document_${timestamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF generated and downloaded successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate PDF",
      );
    } finally {
      setGenerating(false);
    }
  }, [formData, positions, masks, templateData, validate]);

  const handleTemplateUpload = useCallback((data: string, name: string) => {
    setTemplateData(data);
    setTemplateName(name);
    toast.success("Template uploaded successfully");
  }, []);

  const handleTemplateRemove = useCallback(() => {
    setTemplateData(null);
    setTemplateName(null);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Form */}
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-border bg-card">
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-5">
              {/* Step 1: Template */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    1
                  </div>
                  <h2 className="text-sm font-semibold text-card-foreground">
                    Template
                  </h2>
                </div>
                <TemplateUpload
                  templateData={templateData}
                  templateName={templateName}
                  onUpload={handleTemplateUpload}
                  onRemove={handleTemplateRemove}
                />
                {!templateData && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Using default template. Upload your own to replace it.
                  </p>
                )}
              </section>

              {/* Step 2: Personal Details */}
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    2
                  </div>
                  <h2 className="text-sm font-semibold text-card-foreground">
                    Personal Details
                  </h2>
                </div>
                <DataForm
                  formData={formData}
                  onChange={setFormData}
                  errors={errors}
                />
              </section>

              {/* Step 3: Position Editor */}
              <section>
                <Collapsible
                  open={positionsOpen}
                  onOpenChange={setPositionsOpen}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md p-1 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        3
                      </div>
                      <h2 className="flex-1 text-sm font-semibold text-card-foreground">
                        Position Mapping
                      </h2>
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <PositionEditor
                      positions={positions}
                      masks={masks}
                      onPositionsChange={setPositions}
                      onMasksChange={setMasks}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </section>
            </div>
          </ScrollArea>

          {/* Generate button */}
          <div className="border-t border-border bg-card p-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {generating ? "Generating..." : "Generate & Download PDF"}
            </Button>
          </div>
        </aside>

        {/* Right panel: Preview */}
        <main className="flex-1 overflow-hidden">
          <PdfPreview
            templateData={templateData}
            formData={formData}
            positions={positions}
            masks={masks}
          />
        </main>
      </div>
    </div>
  );
}
