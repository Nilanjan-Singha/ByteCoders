"use client";

import { useReader } from "@/components/reader-provider";
import { BookReader } from "@/components/book-reader";
import { ReaderTopbar } from "@/components/reader-topbar";
import { ChapterSidebar } from "@/components/chapter-sidebar";
import { AISidebar } from "@/components/ai-sidebar";
import { TextSelectionMenu } from "@/components/text-selection-menu";

function SparklesIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

export function ReaderShell() {
  const {
    chaptersOpen,
    aiOpen,
    toggleChapters,
    toggleAI,
  } = useReader();

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      {/* ================================================================ */}
      {/* TOPBAR                                                           */}
      {/* ================================================================ */}

      <ReaderTopbar />

      {/* ================================================================ */}
      {/* READER BODY                                                      */}
      {/* ================================================================ */}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <TextSelectionMenu />

        {/* ============================================================ */}
        {/* MOBILE / TABLET BACKDROPS                                    */}
        {/* ============================================================ */}

        {(chaptersOpen || aiOpen) && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => {
              if (chaptersOpen) toggleChapters();
              if (aiOpen) toggleAI();
            }}
            aria-hidden="true"
          />
        )}

        {/* ============================================================ */}
        {/* CHAPTER SIDEBAR                                               */}
        {/* ============================================================ */}

        {chaptersOpen && (
          <aside
            className="
              fixed left-0 right-0 top-[var(--reader-topbar-height,56px)]
              z-40
              max-h-[75dvh]
              overflow-hidden
              border-b
              bg-background
              shadow-2xl

              animate-in
              slide-in-from-top-2

              sm:left-4
              sm:right-auto
              sm:w-[360px]
              sm:rounded-b-xl
              sm:border

              lg:relative
              lg:inset-auto
              lg:z-auto
              lg:h-full
              lg:max-h-none
              lg:w-72
              lg:shrink-0
              lg:rounded-none
              lg:border-b-0
              lg:border-r
              lg:shadow-none
              lg:animate-none
            "
          >
            <ChapterSidebar />
          </aside>
        )}

        {/* ============================================================ */}
        {/* MAIN BOOK READER                                              */}
        {/* ============================================================ */}

        <main
          className="
            relative
            min-w-0
            flex-1
            overflow-hidden
          "
        >
          <BookReader
            chaptersOpen={chaptersOpen}
            onToggleChapters={toggleChapters}
          />
        </main>

        {/* ============================================================ */}
        {/* AI SIDEBAR                                                    */}
        {/* ============================================================ */}

        {aiOpen && (
          <aside
            className="
              fixed
              inset-x-0
              bottom-0
              z-40

              flex
              h-[min(78dvh,720px)]
              max-h-[90dvh]
              flex-col
              overflow-hidden

              rounded-t-2xl
              border-t
              bg-background
              shadow-2xl

              animate-in
              slide-in-from-bottom-4

              sm:inset-x-4
              sm:bottom-4
              sm:mx-auto
              sm:max-w-[520px]
              sm:rounded-2xl
              sm:border

              lg:relative
              lg:inset-auto
              lg:bottom-auto
              lg:z-auto
              lg:mx-0
              lg:h-full
              lg:max-h-none
              lg:w-80
              lg:max-w-none
              lg:shrink-0
              lg:rounded-none
              lg:border-y-0
              lg:border-l
              lg:shadow-none
              lg:animate-none

              xl:w-96
            "
          >
            {/* Mobile drag indicator */}
            <div className="flex shrink-0 justify-center pt-2 lg:hidden">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="min-h-0 flex-1">
              <AISidebar />
            </div>
          </aside>
        )}

        {/* ============================================================ */}
        {/* MOBILE AI FAB                                                 */}
        {/* ============================================================ */}

        {!aiOpen && (
          <button
            type="button"
            onClick={toggleAI}
            aria-label="Open AI Assistant"
            className="
              fixed
              bottom-5
              right-5
              z-20

              flex
              h-14
              w-14
              items-center
              justify-center

              rounded-full
              bg-primary
              text-primary-foreground
              shadow-xl

              transition-transform
              duration-200

              hover:scale-105
              active:scale-95

              lg:hidden
            "
          >
            <SparklesIcon className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}