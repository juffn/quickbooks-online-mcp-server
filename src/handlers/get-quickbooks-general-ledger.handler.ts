import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { formatReport } from "../helpers/format-report.js";

export interface GetGeneralLedgerInput {
  start_date: string;
  end_date: string;
  account?: string;
  accounting_method?: "Cash" | "Accrual";
}

export async function getQuickbooksGeneralLedger(
  data: GetGeneralLedgerInput
): Promise<ToolResponse<string>> {
  try {
    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();

    const options: Record<string, string> = {
      start_date: data.start_date,
      end_date: data.end_date,
    };
    if (data.account) options.account = data.account;
    if (data.accounting_method) options.accounting_method = data.accounting_method;

    return new Promise((resolve) => {
      (quickbooks as any).reportGeneralLedger(options, (err: any, report: any) => {
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
