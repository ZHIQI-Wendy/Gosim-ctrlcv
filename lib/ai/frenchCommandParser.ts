import { requestTaskJson } from "@/lib/ai/aiClient";
import { FRENCH_COMMAND_PARSER_PROMPT } from "@/lib/ai/prompts/frenchCommandParserPrompt";
import { FrenchCommandParserInput, FrenchCommandParserOutput } from "@/types";

export async function frenchCommandParserAI(
  input: FrenchCommandParserInput
): Promise<FrenchCommandParserOutput> {
  return requestTaskJson<FrenchCommandParserOutput>(FRENCH_COMMAND_PARSER_PROMPT, input);
}
