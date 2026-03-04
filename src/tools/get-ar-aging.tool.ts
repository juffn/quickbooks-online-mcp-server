import { getQuickbooksArAging } from "../handlers/get-quickbooks-ar-aging.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_ar_aging";
const toolDescription =
  "Get the Aged Receivables (AR Aging) report from QuickBooks Online. Shows outstanding customer invoices grouped by age buckets — useful for collections monitoring.";

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
  const response = await getQuickbooksArAging(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return { content: [{ type: "text" as const, text: response.result ?? "" }] };
};

export const GetArAgingTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
