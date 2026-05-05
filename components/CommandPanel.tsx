"use client";

import { strategyOptions } from "@/data/mockGameState";
import { StrategicFocus } from "@/types";
import { useMemo, useState } from "react";

interface CommandPanelProps {
  selectedFocus: StrategicFocus;
  queueSize: number;
  disabled: boolean;
  cityVehiclesDiscovered: boolean;
  cityVehiclesUsed: boolean;
  setFocus: (focus: StrategicFocus) => void;
  enqueueCommand: (text: string) => void;
  mobilizeCityVehicles: () => void;
}

export function CommandPanel(props: CommandPanelProps) {
  const [text, setText] = useState("");
  const count = text.length;
  const limitedText = useMemo(() => text.slice(0, 120), [text]);

  return (
    <section className="command-panel-float">
      <header>
        <h3>Strategic Orders</h3>
      </header>

      <div className="command-list">
        {strategyOptions.map((item) => {
          const isSelected = props.selectedFocus === item.focus;
          return (
            <button
              key={item.focus}
              className={`command-item ${isSelected ? "selected" : ""}`}
              onClick={() => props.setFocus(item.focus)}
              disabled={props.disabled}
            >
              <span className="command-accent" style={{ background: item.accent }} aria-hidden />
              <span className="command-icon" aria-hidden>
                {item.icon}
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
            </button>
          );
        })}
      </div>

      <label htmlFor="order-note">Intent note</label>
      <textarea
        id="order-note"
        value={text}
        onChange={(event) => setText(event.target.value.slice(0, 120))}
        placeholder="Add operational clarification..."
        disabled={props.disabled}
      />
      <div className="note-footer">
        <small>{count > 120 ? 120 : count}/120</small>
        <small>Queued: {props.queueSize}</small>
      </div>

      <button
        className="issue-button"
        disabled={props.disabled}
        onClick={() => {
          props.enqueueCommand(limitedText);
          setText("");
        }}
      >
        ✈ Issue Command
      </button>

      {props.cityVehiclesDiscovered && !props.cityVehiclesUsed && (
        <div className="city-unlock-box">
          <p>Urban logistics branch unlocked.</p>
          <button onClick={props.mobilizeCityVehicles} disabled={props.disabled}>
            Requisition City Vehicles
          </button>
        </div>
      )}
    </section>
  );
}
