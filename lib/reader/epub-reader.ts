// lib/reader/epub-reader.ts
import ePub, { Book, Rendition } from "epubjs";
import type { Chapter } from "@/components/reader-provider";

export class EPUBReader {
  private container: HTMLElement;
  private book: Book | null = null;
  private rendition: Rendition | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async load(fileUrlOrArrayBuffer: string | ArrayBuffer) {
    this.destroy();

    this.book = ePub(fileUrlOrArrayBuffer);
    await this.book.opened;

    this.rendition = this.book.renderTo(this.container, {
      width: "100%",
      height: "100%",
      spread: "none",
    });

    await this.rendition.display();

    const navigation = await this.book.loaded.navigation;
    const tocItems = navigation?.toc || [];
    const chapters: Chapter[] = [];

    let pageCounter = 1;
    tocItems.forEach((item: any) => {
      chapters.push({
        id: item.href || item.id || `chap-${pageCounter}`,
        title: item.label ? item.label.trim() : `Section ${pageCounter}`,
        page: pageCounter++,
      });
    });

    return {
      pages: chapters.length || 1,
      chapters,
    };
  }

  setZoom(zoom: number) {
    if (this.rendition) {
      // Scale font-size percentage for ePUB flow
      const fontSize = `${Math.round(zoom * 100)}%`;
      this.rendition.themes.fontSize(fontSize);
    }
  }

  scrollToPage(target: number | string) {
    if (this.rendition && this.book) {
      if (typeof target === "string" && target.includes(".xhtml")) {
        this.rendition.display(target);
      } else {
        const index = typeof target === "number" ? target - 1 : 0;
        const spineItem = this.book.spine.get(index);
        if (spineItem) {
          this.rendition.display(spineItem.href);
        }
      }
    }
  }

  destroy() {
    if (this.rendition) {
      try {
        this.rendition.destroy();
      } catch {
        // Ignore internal cleanup glitches
      }
      this.rendition = null;
    }
    if (this.container) {
      this.container.innerHTML = "";
    }
    this.book = null;
  }
}