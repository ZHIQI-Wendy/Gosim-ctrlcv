"use client";

import { useEffect } from "react";
import { MapNodeId } from "@/types";
import { useGameStore } from "@/lib/gameState";

type DemoStep =
  | { type: "click_city"; nodeId: MapNodeId; label: string }
  | { type: "fr_type_and_send"; text: string };

const SCRIPT: DemoStep[] = [
  { type: "click_city", nodeId: "paris", label: "User opens Paris city card." },
  { type: "click_city", nodeId: "meaux", label: "User focuses Meaux before issuing movement." },
  { type: "fr_type_and_send", text: "Move Fifth Army to Meaux and meet the German advance there." },

  { type: "click_city", nodeId: "meaux", label: "User reopens Meaux to inspect the front." },
  { type: "fr_type_and_send", text: "Fifth Army counterattack at Meaux and keep French losses lower than the German side." },

  { type: "click_city", nodeId: "meaux", label: "User keeps pressure on Meaux." },
  { type: "fr_type_and_send", text: "Attack German forces at Meaux again." },

  { type: "click_city", nodeId: "paris", label: "User checks Paris transport conditions." },
  { type: "fr_type_and_send", text: "Use taxi to move Sixth Army toward the Marne crossings." },

  { type: "click_city", nodeId: "marne_crossings", label: "User inspects the Marne crossings." },
  { type: "fr_type_and_send", text: "Sixth Army attack at the Marne crossings and keep pressure on the German line." }
];

const TYPE_INTERVAL_MS = 30;
const CITY_CARD_OPEN_MS = 5000;
const MIN_GAP_MS = 2 * 1000;
const MAX_GAP_MS = 6 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomGapMs(): number {
  return Math.floor(Math.random() * (MAX_GAP_MS - MIN_GAP_MS + 1)) + MIN_GAP_MS;
}

async function waitForUnit(
  unitId: string,
  predicate: (unit: NonNullable<ReturnType<typeof readUnit>>) => boolean,
  timeoutMs = 30000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const unit = readUnit(unitId);
    if (unit && predicate(unit)) return true;
    await sleep(800);
  }
  return false;
}

function readUnit(unitId: string) {
  return useGameStore.getState().game.units.find((unit) => unit.id === unitId);
}

export function DemoAutorun({
  setDemoInput
}: {
  setDemoInput: (value: string) => void;
}) {
  const {
    reset,
    selectNode,
    closeNode,
    enqueueCommand
  } = useGameStore();

  useEffect(() => {
    let cancelled = false;

    const waitForDecisionCycle = async () => {
      const startedDeadline = Date.now() + 15000;
      while (!cancelled && Date.now() < startedDeadline) {
        const snapshot = useGameStore.getState();
        const pending = Object.values(snapshot.game.pendingAgentState).some((agent) => agent.pending);
        if (pending || snapshot.pendingCommands.length === 0) {
          break;
        }
        await sleep(150);
      }

      const finishedDeadline = Date.now() + 25000;
      while (!cancelled && Date.now() < finishedDeadline) {
        const snapshot = useGameStore.getState();
        const pending = Object.values(snapshot.game.pendingAgentState).some((agent) => agent.pending);
        if (!pending && snapshot.pendingCommands.length === 0) {
          return;
        }
        await sleep(200);
      }
    };

    const run = async () => {
      reset();
      await sleep(1200);

      for (const step of SCRIPT) {
        if (cancelled) return;
        if (useGameStore.getState().ending) return;

        if (step.type === "click_city") {
          selectNode(step.nodeId);
          await sleep(CITY_CARD_OPEN_MS);
          closeNode();
          await sleep(randomGapMs());
          continue;
        }

        if (step.type === "fr_type_and_send") {
          const typedText = `${step.text}`;
          const text = step.text.toLowerCase();
          setDemoInput("");
          let buffer = "";
          for (const char of typedText) {
            if (cancelled) return;
            buffer += char;
            setDemoInput(buffer);
            await sleep(TYPE_INTERVAL_MS);
          }
          await sleep(300);
          enqueueCommand(typedText);
          setDemoInput("");
          await waitForDecisionCycle();

          if (text.includes("move fifth army to meaux")) {
            await waitForUnit("fifth_army", (unit) => unit.role === "moving" || unit.nodeId === "meaux");
          }

          if (text.includes("use taxi") && text.includes("sixth army")) {
            await waitForUnit("sixth_army", (unit) => unit.nodeId === "paris" || unit.role === "moving");
          }

          await sleep(randomGapMs());
          continue;
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [closeNode, enqueueCommand, reset, selectNode, setDemoInput]);

  return null;
}
