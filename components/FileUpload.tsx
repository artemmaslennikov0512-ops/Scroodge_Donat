"use client";

import { useRef } from "react";
import { FiUpload, FiX } from "react-icons/fi";

interface FileUploadProps {
  label: string;
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

export function FileUpload({ label, accept, file, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-gray-400 mb-2">{label}</label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-pink-500/40 rounded-xl p-8 text-center hover:border-pink-500 transition cursor-pointer"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-green-400">
            <span>{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-1 text-red-400 hover:text-red-300"
            >
              <FiX />
            </button>
          </div>
        ) : (
          <>
            <FiUpload className="text-3xl text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">Нажмите или перетащите файл</p>
            <p className="text-xs text-gray-600 mt-1">JPG, PNG или PDF, до 10MB</p>
          </>
        )}
      </div>
    </div>
  );
}
