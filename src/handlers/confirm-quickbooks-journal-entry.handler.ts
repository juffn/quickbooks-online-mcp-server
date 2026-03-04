import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { journalEntryConfirmations, } from "../helpers/confirmation-store.js";
import type { PrepareJournalEntryInput } from "./prepare-quickbooks-journal-entry.handler.js";

export interface ConfirmJournalEntryInput {
  confirmation_id: string;
}

export async function confirmQuickbooksJournalEntry(
  data: ConfirmJournalEntryInput
): Promise<ToolResponse<any>> {
  try {
    const pending = journalEntryConfirmations.get(data.confirmation_id);
    if (!pending) {
      return {
        result: null,
        isError: true,
        error: `No pending journal entry found for confirmation ID "${data.confirmation_id}". It may have expired (30-minute TTL) or already been posted.`,
      };
    }

    const jeData = pending as PrepareJournalEntryInput;

    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();

    // Build QBO journal entry payload
    const journalEntryPayload: any = {
      TxnDate: jeData.txn_date,
      PrivateNote: jeData.memo,
      DocNumber: jeData.doc_number,
      Line: jeData.lines.map((line) => ({
        DetailType: "JournalEntryLineDetail",
        Amount: line.debit ?? line.credit ?? 0,
        Description: line.description,
        JournalEntryLineDetail: {
          PostingType: line.debit ? "Debit" : "Credit",
          AccountRef: { value: line.account_id },
          ...(line.entity && {
            Entity: {
              EntityRef: { value: line.entity.id },
              Type: line.entity.type,
            },
          }),
        },
      })),
    };

    return new Promise((resolve) => {
      (quickbooks as any).createJournalEntry(
        journalEntryPayload,
        (err: any, created: any) => {
          if (err) {
            resolve({ result: null, isError: true, error: formatError(err) });
          } else {
            // Clear from store after successful post
            journalEntryConfirmations.delete(data.confirmation_id);
            resolve({
              result: {
                id: created?.Id,
                txn_date: created?.TxnDate,
                doc_number: created?.DocNumber,
                memo: created?.PrivateNote,
              },
              isError: false,
              error: null,
            });
          }
        }
      );
    });
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
