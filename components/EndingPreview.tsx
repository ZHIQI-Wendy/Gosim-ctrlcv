import { outcomeLabels } from "@/data/mockGameState";
import { GameStateData, OutcomeKey } from "@/types";

function topThree(game: GameStateData): OutcomeKey[] {
  return (Object.keys(game.outcomeScores) as OutcomeKey[])
    .sort((a, b) => game.outcomeScores[b] - game.outcomeScores[a])
    .slice(0, 3);
}

export function EndingPreview({ game }: { game: GameStateData }) {
  const top = topThree(game);
  const topLabel = outcomeLabels[top[0]];
  const confidence = game.outcomeScores[top[0]] > 65 ? "High" : game.outcomeScores[top[0]] > 40 ? "Medium" : "Low";

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
