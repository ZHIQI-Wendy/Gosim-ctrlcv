// components/CommandPanel.tsx
"use client";

import { strategyOptions } from "@/data/mockGameState";
import { AllowedAction, BattleReport } from "@/types";
import { useEffect, useMemo, useState } from "react";

interface CommandPanelProps {
  selectedAction: AllowedAction;
  queueSize: number;
  reports: BattleReport[];
  disabled: boolean;
  aiStatusText: string | null;
  cityVehiclesDiscovered: boolean;
  cityVehiclesUsed: boolean;
  inputValue?: string;
  setAction: (action: AllowedAction) => void;
  setInputValue?: (value: string) => void;
  enqueueCommand: (text: string) => void;
  mobilizeCityVehicles: () => void;
}

export function CommandPanel(props: CommandPanelProps) {
  const [text, setText] = useState("");
  const liveText = props.inputValue ?? text;
  const count = liveText.length;

  useEffect(() => {
    if (props.inputValue === undefined) return;
    setText(props.inputValue);
  }, [props.inputValue]);

  const limitedText = useMemo(() => liveText.slice(0, 160), [liveText]);

  const updateText = (value: string) => {
    const next = value.slice(0, 160);
    if (props.inputValue !== undefined) {
      props.setInputValue?.(next);
      return;
    }
    setText(next);
  };

  const sendCommand = () => {
    const payload = limitedText.trim();
    if (!payload || props.disabled) return;
    props.enqueueCommand(payload);
    updateText("");
  };

  return (
    <section className="command-panel">
      {props.aiStatusText && (
        <div className="decision-strip" aria-live="polite" aria-busy="true">
          <article className="decision-item decision-item-pending">
            <div className="decision-item-row">
              <span className="decision-spinner" aria-hidden />
              <strong>Command is being issued</strong>
            </div>
          </article>
        </div>
      )}

      <div className="command-list">
        {strategyOptions.map((item) => {
          const isSelected = props.selectedAction === item.action;
          return (
            <button
              key={item.action}
              className={`command-item ${isSelected ? "selected" : ""}`}
              onClick={() => {
                props.setAction(item.action);
                props.enqueueCommand(item.commandText);
              }}
              disabled={props.disabled}
            >
              <span className="command-icon" aria-hidden>
                {item.icon}
              </span>
              <strong>{item.title}</strong>
            </button>
          );
        })}
      </div>

      <div className="command-input-row">
        <input
          id="order-note"
          value={liveText}
          onChange={(event) => updateText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              sendCommand();
            }
          }}
          placeholder="Give your order clarification Général..."
          disabled={props.disabled}
        />
        <button className="issue-button" disabled={props.disabled} onClick={sendCommand} aria-label="Send command">
          ↑
        </button>
      </div>
      <div className="note-footer">
        <small>{count > 160 ? 160 : count}/160</small>
        <small>Queued: {props.queueSize}</small>
      </div>

      {props.cityVehiclesDiscovered && !props.cityVehiclesUsed && (
        <div className="city-unlock-box">
          <p>Urban logistics branch discovered. Use text order to mobilize, or quick action below.</p>
          <button onClick={props.mobilizeCityVehicles} disabled={props.disabled}>
            Requisition City Vehicles
          </button>
        </div>
      )}
    </section>
  );
}
