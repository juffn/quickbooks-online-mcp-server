import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import https from "https";

const httpsAgent = new https.Agent({ keepAlive: true });

export interface QueryQuickbooksInput {
  query: string;
}

export async function queryQuickbooks(
  data: QueryQuickbooksInput
): Promise<ToolResponse<any>> {
  try {
    await quickbooksClient.authenticate();
    const qb = quickbooksClient.getQuickbooks() as any;

    const baseUrl: string = qb.endpoint; // e.g. https://sandbox-quickbooks.api.intuit.com/v3/company/
    const realmId: string = qb.realmId;
    const token: string = qb.token;

    const url = `${baseUrl}${realmId}/query?query=${encodeURIComponent(data.query)}&minorversion=65`;

    return new Promise((resolve) => {
      const req = https.get(
        url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          agent: httpsAgent,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              if (res.statusCode && res.statusCode >= 400) {
                const msg =
                  parsed?.Fault?.Error?.[0]?.Message ||
                  parsed?.Fault?.type ||
                  `HTTP ${res.statusCode}`;
                resolve({ result: null, isError: true, error: msg });
              } else {
                resolve({
                  result: parsed.QueryResponse ?? parsed,
                  isError: false,
                  error: null,
                });
              }
            } catch {
              resolve({ result: null, isError: true, error: `Failed to parse response: ${body}` });
            }
          });
        }
      );
      req.on("error", (err) => {
        resolve({ result: null, isError: true, error: formatError(err) });
      });
    });
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
