import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      messages = [],
      mode,
      contextText,
      pageNumber,
      bookTitle,
      scope = "page",
    } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured in environment variables" },
        { status: 500 }
      );
    }

    // Expand context length to support multi-page chapter context chunks
    const maxContextLength = scope === "chapter" ? 16000 : 6000;
    const safeContext = contextText ? String(contextText).slice(0, maxContextLength) : "";

    const scopeLabel = scope === "chapter" ? "entire chapter" : `page ${pageNumber || 1}`;

    let systemInstruction = `
You are ContextBook AI, an intelligent reading assistant for "${bookTitle || "this book"}".

You are assisting a reader who is analyzing content at the ${scope.toUpperCase()} level (${scopeLabel}).

Rules:
- Answer questions accurately using general knowledge and supplied context.
- When context is available, draw primarily from it to formulate summaries, flashcards, mindmaps, and quizzes.
- Use previous conversation history to understand references like "this", "that", or "explain further".
- Be precise, educational, and clear.
- Do not make statements about the book's content that are unsupported by the provided context.
`;

    if (pageNumber) {
      systemInstruction += `\nReader's current position: Page ${pageNumber}.\n`;
    }

    if (safeContext) {
      systemInstruction += `
Current ${scope} context:

"""
${safeContext}
"""
`;
    } else {
      systemInstruction += `
There is currently no extracted text context available. Answer using conversation history and general knowledge.
`;
    }

switch (mode) {
      case "summaries":
        systemInstruction += `
The user requested a summary of this ${scope}.
${
  scope === "chapter"
    ? "Provide a comprehensive, in-depth summary broken down by key sections or sub-topics with detailed bullet points under each."
    : "Provide a concise summary structured with clear bullet points."
}
Bold important terms, key entities, and core concepts.
`;
        break;

      case "flashcards":
        systemInstruction += `
Generate study flashcards based on the provided ${scope} context.

Count requirement:
${
  scope === "chapter"
    ? "- Generate 15-20 detailed study flashcards covering key concepts across the entire chapter."
    : "- Generate 5-8 concise study flashcards based on this page."
}

Return ONLY a valid JSON array:

[
  {
    "question": "Question text here?",
    "answer": "Clear, accurate answer explaining the concept."
  }
]
`;
        break;

      case "mindmap":
        systemInstruction += `
Create a visual mind map using Mermaid.js mindmap syntax representing key ideas from this ${scope}.

You MUST reply ONLY with valid Mermaid code.

Rules:
1. The first line MUST be exactly:
mindmap

2. Use 2 spaces for each indentation level.
3. Use a root node representing the overarching topic:
   root((Main Topic))
4. Keep each node short and on its own line.
5. Do NOT use markdown code block wrappers or fences.
6. Do NOT output any introductory or concluding text.
${
  scope === "chapter"
    ? "7. Provide a detailed, multi-branch mindmap covering all major sub-sections and secondary nodes."
    : "7. Keep the mindmap focused on the core 3-4 topics from this page."
}

Example format:
mindmap
  root((Main Topic))
    Concept A
      Detail A1
      Detail A2
    Concept B
      Detail B1
`;
        break;

      case "eli5":
        systemInstruction += `
Explain the core concepts from this ${scope} as if explaining to a 5-year-old.
Use simple language, short sentences, and familiar everyday analogies.
`;
        break;

      case "hinglish":
        systemInstruction += `
Explain the key concepts from this ${scope} in natural, conversational Hinglish (Hindi written in Roman script mixed with English).
Keep technical terms in English.
`;
        break;

      case "analogy":
        systemInstruction += `
Explain the core concepts from this ${scope} using ${
          scope === "chapter" ? "4-5" : "2-3"
        } intuitive real-world analogies.
Follow each analogy with a direct connection back to the text.
`;
        break;

      case "quiz":
        systemInstruction += `
Generate a multiple-choice quiz testing understanding of this ${scope}.

Count requirement:
${
  scope === "chapter"
    ? "- Generate 25 multiple-choice questions covering all key topics and sub-sections of the chapter."
    : "- Generate 10 multiple-choice questions testing key facts on this page."
}

Return ONLY a valid JSON array:

[
  {
    "id": "1",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this answer is correct."
  }
]
`;
        break;

      case "translate":
        systemInstruction += `
Translate and simplify the provided ${scope} content into clear, straightforward English.
Focus on preserving core meaning rather than literal word-for-word translation.
`;
        break;

      default:
        systemInstruction += `
Respond directly and conversationally to the user's latest query.
`;
        break;
    }
    
    // Sanitize message history (strip non-standard attributes or artifacts)
    const validMessages = messages
      .filter((m: any) => m && m.role && typeof m.content === "string")
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

    const apiMessages = [
      {
        role: "system",
        content: systemInstruction,
      },
      ...validMessages,
    ];

    const isStructuredOutputMode = mode === "flashcards" || mode === "quiz" || mode === "mindmap";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "ContextBook Reader AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        temperature: isStructuredOutputMode ? 0.1 : 0.4,
        max_tokens: 2200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to reach AI provider" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}