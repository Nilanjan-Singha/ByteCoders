// components/reader/text-selection-menu.tsx
"use client";

import { useEffect, useState } from "react";
import { Copy, MessageSquarePlus, Highlighter } from "lucide-react";
import { useReader } from "@/components/reader-provider";

interface SelectionPosition {
  x: number;
  y: number;
}

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
];

export function TextSelectionMenu() {
  const {
    setSelectedText,
    addHighlight,
    setAiOpen,
    setAiMode,
    currentPage,
  } = useReader();

  const [position, setPosition] = useState<SelectionPosition | null>(null);
  const [selectedStr, setSelectedStr] = useState("");

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
        setSelectedStr("");
        return;
      }

      const text = selection.toString().trim();
      setSelectedStr(text);

      // Position popover near selection bounds
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setPosition({
        x: rect.left + rect.width / 2,
        y: Math.max(10, rect.top - 50),
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  if (!position || !selectedStr) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedStr);
    setPosition(null);
  };

  const handleHighlight = (color: string) => {
    addHighlight({
      text: selectedStr,
      page: currentPage,
      color,
    });
    window.getSelection()?.removeAllRanges();
    setPosition(null);
  };

  const handleSendToAI = () => {
    setSelectedText(selectedStr, currentPage);
    setAiMode("chat");
    setAiOpen(true);
    setPosition(null);
  };

  return (
    <div
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
      className="fixed z-50 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover p-1 shadow-md text-popover-foreground animate-in fade-in zoom-in-95"
    >
      {/* Highlight Color Pickers */}
      <div className="flex items-center gap-1 px-1 border-r pr-2">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => handleHighlight(c.value)}
            className="size-4 rounded-full border border-black/10 transition-transform hover:scale-125"
            style={{ backgroundColor: c.value }}
            title={`Highlight ${c.label}`}
          />
        ))}
      </div>

      {/* Copy Text */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-accent"
        title="Copy text"
      >
        <Copy className="size-3.5" />
        <span>Copy</span>
      </button>

      {/* Ask AI */}
      <button
        onClick={handleSendToAI}
        className="flex items-center gap-1.5 rounded bg-primary px-2 py-1 text-xs text-primary-foreground font-medium hover:opacity-90"
      >
        <MessageSquarePlus className="size-3.5" />
        <span>Ask AI</span>
      </button>
    </div>
  );
}