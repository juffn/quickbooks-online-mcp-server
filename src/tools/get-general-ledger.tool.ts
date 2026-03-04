import { getQuickbooksGeneralLedger } from "../handlers/get-quickbooks-general-ledger.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_general_ledger";
const toolDescription =
  "Get the General Ledger report from QuickBooks Online for a given date range. Returns transaction-level detail useful for reconciliation. Optionally filter by account.";

const toolSchema = z.object({
  start_date: z.string().describe("Start date in YYYY-MM-DD format"),
  end_date: z.string().describe("End date in YYYY-MM-DD format"),
  account: z
    .string()
    .optional()
    .describe("Account ID to filter by. Leave blank for all accounts."),
  accounting_method: z
    .enum(["Cash", "Accrual"])
    .optional()
    .describe("Accounting method. Defaults to Accrual."),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksGeneralLedger(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return { content: [{ type: "text" as const, text: response.result ?? "" }] };
};

export const GetGeneralLedgerTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
