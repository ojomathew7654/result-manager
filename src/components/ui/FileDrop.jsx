"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import clsx from "clsx";

export default function FileDrop({ accept = ".xlsx,.xls,.csv", onFile, hint }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name);
    onFile && onFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
        dragOver ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-white hover:border-brand-300"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {fileName ? <FileSpreadsheet size={22} /> : <UploadCloud size={22} />}
      </div>
      <div>
        <p className="text-sm font-medium text-ink-900">
          {fileName ? fileName : "Click to upload, or drag a spreadsheet here"}
        </p>
        {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}
