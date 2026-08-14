"use client";

import { useRef, ChangeEvent } from "react";
import {
  BookOpen,
  Menu,
  Moon,
  Settings,
  Sun,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useReader } from "@/components/reader-provider";
import { useTheme } from "next-themes";

export function ReaderTopbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { resolvedTheme, setTheme } = useTheme();
  const { book, loadCustomBook } = useReader();

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
      e.target.value = "";
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const bookName = book?.title?.trim() || "Untitled Book";

  return (
    <header className="relative flex h-[52px] shrink-0 items-center justify-between border-b bg-background px-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.epub,application/pdf,application/epub+zip"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ============================================================= */}
      {/* LEFT - BRAND                                                  */}
      {/* ============================================================= */}

      <div className="z-10 flex shrink-0 items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
          <BookOpen className="size-4" />
        </div>

        <span className="hidden text-sm font-semibold sm:inline-block">
          Bookify
        </span>
      </div>

      {/* ============================================================= */}
      {/* CENTER - BOOK TITLE                                           */}
      {/* ============================================================= */}

      <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center px-20">
        <h1
          className="
            max-w-[160px]
            truncate
            text-center
            text-xs
            font-semibold
            text-foreground

            xs:max-w-[240px]
            sm:max-w-[360px]
            md:max-w-[500px]
            lg:max-w-[650px]
          "
          title={bookName}
        >
          {bookName}
        </h1>
      </div>

      {/* ============================================================= */}
      {/* RIGHT - ACTIONS                                               */}
      {/* ============================================================= */}

      <div className="z-10 flex shrink-0 items-center gap-1">
        {/* ----------------------------------------------------------- */}
        {/* DESKTOP UPLOAD                                              */}
        {/* ----------------------------------------------------------- */}

        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-1.5 text-xs font-medium md:inline-flex"
          onClick={handleUploadClick}
          type="button"
        >
          <Upload className="size-3.5" />
          <span>Upload</span>
        </Button>

        {/* ----------------------------------------------------------- */}
        {/* DESKTOP THEME                                               */}
        {/* ----------------------------------------------------------- */}

        <Button
          variant="ghost"
          size="icon"
          className="relative hidden size-8 md:inline-flex"
          type="button"
          title="Toggle theme"
          onClick={toggleTheme}
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

          <span className="sr-only">
            Toggle theme
          </span>
        </Button>

        {/* ----------------------------------------------------------- */}
        {/* DESKTOP SETTINGS                                             */}
        {/* ----------------------------------------------------------- */}

        <Button
          variant="ghost"
          size="icon"
          className="hidden size-8 md:inline-flex"
          type="button"
          title="Settings"
        >
          <Settings className="size-4" />
        </Button>

        {/* =========================================================== */}
        {/* MOBILE MENU                                                 */}
        {/* =========================================================== */}

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                type="button"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-52"
            >
              {/* Upload */}
              <button
                type="button"
                onClick={handleUploadClick}
                className="
                  flex
                  w-full
                  items-center
                  gap-2
                  rounded-sm
                  px-2
                  py-2
                  text-sm
                  outline-none
                  transition-colors
                  hover:bg-accent
                  hover:text-accent-foreground
                "
              >
                <Upload className="size-4" />
                <span>Upload Book</span>
              </button>

              {/* Theme */}
              <button
                type="button"
                onClick={toggleTheme}
                className="
                  flex
                  w-full
                  items-center
                  gap-2
                  rounded-sm
                  px-2
                  py-2
                  text-sm
                  outline-none
                  transition-colors
                  hover:bg-accent
                  hover:text-accent-foreground
                "
              >
                {resolvedTheme === "dark" ? (
                  <>
                    <Sun className="size-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="size-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <DropdownMenuSeparator />

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  // TODO: open settings
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-2
                  rounded-sm
                  px-2
                  py-2
                  text-sm
                  outline-none
                  transition-colors
                  hover:bg-accent
                  hover:text-accent-foreground
                "
              >
                <Settings className="size-4" />
                <span>Settings</span>
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}