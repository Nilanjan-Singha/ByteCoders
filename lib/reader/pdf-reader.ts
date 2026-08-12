type PDFJS = typeof import("pdfjs-dist");

export interface PDFChapter {
  id: string;
  title: string;
  page: number;
  endPage: number;
  level?: number;
}

export interface ChapterTextProgress {
  currentPage: number;
  startPage: number;
  endPage: number;
  completedPages: number;
  totalPages: number;
  percent: number;
}

export interface ChapterTextResult {
  chapter: PDFChapter;
  text: string;
  pages: Array<{
    page: number;
    text: string;
  }>;
}

export interface ChunkOptions {
  maxChunkSize?: number; 
  overlap?: number;      
}

export class PDFReader {
  container: HTMLElement;
  pdf: import("pdfjs-dist").PDFDocumentProxy | null;
  scale: number;

  private pdfjs: PDFJS | null = null;

  
    // Cache extracted page text to avoid reparsing pdf 

  private pageTextCache = new Map<number, string>();

  constructor(container: HTMLElement) {
    this.container = container;
    this.pdf = null;
    this.scale = 1.25;
  }


    // Dynamic loader for PDF.js to avoid SSR/DOMMatrix issues.

  private async getPDFJS(): Promise<PDFJS> {
    if (typeof window === "undefined") {
      throw new Error("PDFReader can only run in the browser.");
    }

    if (!this.pdfjs) {
      this.pdfjs = await import("pdfjs-dist");

      this.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${this.pdfjs.version}/build/pdf.worker.min.mjs`;
    }

    return this.pdfjs;
  }

  // load pdf from url

  async load(url: string) {
    if (typeof window === "undefined") {
      throw new Error("PDFReader can only run in the browser.");
    }

    this.destroy();

    const pdfjsLib = await this.getPDFJS();

    const loadingTask = pdfjsLib.getDocument({
      url,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });

    this.pdf = await loadingTask.promise;

    await this.renderAllPages();

    return {
      pages: this.pdf.numPages,
    };
  }

//  change zoom scale

  async setZoom(zoom: number) {
    this.scale = zoom;

    if (this.pdf) {
      await this.renderAllPages();
    }
  }

//  Render every PDF page sequentially inside the container.

  async renderAllPages() {
    if (!this.pdf) return;

    this.container.innerHTML = "";

    for (let pageNumber = 1; pageNumber <= this.pdf.numPages; pageNumber++) {
      await this.renderPage(pageNumber);
    }
  }

//  Render a single page along with its selectable text layer.

  async renderPage(pageNumber: number) {
    if (!this.pdf) return;

    const pdfjsLib = await this.getPDFJS();
    const page = await this.pdf.getPage(pageNumber);
    const dpr = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: this.scale });

    // Page wrapper element
    const wrapper = document.createElement("div");
    wrapper.dataset.page = String(pageNumber);
    wrapper.className = "pdf-page relative mx-auto mb-6 w-fit shadow-md select-text";
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;

    // Canvas element
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(`Could not create canvas context for page ${pageNumber}`);
    }

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    wrapper.appendChild(canvas);

    // Text layer element
    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "textLayer absolute inset-0 overflow-hidden";
    wrapper.appendChild(textLayerDiv);

    this.container.appendChild(wrapper);

    const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

    await page.render({
      canvas,
      canvasContext: context,
      viewport,
      transform,
    }).promise;

    try {
      const textContent = await page.getTextContent();
      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
      });

      await textLayer.render();
    } catch (error) {
      console.warn(`Could not render text layer for page ${pageNumber}:`, error);
    }
  }

  //  Extract normalized text from a single page with caching.

  async getPageText(pageNumber: number): Promise<string> {
    if (!this.pdf) {
      console.warn("getPageText called before PDF proxy was loaded.");
      return "";
    }

    const cached = this.pageTextCache.get(pageNumber);
    if (cached !== undefined) {
      return cached;
    }

    if (pageNumber < 1 || pageNumber > this.pdf.numPages) {
      return "";
    }

    try {
      const page = await this.pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const text = textContent.items
        .map((item: any) => item.str || "")
        .filter((str: string) => str.trim().length > 0)
        .join(" ");

      const normalizedText = this.normalizeText(text);
      this.pageTextCache.set(pageNumber, normalizedText);

      return normalizedText;
    } catch (error) {
      console.error(`Failed to extract text from page ${pageNumber}:`, error);
      return "";
    }
  }

  
    // Normalize raw extracted text.
   
  private normalizeText(text: string): string {
    return text
      .replace(/\u00AD/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

    // Extract text across a range of pages with progress feedback.

  async getPagesText(
    startPage: number,
    endPage: number,
    onProgress?: (progress: ChapterTextProgress) => void
  ): Promise<Array<{ page: number; text: string }>> {
    if (!this.pdf) return [];

    const safeStart = Math.max(1, Math.min(startPage, this.pdf.numPages));
    const safeEnd = Math.max(safeStart, Math.min(endPage, this.pdf.numPages));
    const totalPages = safeEnd - safeStart + 1;

    const results: Array<{ page: number; text: string }> = [];

    for (let page = safeStart; page <= safeEnd; page++) {
      const text = await this.getPageText(page);

      results.push({ page, text });

      const completedPages = page - safeStart + 1;
      onProgress?.({
        currentPage: page,
        startPage: safeStart,
        endPage: safeEnd,
        completedPages,
        totalPages,
        percent: Math.round((completedPages / totalPages) * 100),
      });
    }

    return results;
  }

  
  //  Extract combined text string for a page range.

  async getRangeText(
    startPage: number,
    endPage: number,
    onProgress?: (progress: ChapterTextProgress) => void
  ): Promise<string> {
    const pages = await this.getPagesText(startPage, endPage, onProgress);
    return pages
      .map((page) => page.text)
      .filter(Boolean)
      .join("\n\n");
  }

  // get full chapter text 

  async getChapterText(
    chapter: PDFChapter,
    onProgress?: (progress: ChapterTextProgress) => void
  ): Promise<ChapterTextResult> {
    const pages = await this.getPagesText(chapter.page, chapter.endPage, onProgress);

    const text = pages
      .map((page) => (page.text ? `[Page ${page.page}]\n${page.text}` : ""))
      .filter(Boolean)
      .join("\n\n");

    return {
      chapter,
      text,
      pages,
    };
  }

  // get pages array for a chapter

  async getChapterPages(
    chapter: PDFChapter,
    onProgress?: (progress: ChapterTextProgress) => void
  ) {
    return this.getPagesText(chapter.page, chapter.endPage, onProgress);
  }

//  extracting page from pdf

  async getAllText(
    onProgress?: (progress: ChapterTextProgress) => void
  ): Promise<string> {
    if (!this.pdf) return "";
    return this.getRangeText(1, this.pdf.numPages, onProgress);
  }

  // checking and merging utilties  Utility to break raw text into chunks suitable for LLM context limits. Splitting preserves paragraph and word boundaries.

  static chunkText(text: string, options: ChunkOptions = {}): string[] {
    const maxChunkSize = options.maxChunkSize || 3500;
    const overlap = options.overlap || 200;

    if (!text || text.length <= maxChunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChunkSize;

      if (end >= text.length) {
        chunks.push(text.slice(start).trim());
        break;
      }

      // Find best split point (paragraph break -> sentence boundary -> space)
      let splitPoint = text.lastIndexOf("\n\n", end);
      if (splitPoint <= start) {
        splitPoint = text.lastIndexOf(". ", end);
      }
      if (splitPoint <= start) {
        splitPoint = text.lastIndexOf(" ", end);
      }
      if (splitPoint <= start) {
        splitPoint = end; // Fallback hard cutoff
      }

      chunks.push(text.slice(start, splitPoint).trim());
      start = Math.max(start + 1, splitPoint - overlap);
    }

    return chunks;
  }

  // merge multiple chunks for final processing

  static mergeChunks(chunks: string[], title = "Chapter Context"): string {
    if (chunks.length === 0) return "";
    if (chunks.length === 1) return chunks[0];

    return chunks
      .map((chunk, idx) => `--- [Section ${idx + 1} of ${chunks.length}: ${title}] ---\n${chunk}`)
      .join("\n\n");
  }

  // chapter navigation

  // extract outline/toc of pdf
  
  async getOutline(): Promise<PDFChapter[]> {
    if (!this.pdf) return [];

    try {
      const outline = await this.pdf.getOutline();
      if (!outline || outline.length === 0) return [];

      const chapters: PDFChapter[] = [];

      const processItems = async (items: any[], level = 1) => {
        for (const item of items) {
          if (!item.title) continue;

          let page = 1;
          try {
            if (item.dest) {
              let destination = item.dest;
              if (typeof destination === "string") {
                destination = await this.pdf!.getDestination(destination);
              }
              if (Array.isArray(destination) && destination[0]) {
                const pageIndex = await this.pdf!.getPageIndex(destination[0]);
                page = pageIndex + 1;
              }
            }
          } catch (err) {
            console.warn(`Could not resolve page destination for bookmark "${item.title}"`, err);
          }

          chapters.push({
            id: `outline-${chapters.length + 1}`,
            title: item.title.trim(),
            page,
            endPage: this.pdf!.numPages,
            level,
          });

          if (item.items && item.items.length > 0) {
            await processItems(item.items, level + 1);
          }
        }
      };

      await processItems(outline, 1);

      // Filter duplicate contiguous pages
      const uniqueChapters = chapters.filter(
        (chapter, index, array) =>
          index === 0 || chapter.page !== array[index - 1].page
      );

      return this.addChapterRanges(uniqueChapters, this.pdf.numPages);
    } catch (error) {
      console.warn("Could not read PDF outline:", error);
      return [];
    }
  }

 
    // Calculate exact end pages for chapters.

  addChapterRanges(chapters: PDFChapter[], totalPages: number): PDFChapter[] {
    const sorted = [...chapters].sort((a, b) => a.page - b.page);

    return sorted.map((chapter, index) => {
      const nextChapter = sorted[index + 1];
      const endPage = nextChapter
        ? Math.max(chapter.page, nextChapter.page - 1)
        : totalPages;

      return {
        ...chapter,
        endPage,
      };
    });
  }

  getChapter(chapters: PDFChapter[], chapterId: string): PDFChapter | null {
    return chapters.find((chapter) => chapter.id === chapterId) ?? null;
  }

  getChapterForPage(chapters: PDFChapter[], pageNumber: number): PDFChapter | null {
    return (
      chapters.find(
        (chapter) => pageNumber >= chapter.page && pageNumber <= chapter.endPage
      ) ?? null
    );
  }

  scrollToPage(pageNumber: number) {
    if (!this.container) return;

    const targetElement = this.container.querySelector<HTMLElement>(
      `[data-page="${pageNumber}"]`
    );

    if (!targetElement) {
      console.warn(`Page ${pageNumber} is not currently rendered.`);
      return;
    }

    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }

  clearTextCache() {
    this.pageTextCache.clear();
  }
destroy() {
    if (this.container) {
      this.container.innerHTML = "";
    }

    if (this.pdf) {
      try {
        const doc = this.pdf as any;

        // Try destroy() first, fallback to cleanup() if available
        if (typeof doc.destroy === "function") {
          doc.destroy();
        } else if (typeof doc.cleanup === "function") {
          doc.cleanup();
        }
      } catch (error) {
        console.warn("Error destroying PDF document:", error);
      } finally {
        this.pdf = null;
      }
    }
}
}