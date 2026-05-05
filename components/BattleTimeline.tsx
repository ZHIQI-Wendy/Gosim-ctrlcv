"use client";

import { BattleReport } from "@/types";

export function BattleTimeline({ reports }: { reports: BattleReport[] }) {
  return (
    <aside className="timeline-feed" aria-label="Battle feed">
      {reports.slice(0, 14).map((report, index) => (
        <article key={report.id} className={`timeline-feed-item ${index === 0 ? "latest" : ""}`}>
          <div className="timeline-feed-head">
            <small>{report.dateLabel ?? "Sep 05 18:00"}</small>
            <strong>{report.title}</strong>
          </div>
          <p>{report.body}</p>
        </article>
      ))}
    </aside>
  );
}
