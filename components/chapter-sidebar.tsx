"use client";

import { useReader } from "@/components/reader-provider";
import { cn } from "@/lib/utils";

export function ChapterSidebar() {
  const { book, currentChapter, goToChapter } = useReader();
  const chapters = book?.chapters ?? [];

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-12 items-center border-b px-4 font-semibold text-sm">
        Table of Contents
      </div>

      <div className="flex-1 overflow-auto p-2">
        {chapters.length === 0 ? (
          <div className="p-4 text-xs text-muted-foreground text-center">
            No chapters detected.
          </div>
        ) : (
          <nav className="space-y-1">
            {chapters.map((chapter) => {
              const isActive = currentChapter?.id === chapter.id;

              return (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(chapter)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
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
    </aside>
  );
}