import { prepareQuickbooksJournalEntry } from "../handlers/prepare-quickbooks-journal-entry.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "prepare_journal_entry";
const toolDescription = `Prepare a journal entry for review WITHOUT posting it to QuickBooks.

Returns a formatted preview showing all lines, debits, credits, and balance verification.
Also returns a confirmation_id — pass this to confirm_journal_entry to actually post the entry.

Use this instead of create_journal_entry whenever human review is required before posting.`;

const lineSchema = z.object({
  account_id: z.string().describe("QBO Account ID (from search_accounts)"),
  account_name: z.string().describe("Human-readable account name for the preview"),
  debit: z.number().optional().describe("Debit amount. Provide either debit or credit, not both."),
  credit: z.number().optional().describe("Credit amount. Provide either debit or credit, not both."),
  description: z.string().optional().describe("Line-level description or memo"),
});

const toolSchema = z.object({
  txn_date: z.string().describe("Transaction date in YYYY-MM-DD format"),
  memo: z.string().describe("Journal entry memo / description"),
  lines: z.array(lineSchema).min(2).describe("Journal entry lines. Must balance (total debits = total credits)."),
  doc_number: z.string().optional().describe("Reference or document number"),
});

const toolHandler = async ({ params }: any) => {
  const response = await prepareQuickbooksJournalEntry(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return {
    content: [
      { type: "text" as const, text: response.result!.preview },
      {
        type: "text" as const,
        text: `\nConfirmation ID: ${response.result!.confirmation_id}\n\nReview the entry above. If correct, call confirm_journal_entry with this confirmation ID to post it to QuickBooks.`,
      },
    ],
  };
};

export const PrepareJournalEntryTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
