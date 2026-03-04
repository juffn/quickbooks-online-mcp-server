import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { formatReport } from "../helpers/format-report.js";

export interface GetTrialBalanceInput {
  start_date: string;
  end_date: string;
  accounting_method?: "Cash" | "Accrual";
}

export async function getQuickbooksTrialBalance(
  data: GetTrialBalanceInput
): Promise<ToolResponse<string>> {
  try {
    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();

    const options: Record<string, string> = {
      start_date: data.start_date,
      end_date: data.end_date,
    };
    if (data.accounting_method) options.accounting_method = data.accounting_method;

    return new Promise((resolve) => {
      (quickbooks as any).reportTrialBalance(options, (err: any, report: any) => {
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
