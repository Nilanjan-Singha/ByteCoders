"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidViewerProps {
  chart: string;
}

function sanitizeMermaidCode(rawText: string): string {
  if (!rawText) return "";

  let clean = rawText.trim();

  /*
   * ------------------------------------------------------------
   * 1. Remove markdown code fences
   * ------------------------------------------------------------
   */

  clean = clean
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  /*
   * ------------------------------------------------------------
   * 2. Find the actual Mermaid diagram
   *
   * AI sometimes returns:
   *
   * "Here is your mind map:"
   * mindmap
   *   root((Topic))
   *
   * We only want everything starting at "mindmap".
   * ------------------------------------------------------------
   */

  const mindmapMatch = clean.match(
    /(?:^|\n)\s*mindmap\s*(?:\n|$)/i
  );

  if (!mindmapMatch || mindmapMatch.index === undefined) {
    return "";
  }

  clean = clean
    .slice(mindmapMatch.index)
    .trim();

  /*
   * ------------------------------------------------------------
   * 3. Normalize line endings
   * ------------------------------------------------------------
   */

  clean = clean.replace(/\r\n/g, "\n");

  /*
   * ------------------------------------------------------------
   * 4. Convert tabs to spaces
   *
   * Mermaid mindmaps depend on indentation.
   * Do NOT trim individual lines.
   * ------------------------------------------------------------
   */

  clean = clean.replace(/\t/g, "  ");

  /*
   * ------------------------------------------------------------
   * 5. Remove empty lines
   *
   * Empty lines aren't useful in the generated diagram and
   * occasionally cause weird parser behavior.
   * ------------------------------------------------------------
   */

  const lines = clean
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (!lines.length) {
    return "";
  }

  /*
   * ------------------------------------------------------------
   * 6. Make absolutely sure the first line is `mindmap`
   * ------------------------------------------------------------
   */

  const firstLine = lines[0].trim().toLowerCase();

  if (firstLine !== "mindmap") {
    return "";
  }

  /*
   * ------------------------------------------------------------
   * 7. Preserve Mermaid syntax.
   *
   * IMPORTANT:
   *
   * DO NOT:
   * - add quotes
   * - split nodes
   * - modify brackets
   * - modify parentheses
   * - modify indentation
   * - turn labels into strings
   *
   * Mermaid itself understands:
   *
   * root((Title))
   *   Node
   *     Child
   *
   * ------------------------------------------------------------
   */

  return lines.join("\n").trim();
}

export function MermaidViewer({
  chart,
}: MermaidViewerProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const renderIdRef = useRef(0);

  const [svg, setSvg] = useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [isRendering, setIsRendering] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const renderChart = async () => {
      /*
       * Reset previous result.
       */
      setSvg("");
      setError(null);

      if (!chart?.trim()) {
        setError("No diagram was generated.");
        return;
      }

      setIsRendering(true);

      // increment render id
      const renderId =
        ++renderIdRef.current;

      try {
        mermaid.initialize({
          startOnLoad: false,

          theme: "dark",

          securityLevel: "loose",

          fontFamily:
            "var(--font-sans), sans-serif",

          mindmap: {
            useMaxWidth: true,
          },

          themeVariables: {
            fontFamily:
              "var(--font-sans), sans-serif",
          },
        });

        // clean ai response
        const cleanChart =
          sanitizeMermaidCode(chart);

        if (!cleanChart) {
          throw new Error(
            "The AI response does not contain a valid Mermaid mindmap."
          );
        }

        // validate mermaid id
        await mermaid.parse(cleanChart);

        if (
          !mounted ||
          renderId !== renderIdRef.current
        ) {
          return;
        }

      //  unique mermaid id
        const id =
          `mermaid-mindmap-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

        // render mermaid
        const result =
          await mermaid.render(
            id,
            cleanChart
          );

        // checks
        if (
          !mounted ||
          renderId !== renderIdRef.current
        ) {
          return;
        }

        if (!result?.svg) {
          throw new Error(
            "Mermaid returned an empty SVG."
          );
        }

        setSvg(result.svg);

        /*
         * Mermaid can return a bindFunctions callback
         * for interactive diagrams.
         *
         * Since we're injecting the SVG ourselves, attach
         * those handlers after the SVG is mounted.
         */
        requestAnimationFrame(() => {
          if (
            !mounted ||
            renderId !== renderIdRef.current
          ) {
            return;
          }

          if (
            containerRef.current &&
            result.bindFunctions
          ) {
            result.bindFunctions(
              containerRef.current
            );
          }
        });
      } catch (err) {
        console.error(
          "Mermaid Render Error:",
          err
        );

        if (
          !mounted ||
          renderId !== renderIdRef.current
        ) {
          return;
        }

        const message =
          err instanceof Error
            ? err.message
            : "Unknown Mermaid rendering error.";

        setError(message);
      } finally {
        if (
          mounted &&
          renderId === renderIdRef.current
        ) {
          setIsRendering(false);
        }
      }
    };

    renderChart();

    return () => {
      mounted = false;

      /*
       * Invalidate any currently running render.
       */
      renderIdRef.current++;
    };
  }, [chart]);

// loading

  if (isRendering) {
    return (
      <div className="my-2 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />

          Generating mind map...
        </div>
      </div>
    );
  }

// error

  if (error) {
    const cleanedCode =
      sanitizeMermaidCode(chart);

    return (
      <div className="my-2 overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/10">
        <div className="border-b border-amber-500/20 px-3 py-2">
          <p className="text-xs font-medium text-amber-200">
            Could not render mind map
          </p>

          <p className="mt-0.5 text-[10px] text-amber-200/60">
            Mermaid rejected the generated diagram.
          </p>
        </div>

        <div className="p-3">
          <p className="mb-2 text-[10px] text-amber-200/70">
            {error}
          </p>

          <details>
            <summary className="cursor-pointer text-[10px] text-amber-200/70">
              Show Mermaid code
            </summary>

            <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-amber-500/20 bg-black/20 p-2 text-[10px] leading-relaxed text-amber-100/80">
              {cleanedCode || chart}
            </pre>
          </details>
        </div>
      </div>
    );
  }

// empty

  if (!svg) {
    return (
      <div className="my-2 rounded-lg border bg-card p-4 text-center text-xs text-muted-foreground">
        No mind map available.
      </div>
    );
  }

//  svg

  return (
    <div
      ref={containerRef}
      className="
        my-2
        flex
        min-h-[180px]
        w-full
        justify-center
        overflow-auto
        rounded-lg
        border
        bg-card
        p-4
      "
      dangerouslySetInnerHTML={{
        __html: svg,
      }}
    />
  );
}