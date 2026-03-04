/**
 * Converts QBO report JSON (nested Rows > Row > ColData structure)
 * into a clean, readable text table for Claude to reason over.
 */

interface ColData {
  value: string;
  id?: string;
}

interface Row {
  type?: string;
  ColData?: ColData[];
  Header?: { ColData: ColData[] };
  Rows?: { Row: Row[] };
  Summary?: { ColData: ColData[] };
}

interface ReportData {
  Header?: {
    ReportName?: string;
    DateMacro?: string;
    StartPeriod?: string;
    EndPeriod?: string;
    SummarizeColumnsBy?: string;
    Currency?: string;
    Option?: Array<{ Name: string; Value: string }>;
  };
  Columns?: {
    Column: Array<{ ColTitle: string; ColType: string }>;
  };
  Rows?: {
    Row: Row[];
  };
}

function extractColValues(colData: ColData[] | undefined): string[] {
  if (!colData) return [];
  return colData.map((c) => c.value ?? "");
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}

function formatRow(values: string[], widths: number[]): string {
  return values.map((v, i) => padRight(v, widths[i] ?? 20)).join("  ");
}

function collectRows(
  rows: Row[],
  widths: number[],
  depth: number = 0
): string[] {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);

  for (const row of rows) {
    if (row.type === "Section") {
      if (row.Header?.ColData) {
        const vals = extractColValues(row.Header.ColData);
        if (vals[0]) {
          lines.push(indent + formatRow(vals, widths));
        }
      }
      if (row.Rows?.Row) {
        lines.push(...collectRows(row.Rows.Row, widths, depth + 1));
      }
      if (row.Summary?.ColData) {
        const vals = extractColValues(row.Summary.ColData);
        if (vals.some((v) => v)) {
          lines.push(indent + formatRow(vals, widths));
          lines.push("");
        }
      }
    } else if (row.type === "Data" && row.ColData) {
      const vals = extractColValues(row.ColData);
      if (vals.some((v) => v)) {
        lines.push(indent + formatRow(vals, widths));
      }
    }
  }

  return lines;
}

export function formatReport(report: ReportData): string {
  const header = report.Header;
  const columns = report.Columns?.Column ?? [];
  const rows = report.Rows?.Row ?? [];

  const parts: string[] = [];

  // Report header
  if (header?.ReportName) {
    parts.push(`=== ${header.ReportName} ===`);
  }
  if (header?.StartPeriod && header?.EndPeriod) {
    parts.push(`Period: ${header.StartPeriod} to ${header.EndPeriod}`);
  } else if (header?.DateMacro) {
    parts.push(`Period: ${header.DateMacro}`);
  }
  if (header?.Currency) {
    parts.push(`Currency: ${header.Currency}`);
  }
  parts.push("");

  // Column headers
  const colTitles = columns.map((c) => c.ColTitle ?? "");
  const widths = colTitles.map((t) => Math.max(t.length, 20));

  if (colTitles.some((t) => t)) {
    parts.push(formatRow(colTitles, widths));
    parts.push("-".repeat(widths.reduce((a, b) => a + b + 2, 0)));
  }

  // Data rows
  parts.push(...collectRows(rows, widths));

  return parts.join("\n");
}
