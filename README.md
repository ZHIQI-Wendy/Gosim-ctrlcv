# GOSIM 2026 - CtrlCV (Marne AI Commander)

Quasi-real-time AI command demo for the First Battle of the Marne (1914).

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
