"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AIMode =
  | "chat"
  | "flashcards"
  | "summaries"
  | "mindmap"
  | "eli5"
  | "hinglish"
  | "analogy"
  | "quiz"
  | "notes"
  | "translate";

export interface Chapter {
  id: string;
  title: string;
  page: number;
  endPage?: number;
  level?: number;
}

export interface Highlight {
  id: string;
  text: string;
  page: number;
  color?: string;
  note?: string;
}

export interface ReaderNote {
  id: string;
  text: string;
  page: number;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  page: number;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  fileUrl: string;
  totalPages: number;
  chapters: Chapter[];
}

interface ReaderContextValue {
  book: Book | null;

  currentPage: number;
  currentChapter: Chapter | null;

  zoom: number;
  setZoom: (value: number) => void;

  chaptersOpen: boolean;
  aiOpen: boolean;

  toggleChapters: () => void;
  toggleAI: () => void;

  setChaptersOpen: (value: boolean) => void;
  setAiOpen: (value: boolean) => void;

  aiMode: AIMode;
  setAiMode: (mode: AIMode) => void;

  selectedText: string;
  selectedPage: number | null;

  setSelectedText: (text: string, page?: number) => void;
  clearSelection: () => void;

  /*
   * Navigation
   */
  goToPage: (page: number) => void;
  goToChapter: (chapter: Chapter) => void;

  /*
   * Used ONLY by the PDF scroll observer.
   *
   * IMPORTANT:
   * This does NOT scroll the PDF.
   */
  setCurrentPageFromReader: (page: number) => void;

  setBookChapters: (chapters: Chapter[]) => void;
  setBookTotalPages: (totalPages: number) => void;
  setReader: (reader: any) => void;

  highlights: Highlight[];
  notes: ReaderNote[];
  flashcards: Flashcard[];

  addHighlight: (highlight: Omit<Highlight, "id">) => void;
  removeHighlight: (id: string) => void;

  addNote: (note: Omit<ReaderNote, "id" | "createdAt">) => void;
  addFlashcard: (flashcard: Omit<Flashcard, "id">) => void;

  loadCustomBook: (file: File) => Promise<void>;

