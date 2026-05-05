"use client";

import { BattleReport } from "@/types";
import { useMemo, useState } from "react";

export function BattleTimeline({ reports }: { reports: BattleReport[] }) {
  const [start, setStart] = useState(0);
  const visible = useMemo(() => reports.slice(start, start + 4), [reports, start]);
  const maxStart = Math.max(0, reports.length - 4);

  return (
    <section className="timeline-float">
      <header className="float-header">
        <h3>Battle Timeline</h3>
        <div className="nav-buttons">
          <button onClick={() => setStart((value) => Math.max(0, value - 1))}>◀</button>
          <button onClick={() => setStart((value) => Math.min(maxStart, value + 1))}>▶</button>
        </div>
      </header>

      <div className="timeline-track">
        {visible.map((report, index) => (
          <article key={report.id} className={`timeline-card ${index === 0 ? "hot" : ""}`}>
            <small>{report.dateLabel ?? "Sep 06 06:00"}</small>
            <strong>{report.title}</strong>
            <p>{report.body}</p>
            <span className="stamp">{index === 0 ? "Confirmed" : "Monitor"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
