// Best-effort keyword extraction for job-posting text (no AI — a plain
// labeled-section scan). Works on Japanese job postings that use common
// section labels (年収, 勤務地, 必須スキル, ...). Always meant to be a
// starting point the user reviews/edits, not a final answer.

export interface JobFieldGuess {
  salary: string | null;
  workLocation: string | null;
  remoteType: string | null;
  jobRequirements: string | null;
}

const STOP_LABELS = [
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

export function guessJobFieldsFromText(rawText: string): JobFieldGuess {
  const text = rawText.replace(/\r/g, "").replace(/[ \t]+/g, " ");

  const salary = grabAfterLabel(text, ["想定年収", "年収", "給与", "月給"], 60);
  const workLocation = grabAfterLabel(
    text,
    ["勤務地", "勤務場所", "就業場所"],
    80,
  );

  let remoteType: string | null = null;
  if (/フルリモート|完全リモート|リモートワーク可\(フル\)/.test(text)) {
    remoteType = "フルリモート";
  } else if (/リモート不可|出社必須|原則出社|フル出社/.test(text)) {
    remoteType = "リモート不可";
  } else if (/リモート可|一部リモート|ハイブリッド|テレワーク/.test(text)) {
    remoteType = "一部リモート";
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

  return { salary, workLocation, remoteType, jobRequirements };
}
