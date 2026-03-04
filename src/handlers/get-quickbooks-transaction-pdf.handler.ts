import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import https from "https";

const httpsAgent = new https.Agent({ keepAlive: true });

export type PdfEntityType = "invoice" | "estimate" | "salesreceipt";

export interface GetTransactionPdfInput {
  entity_type: PdfEntityType;
  id: string;
}

export async function getQuickbooksTransactionPdf(
  data: GetTransactionPdfInput
): Promise<ToolResponse<{ base64: string; entity_type: string; id: string }>> {
  try {
    await quickbooksClient.authenticate();
    const qb = quickbooksClient.getQuickbooks() as any;

    const baseUrl: string = qb.endpoint;
    const realmId: string = qb.realmId;
    const token: string = qb.token;

    const url = `${baseUrl}${realmId}/${data.entity_type}/${data.id}/pdf?minorversion=65`;

    return new Promise((resolve) => {
      const req = https.get(
        url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
          agent: httpsAgent,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const body = Buffer.concat(chunks);
            if (res.statusCode && res.statusCode >= 400) {
              // Error responses from QBO are JSON even when Accept is PDF
              resolve({
                result: null,
                isError: true,
                error: `HTTP ${res.statusCode}: ${body.toString("utf8").slice(0, 200)}`,
              });
            } else {
              resolve({
                result: {
                  base64: body.toString("base64"),
                  entity_type: data.entity_type,
                  id: data.id,
                },
                isError: false,
                error: null,
              });
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
