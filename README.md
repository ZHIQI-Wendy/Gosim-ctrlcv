# GOSIM 2026 - CtrlCV 

# 🎮 What If: Marne

An AI-supported interactive historical strategy experience built for the **Gosim Hackathon (HCI × Education Track)**.
<img width="1536" height="1024" alt="928283a0172eba25e2a6eb56a0d89562" src="https://github.com/user-attachments/assets/53f2ca06-9ea8-4735-a5d7-eb86772cf0fa" />

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
* And others

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

# ✨ Key Idea

> History is not just something to memorize.

---

# 🎯 Design Philosophy

The project is not trying to simulate exact military mathematics.

It is trying to simulate:

* battlefield uncertainty
* operational friction
* cascading failures
* limited information
* strategic adaptation
* historical pressure

Victory is not determined by eliminating enemy HP.

Victory emerges when one side can no longer effectively pursue its objectives.


> It is a fragile system of decisions, pressures, mistakes, and consequences.

*What If: Marne* turns that system into something players can actively experience.

---

# ⚙️ Core Innovation

## AI-Supported Situation Propagation Engine

Instead of relying on traditional HP bars, damage formulas, or fixed scripted outcomes, the project uses a **Situation Propagation Engine**.

The battlefield is modeled as a network of evolving battlefield conditions (“situation tags”) rather than pure combat statistics.

```text
Player Action
→ Situation Tags Change
→ AI Agents React
→ Tags Propagate Across Systems
→ Collapse / Recovery / Reversal
```

Examples of battlefield situation tags:

* flank exposure
* railway congestion
* communication delay
* command confusion
* morale instability
* supply pressure
* overextension
* political tension
* misinformation
* local disorder

These tags interact and propagate dynamically across the battlefield.

Example:

```text
Overextended Flank
+ Supply Pressure
→ Vulnerable Position

Vulnerable Position
+ Enemy Pressure
→ Forced Retreat

Forced Retreat
+ Communication Delay
→ Local Collapse
```

This allows the system to naturally produce:

* surprise breakthroughs
* battlefield panic
* failed offensives
* tactical reversals
* last-minute recoveries
* underdog victories

without relying on scripted events or hidden combat modifiers.

The result is a battlefield that behaves more like a living historical system than a traditional strategy game.

---

# 🤖 Multi-Agent Battlefield System

The battlefield is driven by multiple AI-supported agents operating under limited information.

Agents do not have omniscient knowledge of the battlefield.
Each agent reacts only to what it can realistically observe or infer.

Core agents include:

* Command Parser Agent
* Feasibility Judge Agent
* Friction Engine
* Situation Engine
* NPC Commander Agents
* Outcome Judge Agent
* Narrative Reporter
* Memory Manager

Each agent continuously evaluates:

* battlefield conditions
* strategic priorities
* available resources
* timing and delays
* player intent
* incomplete intelligence
* operational risks

This creates emergent battlefield behavior instead of deterministic scripted outcomes.

---

# 🌫 Fog of War & Battlefield Friction

A core design principle is that:

```text
Orders are not instant reality.
```

Every command passes through a battlefield friction layer.

The system simulates:

* communication delay
* weather disruption
* terrain constraints
* transport congestion
* incomplete reconnaissance
* command misunderstanding
* fatigue and morale effects

Example:

```text
Player Order:
Mobilize Paris taxis to reinforce the right flank.

System Result:
Partial Success

Effects:
- Reinforcements arrive earlier
- Traffic congestion delays part of the force
- German reconnaissance notices abnormal movement near Paris
```

This allows battlefield situations to evolve organically rather than through fixed probabilities.

---

# 🧠 Persistent Replay Adaptation

The project also experiments with persistent adaptation across playthroughs.

Instead of hard-countering player strategies, the system remembers discovered historical breakthroughs and gradually changes battlefield conditions in future runs.

Example:

### First Playthrough

```text
Player successfully mobilizes Paris taxis.
→ Recorded as a breakthrough strategy.
```

### Second Playthrough

```text
Variant adds:
- fuel shortages
- traffic congestion
- slower civilian coordination
```

### Third Playthrough

```text
Variant adds:
- earlier enemy reconnaissance
- roadblocks
- increased command suspicion
```

The original strategy still works, but no longer functions as a guaranteed solution.

This creates a long-term adaptation loop:

```text
Player Learns History
↕
System Learns Player Tendencies
```

---

# 🧩 Lightweight Memory Architecture

The memory system is intentionally lightweight for the MVP.

It stores:

### Run Log

Detailed record of battlefield actions, tag changes, and key decisions.

### Scenario Memory

Historical setup, fixed constraints, and scenario conditions.

### Replay Memory

Player-discovered breakthroughs and previously successful strategic patterns.

Replay memory is used to generate future scenario variants while preserving historical plausibility.


---

# Architecture Diagram
<img width="1536" height="1024" alt="39acf6e2c063758a8e05690e54e81b05" src="https://github.com/user-attachments/assets/89e4b6bc-b97f-434c-adc1-0c124ebe65d7" />

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
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/781a7e6c-f2d6-46e3-b04f-340da0ae668a" />

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

---
# Stack

- Next.js (app shell)
- React (UI)
- PixiJS (battle map)
- Zustand (state)
- Local rule engine tick every 3 seconds
- Local mock narrator interface (LLM optional)

---

# File Tree

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

---

# Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.


---

# Demo Flow

Please click the link:https://drive.google.com/drive/folders/1MTh3kj7e2DAII_qbYp-YGcXkiSQWBD_0?usp=drive_link


