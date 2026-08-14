"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReader } from "@/components/reader-provider";
import { cn } from "@/lib/utils";

export function ChapterSidebar() {
  const { book, currentChapter, goToChapter, toggleChapters } = useReader();
  const chapters = book?.chapters ?? [];

  const handleSelectChapter = (chapter: (typeof chapters)[number]) => {
    goToChapter(chapter);
    // Auto-close on mobile when selecting a chapter
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleChapters();
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4 font-semibold text-sm">
        <span>Table of Contents</span>

        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 md:hidden"
          onClick={toggleChapters}
          type="button"
          title="Close Table of Contents"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chapters.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No chapters detected.
          </div>
        ) : (
          <nav className="space-y-1">
            {chapters.map((chapter) => {
              const isActive = currentChapter?.id === chapter.id;

              return (
                <button
                  key={chapter.id}
                  onClick={() => handleSelectChapter(chapter)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2.5 sm:py-2 text-left text-xs sm:text-xs transition-colors hover:bg-accent active:bg-accent/80",
                    isActive
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-muted-foreground",
                    chapter.level && chapter.level > 1 && "pl-6"
                  )}
                >
                  <span className="truncate pr-2">{chapter.title}</span>
                  <span className="shrink-0 text-[10px] opacity-60">
                    p. {chapter.page}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}