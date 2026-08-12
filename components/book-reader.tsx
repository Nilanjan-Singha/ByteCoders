"use client";

import { useEffect, useRef, useState } from "react";
import {
  PanelLeft,
  ZoomIn,
  ZoomOut,
  Upload,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useReader, type Chapter } from "@/components/reader-provider";

import { detectChaptersFromTexts } from "@/lib/reader/chapter-detector";
import { PDFReader } from "@/lib/reader/pdf-reader";

interface BookReaderProps {
  chaptersOpen: boolean;
  onToggleChapters: () => void;
}

export function BookReader({
  chaptersOpen,
  onToggleChapters,
}: BookReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<PDFReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    book,
    currentPage,
    goToPage,
    currentChapter,
    zoom,
    setZoom,
    setBookTotalPages,
    setBookChapters,
    setReader,
    loadCustomBook,
  } = useReader();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pages = book?.totalPages ?? 0;
  const hasBook = Boolean(book && book.fileUrl && book.fileUrl.trim() !== "");

  // Zoom handler
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(
      2.0,
      Math.max(0.75, Number(newZoom.toFixed(2)))
    );
    setZoom(clampedZoom);
  };

  // Upload handler for empty state
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadCustomBook(file);
    }
  };

  // Scroll observer effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasBook) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const pageElements =
          container.querySelectorAll<HTMLElement>("[data-page]");

        if (!pageElements.length) {
          ticking = false;
          return;
        }

        let closestPage = 1;
        let closestDistance = Number.POSITIVE_INFINITY;

        pageElements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          const pageNumber = Number(element.dataset.page);

          if (!Number.isFinite(pageNumber)) return;

          const distance = Math.abs(rect.top - containerRect.top - 24);
          const visible =
            rect.bottom > containerRect.top && rect.top < containerRect.bottom;

          if (visible && distance < closestDistance) {
            closestDistance = distance;
            closestPage = pageNumber;
          }
        });

        if (
          readerRef.current &&
          closestPage !== (readerRef.current as any).currentPage
        ) {
          (readerRef.current as any).currentPage = closestPage;
        }

        ticking = false;
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [hasBook]);

  // Document initialization
  useEffect(() => {
    let mounted = true;
    let activeReader: PDFReader | null = null;

    async function initialize() {
      if (
        !containerRef.current ||
        !book ||
        !book.fileUrl ||
        book.fileUrl.trim() === ""
      ) {
        return;
      }

      setLoading(true);
      setError(null);

      // Cleanup previous instance
      if (readerRef.current) {
        try {
          readerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
        readerRef.current = null;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      try {
        const isEpub =
          book.fileUrl.toLowerCase().endsWith(".epub") ||
          (book.fileUrl.startsWith("blob:") &&
            book.title.toLowerCase().endsWith(".epub"));

        // EPUB Path
        if (isEpub) {
          const { EPUBReader } = await import("@/lib/reader/epub-reader");
          if (!mounted) return;

          const reader = new EPUBReader(containerRef.current!);
          const epubReader = reader as any;
          const result = await epubReader.load(book.fileUrl);

          if (!mounted) {
            epubReader.destroy?.();
            return;
          }

          setBookTotalPages(result.pages);
          if (result.chapters && result.chapters.length > 0) {
            setBookChapters(result.chapters);
          }
          setReader(epubReader);
          return;
        }

        // PDF Path
        const reader = new PDFReader(containerRef.current!);
        activeReader = reader;
        readerRef.current = reader;
        setReader(reader);

        const result = await reader.load(book.fileUrl);
        if (!mounted) {
          reader.destroy();
          return;
        }

        setBookTotalPages(result.pages);

        // Native PDF Outline extraction
        const nativeOutline = await reader.getOutline();

        if (nativeOutline && nativeOutline.length > 0) {
          setBookChapters(nativeOutline);
        } else {
          // Auto-detect chapter boundaries fallback
          const pageTexts: string[] = [];
          for (
            let pageNumber = 1;
            pageNumber <= result.pages;
            pageNumber++
          ) {
            if (!mounted) return;
            const text = await reader.getPageText(pageNumber);
            pageTexts.push(text);
          }

          if (!mounted) return;

          const detectedChapters = detectChaptersFromTexts(pageTexts);

          if (detectedChapters.length > 0) {
            setBookChapters(detectedChapters);
          } else {
            setBookChapters([]);
          }
        }

        (reader as any).currentPage = 1;
      } catch (err) {
        console.error("Reader load error:", err);
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load document."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      mounted = false;
      if (activeReader) {
        try {
          activeReader.destroy();
        } catch {
          // Ignore
        }
      }
      if (readerRef.current === activeReader) {
        readerRef.current = null;
      }
    };
  }, [
    book?.id,
    book?.fileUrl,
    book?.title,
    setBookChapters,
    setBookTotalPages,
    setReader,
  ]);

  // Empty state view when no document is active
  if (!hasBook) {
    return (
      <div className="relative flex h-full w-full min-h-0 flex-col items-center justify-center bg-muted/20 p-6 text-center">
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.epub"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
          <BookOpen className="size-8" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          Welcome to Bookify
        </h1>

        <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
          Read your favourite books with AI. Summarize, extract flashcards,
          and explore mindmaps effortlessly.
        </p>

        <Button
          className="mt-6 gap-2 rounded-full px-6 py-5 font-medium shadow-sm transition hover:shadow-md"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" />
          Upload a PDF to get started
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onToggleChapters}
          title={chaptersOpen ? "Hide chapters" : "Show chapters"}
        >
          <PanelLeft className="size-4" />
        </Button>

        <span className="max-w-[240px] truncate text-xs text-muted-foreground">
          {currentChapter
            ? currentChapter.title
            : loading
            ? "Loading document..."
            : "Chapter data unavailable"}
        </span>

        {/* Zoom controls */}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => handleZoomChange(zoom - 0.15)}
            disabled={zoom <= 0.75 || loading}
            title="Zoom Out"
          >
            <ZoomOut className="size-4" />
          </Button>

          <span className="min-w-[40px] text-center font-mono text-xs">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => handleZoomChange(zoom + 0.15)}
            disabled={zoom >= 2.0 || loading}
            title="Zoom In"
          >
            <ZoomIn className="size-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <div className="text-xs text-muted-foreground">
            {pages > 0 ? `${pages} pages` : "—"}
          </div>
        </div>
      </div>

      {/* PDF Viewport */}
      <div className="relative min-h-0 flex-1 bg-muted/20">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 text-sm text-muted-foreground">
            Loading document...
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 p-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        <div
          ref={containerRef}
          className="h-full w-full overflow-auto px-8 py-8 scroll-smooth"
        />
      </div>

      {/* Page Navigation Floating Dock */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background/95 px-2 py-1 shadow-lg backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
        >
          ←
        </Button>

        <span className="px-2 font-mono text-xs">
          {currentPage} / {pages}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= pages || loading || pages === 0}
        >
          →
        </Button>
      </div>
    </div>
  );
}