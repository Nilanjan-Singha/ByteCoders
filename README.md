# 📚 Bookify

> **Transform static PDFs and ePubs into dynamic, AI-powered interactive study workspaces.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PDF.js](https://img.shields.io/badge/PDF.js-Viewer-red?style=flat-square)](https://mozilla.github.io/pdf.js/)
[![OpenRouter](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue?style=flat-square)](https://openrouter.ai/)

---

## 🌟 Overview

**Bookify** solves passive reading fatigue. Instead of endlessly scrolling through dense textbooks or technical documentation, Bookify turns your documents into an interactive study partner. 

With dual **Page-Level** and **Chapter-Level** AI processing, readers can automatically extract study flashcards, generate visual Mermaid mind maps, take practice quizzes, and break down complex concepts into ELI5, Hinglish, or real-world analogies.

---

## 📸 Demo & Screenshots

![Bookify Application Banner & Interface](https://postimg.cc/GTmnCfMM)

<p align="center">
  <i>The Bookify workspace featuring the PDF viewer, Chapter Outline, and AI Assistant Sidebar.</i>
</p>

---

## ✨ Key Features

- 📖 **Interactive Document Reader:** High-performance, client-side PDF and ePub rendering using PDF.js with custom zoom, outline extraction, and page jump controls.
- 🎯 **Dual Scope Intelligence:** Toggle seamlessly between **Page Level** (focused analysis) and **Chapter Level** (broad synthesis) modes.
- 🗂️ **Automated Flashcard Deck:** Instantly generate, flip, and review study cards cached per page/chapter.
- 🧠 **Interactive Mind Maps:** Automatically map complex chapter hierarchies into visual [Mermaid.js](https://mermaid.js.org/) diagrams.
- 📝 **Practice Quizzes:** Self-assess retention with generated multiple-choice quizzes complete with answer explanations and instant feedback.
- 🗣️ **Adaptive Explanation Modes:**
  - **ELI5:** Simple explanations with short sentences and everyday examples.
  - **Hinglish:** Conversational blend of Hindi and English in Roman script.
  - **Analogy:** Real-world comparisons connecting back to core concepts.
  - **Summarizer & Translator:** Concise bulleted takeaways and plain-English translations.
- ⚡ **Non-Blocking UI Pipeline:** Large chapter processing uses client-side text chunking and step-by-step progress tracking to keep the reading interface smooth.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide Icons](https://lucide.dev/)
- **Theme Management:** [next-themes](https://github.com/pacocoursey/next-themes) (Light / Dark mode)
- **Document Processing:** [PDF.js](https://mozilla.github.io/pdf.js/)
- **Diagram Rendering:** [Mermaid.js](https://mermaid.js.org/)
- **AI Infrastructure:** [OpenRouter API](https://openrouter.ai/) (`google/gemini-2.5-flash`)

---

