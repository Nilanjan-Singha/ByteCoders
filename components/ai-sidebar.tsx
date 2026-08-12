"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  X,
  Layers,
  GitFork,
  RotateCw,
  HelpCircle,
  Send,
  Sparkles,
  RotateCcw,
  BookOpenText,
  Languages,
  Baby,
  Smile,
  Lightbulb,
  FileText,
  Book,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useReader } from "@/components/reader-provider";
import { MermaidViewer } from "@/components/mermaid-viewer";

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type AIScope = "page" | "chapter";

type ArtifactType = "flashcards" | "mindmap" | "quiz";

type ViewerType = "chat" | ArtifactType;

interface ChatArtifact {
  type: ArtifactType;
  title: string;
  subtitle?: string;
  count?: number;
  page?: number;
  scope?: AIScope;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content?: string;
  artifact?: ChatArtifact;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

type AIAction =
  | "eli5"
  | "summaries"
  | "flashcards"
  | "mindmap"
  | "hinglish"
  | "quiz"
  | "analogy"
  | "translate";

/* -------------------------------------------------------------------------- */
/*                                ACTION BUTTON                               */
/* -------------------------------------------------------------------------- */

function AIActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="
        flex shrink-0 items-center gap-1.5
        rounded-full border
        bg-background
        px-2.5 py-1.5
        text-[11px] font-medium
        text-muted-foreground
        transition-colors
        hover:bg-accent
        hover:text-foreground
        disabled:pointer-events-none
        disabled:opacity-50
      "
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                               ARTIFACT CARD                                */
/* -------------------------------------------------------------------------- */

function ArtifactMessage({
  artifact,
  onOpen,
}: {
  artifact: ChatArtifact;
  onOpen: () => void;
}) {
  const config = {
    flashcards: {
      icon: Layers,
      label: "Flashcards",
      description: "Study key concepts extracted by AI.",
    },
    mindmap: {
      icon: GitFork,
      label: "Mind Map",
      description: "Explore the concepts visually.",
    },
    quiz: {
      icon: HelpCircle,
      label: "Quiz",
      description: "Test your understanding of this section.",
    },
  }[artifact.type];

  const Icon = config.icon;

  return (
    <div className="mr-8 rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">{artifact.title}</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
            {artifact.subtitle || config.description}
          </p>

          {artifact.count !== undefined && (
            <p className="mt-1 text-[10px] font-medium text-primary">
              {artifact.count} {config.label.toLowerCase()}
            </p>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-3 h-7 w-full text-[11px]"
        onClick={onOpen}
      >
        Open {config.label}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MAIN SIDEBAR                                */
/* -------------------------------------------------------------------------- */

export function AISidebar() {
const {
  book,
  selectedText,
  clearSelection,
  currentPage,
  flashcards,
  addFlashcard,
  getCurrentPageText,
  getChapterText // <-- Destructured here as getChapterText
} = useReader();

  /* ------------------------------------------------------------------------ */
  /*                                    STATE                                 */
  /* ------------------------------------------------------------------------ */

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiScope, setAiScope] = useState<AIScope>("page");

  // Progress Pipeline State
  const [progressStep, setProgressStep] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [viewer, setViewer] = useState<ViewerType>("chat");

  const [generatedFlashcardPages, setGeneratedFlashcardPages] = useState<number[]>([]);
  const [generatedMindmapPages, setGeneratedMindmapPages] = useState<number[]>([]);
  const [generatedQuizPages, setGeneratedQuizPages] = useState<number[]>([]);

  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [activeMindmapCode, setActiveMindmapCode] = useState("");
  const [mindmapPages, setMindmapPages] = useState<Record<number, string>>({});
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizPages, setQuizPages] = useState<Record<number, QuizQuestion[]>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hey! I'm BookifyAI. Ask me anything about this page, chapter, or general concepts.",
    },
  ]);

/* ------------------------------------------------------------------------ */
/*                              TEXT PIPELINE                               */
/* ------------------------------------------------------------------------ */

const fetchScopeText = async (): Promise<string> => {
  // 1. Prioritize user-highlighted selection if present
  if (selectedText) return selectedText;

  // 2. Chapter Scope
  if (aiScope === "chapter" && getChapterText) {
    setProgressStep("Extracting chapter context...");
    setProgressPercent(20);
    // getChapterText expects a Chapter object in some implementations;
    // cast to any to allow calling with currentPage (number) here.
    const chapterText = await (getChapterText as any)(currentPage);
    if (chapterText && chapterText.trim().length > 0) {
      return chapterText;
    }
  }

  // 3. Fallback: Single Page Scope
  setProgressStep("Extracting page context...");
  setProgressPercent(20);
  return await getCurrentPageText();
};

