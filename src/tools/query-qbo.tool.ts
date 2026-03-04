import { queryQuickbooks } from "../handlers/query-quickbooks.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "query_qbo";
const toolDescription = `Run a SQL-like SELECT query against QuickBooks Online. Use this for ad-hoc lookups when entity-specific tools aren't sufficient.

Examples:
- SELECT * FROM JournalEntry WHERE TxnDate > '2026-02-01'
- SELECT * FROM Invoice WHERE Balance > '0'
- SELECT * FROM Account WHERE AccountType = 'Expense'
- SELECT * FROM Bill WHERE DueDate < '2026-03-01'
- SELECT COUNT(*) FROM Customer WHERE Active = true

Only SELECT queries are supported — QBO queries are read-only by design.`;

const toolSchema = z.object({
  query: z
    .string()
    .describe(
      "A SQL-like SELECT query in QBO query language. Must start with SELECT."
    ),
});

const toolHandler = async ({ params }: any) => {
  if (!params.query.trim().toUpperCase().startsWith("SELECT")) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: Only SELECT queries are allowed. QBO queries are read-only.",
        },
      ],
    };
  }

  const response = await queryQuickbooks(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return {
    content: [
      { type: "text" as const, text: "Query executed successfully." },
      {
        type: "text" as const,
        text: JSON.stringify(response.result, null, 2),
      },
    ],
  };
};

export const QueryQboTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
