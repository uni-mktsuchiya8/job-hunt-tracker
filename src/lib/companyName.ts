// Japanese corporate-entity affixes that commonly appear either before the
// core company name (前株, e.g. "株式会社ソニー") or after it (後株, e.g.
// "ソニー株式会社"). We strip at most one prefix match and one suffix match
// so that both forms normalize to the same "core" name for matching.
const CORP_AFFIXES = [
  "株式会社",
  "有限会社",
  "合同会社",
  "合資会社",
  "合名会社",
  "（株）",
  "(株)",
  "㈱",
  "（有）",
  "(有)",
  "㈲",
];

export function normalizeCompanyName(raw: string): string {
  let name = raw.replace(/　/g, " ").trim();

  for (const affix of CORP_AFFIXES) {
    if (name.startsWith(affix)) {
      name = name.slice(affix.length).trim();
      break;
    }
  }
  for (const affix of CORP_AFFIXES) {
    if (name.endsWith(affix)) {
      name = name.slice(0, -affix.length).trim();
      break;
    }
  }

  return name;
}
