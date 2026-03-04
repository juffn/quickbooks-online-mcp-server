import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { formatReport } from "../helpers/format-report.js";

export interface GetTransactionListInput {
  start_date: string;
  end_date: string;
  transaction_type?: string;
  account?: string;
}

export async function getQuickbooksTransactionList(
  data: GetTransactionListInput
): Promise<ToolResponse<string>> {
  try {
    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();

    const options: Record<string, string> = {
      start_date: data.start_date,
      end_date: data.end_date,
    };
    if (data.transaction_type) options.transaction_type = data.transaction_type;
    if (data.account) options.account = data.account;

    return new Promise((resolve) => {
      (quickbooks as any).reportTransactionList(options, (err: any, report: any) => {
        if (err) {
          resolve({ result: null, isError: true, error: formatError(err) });
        } else {
          resolve({ result: formatReport(report), isError: false, error: null });
        }
      });
    });
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
