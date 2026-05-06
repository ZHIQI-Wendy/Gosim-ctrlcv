// components/CommandPanel.tsx
"use client";

import { strategyOptions } from "@/data/mockGameState";
import { AllowedAction, BattleReport } from "@/types";
import { useMemo, useState } from "react";

interface CommandPanelProps {
  selectedAction: AllowedAction;
  queueSize: number;
  reports: BattleReport[];
  disabled: boolean;
  aiStatusText: string | null;
  cityVehiclesDiscovered: boolean;
  cityVehiclesUsed: boolean;
  setAction: (action: AllowedAction) => void;
  enqueueCommand: (text: string) => void;
  mobilizeCityVehicles: () => void;
}

export function CommandPanel(props: CommandPanelProps) {
  const [text, setText] = useState("");
  const count = text.length;

  const limitedText = useMemo(() => text.slice(0, 160), [text]);

  const sendCommand = () => {
    const payload = limitedText.trim();
    if (!payload || props.disabled) return;
    props.enqueueCommand(payload);
    setText("");
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
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 160))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              sendCommand();
            }
          }}
          placeholder="Add operational clarification..."
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
