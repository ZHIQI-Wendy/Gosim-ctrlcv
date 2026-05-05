import { AgentLine } from "@/types";

function pickLine(lines: AgentLine[], speaker: AgentLine["speaker"]): string {
  return lines.find((line) => line.speaker === speaker)?.text ?? "Awaiting new intelligence.";
}

export function AgentPanel({ lines }: { lines: AgentLine[] }) {
  const ally = pickLine(lines, "Friendly HQ");
  const enemy = pickLine(lines, "German HQ");
  const adviser = pickLine(lines, "Adviser");

  return (
    <section className="agent-float">
      <h3>Agent Interaction</h3>
      <div className="agent-cards">
        <article className="agent-card ally">
          <strong>Allied Command</strong>
          <p>{ally}</p>
        </article>
        <article className="agent-card enemy">
          <strong>German Command</strong>
          <p>{enemy}</p>
        </article>
        <article className="agent-card adviser">
          <strong>AI Adviser</strong>
          <p>{adviser}</p>
        </article>
      </div>
      <div className="dot-pager">
        <span className="active" />
        <span />
        <span />
      </div>
    </section>
  );
}
