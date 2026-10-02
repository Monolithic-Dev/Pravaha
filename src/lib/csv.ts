// RFC 4180 CSV for spreadsheet exports. Pure, so it is unit-tested.

export type CsvValue = string | number | null;

// Learner-typed text is untrusted: a cell starting with = + - @ (or a tab or carriage return) runs as a formula
// when an organizer opens the file in Excel or Google Sheets, so such strings get a leading ' (OWASP: CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: CsvValue): string {
  if (value === null) return "";
  const text = typeof value === "string" && FORMULA_START.test(value) ? `'${value}` : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: CsvValue[][]): string {
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
