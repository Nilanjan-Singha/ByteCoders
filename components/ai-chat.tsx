"use client";

import {
  Bot,
  Send,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AIChat() {
  return (
    <div className="flex h-full flex-col">
      {/* Context */}
      <div className="border-b px-3 py-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Sparkles className="size-3" />

          <span>
            Page 47 · Chapter 3 · Context aware
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="flex gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
            <Bot className="size-3.5" />
          </div>

          <div className="text-sm leading-6">
            I'm following along with this chapter.
            Ask me anything about the current page,
            chapter, or book.
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="relative">
          <Textarea
            placeholder="Ask about this book..."
            className="min-h-[80px] resize-none pr-12"
          />

          <Button
            size="icon"
            className="absolute bottom-2 right-2 size-8"
          >
            <Send className="size-3.5" />
          </Button>
        </div>

        <div className="mt-2 text-center text-[10px] text-muted-foreground">
          AI uses your current reading context
        </div>
      </div>
    </div>
  );
}