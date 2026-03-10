import { getQuickbooksTransactionPdf } from "../handlers/get-quickbooks-transaction-pdf.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_transaction_pdf";
const toolDescription = `Download a transaction as a PDF from QuickBooks Online and save it to disk.

Supported entity types:
- invoice
- estimate
- salesreceipt

Returns the file path where the PDF was saved. Output directory defaults to ~/Downloads; override with PDF_OUTPUT_DIR env var.`;

const toolSchema = z.object({
  entity_type: z
    .enum(["invoice", "estimate", "salesreceipt"])
    .describe("The type of transaction to download as PDF"),
  id: z.string().describe("The QBO transaction ID"),
});

const toolHandler = async ({ params }: any) => {
  const response = await getQuickbooksTransactionPdf(params);
  if (response.isError) {
    return { content: [{ type: "text" as const, text: `Error: ${response.error}` }] };
  }
  return {
    content: [
      {
        type: "text" as const,
        text: `PDF saved: ${response.result!.file_path}`,
      },
    ],
  };
};

export const GetTransactionPdfTool: ToolDefinition<typeof toolSchema> = {
  name: toolName,
  description: toolDescription,
  schema: toolSchema,
  handler: toolHandler,
};
