import { confirmQuickbooksJournalEntry } from "../handlers/confirm-quickbooks-journal-entry.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "confirm_journal_entry";
const toolDescription = `Post a previously prepared journal entry to QuickBooks Online.

Requires a confirmation_id from prepare_journal_entry. The entry expires after 30 minutes — if expired, re-run prepare_journal_entry.

This is the final step that writes to your books. Only call this after reviewing the preview from prepare_journal_entry.`;

const toolSchema = z.object({
  confirmation_id: z
    .string()
    .describe("The confirmation ID returned by prepare_journal_entry"),
});

const toolHandler = async ({ params }: any) => {
  const response = await confirmQuickbooksJournalEntry(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  const je = response.result;
  return {
    content: [
      {
        type: "text" as const,
        text: `Journal entry posted successfully.\n\nID: ${je.id}\nDate: ${je.txn_date}\nMemo: ${je.memo}${je.doc_number ? `\nRef #: ${je.doc_number}` : ""}`,
      },
    ],
  };
};

export const ConfirmJournalEntryTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
