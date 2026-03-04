import { getQuickbooksTransactionList } from "../handlers/get-quickbooks-transaction-list.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_transaction_list";
const toolDescription =
  "Get a filtered Transaction List report from QuickBooks Online. Returns transactions for a date range, optionally filtered by transaction type or account.";

const toolSchema = z.object({
  start_date: z.string().describe("Start date in YYYY-MM-DD format"),
  end_date: z.string().describe("End date in YYYY-MM-DD format"),
  transaction_type: z
    .string()
    .optional()
    .describe(
      "Type of transaction to filter by (e.g. Invoice, Bill, JournalEntry, CreditMemo). Leave blank for all."
    ),
  account: z
    .string()
    .optional()
    .describe("Account ID to filter by. Leave blank for all accounts."),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksTransactionList(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return { content: [{ type: "text" as const, text: response.result ?? "" }] };
};

export const GetTransactionListTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
