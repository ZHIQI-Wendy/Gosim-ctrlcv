# GOSIM 2026 - CtrlCV 

# 🎮 What If: Marne

An AI-supported interactive historical strategy experience built for the **Gosim Hackathon (HCI × Education Track)**.

---

## 📖 Overview

*What If: Marne* is set during the First Battle of the Marne in 1914, when Paris stood on the edge of collapse.

Players take the role of Joseph Joffre and make high-level strategic decisions while the battlefield evolves in real time through AI-supported agents, logistics systems, morale, and political pressure.

Instead of directly controlling units, players interact through **intent**:

* Defend Paris
* Delay the German advance
* Launch risky counterattacks
* Reorganize logistics
* Attempt unconventional strategies

The system interprets these decisions and transforms them into historically grounded consequences.

---

# 🧠 What Problem Are We Solving?

## Traditional History Education

Most history education is passive:

* memorize facts
* read conclusions
* consume static information

But players rarely understand:

* *why* events unfolded the way they did
* how logistics, morale, geography, and politics interacted
* how fragile historical outcomes actually were

---

## Traditional Strategy Games

Most war games determine victory through:

* troop numbers
* HP systems
* resource optimization

This often turns warfare into mathematical optimization rather than understanding real historical dynamics.

In reality, many battles were decided by:

* morale collapse
* logistics pressure
* command confusion
* timing
* political instability
* misinformation

—not simply by larger armies.

---

# ⚙️ Core Innovation

## AI-Supported Situation Propagation Engine

Instead of using traditional “HP reaches zero” victory conditions, the game runs on a **situation propagation model**.

```text id="gtfhlr"
Player Action
→ Situation Tags Change
→ AI Agents React
→ Tags Propagate Across Systems
→ Collapse / Recovery / Reversal
```

Player decisions change evolving battlefield conditions such as:

* railway congestion
* flank exposure
* morale instability
* command confusion
* supply pressure
* political tension

These conditions dynamically spread across the battlefield and influence future AI decisions.

The result is a battlefield that behaves less like a scripted game and more like a living historical system.

---

# 🤖 Multi-Agent Battlefield

The battlefield is driven by multiple AI-supported agents:

* Friendly command agents
* Enemy command agents
* Logistics systems
* Advisory agents
* Political systems

Each agent continuously evaluates:

* battlefield conditions
* strategic priorities
* player intent
* resource constraints

This creates emergent behavior rather than fixed scripted outcomes.

---

# 🧩 Persistent Historical Adaptation

The system also experiments with persistent adaptation across playthroughs.

Using:

* Agent memory
* Historical data weighting
* Strategy tracking

AI agents can gradually adapt to player tendencies and modify future battlefield pressure points and breakthrough opportunities.

This creates a dynamic loop where:

```text id="tsicg7"
Player Learns History
↕
System Learns Player Behavior
```

---

# 🎓 Learning Through Gameplay

Historical knowledge is embedded directly into gameplay instead of separate tutorials.

During play, players naturally encounter:

* military strategy
* railway logistics
* geography & terrain
* political instability
* morale systems
* weaknesses in the Schlieffen Plan

Knowledge appears through decisions, discoveries, and battlefield events.

---

# 🎮 Gameplay Flow

```text id="vt6lzf"
Player Intent
→ AI Interpretation
→ Situation Changes
→ Agent Reactions
→ Battlefield Evolution
→ Historical Consequences
```

---

# 🛠️ Tech Stack

* Next.js
* React
* TailwindCSS
* TypeScript
* AI-supported multi-agent system
* Situation propagation engine
* Real-time simulation loop

---

# 🧪 HCI × Education Focus

This project explores:

## HCI

* intent-driven interaction
* natural language decision making
* open-ended interaction with constrained outcomes

## Education

* causal historical understanding
* experiential learning
* counterfactual reasoning through simulation

## Stack

- Next.js (app shell)
- React (UI)
- PixiJS (battle map)
- Zustand (state)
- Local rule engine tick every 3 seconds
- Local mock narrator interface (LLM optional)

## File Tree

```text
.
├── app
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── AgentDialog.tsx
│   ├── BattlefieldMap.tsx
│   ├── CommandPanel.tsx
│   ├── EndingPanel.tsx
│   ├── KnowledgeCards.tsx
│   ├── StatsBar.tsx
│   └── TimelinePanel.tsx
├── lib
│   ├── aiTick.ts
│   ├── commandClassifier.ts
│   ├── gameState.ts
│   ├── outcome.ts
│   └── reports.ts
├── design.prompt.md
├── next-env.d.ts
├── next.config.mjs
├── package.json
├── tsconfig.json
└── types.ts
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo Flow (2-3 minutes)

1. Queue different strategic commands from the right panel.
2. Watch `aiTick` execute every 3 seconds and update map pressure.
3. Click Paris when threat rises above 72 to reveal city logistics.
4. Requisition city vehicles for the hidden mobilization mechanic.
5. Trigger an ending by time depletion or threat escalation.

## Architecture Notes

- Player text is always mapped into bounded actions by `commandClassifier`.
- `aiTick` is a pure function consuming state and order queue.
- LLM is not allowed to mutate `GameState`; only text generation is reserved via a mock narrator interface.


---

# ✨ Key Idea

> History is not just something to memorize.

> It is a fragile system of decisions, pressures, mistakes, and consequences.

*What If: Marne* turns that system into something players can actively experience.


