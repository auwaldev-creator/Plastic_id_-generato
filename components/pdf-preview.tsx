"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Grid3X3, ZoomIn, ZoomOut, AlertCircle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import type { FieldPositions, FormData, MaskRect } from "@/lib/types";

interface PdfPreviewProps {
  templateData: string | null;
  formData: FormData;
  positions: FieldPositions;
  masks: MaskRect[];
}

export function PdfPreview({
  templateData,
  formData,
  positions,
  masks,
}: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [scale, setScale] = useState(1);
  const [pdfPageProxy, setPdfPageProxy] = useState<unknown>(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setError(null);
      setLoading(true);

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

        let pdfBytes: ArrayBuffer;
        if (templateData) {
          const base64 = templateData.split(",")[1] || templateData;
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          pdfBytes = bytes.buffer as ArrayBuffer;
        } else {
          const resp = await fetch("/template.pdf");
          if (!resp.ok) {
            throw new Error("Failed to load default template");
          }
          const contentType = resp.headers.get("content-type") || "";
          if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
            throw new Error("Template file is not a valid PDF");
          }
          pdfBytes = await resp.arrayBuffer();
          // Verify PDF header (%PDF-)
          const header = new Uint8Array(pdfBytes.slice(0, 5));
          const headerStr = String.fromCharCode(...header);
          if (!headerStr.startsWith("%PDF")) {
            throw new Error("Template file does not have a valid PDF header");
          }
        }

        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const page = await pdf.getPage(1);

        if (!cancelled) {
          setPdfPageProxy(page);
          const vp = page.getViewport({ scale: 1 });
          setPdfDimensions({ width: vp.width, height: vp.height });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [templateData]);

  const renderPreview = useCallback(() => {
    if (!pdfPageProxy || !canvasRef.current) return;
    const page = pdfPageProxy as {
      getViewport: (opts: { scale: number }) => {
        width: number;
        height: number;
      };
      render: (opts: {
        canvasContext: CanvasRenderingContext2D;
        viewport: { width: number; height: number };
      }) => { promise: Promise<void> };
    };
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({ canvasContext: ctx, viewport }).promise.then(() => {
      // Draw white masks
      ctx.fillStyle = "white";
      for (const mask of masks) {
        ctx.fillRect(
          mask.x * scale,
          mask.y * scale,
          mask.width * scale,
          mask.height * scale,
        );
      }

      // Draw field overlays
      const drawText = (
        text: string,
        pos: { x: number; y: number; fontSize?: number; fontColor?: string },
        bold = false,
      ) => {
        if (!text) return;
        const fs = (pos.fontSize || 12) * scale;
        ctx.font = `${bold ? "bold " : ""}${fs}px Helvetica, Arial, sans-serif`;
        ctx.fillStyle = pos.fontColor || "#000000";
        ctx.fillText(text, pos.x * scale, pos.y * scale + fs * 0.8);
      };

      drawText(formData.surname.toUpperCase(), positions.surname, true);
      drawText(formData.givenNames, positions.givenNames);
      drawText(formData.nin, positions.nin);
      drawText(formData.dateOfBirth, positions.dateOfBirth);
      drawText(formData.sex, positions.sex);

      // Draw photo placeholder/image
      if (formData.photo) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(
            img,
            positions.photo.x * scale,
            positions.photo.y * scale,
            positions.photo.width * scale,
            positions.photo.height * scale,
          );

          if (showGrid) drawGrid(ctx, canvas.width, canvas.height);
        };
        img.src = formData.photo;
      } else {
        // Draw photo placeholder box
        ctx.strokeStyle = "hsl(215, 65%, 45%)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          positions.photo.x * scale,
          positions.photo.y * scale,
          positions.photo.width * scale,
          positions.photo.height * scale,
        );
        ctx.setLineDash([]);

        if (showGrid) drawGrid(ctx, canvas.width, canvas.height);
      }

      // Draw field position indicators
      const fields = ["surname", "givenNames", "nin", "dateOfBirth", "sex"] as const;
      for (const field of fields) {
        const pos = positions[field];
        ctx.fillStyle = "hsla(215, 65%, 45%, 0.15)";
        ctx.fillRect(
          pos.x * scale - 2,
          pos.y * scale - 2,
          120 * scale,
          ((pos.fontSize || 12) + 4) * scale,
        );
      }

      if (!formData.photo && showGrid) {
        // Grid already drawn above for non-photo case
      }
    });
  }, [pdfPageProxy, scale, masks, formData, positions, showGrid]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  function drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) {
    ctx.strokeStyle = "rgba(37, 99, 235, 0.15)";
    ctx.lineWidth = 0.5;
    const step = 20 * scale;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Coordinate labels every 100 units
    ctx.fillStyle = "rgba(37, 99, 235, 0.4)";
    ctx.font = `${9 * scale}px monospace`;
    const bigStep = 100 * scale;
    for (let x = 0; x < width; x += bigStep) {
      ctx.fillText(`${Math.round(x / scale)}`, x + 2, 10 * scale);
    }
    for (let y = bigStep; y < height; y += bigStep) {
      ctx.fillText(`${Math.round(y / scale)}`, 2, y - 2);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Preview {pdfDimensions.width > 0 && `(${Math.round(pdfDimensions.width)} x ${Math.round(pdfDimensions.height)} pt)`}
        </span>
        <div className="flex items-center gap-1">
          <Toggle
            pressed={showGrid}
            onPressedChange={setShowGrid}
            size="sm"
            className="h-7 w-7 p-0"
            aria-label="Toggle grid"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </Toggle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="w-10 text-center text-[10px] text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/50 p-4"
      >
        {loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading template...</p>
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">Failed to load PDF</p>
            <p className="max-w-xs text-center text-xs text-muted-foreground">{error}</p>
          </div>
        )}
        {!loading && !error && !pdfPageProxy && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p className="text-sm">Upload a template to see preview</p>
          </div>
        )}
        {!loading && !error && pdfPageProxy && (
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="shadow-lg"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
