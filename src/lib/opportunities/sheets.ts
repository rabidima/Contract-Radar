import { GoogleAuth } from "google-auth-library";
import type { Opportunity } from "./types";

const HEADER = [
  "Title", "NAICS", "Notice Type", "Solicitation #", "Dept", "Office",
  "Posted", "Due", "Set-Aside", "Status", "Link", "Awardee",
];

const SHEET_TAB = "Sheet1";

// Memoized across warm invocations, same pattern as the Postgres pool in
// src/lib/db.ts — signing a fresh JWT per call would work too, but this
// avoids it under Vercel's Fluid compute reuse.
const globalRef = globalThis as typeof globalThis & { __googleAuth__?: GoogleAuth };

function getAuth(): GoogleAuth {
  if (!globalRef.__googleAuth__) {
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set.");
    globalRef.__googleAuth__ = new GoogleAuth({
      credentials: JSON.parse(json),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return globalRef.__googleAuth__;
}

async function accessToken(): Promise<string> {
  const client = await getAuth().getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Failed to obtain a Google access token.");
  return token.token;
}

function opportunityRow(o: Opportunity): (string | number)[] {
  return [
    o.title, o.naics ?? "", o.noticeType, o.solicitationNumber ?? "", o.dept ?? "", o.office ?? "",
    o.publishDate.slice(0, 10), o.responseDate ? o.responseDate.slice(0, 10) : "",
    o.setAside ?? "", o.status, o.link, o.awardee ?? "",
  ];
}

/** Appends newly-discovered opportunities as rows — this is a running log,
 * not a mirror of the DB, so it only ever grows. Writes the header row
 * first if the sheet looks empty. No-ops if Sheets isn't configured, so
 * this stays optional rather than breaking a sync that doesn't need it. */
export async function appendNewOpportunitiesToSheet(newOpportunities: Opportunity[]): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId || newOpportunities.length === 0) return;

  const token = await accessToken();
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`;

  const headerCheck = await fetch(`${base}/${SHEET_TAB}!A1:A1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!headerCheck.ok) {
    throw new Error(`Google Sheets ${headerCheck.status}: ${await headerCheck.text().catch(() => "")}`);
  }
  const headerData = (await headerCheck.json()) as { values?: string[][] };
  if (!headerData.values || headerData.values.length === 0) {
    await fetch(`${base}/${SHEET_TAB}!A1?valueInputOption=RAW`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ values: [HEADER] }),
    });
  }

  const appendRes = await fetch(
    `${base}/${SHEET_TAB}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ values: newOpportunities.map(opportunityRow) }),
    },
  );
  if (!appendRes.ok) {
    throw new Error(`Google Sheets append ${appendRes.status}: ${await appendRes.text().catch(() => "")}`);
  }
}
