import {formatClockByMinutes} from "@/lib/utils";
import {SpeedLevel} from "@/lib/gameState";
import {GameStateData} from "@/types";
import Image from "next/image";
import GitHubIcon from "@/assets/img/github-icon.svg";

function barColor(kind: "cohesion" | "stability" | "pressure" | "rail" | "threat"): string {
    if (kind === "cohesion") return "#4d9666";
    if (kind === "stability") return "#5d8ab9";
    if (kind === "pressure") return "#a95d52";
    if (kind === "rail") return "#c6a44a";
    return "#b1493f";
}

function formatSpeed(speedLevel: SpeedLevel): string {
    if (speedLevel === "SLOW") return "x0.5";
    if (speedLevel === "FAST") return "x2.0";
    return "x1.0";
}

function threatLevel(value: number): string {
    if (value >= 85) return "Critical";
    if (value >= 70) return "High";
    if (value >= 50) return "Elevated";
    return "Managed";
}

function MetricBar({label, value, color}: { label: string; value: number; color: string }) {
    const width = Math.max(0, Math.min(100, value));
    return (
        <div className="hud-metric-shell">
            <div className="hud-metric-fill" style={{width: `${width}%`, background: color}}/>
            <span className="hud-metric-label">
        {label}: {Math.round(value)}%
      </span>
        </div>
    );
}


export function RightMetrics({
                                 game,
                                 isPaused,
                                 speedLevel,
                                 onTogglePause,
                                 onDecreaseSpeed,
                                 onIncreaseSpeed
                             }: {
    game: GameStateData;
    isPaused: boolean;
    speedLevel: SpeedLevel;
    onTogglePause: () => void;
    onDecreaseSpeed: () => void;
    onIncreaseSpeed: () => void;
}) {
    return (
        <aside className="hud-right-meters" aria-label="Operational metrics">
            <div className={"title-row"}>
                <h1 style={{margin: 0}}>What If: Marne</h1>
                {/*<span className="github-link">*/}
                {/*    <a href="https://github.com/ZHIQI-Wendy/Gosim-ctrlcv" target="_blank" rel="noopener noreferrer">*/}
                {/*        <Image src={GitHubIcon} alt="GitHub" width={20} height={20}/>*/}
                {/*    </a>*/}
                {/*</span>*/}
            </div>
            <MetricBar label="Command Cohesion" value={game.commandCohesion} color={barColor("cohesion")}/>
            <MetricBar label="City Stability" value={game.cityStability} color={barColor("stability")}/>
            <MetricBar label="Political Pressure" value={game.politicalPressure} color={barColor("pressure")}/>
            <MetricBar label="Rail Congestion" value={game.railwayCongestion} color={barColor("rail")}/>

            <div className="hud-control-row">
                <div className="hud-time-readout">
                    <small>Campaign Time</small>
                    <strong>{formatClockByMinutes(game.currentTimeMinutes)}</strong>
                </div>
                <div className="hud-control-buttons">
                    <button
                        onClick={onTogglePause}
                        aria-label={isPaused ? "Resume simulation" : "Pause simulation"}
                        title={isPaused ? "Resume simulation" : "Pause simulation"}
                    >
                        {isPaused ? "▶" : "❚❚"}
                    </button>
                    <button onClick={onDecreaseSpeed} aria-label="Decrease simulation speed">
                        -
                    </button>
                    <span className="hud-speed-pill">{formatSpeed(speedLevel)}</span>
                    <button onClick={onIncreaseSpeed} aria-label="Increase simulation speed">
                        +
                    </button>
                </div>
            </div>
        </aside>
    );
}

export function BottomThreatBar({game}: { game: GameStateData }) {
    return (
        <div className="bottom-threat-strip" aria-label="Paris threat">
            <div className="bottom-threat-shell">
                <div
                    className="bottom-threat-fill"
                    style={{
                        width: `${Math.max(0, Math.min(100, game.parisThreat))}%`,
                        background: barColor("threat")
                    }}
                />
                <span className="bottom-threat-label">
          Paris Threat {Math.round(game.parisThreat)}% · {threatLevel(game.parisThreat)}
        </span>
            </div>
        </div>
    );
}
