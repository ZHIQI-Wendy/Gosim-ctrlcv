import {GameStateData} from "@/types";
import {SpeedLevel} from "@/lib/gameState";

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
    const totalMinutes = Math.max(0, Math.round(clamped * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}h${String(minutes).padStart(2, "0")}m`;
}

function formatCampaignClock(timeLeftHours: number): string {
    const elapsedMinutes = Math.max(0, Math.round((48 - timeLeftHours) * 60));
    const at = new Date(Date.UTC(1914, 8, 5, 18, 0, 0) + elapsedMinutes * 60 * 1000);
    const hh = String(at.getUTCHours()).padStart(2, "0");
    const mm = String(at.getUTCMinutes()).padStart(2, "0");
    const day = at.getUTCDate();
    const year = at.getUTCFullYear();
    return `${hh}:${mm} ${day} Sept. ${year}`;
}

function formatSpeed(speedLevel: SpeedLevel): string {
    if (speedLevel === "SLOW") return "x0.5";
    if (speedLevel === "FAST") return "x2.0";
    return "x1.0";
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
                                 onDecreaseSpeed,
                                 onIncreaseSpeed,
                                 onTogglePanel
                             }: {
    game: GameStateData;
    isPaused: boolean;
    speedLevel: SpeedLevel;
    panelToggles: PanelToggle[];
    onTogglePause: () => void;
    onDecreaseSpeed: () => void;
    onIncreaseSpeed: () => void;
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
                        <div className="meter-fill"
                             style={{width: `${game.parisThreat}%`, background: barColor("threat")}}/>
                    </div>
                </div>
                <div className="status-item status-bar-item">
                    <span>Morale: {Math.round(game.morale)}%</span>
                    <div className="meter-shell">
                        <div className="meter-fill" style={{width: `${game.morale}%`, background: barColor("morale")}}/>
                    </div>
                </div>
                <div className="status-item status-bar-item">
                    <span>Supply: {Math.round(game.supply)}%</span>
                    <div className="meter-shell">
                        <div className="meter-fill" style={{width: `${game.supply}%`, background: barColor("supply")}}/>
                    </div>
                </div>
            </div>

            <div className="top-actions">
                <div className="sim-actions">
                    <button onClick={onTogglePause}>{isPaused ? "Resume" : "Pause"}</button>
                    <button onClick={onDecreaseSpeed} aria-label="Decrease simulation speed">
                        -
                    </button>
                    <div className="time-speed-bar" role="status" aria-live="polite">
                        <span>{formatCampaignClock(game.timeLeft)}</span>
                        <strong>{formatSpeed(speedLevel)}</strong>
                    </div>
                    <button onClick={onIncreaseSpeed} aria-label="Increase simulation speed">
                        +
                    </button>
                </div>
            </div>
        </section>
    );
}
