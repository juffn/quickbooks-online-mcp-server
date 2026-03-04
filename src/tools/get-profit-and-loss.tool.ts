import { getQuickbooksProfitAndLoss } from "../handlers/get-quickbooks-profit-and-loss.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_profit_and_loss";
const toolDescription =
  "Get the Profit and Loss (Income Statement) report from QuickBooks Online for a given date range. Returns a formatted table showing revenue, expenses, and net income.";

const toolSchema = z.object({
  start_date: z.string().describe("Start date in YYYY-MM-DD format"),
  end_date: z.string().describe("End date in YYYY-MM-DD format"),
  accounting_method: z
    .enum(["Cash", "Accrual"])
    .optional()
    .describe("Accounting method. Defaults to Accrual."),
  summarize_column_by: z
    .enum(["Month", "Quarter", "Year", "Total"])
    .optional()
    .describe("How to summarize columns. Defaults to Total."),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksProfitAndLoss(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return { content: [{ type: "text" as const, text: response.result ?? "" }] };
};

export const GetProfitAndLossTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
