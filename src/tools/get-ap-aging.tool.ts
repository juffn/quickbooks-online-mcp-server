import { getQuickbooksApAging } from "../handlers/get-quickbooks-ap-aging.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_ap_aging";
const toolDescription =
  "Get the Aged Payables (AP Aging) report from QuickBooks Online. Shows outstanding vendor bills grouped by age buckets — useful for payables monitoring.";

const toolSchema = z.object({
  date: z
    .string()
    .optional()
    .describe("As-of date in YYYY-MM-DD format. Defaults to today."),
  aging_period: z
    .number()
    .optional()
    .describe("Number of days per aging bucket. Defaults to 30."),
  num_periods: z
    .number()
    .optional()
    .describe("Number of aging buckets to show. Defaults to 4."),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksApAging(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return { content: [{ type: "text" as const, text: response.result ?? "" }] };
};

export const GetApAgingTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
