import { GameStateData } from "@/types";

type SpeedLevel = "SLOW" | "NORMAL" | "FAST";

function threatLevel(value: number): string {
  if (value >= 80) return "High";
  if (value >= 55) return "Elevated";
  return "Managed";
}

function barColor(kind: "threat" | "morale" | "supply"): string {
  if (kind === "threat") return "#b1493f";
  if (kind === "morale") return "#4d9666";
  return "#c6a44a";
}

function formatTimeLeft(hoursFloat: number): string {
  const clamped = Math.max(0, hoursFloat);
  return `${clamped.toFixed(3)}h`;
}

interface PanelToggle {
  key: string;
  label: string;
  open: boolean;
}

export function TopStatusBar({
  game,
  isPaused,
  speedLevel,
  panelToggles,
  onTogglePause,
  onStep,
  onSetSpeed,
  onTogglePanel
}: {
  game: GameStateData;
  isPaused: boolean;
  speedLevel: SpeedLevel;
  panelToggles: PanelToggle[];
  onTogglePause: () => void;
  onStep: () => void;
  onSetSpeed: (speed: SpeedLevel) => void;
  onTogglePanel: (key: string) => void;
}) {
  return (
    <section className="floating-panel top-status-bar">
      <div className="title-block">
        <h1>Marne: AI Commander</h1>
        <p>September 1914 · Day 6</p>
      </div>

      <div className="status-meters">
        <div className="status-item">
          <span>⌛ Time Left</span>
          <strong>{formatTimeLeft(game.timeLeft)}</strong>
        </div>
        <div className="status-item status-bar-item">
          <span>Paris Threat: {threatLevel(game.parisThreat)}</span>
          <div className="meter-shell">
            <div className="meter-fill" style={{ width: `${game.parisThreat}%`, background: barColor("threat") }} />
          </div>
        </div>
        <div className="status-item status-bar-item">
          <span>Morale: {Math.round(game.morale)}%</span>
          <div className="meter-shell">
            <div className="meter-fill" style={{ width: `${game.morale}%`, background: barColor("morale") }} />
          </div>
        </div>
        <div className="status-item status-bar-item">
          <span>Supply: {Math.round(game.supply)}%</span>
          <div className="meter-shell">
            <div className="meter-fill" style={{ width: `${game.supply}%`, background: barColor("supply") }} />
          </div>
        </div>
      </div>

      <div className="top-actions">
        <div className="sim-actions">
          <button onClick={onTogglePause}>{isPaused ? "Resume" : "Pause"}</button>
          <button onClick={onStep}>Simulate 2h</button>
          <button className={speedLevel === "SLOW" ? "panel-open" : "panel-closed"} onClick={() => onSetSpeed("SLOW")}>
            Slow
          </button>
          <button className={speedLevel === "NORMAL" ? "panel-open" : "panel-closed"} onClick={() => onSetSpeed("NORMAL")}>
            Normal
          </button>
          <button className={speedLevel === "FAST" ? "panel-open" : "panel-closed"} onClick={() => onSetSpeed("FAST")}>
            Fast
          </button>
        </div>
        <div className="panel-actions">
          {panelToggles.map((panel) => (
            <button key={panel.key} className={panel.open ? "panel-open" : "panel-closed"} onClick={() => onTogglePanel(panel.key)}>
              {panel.open ? "Hide" : "Show"} {panel.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
