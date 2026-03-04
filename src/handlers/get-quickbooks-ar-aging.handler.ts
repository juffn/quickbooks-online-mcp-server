import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import { formatReport } from "../helpers/format-report.js";

export interface GetArAgingInput {
  date?: string;
  aging_period?: number;
  num_periods?: number;
}

export async function getQuickbooksArAging(
  data: GetArAgingInput
): Promise<ToolResponse<string>> {
  try {
    await quickbooksClient.authenticate();
    const quickbooks = quickbooksClient.getQuickbooks();

    const options: Record<string, string> = {};
    if (data.date) options.date = data.date;
    if (data.aging_period) options.aging_period = String(data.aging_period);
    if (data.num_periods) options.num_periods = String(data.num_periods);

    return new Promise((resolve) => {
      (quickbooks as any).reportAgedReceivables(options, (err: any, report: any) => {
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
