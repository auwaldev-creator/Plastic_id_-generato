"use client";

import React from "react"

import { useCallback, useRef } from "react";
import { Upload, FileCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateUploadProps {
  templateData: string | null;
  templateName: string | null;
  onUpload: (data: string, name: string) => void;
  onRemove: () => void;
}

export function TemplateUpload({
  templateData,
  templateName,
  onUpload,
  onRemove,
}: TemplateUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") return;
      const reader = new FileReader();
      reader.onload = () => {
        onUpload(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  if (templateData) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
        <FileCheck className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-card-foreground">
            {templateName}
          </p>
          <p className="text-xs text-muted-foreground">Template loaded</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 shrink-0"
          aria-label="Remove template"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload PDF template"
    >
      <Upload className="h-8 w-8 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium text-card-foreground">
          Upload PDF Template
        </p>
        <p className="text-xs text-muted-foreground">
          Drag and drop or click to browse
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
