"use client";

import { useReader } from "@/components/reader-provider";
import { BookReader } from "@/components//book-reader";
import {ReaderTopbar} from "@/components//reader-topbar";
import { ChapterSidebar } from "@/components//chapter-sidebar";
import { AISidebar } from "@/components/ai-sidebar";
import { TextSelectionMenu } from "@/components//text-selection-menu";

export function ReaderShell() {
  const { chaptersOpen, aiOpen, toggleChapters } = useReader();

  return (
    <div className="h-screen flex flex-col">
  <ReaderTopbar/>

    <div className="flex h-full w-full overflow-hidden">
        
      <TextSelectionMenu />

      {chaptersOpen && <ChapterSidebar />}

      <main className="flex-1 overflow-hidden">
        <BookReader
          chaptersOpen={chaptersOpen}
          onToggleChapters={toggleChapters}
        />
      </main>

      {aiOpen && <AISidebar />}
    </div>
    </div>
  );
}