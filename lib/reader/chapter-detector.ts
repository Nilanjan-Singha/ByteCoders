import type { Chapter } from "@/components/reader-provider";
import { normalizePageText, slugifyText } from "./reader-utils";

const chapterRegex = /(?:Chapter|CHAPTER)\s+([0-9IVXLC]+)\s*[:\-–.]?\s*(.*)/g;
const partRegex = /^(Part|PART)\s+([IVXLC0-9]+)\s*[:\-–.]?\s*(.*)$/i;

function isLikelyHeading(line: string): boolean {
  const trimmed = line.trim();

  // Heading length bounds
  if (trimmed.length < 4 || trimmed.length > 70) {
    return false;
  }

  // Reject sentences that end with punctuation
  if (/[.?!:]$/.test(trimmed)) {
    return false;
  }

  // Allow explicit chapter starts
  if (/^(chapter|part)\s+/i.test(trimmed)) {
    return true;
  }

  // Check for ALL CAPS titles (3 to 6 words)
  const words = trimmed.split(/\s+/);
  if (
    words.length >= 1 &&
    words.length <= 6 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed)
  ) {
    return true;
  }

  return false;
}

function extractHeadingsFromPage(text: string, page: number): Chapter[] {
  const headings: Chapter[] = [];
  const normalized = normalizePageText(text || "");

  if (!normalized.trim()) return [];

  let match: RegExpExecArray | null;
  chapterRegex.lastIndex = 0;

  while ((match = chapterRegex.exec(normalized)) !== null) {
    const chapterNumber = match[1];
    const rawTitle = match[2].trim();
    const title = rawTitle
      ? `Chapter ${chapterNumber}: ${rawTitle}`
      : `Chapter ${chapterNumber}`;

    headings.push({
      id: slugifyText(`${title}-p${page}`),
      title,
      page,
      level: 1,
    });
  }

  if (headings.length > 0) {
    return headings;
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line:string) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const partMatch = partRegex.exec(line);

    if (partMatch) {
      const partNum = partMatch[2];
      const partTitle = partMatch[3]?.trim();
      const title = partTitle ? `Part ${partNum}: ${partTitle}` : `Part ${partNum}`;

      headings.push({
        id: slugifyText(`${title}-p${page}`),
        title,
        page,
        level: 1,
      });
      continue;
    }

    if (isLikelyHeading(line)) {
      headings.push({
        id: slugifyText(`${line}-p${page}`),
        title: line,
        page,
        level: 2,
      });
    }
  }

  return headings;
}

export function detectChaptersFromTexts(pageTexts: string[]): Chapter[] {
  const chapterMap = new Map<string, Chapter>();

  pageTexts.forEach((text, index) => {
    const pageNumber = index + 1;
    const headings = extractHeadingsFromPage(text, pageNumber);

    headings.forEach((heading) => {
      // Keep only the first occurrence of each distinct heading title
      const titleSlug = slugifyText(heading.title);
      if (!chapterMap.has(titleSlug)) {
        chapterMap.set(titleSlug, heading);
      }
    });
  });

  return Array.from(chapterMap.values()).sort((a, b) => a.page - b.page);
}