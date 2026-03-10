import { quickbooksClient } from "../clients/quickbooks-client.js";
import { ToolResponse } from "../types/tool-response.js";
import { formatError } from "../helpers/format-error.js";
import https from "https";
import fs from "fs";
import path from "path";
import os from "os";

const httpsAgent = new https.Agent({ keepAlive: true });

export type PdfEntityType = "invoice" | "estimate" | "salesreceipt";

export interface GetTransactionPdfInput {
  entity_type: PdfEntityType;
  id: string;
}

export async function getQuickbooksTransactionPdf(
  data: GetTransactionPdfInput
): Promise<ToolResponse<{ file_path: string; entity_type: string; id: string }>> {
  try {
    await quickbooksClient.authenticate();
    const qb = quickbooksClient.getQuickbooks() as any;

    const baseUrl: string = qb.endpoint;
    const realmId: string = qb.realmId;
    const token: string = qb.token;

    const url = `${baseUrl}${realmId}/${data.entity_type}/${data.id}/pdf?minorversion=65`;

    const outputDir = process.env.PDF_OUTPUT_DIR || path.join(os.homedir(), "Downloads");
    fs.mkdirSync(outputDir, { recursive: true });
    const fileName = `${data.entity_type}-${data.id}.pdf`;
    const filePath = path.join(outputDir, fileName);

    const savePdf = (buf: Buffer) => {
      fs.writeFileSync(filePath, buf);
      return { file_path: filePath, entity_type: data.entity_type, id: data.id };
    };

    const fetchPdf = (targetUrl: string): Promise<ToolResponse<{ file_path: string; entity_type: string; id: string }>> =>
      new Promise((resolve) => {
        const req = https.get(
          targetUrl,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/pdf",
            },
            agent: httpsAgent,
          },
          (res) => {
            // QBO PDF endpoint redirects to a CDN URL — follow it
            if (res.statusCode === 302 || res.statusCode === 301) {
              const location = res.headers.location;
              res.resume(); // drain and discard redirect body
              if (!location) {
                resolve({ result: null, isError: true, error: "Redirect with no Location header" });
                return;
              }
              // CDN URL is plain HTTPS, no auth header needed
              const cdnReq = https.get(location, { agent: httpsAgent }, (cdnRes) => {
                const chunks: Buffer[] = [];
                cdnRes.on("data", (chunk: Buffer) => chunks.push(chunk));
                cdnRes.on("end", () => {
                  const body = Buffer.concat(chunks);
                  if (cdnRes.statusCode && cdnRes.statusCode >= 400) {
                    resolve({ result: null, isError: true, error: `CDN HTTP ${cdnRes.statusCode}` });
                  } else {
                    resolve({ result: savePdf(body), isError: false, error: null });
                  }
                });
              });
              cdnReq.setTimeout(30000, () => { cdnReq.destroy(); resolve({ result: null, isError: true, error: "PDF download timed out" }); });
              cdnReq.on("error", (err) => resolve({ result: null, isError: true, error: formatError(err) }));
              return;
            }

            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
              const body = Buffer.concat(chunks);
              if (res.statusCode && res.statusCode >= 400) {
                resolve({ result: null, isError: true, error: `HTTP ${res.statusCode}: ${body.toString("utf8").slice(0, 200)}` });
              } else {
                resolve({ result: savePdf(body), isError: false, error: null });
              }
            });
          }
        );
        req.setTimeout(30000, () => { req.destroy(); resolve({ result: null, isError: true, error: "Request timed out after 30s" }); });
        req.on("error", (err) => resolve({ result: null, isError: true, error: formatError(err) }));
      });

    return fetchPdf(url);
  } catch (error) {
    return { result: null, isError: true, error: formatError(error) };
  }
}
