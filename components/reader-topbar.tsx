"use client";

import { useRef, ChangeEvent } from "react";
import {
  BookOpen,
  ChevronRight,
  Home,
  Moon,
  Settings,
  Sun,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useReader } from "@/components/reader-provider";
import { useTheme } from "next-themes";

export function ReaderTopbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme, setTheme } = useTheme();

  const {
    book,
    loadCustomBook,
  } = useReader();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      await loadCustomBook(file);
    } catch (err) {
      console.error("Failed to load book:", err);
    } finally {
      // Allow selecting the same file again.
      e.target.value = "";
    }
  };


  const bookName =
    book?.title?.trim() ||
    "Untitled Book";

  return (
    <header className="flex h-[52px] shrink-0 items-center border-b bg-background px-3">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
          <BookOpen className="size-4" />
        </div>

        <span className="text-sm font-semibold">
          Bookify
        </span>
      </div>

      <Separator
        orientation="vertical"
        className="mx-4 h-5"
      />

      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="shrink-0 text-muted-foreground">
          Home
        </span>

        <ChevronRight className="size-3 shrink-0 text-muted-foreground" />

        <span
          className="truncate font-medium"
          title={bookName}
        >
          {bookName}
        </span>
      </div>

      {/* Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.epub,application/pdf,application/epub+zip"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Upload */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium"
          onClick={handleUploadClick}
          type="button"
        >
          <Upload className="size-3.5" />
          <span>Upload</span>
        </Button>

        <Separator
          orientation="vertical"
          className="mx-1.5 h-4"
        />

        {/* Home */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          type="button"
          title="Home"
        >
          <Home className="size-4" />
        </Button>

        <Button
      variant="ghost"
      size="icon"
      className="relative size-8"
      type="button"
      title="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          type="button"
          title="Settings"
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </header>
  );
}