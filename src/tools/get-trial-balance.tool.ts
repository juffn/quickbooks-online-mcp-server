import { getQuickbooksTrialBalance } from "../handlers/get-quickbooks-trial-balance.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_trial_balance";
const toolDescription =
  "Get the Trial Balance report from QuickBooks Online for a given date range. Returns all account balances with debits and credits — useful for month-end close verification.";

const toolSchema = z.object({
  start_date: z.string().describe("Start date in YYYY-MM-DD format"),
  end_date: z.string().describe("End date in YYYY-MM-DD format"),
  accounting_method: z
    .enum(["Cash", "Accrual"])
    .optional()
    .describe("Accounting method. Defaults to Accrual."),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksTrialBalance(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return { content: [{ type: "text" as const, text: response.result ?? "" }] };
};

export const GetTrialBalanceTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
