// components/KnowledgeCard.tsx
"use client";

import { KnowledgeCard as KnowledgeItem } from "@/types";
import { useMemo, useState } from "react";

const fallback: KnowledgeItem = {
  id: "fallback-marne-taxi",
  title: "Taxis of the Marne",
  content:
    "In September 1914, Paris taxis transported troops toward the front. The direct military effect was limited, but the event symbolized social mobilization and state resolve.",
  discoveredAtMinutes: 0
};

const tags = ["Social Mobilization", "Urban Resources", "War Innovation"];

export function KnowledgeCard({ cards }: { cards: KnowledgeItem[] }) {
  const list = useMemo(() => (cards.length ? cards : [fallback]), [cards]);
  const [index, setIndex] = useState(0);
  const active = list[Math.min(index, list.length - 1)] ?? fallback;

  return (
    <section className="knowledge-float">
      <header className="float-header">
        <h3>Historical Knowledge</h3>
        <div className="nav-buttons">
          <button onClick={() => setIndex((value) => Math.max(0, value - 1))}>◀</button>
          <button onClick={() => setIndex((value) => Math.min(list.length - 1, value + 1))}>▶</button>
        </div>
      </header>

      <div className="knowledge-body">
        <div className="knowledge-art" aria-hidden>
          <span>Archive</span>
        </div>
        <div>
          <strong>{active.title}</strong>
          <p>{active.content}</p>
          <div className="tag-row">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
