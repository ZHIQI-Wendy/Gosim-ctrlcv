"use client";

import { AllowedAction } from "@/types";
import { useEffect, useRef, useState } from "react";

type DemoMode = "fr" | "gr";

type DemoScenario = {
  id: string;
  label: string;
  frenchCommand: string;
  germanAction: AllowedAction | "MOBILIZE_CITY";
  passiveMs: number;
};

interface DemoControllerProps {
  reportsCount: number;
  hasPendingAgents: boolean;
  disabled: boolean;
  setAction: (action: AllowedAction) => void;
  enqueueCommand: (text: string) => void;
  mobilizeCityVehicles: () => void;
  demoInput: string;
  setDemoInput: (value: string) => void;
}

const DEFAULT_SCENARIOS: DemoScenario[] = [
  {
    id: "moving_troops",
    label: "moving the troops",
    frenchCommand: "Move the troops toward the Marne crossings and keep reserves ready behind Paris.",
    germanAction: "DELAY",
    passiveMs: 1800
  },
  {
    id: "counterattack_enemy",
    label: "conterattack the enermy",
    frenchCommand: "Counterattack the enemy flank near the exposed advance corridor before dawn.",
    germanAction: "COUNTERATTACK",
    passiveMs: 1800
  },
  {
    id: "social_news",
    label: "social news and reports",
    frenchCommand: "Issue social news and reports to keep Paris calm and confident.",
    germanAction: "PROPAGANDA",
    passiveMs: 1500
  },
  {
    id: "use_taxi",
    label: "use the taxi",
    frenchCommand: "Use the taxi network to rush local troops from Paris to the front.",
    germanAction: "MOBILIZE_CITY",
    passiveMs: 2200
  },
  {
    id: "win_crisis",
    label: "win the crisis",
    frenchCommand: "Win the crisis by holding Paris, restoring morale, and keeping transport moving.",
    germanAction: "DEFEND",
    passiveMs: 2000
  }
];

const AUTO_START_DELAY_MS = 1200;
const BETWEEN_SCENARIOS_MS = 1800;
const MODE_SEQUENCE: DemoMode[] = ["fr", "gr", "fr", "gr", "fr"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function DemoController(props: DemoControllerProps) {
  const [mode, setMode] = useState<DemoMode>("fr");
  const [scenarios, setScenarios] = useState<DemoScenario[]>(DEFAULT_SCENARIOS);
  const [status, setStatus] = useState("Preparing demo autorun.");
  const [runningId, setRunningId] = useState<string | null>(null);
  const reportsRef = useRef(props.reportsCount);
  const pendingRef = useRef(props.hasPendingAgents);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    reportsRef.current = props.reportsCount;
  }, [props.reportsCount]);

  useEffect(() => {
    pendingRef.current = props.hasPendingAgents;
  }, [props.hasPendingAgents]);

  useEffect(() => {
    void fetch("/api/demo-controller")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`demo route failed: ${response.status}`);
        }
        return response.json();
      })
      .then((payload: { scenarios?: DemoScenario[] }) => {
        if (payload.scenarios?.length) {
          setScenarios(payload.scenarios);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    if (!scenarios.length) return;

    hasStartedRef.current = true;

    void (async () => {
      await sleep(AUTO_START_DELAY_MS);
      for (let index = 0; index < scenarios.length; index += 1) {
        const scenario = scenarios[index];
        const nextMode = MODE_SEQUENCE[index] ?? "fr";
        setMode(nextMode);
        await runScenario(scenario, nextMode);
        if (index < scenarios.length - 1) {
          setStatus(`Pause before next scripted step.`);
          await sleep(BETWEEN_SCENARIOS_MS);
        }
      }
      setStatus("Demo sequence completed.");
    })();
  }, [scenarios]);

  const waitForReportNews = async (baselineReports: number) => {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (reportsRef.current > baselineReports && !pendingRef.current) {
        return true;
      }
      await sleep(150);
    }
    return false;
  };

  const runScenario = async (scenario: DemoScenario, activeMode: DemoMode) => {
    if (props.disabled || runningId) return;

    setRunningId(scenario.id);
    const baselineReports = reportsRef.current;

    try {
      if (activeMode === "fr") {
        setStatus(`FR: input the command in input field letter by letter for "${scenario.label}".`);
        let buffer = "";
        props.setDemoInput("");
        for (const char of scenario.frenchCommand) {
          buffer += char;
          props.setDemoInput(buffer);
          await sleep(28);
        }

        setStatus("FR: send and remove all.");
        props.enqueueCommand(scenario.frenchCommand);
        props.setDemoInput("");
      } else {
        setStatus(`GR: action for "${scenario.label}".`);
        if (scenario.germanAction === "MOBILIZE_CITY") {
          props.mobilizeCityVehicles();
        } else {
          props.setAction(scenario.germanAction);
          props.enqueueCommand(scenario.frenchCommand);
        }
      }

      setStatus(`${activeMode.toUpperCase()}: waiting for report / news.`);
      const reportSeen = await waitForReportNews(baselineReports);
      setStatus(
        reportSeen
          ? `${activeMode.toUpperCase()}: report / news received.`
          : `${activeMode.toUpperCase()}: waiting ended without new report.`
      );

      setStatus(`${activeMode.toUpperCase()}: ui passive move.`);
      await sleep(scenario.passiveMs);
      setStatus(`Ready for external demo control. Last demo: ${scenario.label}.`);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <aside className="demo-controller floating-panel" aria-label="External demo controller">
      <div className="demo-controller-head">
        <div>
          <strong>Outside Demo Controller</strong>
          <p>Autorun script mode from `npm run demo`. `npm run dev` stays normal interactive.</p>
        </div>
        <div className="demo-mode-switch" role="tablist" aria-label="Demo side">
          <button
            className={mode === "fr" ? "active" : ""}
            disabled
          >
            FR
          </button>
          <button
            className={mode === "gr" ? "active" : ""}
            disabled
          >
            GR
          </button>
        </div>
      </div>

      <div className="demo-scenario-list">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`demo-scenario-button ${runningId === scenario.id ? "running" : ""}`}
          >
            {scenario.label}
          </div>
        ))}
      </div>

      <div className="demo-controller-status">
        <small>{status}</small>
        <small>{mode === "fr" ? `FR draft: ${props.demoInput.length}/160` : "GR follows action -> report/news -> ui passive move."}</small>
      </div>
    </aside>
  );
}
