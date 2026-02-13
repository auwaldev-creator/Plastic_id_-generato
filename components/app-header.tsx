"use client";

import { FileText } from "lucide-react";

export function AppHeader() {
  return (
    <header className="flex items-center gap-3 border-b bg-card px-6 py-4">
      <div className="flex items-center justify-center rounded-lg bg-primary p-2">
        <FileText className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-card-foreground">
          Document Generator
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload template, fill details, download PDF
        </p>
      </div>
    </header>
  );
}
