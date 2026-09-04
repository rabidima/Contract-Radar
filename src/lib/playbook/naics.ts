export interface NaicsCode {
  code: string;
  title: string;
  size: string;
  sizeKind: "receipts" | "employees";
  cluster: string;
}

export const NAICS: NaicsCode[] = [
  { code: "236115", title: "New Single-Family Housing Construction", size: "$45.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "236220", title: "Commercial and Institutional Building Construction", size: "$45.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "237110", title: "Water and Sewer Line and Related Structures", size: "$45.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "237310", title: "Highway, Street, and Bridge Construction", size: "$45.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "237990", title: "Other Heavy and Civil Engineering Construction", size: "$45.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "238160", title: "Roofing Contractors", size: "$19.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "238210", title: "Electrical Contractors and Other Wiring Installation", size: "$19.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "238220", title: "Plumbing, Heating, and Air-Conditioning Contractors", size: "$19.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "238990", title: "All Other Specialty Trade Contractors", size: "$19.0M", sizeKind: "receipts", cluster: "Construction" },
  { code: "334111", title: "Electronic Computer Manufacturing", size: "1,250 employees", sizeKind: "employees", cluster: "Manufacturing" },
  { code: "334511", title: "Search, Detection, Navigation, Guidance Instruments", size: "1,350 employees", sizeKind: "employees", cluster: "Manufacturing" },
  { code: "517111", title: "Wired Telecommunications Carriers", size: "1,500 employees", sizeKind: "employees", cluster: "IT & Telecom" },
  { code: "518210", title: "Computing Infrastructure Providers, Data Processing", size: "$40.0M", sizeKind: "receipts", cluster: "IT & Telecom" },
  { code: "541310", title: "Architectural Services", size: "$12.5M", sizeKind: "receipts", cluster: "A/E" },
  { code: "541330", title: "Engineering Services", size: "$25.5M", sizeKind: "receipts", cluster: "A/E" },
  { code: "541370", title: "Surveying and Mapping (except Geophysical)", size: "$19.0M", sizeKind: "receipts", cluster: "A/E" },
  { code: "541380", title: "Testing Laboratories and Services", size: "$19.0M", sizeKind: "receipts", cluster: "A/E" },
  { code: "541511", title: "Custom Computer Programming Services", size: "$34.0M", sizeKind: "receipts", cluster: "IT & Telecom" },
  { code: "541512", title: "Computer Systems Design Services", size: "$34.0M", sizeKind: "receipts", cluster: "IT & Telecom" },
  { code: "541513", title: "Computer Facilities Management Services", size: "$37.0M", sizeKind: "receipts", cluster: "IT & Telecom" },
  { code: "541519", title: "Other Computer Related Services", size: "$34.0M", sizeKind: "receipts", cluster: "IT & Telecom" },
  { code: "541611", title: "Admin. and General Management Consulting", size: "$24.5M", sizeKind: "receipts", cluster: "Professional" },
  { code: "541612", title: "Human Resources Consulting Services", size: "$24.5M", sizeKind: "receipts", cluster: "Professional" },
  { code: "541613", title: "Marketing Consulting Services", size: "$19.0M", sizeKind: "receipts", cluster: "Professional" },
  { code: "541614", title: "Process, Physical Distribution, and Logistics Consulting", size: "$20.0M", sizeKind: "receipts", cluster: "Professional" },
  { code: "541618", title: "Other Management Consulting Services", size: "$19.0M", sizeKind: "receipts", cluster: "Professional" },
  { code: "541620", title: "Environmental Consulting Services", size: "$19.0M", sizeKind: "receipts", cluster: "Professional" },
  { code: "541690", title: "Other Scientific and Technical Consulting", size: "$19.0M", sizeKind: "receipts", cluster: "Professional" },
  { code: "541715", title: "R&D in the Physical, Engineering, and Life Sciences", size: "1,000 employees", sizeKind: "employees", cluster: "R&D" },
  { code: "541810", title: "Advertising Agencies", size: "$19.0M", sizeKind: "receipts", cluster: "Professional" },
  { code: "541990", title: "All Other Professional, Scientific, and Technical", size: "$19.5M", sizeKind: "receipts", cluster: "Professional" },
  { code: "561210", title: "Facilities Support Services", size: "$47.0M", sizeKind: "receipts", cluster: "Facilities" },
  { code: "561320", title: "Temporary Help Services", size: "$34.0M", sizeKind: "receipts", cluster: "Facilities" },
  { code: "561612", title: "Security Guards and Patrol Services", size: "$29.0M", sizeKind: "receipts", cluster: "Facilities" },
  { code: "561720", title: "Janitorial Services", size: "$22.0M", sizeKind: "receipts", cluster: "Facilities" },
  { code: "561730", title: "Landscaping Services", size: "$9.5M", sizeKind: "receipts", cluster: "Facilities" },
  { code: "562910", title: "Remediation Services", size: "$25.0M", sizeKind: "receipts", cluster: "Facilities" },
  { code: "611430", title: "Professional and Management Development Training", size: "$16.5M", sizeKind: "receipts", cluster: "Training" },
  { code: "611512", title: "Flight Training", size: "$34.0M", sizeKind: "receipts", cluster: "Training" },
  { code: "621111", title: "Offices of Physicians (except Mental Health)", size: "$16.0M", sizeKind: "receipts", cluster: "Health" },
  { code: "621498", title: "All Other Outpatient Care Centers", size: "$19.5M", sizeKind: "receipts", cluster: "Health" },
  { code: "621511", title: "Medical Laboratories", size: "$41.5M", sizeKind: "receipts", cluster: "Health" },
];

export const NAICS_BY_CODE = Object.fromEntries(NAICS.map((n) => [n.code, n]));

export function naicsTitle(code: string): string {
  return NAICS_BY_CODE[code]?.title ?? "Unlisted NAICS";
}

export function naicsSize(code: string): string {
  return NAICS_BY_CODE[code]?.size ?? "See SBA table";
}

export const ADJACENT: Record<string, string[]> = {
  "541511": ["541512", "541519", "541513", "518210"],
  "541512": ["541511", "541519", "541513", "518210", "541611"],
  "541513": ["541512", "541519", "561210"],
  "541519": ["541511", "541512", "541513"],
  "541330": ["541310", "541370", "541380", "541690", "237990"],
  "541611": ["541612", "541618", "541690", "541990", "541512"],
  "561210": ["561720", "561612", "238220", "561730", "541513"],
  "236220": ["236115", "238210", "238220", "238160", "237310"],
  "238210": ["238220", "238990", "236220"],
  "541620": ["562910", "541690", "541330"],
  "518210": ["541512", "541513", "541519"],
};

export function adjacentTo(codes: string[]): string[] {
  const set = new Set<string>();
  for (const c of codes) {
    for (const a of ADJACENT[c] ?? []) set.add(a);
  }
  for (const c of codes) set.delete(c);
  return [...set];
}
