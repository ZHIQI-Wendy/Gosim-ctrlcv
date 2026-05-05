"use client";

import { strategyOptions } from "@/data/mockGameState";
import { BattleReport, StrategicFocus } from "@/types";
import { useMemo, useState } from "react";

interface CommandPanelProps {
  selectedFocus: StrategicFocus;
  queueSize: number;
  reports: BattleReport[];
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
  const latestDecisions = useMemo(
    () =>
      props.reports
        .filter((report) => report.title.startsWith("Order Executed:"))
        .slice(0, 2),
    [props.reports]
  );
  const sendCommand = () => {
    const payload = limitedText.trim();
    if (!payload || props.disabled) return;
    props.enqueueCommand(payload);
    setText("");
  };

  return (
    <section className="command-panel-float">
      <div className="decision-strip">
        {latestDecisions.length === 0 && <p>Give your order, Général!</p>}
        {latestDecisions.map((report) => (
          <article key={report.id} className="decision-item">
            <strong>{report.title.replace("Order Executed: ", "")}</strong>
            <p>{report.body}</p>
          </article>
        ))}
      </div>

      <div className="command-list">
        {strategyOptions.map((item) => {
          const isSelected = props.selectedFocus === item.focus;
          return (
            <button
              key={item.focus}
              className={`command-item ${isSelected ? "selected" : ""}`}
              onClick={() => {
                props.setFocus(item.focus);
                props.enqueueCommand(item.title);
              }}
              disabled={props.disabled}
            >
              <span className="command-icon" aria-hidden>{item.icon}</span>
              <strong>{item.title}</strong>
            </button>
          );
        })}
      </div>

      <div className="command-input-row">
        <input
          id="order-note"
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 120))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              sendCommand();
            }
          }}
          placeholder="Add operational clarification..."
          disabled={props.disabled}
        />
        <button
          className="issue-button"
          disabled={props.disabled}
          onClick={sendCommand}
          aria-label="Send command"
        >
          ↑
        </button>
      </div>
      <div className="note-footer">
        <small>{count > 120 ? 120 : count}/120</small>
        <small>Queued: {props.queueSize}</small>
      </div>

      {/*{props.cityVehiclesDiscovered && !props.cityVehiclesUsed && (*/}
      {/*  <div className="city-unlock-box">*/}
      {/*    <p>Urban logistics branch unlocked.</p>*/}
      {/*    <button onClick={props.mobilizeCityVehicles} disabled={props.disabled}>*/}
      {/*      Requisition City Vehicles*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*)}*/}
    </section>
  );
}
