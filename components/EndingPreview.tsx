// components/EndingPreview.tsx
import { outcomeLabels } from "@/data/mockGameState";
import { GameStateData, OutcomeKey } from "@/types";

const scoreKeys: OutcomeKey[] = ["miracleMarne", "logisticsMaster", "tacticalGamble", "ahistoricalCollapse"];

function topThree(game: GameStateData): OutcomeKey[] {
  return [...scoreKeys]
    .sort(
      (a, b) =>
        game.outcomeScores[b as keyof typeof game.outcomeScores] -
        game.outcomeScores[a as keyof typeof game.outcomeScores]
    )
    .slice(0, 3);
}

export function EndingPreview({ game }: { game: GameStateData }) {
  const top = topThree(game);
  const topKey = top[0] ?? "tacticalGamble";
  const topScore = game.outcomeScores[topKey as keyof typeof game.outcomeScores] ?? 0;
  const topLabel = outcomeLabels[topKey];
  const confidence = topScore > 65 ? "High" : topScore > 40 ? "Medium" : "Low";

  return (
    <section className="ending-preview-float">
      <h3>Outcome Convergence</h3>
      <div className="ending-icons">
        {top.map((key) => (
          <div key={key} className="ending-icon">
            <span>◉</span>
            <small>{outcomeLabels[key]}</small>
          </div>
        ))}
      </div>
      <p>
        Current trend: <strong>{topLabel}</strong> ({confidence} confidence)
      </p>
      <div className="trend-bar">
        <span style={{ width: "33%", background: "#3d6fcc" }} />
        <span style={{ width: "34%", background: "#c9a449" }} />
        <span style={{ width: "33%", background: "#a24a3b" }} />
      </div>
    </section>
  );
}