  const chunkText = (text: string, chunkSize = 3000): string[] => {
    const chunks: string[] = [];
    let index = 0;
    while (index < text.length) {
      chunks.push(text.slice(index, index + chunkSize));
      index += chunkSize;
    }
    return chunks;
  };

  /* ------------------------------------------------------------------------ */
  /*                               ACTIONS                                    */
  /* ------------------------------------------------------------------------ */

  const toggleCardFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasArtifact = (type: ArtifactType, page: number) => {
    if (type === "flashcards") return generatedFlashcardPages.includes(page);
    if (type === "mindmap") return generatedMindmapPages.includes(page);
    if (type === "quiz") return generatedQuizPages.includes(page);
    return false;
  };

  const openArtifact = (type: ArtifactType, page = currentPage) => {
    if (type === "flashcards") {
      setViewer("flashcards");
      return;
    }
    if (type === "mindmap") {
      const existingMap = mindmapPages[page];
      if (existingMap) setActiveMindmapCode(existingMap);
      setViewer("mindmap");
      return;
    }
    if (type === "quiz") {
      const existingQuiz = quizPages[page];
      if (existingQuiz) {
        setQuizQuestions(existingQuiz);
        setQuizAnswers({});
      }
      setViewer("quiz");
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "init",
        role: "assistant",
        content: "Chat cleared. Ready for your next query!",
      },
    ]);
    setViewer("chat");
    setInput("");
  };

  const addArtifactMessage = (type: ArtifactType, count?: number) => {
    const titles = {
      flashcards: "Flashcards generated",
      mindmap: "Mind map generated",
      quiz: "Quiz generated",
    };

    const scopeLabel = aiScope === "chapter" ? "Chapter level" : `Page ${currentPage}`;

    const artifactMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      artifact: {
        type,
        title: titles[type],
        subtitle: `${scopeLabel} • ${book?.title || "Current book"}`,
        count,
        page: currentPage,
        scope: aiScope,
      },
    };

    setMessages((prev) => [...prev, artifactMessage]);
  };

  /* ------------------------------------------------------------------------ */
  /*                              CHAT & TOOLS                                */
  /* ------------------------------------------------------------------------ */

  const handleSend = async () => {
    if (loading) return;
    const text = input.trim();
    if (!text) return;

    setLoading(true);
    setProgressStep("Preparing AI response...");
    setProgressPercent(25);

    const context = await fetchScopeText();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const conversation = [
      ...messages.filter((m) => m.id !== "init"),
      userMessage,
    ];

    setMessages(conversation);
    setInput("");
    setViewer("chat");

    try {
      setProgressStep("Generating response...");
      setProgressPercent(75);

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation,
          contextText: context,
          pageNumber: currentPage,
          bookTitle: book?.title,
          scope: aiScope,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Generation failed.");

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: typeof data.reply === "string" ? data.reply : "No response generated.",
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `⚠️ ${error?.message || "Something went wrong."}`,
        },
      ]);
    } finally {
      setLoading(false);
      setProgressPercent(0);
      setProgressStep("");
      clearSelection();
    }
  };

  const generateArtifactPipeline = async (type: ArtifactType) => {
    if (hasArtifact(type, currentPage) && aiScope === "page") {
      openArtifact(type);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const rawText = await fetchScopeText();
      const chunks = chunkText(rawText);

      setProgressStep(`Analyzing ${aiScope} content...`);
      setProgressPercent(50);

      setProgressStep(`Finalizing ${type}...`);
      setProgressPercent(85);

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate ${type} for this ${aiScope}.`,
            },
          ],
          mode: type,
          contextText: chunks.join("\n\n"),
          pageNumber: currentPage,
          bookTitle: book?.title,
          scope: aiScope,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || `Failed to generate ${type}.`);

      const cleanReply = String(data.reply || "").replace(/```json|```mermaid|```/gi, "").trim();

      if (type === "flashcards") {
        const parsed = JSON.parse(cleanReply);
        parsed.forEach((card: any) => {
          if (card?.question && card?.answer) {
            addFlashcard({ question: card.question, answer: card.answer, page: currentPage });
          }
        });
        setGeneratedFlashcardPages((prev) => [...prev, currentPage]);
        addArtifactMessage("flashcards", parsed.length);
      } else if (type === "mindmap") {
        setMindmapPages((prev) => ({ ...prev, [currentPage]: cleanReply }));
        setActiveMindmapCode(cleanReply);
        setGeneratedMindmapPages((prev) => [...prev, currentPage]);
        addArtifactMessage("mindmap");
      } else if (type === "quiz") {
        const parsed = JSON.parse(cleanReply);
        setQuizPages((prev) => ({ ...prev, [currentPage]: parsed }));
        setQuizQuestions(parsed);
        setQuizAnswers({});
        setGeneratedQuizPages((prev) => [...prev, currentPage]);
        addArtifactMessage("quiz", parsed.length);
      }

      setViewer(type);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `⚠️ ${error?.message || `Failed to generate ${type}.`}`,
        },
      ]);
    } finally {
      setLoading(false);
      setProgressPercent(0);
      setProgressStep("");
      clearSelection();
    }
  };

  const handleTool = async (action: AIAction) => {
    if (["flashcards", "mindmap", "quiz"].includes(action)) {
      await generateArtifactPipeline(action as ArtifactType);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const textContext = await fetchScopeText();
      const prompts: Record<string, string> = {
        eli5: "Explain key concepts like I am 5.",
        summaries: "Provide bulleted core summaries.",
        hinglish: "Explain concepts in conversational Hinglish.",
        analogy: "Explain using intuitive real-world analogies.",
        translate: "Translate and simplify in basic English.",
      };

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: prompts[action] };
      const conversation = [...messages.filter((m) => m.id !== "init"), userMsg];

      setMessages(conversation);
      setViewer("chat");

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation,
          mode: action,
          contextText: textContext,
          pageNumber: currentPage,
          bookTitle: book?.title,
          scope: aiScope,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "No response generated.",
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `⚠️ ${err.message}` },
      ]);
    } finally {
      setLoading(false);
      setProgressPercent(0);
      setProgressStep("");
      clearSelection();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewer !== "chat") setViewer("chat");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewer]);

  /* ------------------------------------------------------------------------ */
  /*                                VIEWERS                                   */
  /* ------------------------------------------------------------------------ */

  const renderViewer = () => {
    if (viewer === "flashcards") {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
          <div className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setViewer("chat")}>
                <ArrowLeft className="size-4" /> Back to Chat
              </Button>
              <div className="hidden h-5 w-px bg-border sm:block" />
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Flashcards</p>
                  <p className="text-[10px] text-muted-foreground">{flashcards.length} cards</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setViewer("chat")} className="size-8">
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {flashcards.map((card, index) => {
                const isFlipped = flippedCards[card.id];
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleCardFlip(card.id)}
                    className="relative flex min-h-[200px] flex-col justify-between rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Card #{index + 1}</span>
                      <RotateCw className="size-3.5" />
                    </div>
                    <p className="my-4 text-sm font-medium">{isFlipped ? card.answer : card.question}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {isFlipped ? "Answer" : "Question"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (viewer === "mindmap") {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Button variant="ghost" size="sm" onClick={() => setViewer("chat")}>
              <ArrowLeft className="mr-2 size-4" /> Back to Chat
            </Button>
            <p className="text-sm font-semibold">Mind Map</p>
            <Button variant="ghost" size="icon" onClick={() => setViewer("chat")}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-8">
            {activeMindmapCode ? (
              <MermaidViewer chart={activeMindmapCode} />
            ) : (
              <p className="text-center text-sm text-muted-foreground">No mind map active.</p>
            )}
          </div>
        </div>
      );
    }

    if (viewer === "quiz") {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setViewer("chat")}
              >
                <ArrowLeft className="size-4" />
                Back to Chat
              </Button>

              <div className="hidden h-5 w-px bg-border sm:block" />

              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <HelpCircle className="size-4 text-primary" />
                </div>

                <div>
                  <p className="text-sm font-semibold">Practice Quiz</p>
                  <p className="text-[10px] text-muted-foreground">
                    {quizQuestions.length} Questions • Page {currentPage}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewer("chat")}
              className="size-8"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Quiz Content Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-3xl space-y-6">
              {quizQuestions.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                  <HelpCircle className="mb-3 size-10 text-muted-foreground" />
                  <p className="text-sm font-semibold">No Quiz Items Available</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a quiz from the reader toolbar to get started.
                  </p>
                </div>
              ) : (
                quizQuestions.map((q, idx) => {
                  const selectedOpt = quizAnswers[q.id];
                  const hasAnswered = selectedOpt !== undefined;

                  return (
                    <div
                      key={q.id || idx}
                      className="rounded-2xl border bg-card p-5 shadow-xs transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-medium leading-snug">{q.question}</p>
                      </div>

                      {/* Options */}
                      <div className="mt-4 space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          const isCorrect = q.correctAnswer === optIdx;

                          let optionStyle =
                            "border-border bg-background hover:bg-accent/50 text-foreground";

                          if (hasAnswered) {
                            if (isCorrect) {
                              optionStyle =
                                "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium";
                            } else if (isSelected) {
                              optionStyle =
                                "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300";
                            } else {
                              optionStyle = "border-border/40 bg-muted/20 opacity-50";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={hasAnswered}
                              onClick={() =>
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: optIdx,
                                }))
                              }
                              className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${optionStyle}`}
                            >
                              <span>{opt}</span>
                              {hasAnswered && isCorrect && (
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              )}
                              {hasAnswered && isSelected && !isCorrect && (
                                <XCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {hasAnswered && (
                        <div className="mt-3 rounded-xl border border-primary/10 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">Explanation: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 space-y-3 overflow-auto p-3 text-xs">
        {messages.map((message) => {
          if (message.artifact) {
            return (
              <ArtifactMessage
                key={message.id}
                artifact={message.artifact}
                onOpen={() => openArtifact(message.artifact!.type, message.artifact!.page)}
              />
            );
          }
          return (
            <div
              key={message.id}
              className={`rounded-lg p-3 whitespace-pre-wrap leading-relaxed ${
                message.role === "user"
                  ? "ml-8 bg-primary text-primary-foreground"
                  : "mr-8 border bg-muted text-foreground"
              }`}
            >
              {message.content}
            </div>
          );
        })}

        {loading && (
          <div className="mr-8 space-y-2 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Loader2 className="size-3.5 animate-spin" />
              <span>{progressStep || "AI is thinking..."}</span>
            </div>
            {progressPercent > 0 && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                                  RENDER                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <aside
      className={`flex h-full flex-col border-l bg-background transition-all duration-300 ${
        isExpanded ? "w-[580px]" : "w-80"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 border-b p-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <p className="truncate text-xs font-semibold">BookifyAI</p>
            <p className="truncate text-[10px] text-muted-foreground">Reading Assistant</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </Button>
        <Button variant="outline" size="icon" className="size-8" onClick={clearChat}>
          <RotateCcw className="size-3.5" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="border-b bg-muted/20 p-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          <AIActionButton
            icon={<Baby className="size-3 text-primary" />}
            label="ELI5"
            onClick={() => handleTool("eli5")}
            disabled={loading}
          />
          <AIActionButton
            icon={<BookOpenText className="size-3 text-primary" />}
            label="Summary"
            onClick={() => handleTool("summaries")}
            disabled={loading}
          />
          <AIActionButton
            icon={<Layers className="size-3 text-primary" />}
            label="Cards"
            onClick={() => handleTool("flashcards")}
            disabled={loading}
          />
          <AIActionButton
            icon={<GitFork className="size-3 text-primary" />}
            label="Mind Map"
            onClick={() => handleTool("mindmap")}
            disabled={loading}
          />
          <AIActionButton
            icon={<Smile className="size-3 text-primary" />}
            label="Hinglish"
            onClick={() => handleTool("hinglish")}
            disabled={loading}
          />
          <AIActionButton
            icon={<Lightbulb className="size-3 text-primary" />}
            label="Analogy"
            onClick={() => handleTool("analogy")}
            disabled={loading}
          />
          <AIActionButton
            icon={<HelpCircle className="size-3 text-primary" />}
            label="Quiz"
            onClick={() => handleTool("quiz")}
            disabled={loading}
          />
          <AIActionButton
            icon={<Languages className="size-3 text-primary" />}
            label="Translate"
            onClick={() => handleTool("translate")}
            disabled={loading}
          />
        </div>
      </div>

      {/* Selected context banner */}
      {selectedText && viewer === "chat" && (
        <div className="m-2.5 rounded-lg border bg-muted/60 p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
              <Sparkles className="size-3 text-primary" /> Selected Mode
            </span>
            <button type="button" onClick={clearSelection} className="hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
          <p className="line-clamp-3 text-[11px] italic leading-relaxed">"{selectedText}"</p>
        </div>
      )}

      {/* Main View Area */}
      {renderViewer()}

      {/* Bottom Input & Scope Toggle */}
      {viewer === "chat" && (
        <div className="border-t p-2">
          {/* Bottom Scope Toggle */}
          <div className="mb-2 flex items-center justify-between border-b pb-2 text-[11px]">
            <span className="text-muted-foreground">Scope Mode:</span>
            <div className="flex rounded-lg bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setAiScope("page")}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition ${
                  aiScope === "page"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="size-3" />
                Page
              </button>
              <button
                type="button"
                onClick={() => setAiScope("chapter")}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition ${
                  aiScope === "chapter"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Book className="size-3" />
                Chapter
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedText
                  ? "Ask about selected text..."
                  : `Ask about this ${aiScope}...`
              }
              disabled={loading}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
            <Button type="submit" size="icon" className="size-8 shrink-0" disabled={loading || !input.trim()}>
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}
    </aside>
  );
}