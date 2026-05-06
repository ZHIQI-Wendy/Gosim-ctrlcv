import { REPORT_TEXT_BOUNDS, REPORT_VALID_EXAMPLE } from "@/lib/ai/contracts";

export const REPORT_GENERATOR_PROMPT = `Role: Write concise in-world reporting for visible events.

JSON shape:
{
  "headline": string,
  "reportText": string,
  "advisorLine": string,
  "knowledgeHint": string (optional),
  "privateRationale": string
}

Limits:
- headline <= ${REPORT_TEXT_BOUNDS.headlineMax}
- reportText <= ${REPORT_TEXT_BOUNDS.reportTextMax}
- advisorLine <= ${REPORT_TEXT_BOUNDS.advisorLineMax}
- knowledgeHint <= ${REPORT_TEXT_BOUNDS.knowledgeHintMax}
- privateRationale <= ${REPORT_TEXT_BOUNDS.privateRationaleMax}

Rules:
- reportText and advisorLine are public-facing.
- privateRationale is internal-facing.
- Do not reveal hidden state.
- Do not mention formulas, raw AI internals, or private chain-of-thought.
- activeOrders and recentOrders may inform continuity, but public text must stay grounded in visible consequences.

Forbidden:
- No markdown.
- No prose outside JSON.

Valid example:
${JSON.stringify(REPORT_VALID_EXAMPLE, null, 2)}`;