  getCurrentPageText: () => Promise<string>;
  getChapterText: (chapter: Chapter) => Promise<string>;
  getChapterPagesText: (pageNumber?: number) => Promise<string>;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

interface ReaderProviderProps {
  children: ReactNode;
  bookId: string;
  book?: Book;
}

export function ReaderProvider({
  children,
  bookId,
  book,
}: ReaderProviderProps) {
  const [bookData, setBookData] = useState<Book>(
    book ?? {
      id: bookId,
      title: "",
      author: "",
      fileUrl: "", 
      totalPages: 0,
      chapters: [],
    }
  );

  const readerRef = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const setCurrentPageFromReader = useCallback((page: number) => {
    if (!Number.isFinite(page)) {
      return;
    }

    const safePage = Math.max(1, Math.floor(page));
    setCurrentPage(safePage);
  }, []);

  const setBookTotalPages = useCallback((totalPages: number) => {
    setBookData((current) => ({
      ...current,
      totalPages,
    }));
  }, []);

  const setBookChapters = useCallback((chapters: Chapter[]) => {
    setBookData((current) => ({
      ...current,
      chapters,
    }));
  }, []);

  const setReader = useCallback((reader: any) => {
    readerRef.current = reader;
  }, []);

  const [zoom, setZoomState] = useState(1.25);

  const setZoom = useCallback((value: number) => {
    const nextZoom = Math.min(
      2,
      Math.max(0.75, Number(value.toFixed(2)))
    );

    setZoomState(nextZoom);

    if (
      readerRef.current &&
      typeof readerRef.current.setZoom === "function"
    ) {
      void readerRef.current.setZoom(nextZoom);
    }
  }, []);

  const [chaptersOpen, setChaptersOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);

  const [aiMode, setAiMode] = useState<AIMode>("chat");

  const [selectedText, setSelectedTextState] = useState("");
  const [selectedPage, setSelectedPage] = useState<number | null>(null);

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<ReaderNote[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // current chapter based on currentpage

  const currentChapter = useMemo(() => {
    return (
      bookData.chapters.find((chapter, index) => {
        const nextChapter = bookData.chapters[index + 1];

        return (
          currentPage >= chapter.page &&
          (!nextChapter || currentPage < nextChapter.page)
        );
      }) ?? null
    );
  }, [bookData.chapters, currentPage]);

  const setSelectedText = useCallback((text: string, page?: number) => {
    setSelectedTextState(text);

    if (page !== undefined) {
      setSelectedPage(page);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTextState("");
    setSelectedPage(null);
  }, []);

  // scrolling to desired location

  const goToPage = useCallback(
    (page: number) => {
      const total = bookData.totalPages;

      const nextPage =
        total > 0
          ? Math.max(1, Math.min(Math.floor(page), total))
          : Math.max(1, Math.floor(page));

      setCurrentPage(nextPage);

      if (
        readerRef.current &&
        typeof readerRef.current.scrollToPage === "function"
      ) {
        readerRef.current.scrollToPage(nextPage);
      }
    },
    [bookData.totalPages]
  );

  const goToChapter = useCallback(
    (chapter: Chapter) => {
      if (!chapter) {
        return;
      }

      goToPage(chapter.page);
    },
    [goToPage]
  );

  const toggleChapters = useCallback(() => {
    setChaptersOpen((value) => !value);
  }, []);

  const toggleAI = useCallback(() => {
    setAiOpen((value) => !value);
  }, []);

  const addHighlight = useCallback((highlight: Omit<Highlight, "id">) => {
    setHighlights((current) => [
      ...current,
      {
        ...highlight,
        id: crypto.randomUUID(),
      },
    ]);
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setHighlights((current) =>
      current.filter((highlight) => highlight.id !== id)
    );
  }, []);

  const addNote = useCallback(
    (note: Omit<ReaderNote, "id" | "createdAt">) => {
      setNotes((current) => [
        ...current,
        {
          ...note,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    []
  );

  const addFlashcard = useCallback(
    (flashcard: Omit<Flashcard, "id">) => {
      setFlashcards((current) => [
        ...current,
        {
          ...flashcard,
          id: crypto.randomUUID(),
        },
      ]);
    },
    []
  );

  const loadCustomBook = useCallback(async (file: File) => {
    const fileUrl = URL.createObjectURL(file);

    setBookData((previous) => {
      if (previous.fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previous.fileUrl);
      }

      return {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        author: "Uploaded File",
        fileUrl,
        totalPages: 0,
        chapters: [],
      };
    });

    setCurrentPage(1);
    setHighlights([]);
    setNotes([]);
    setFlashcards([]);
  }, []);

  const getCurrentPageText = useCallback(async (): Promise<string> => {
    if (
      readerRef.current &&
      typeof readerRef.current.getPageText === "function"
    ) {
      try {
        const text = await readerRef.current.getPageText(currentPage);

        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (error) {
        console.error("Error pulling page text:", error);
      }
    }

    return "";
  }, [currentPage]);

  const getChapterText = useCallback(
    async (chapter: Chapter): Promise<string> => {
      if (
        !readerRef.current ||
        typeof readerRef.current.getPageText !== "function"
      ) {
        return "";
      }

      const startPage = Math.max(1, chapter.page);

      const endPage = Math.min(
        bookData.totalPages || chapter.endPage || chapter.page,
        chapter.endPage ?? chapter.page
      );

      const pages: string[] = [];

      for (let page = startPage; page <= endPage; page++) {
        try {
          const text = await readerRef.current.getPageText(page);

          if (text?.trim()) {
            pages.push(`PAGE ${page}\n${text.trim()}`);
          }
        } catch (error) {
          console.warn(`Failed to extract page ${page}`, error);
        }
      }

      return pages.join("\n\n");
    },
    [bookData.totalPages]
  );

  const getChapterPagesText = useCallback(
    async (targetPage = currentPage): Promise<string> => {
      if (
        !readerRef.current ||
        typeof readerRef.current.getPageText !== "function"
      ) {
        return "";
      }

      const targetChapter =
        bookData.chapters.find((chapter, index) => {
          const nextChapter = bookData.chapters[index + 1];

          return (
            targetPage >= chapter.page &&
            (!nextChapter || targetPage < nextChapter.page)
          );
        }) ?? null;

      if (!targetChapter) {
        return getCurrentPageText();
      }

      return getChapterText(targetChapter);
    },
    [bookData.chapters, currentPage, getCurrentPageText, getChapterText]
  );

  const value = useMemo<ReaderContextValue>(
    () => ({
      book: bookData,

      currentPage,
      currentChapter,

      zoom,
      setZoom,

      chaptersOpen,
      aiOpen,

      toggleChapters,
      toggleAI,

      setChaptersOpen,
      setAiOpen,

      aiMode,
      setAiMode,

      selectedText,
      selectedPage,

      setSelectedText,
      clearSelection,

      goToPage,
      goToChapter,
      setCurrentPageFromReader,

      setBookChapters,
      setBookTotalPages,
      setReader,

      highlights,
      notes,
      flashcards,

      addHighlight,
      removeHighlight,
      addNote,
      addFlashcard,

      loadCustomBook,
      getCurrentPageText,
      getChapterText,
      getChapterPagesText,
    }),
    [
      bookData,
      currentPage,
      currentChapter,
      zoom,
      setZoom,
      chaptersOpen,
      aiOpen,
      toggleChapters,
      toggleAI,
      aiMode,
      selectedText,
      selectedPage,
      setSelectedText,
      clearSelection,
      goToPage,
      goToChapter,
      setCurrentPageFromReader,
      setBookChapters,
      setBookTotalPages,
      setReader,
      highlights,
      notes,
      flashcards,
      addHighlight,
      removeHighlight,
      addNote,
      addFlashcard,
      loadCustomBook,
      getCurrentPageText,
      getChapterText,
      getChapterPagesText,
      
    ]
  );

  return (
    <ReaderContext.Provider value={value}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);

  if (!context) {
    throw new Error("useReader must be used inside ReaderProvider");
  }

  return context;
}