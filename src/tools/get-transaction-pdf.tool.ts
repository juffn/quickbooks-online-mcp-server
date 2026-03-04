import { getQuickbooksTransactionPdf } from "../handlers/get-quickbooks-transaction-pdf.handler.js";
import { ToolDefinition } from "../types/tool-definition.js";
import { z } from "zod";

const toolName = "get_transaction_pdf";
const toolDescription = `Download a transaction as a PDF from QuickBooks Online and return it as a base64-encoded string.

Supported entity types:
- invoice
- estimate
- salesreceipt

Returns a base64 PDF string. To use the PDF: decode the base64 and save as a .pdf file, or pass it to a tool that accepts base64 PDF data.`;

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
        text: `PDF retrieved for ${response.result!.entity_type} ID ${response.result!.id}.\n\nBase64:\n${response.result!.base64}`,
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
