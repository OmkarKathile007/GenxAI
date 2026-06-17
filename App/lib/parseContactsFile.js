import * as XLSX from "xlsx";

// Maps messy spreadsheet headers → our contact fields.
const FIELD_ALIASES = {
  fullName: ["fullname", "full name", "name", "contact name", "customer", "customer name", "lead name", "client"],
  phone: ["phone", "phone number", "mobile", "mobile number", "number", "contact number", "whatsapp", "cell", "tel", "telephone"],
  email: ["email", "e-mail", "email address", "mail"],
  company: ["company", "organization", "organisation", "org", "business", "company name"],
  source: ["source", "lead source", "campaign", "channel", "utm source", "utm_source"],
  segment: ["segment", "category", "type", "tag", "group"],
  notes: ["notes", "note", "remarks", "comment", "comments", "description"],
};

const normalize = (s) => String(s ?? "").trim().toLowerCase().replace(/[_\s]+/g, " ");

// Build header(normalized) → field map for one sheet's header row.
function buildHeaderMap(headerKeys) {
  const map = {};
  for (const key of headerKeys) {
    const norm = normalize(key);
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(norm)) {
        map[key] = field;
        break;
      }
    }
  }
  return map;
}

/**
 * Parse a CSV/XLSX/XLS File into normalized contact rows.
 * Returns { rows, total, detectedColumns } where rows have
 * { fullName, phone, email, company, source, segment, notes }.
 * Rows without at least a name or phone are dropped.
 */
export async function parseContactsFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { rows: [], total: 0, detectedColumns: [] };

  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  if (!raw.length) return { rows: [], total: 0, detectedColumns: [] };

  const headerMap = buildHeaderMap(Object.keys(raw[0]));
  const detectedColumns = Object.values(headerMap);

  const rows = [];
  for (const record of raw) {
    const row = { fullName: "", phone: "", email: "", company: "", source: "", segment: "", notes: "" };
    for (const [key, value] of Object.entries(record)) {
      const field = headerMap[key];
      if (field) row[field] = String(value ?? "").trim();
    }
    if (row.fullName || row.phone) rows.push(row);
  }

  return { rows, total: rows.length, detectedColumns };
}
