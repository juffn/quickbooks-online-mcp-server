import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { formatReport } from "../helpers/format-report.js";

export interface GetBalanceSheetInput {
  date: string;
  accounting_method?: "Cash" | "Accrual";
  summarize_column_by?: "Month" | "Quarter" | "Year" | "Total";
}

export async function getQuickbooksBalanceSheet(
  data: GetBalanceSheetInput
): Promise<ToolResponse<string>> {
  try {
    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();

    const options: Record<string, string> = {
      date: data.date,
    };
    if (data.accounting_method) options.accounting_method = data.accounting_method;
    if (data.summarize_column_by) options.summarize_column_by = data.summarize_column_by;

    return new Promise((resolve) => {
      (quickbooks as any).reportBalanceSheet(options, (err: any, report: any) => {
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
