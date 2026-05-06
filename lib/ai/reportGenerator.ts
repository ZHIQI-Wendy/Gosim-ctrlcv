import { requestTaskJson } from "@/lib/ai/aiClient";
import { REPORT_GENERATOR_PROMPT } from "@/lib/ai/prompts/reportGeneratorPrompt";
import { ReportGeneratorInput, ReportGeneratorOutput } from "@/types";

export async function reportGeneratorAI(input: ReportGeneratorInput): Promise<ReportGeneratorOutput> {
  return requestTaskJson<ReportGeneratorOutput>(REPORT_GENERATOR_PROMPT, input);
}
