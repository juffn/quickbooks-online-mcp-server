import { ToolResponse } from "../types/tool-response.js";
import { journalEntryConfirmations } from "../helpers/confirmation-store.js";

export interface JournalEntryLine {
  account_id: string;
  account_name: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface PrepareJournalEntryInput {
  txn_date: string;
  memo: string;
  lines: JournalEntryLine[];
  doc_number?: string;
}

function generateConfirmationId(payload: any): string {
  const data = JSON.stringify(payload) + Date.now();
  // Simple hash using built-in btoa
  return Buffer.from(data).toString("base64").slice(0, 16).replace(/[+/=]/g, "x");
}

function formatPreview(data: PrepareJournalEntryInput): string {
  const lines: string[] = [];
  lines.push("=== Journal Entry Preview ===");
  lines.push(`Date:   ${data.txn_date}`);
  lines.push(`Memo:   ${data.memo}`);
  if (data.doc_number) lines.push(`Ref #:  ${data.doc_number}`);
  lines.push("");
  lines.push(
    `${"Account".padEnd(40)}  ${"Debit".padStart(12)}  ${"Credit".padStart(12)}`
  );
  lines.push("-".repeat(70));

  let totalDebits = 0;
  let totalCredits = 0;

  for (const line of data.lines) {
    const account = (line.account_name || line.account_id).slice(0, 38).padEnd(40);
    const debit = line.debit ? line.debit.toFixed(2).padStart(12) : "".padStart(12);
    const credit = line.credit ? line.credit.toFixed(2).padStart(12) : "".padStart(12);
    const desc = line.description ? `  (${line.description})` : "";
    lines.push(`${account}  ${debit}  ${credit}${desc}`);
    totalDebits += line.debit ?? 0;
    totalCredits += line.credit ?? 0;
  }

  lines.push("-".repeat(70));
  lines.push(
    `${"TOTALS".padEnd(40)}  ${totalDebits.toFixed(2).padStart(12)}  ${totalCredits.toFixed(2).padStart(12)}`
  );

  const balanced = Math.abs(totalDebits - totalCredits) < 0.01;
  lines.push("");
  lines.push(balanced ? "✓ Debits equal credits — entry is balanced." : "✗ WARNING: Entry is NOT balanced.");

  return lines.join("\n");
}

export async function prepareQuickbooksJournalEntry(
  data: PrepareJournalEntryInput
): Promise<ToolResponse<{ preview: string; confirmation_id: string }>> {
  try {
    // Validate balance
    let totalDebits = 0;
    let totalCredits = 0;
    for (const line of data.lines) {
      totalDebits += line.debit ?? 0;
      totalCredits += line.credit ?? 0;
    }

    if (Math.abs(totalDebits - totalCredits) >= 0.01) {
      return {
        result: null,
        isError: true,
        error: `Journal entry is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`,
      };
    }

    const confirmationId = generateConfirmationId(data);
    journalEntryConfirmations.set(confirmationId, data);

    const preview = formatPreview(data);

    return {
      result: { preview, confirmation_id: confirmationId },
      isError: false,
      error: null,
    };
  } catch (error: any) {
    return { result: null, isError: true, error: error.message };
  }
}
