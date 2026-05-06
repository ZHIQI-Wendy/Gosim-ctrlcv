import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mode: "mock",
    updatedAt: "2026-05-06",
    scenarios: [
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
    ]
  });
}
