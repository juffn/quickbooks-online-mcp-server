import { getQuickbooksBalanceSheet } from "../handlers/get-quickbooks-balance-sheet.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_balance_sheet";
const toolDescription =
  "Get the Balance Sheet report from QuickBooks Online as of a specific date. Returns assets, liabilities, and equity in a formatted table.";

const toolSchema = z.object({
  date: z.string().describe("As-of date in YYYY-MM-DD format"),
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
  const response = await getQuickbooksBalanceSheet(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return { content: [{ type: "text" as const, text: response.result ?? "" }] };
};

export const GetBalanceSheetTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
