// components/BattleTimeline.tsx
"use client";

import { formatCampaignTime } from "@/lib/utils";
import { BattleReport } from "@/types";

export function BattleTimeline({ reports }: { reports: BattleReport[] }) {
  return (
    <aside className="timeline-feed" aria-label="Battle feed">
      {reports.slice(0, 14).map((report, index) => (
        <article key={report.id} className={`timeline-feed-item ${index === 0 ? "latest" : ""}`}>
          <div className="timeline-feed-head">
            <small>{formatCampaignTime(report.createdAtMinutes)}</small>
            <strong>{report.headline}</strong>
          </div>
          <p>{report.reportText}</p>
        </article>
      ))}
    </aside>
  );
}
