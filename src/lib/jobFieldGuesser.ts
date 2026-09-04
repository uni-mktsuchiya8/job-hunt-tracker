// Best-effort keyword extraction for job-posting text (no AI — a plain
// labeled-section scan). Works on Japanese job postings that use common
// section labels (年収, 勤務地, 必須スキル, ...). Always meant to be a
// starting point the user reviews/edits, not a final answer.

export interface JobFieldGuess {
  companyName: string | null;
  salary: string | null;
  workLocation: string | null;
  remoteType: string | null;
  jobRequirements: string | null;
}

const STOP_LABELS = [
  "会社名",
  "企業名",
  "運営会社",
  "雇用主",
  "年収",
  "給与",
  "月給",
  "勤務地",
  "勤務場所",
  "就業場所",
  "勤務時間",
  "休日",
  "休暇",
  "福利厚生",
  "必須スキル",
  "必須要件",
  "歓迎スキル",
  "歓迎要件",
  "応募資格",
  "応募条件",
  "求める人物像",
  "業務内容",
  "仕事内容",
  "雇用形態",
  "選考プロセス",
  "選考フロー",
];

function grabAfterLabel(
  text: string,
  labels: string[],
  maxLen: number,
): string | null {
  for (const label of labels) {
    const idx = text.indexOf(label);
    if (idx === -1) continue;

    let start = idx + label.length;
    while (start < text.length && /[:：\s]/.test(text[start])) start++;

    // Stop at the next section label, a blank line, or maxLen — whichever
    // comes first.
    let end = start + maxLen;
    const blankLine = text.indexOf("\n\n", start);
    if (blankLine !== -1 && blankLine < end) end = blankLine;
    for (const stop of STOP_LABELS) {
      if (stop === label) continue;
      const stopIdx = text.indexOf(stop, start);
      if (stopIdx !== -1 && stopIdx < end) end = stopIdx;
    }

    const snippet = text.slice(start, Math.max(start, end)).trim();
    if (snippet) return snippet;
  }
  return null;
}

// Salary labels are often followed by explanatory asides — "500万円〜800万円
// (経験・スキルに応じて決定)" — that aren't part of the number itself. Pull
// out just the amount/range and drop the rest.
function cleanSalary(raw: string): string {
  const match = raw.match(
    /[0-9,]+\s*万?円?\s*(?:[〜~\-–ー]\s*[0-9,]+\s*万?円?)?\s*(?:以上|程度)?/,
  );
  const cleaned = match?.[0]?.replace(/\s+/g, "");
  return cleaned && cleaned.length > 0 ? cleaned : raw;
}

export function guessJobFieldsFromText(rawText: string): JobFieldGuess {
  const text = rawText.replace(/\r/g, "").replace(/[ \t]+/g, " ");

  const companyName = grabAfterLabel(
    text,
    ["会社名", "企業名", "運営会社", "雇用主"],
    60,
  );

  const rawSalary = grabAfterLabel(text, ["想定年収", "年収", "給与", "月給"], 60);
  const salary = rawSalary ? cleanSalary(rawSalary) : null;

  const workLocation = grabAfterLabel(
    text,
    ["勤務地", "勤務場所", "就業場所"],
    80,
  );

  let remoteType: string | null = null;
  if (/フルリモート|完全リモート|週5日リモート/.test(text)) {
    remoteType = "5";
  } else if (/週4日.{0,3}リモート|リモート.{0,3}週4日/.test(text)) {
    remoteType = "4";
  } else if (/週3日.{0,3}リモート|リモート.{0,3}週3日|ハイブリッド/.test(text)) {
    remoteType = "3";
  } else if (/週2日.{0,3}リモート|リモート.{0,3}週2日/.test(text)) {
    remoteType = "2";
  } else if (/週1日.{0,3}リモート|リモート.{0,3}週1日|一部リモート|リモート可|テレワーク/.test(text)) {
    remoteType = "1";
  }

  const jobRequirements = grabAfterLabel(
    text,
    [
      "必須スキル",
      "必須要件",
      "応募資格",
      "応募条件",
      "求める人物像",
      "業務内容",
      "仕事内容",
    ],
    500,
  );

  return { companyName, salary, workLocation, remoteType, jobRequirements };
}
