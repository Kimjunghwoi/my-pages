import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
// Rendering is a local authoring step; committed PNGs need no image runtime on Pages.
const sharp = require("sharp");
const escape = value => String(value).replace(/[<>&"']/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]);
const cards = [
  { key: "csv-one-column", label: "CSV 가져오기", lines: ["CSV가 한 열에 몰릴 때", "구분자부터 확인하세요."], sub: ["세미콜론과 따옴표를 구분하고,", "원본을 지키며 세 열로 가져오는 실습."], rows: [["INPUT", "sku;description;price"], ["AFTER IMPORT", "2개 레코드 · 3개 열"]] },
  { key: "excel-leading-zeros", label: "Excel · 식별자", lines: ["앞자리 0은", "서식보다 가져오기가 먼저."], sub: ["같은 00123 표시라도 실제 값은 다릅니다.", "작은 CSV로 숫자와 Text를 비교하세요."], rows: [["화면 표시", "00123 = 00123"], ["실제 값 · 숫자", "123"], ["실제 값 · Text", "00123"]] },
  { key: "power-query-merge-rows", label: "Power Query · 병합", lines: ["병합했을 뿐인데,", "합계가 왜 늘었을까요?"], sub: ["펼치기 전에 매치 수를 세어봅니다.", "잘못된 병합과 수정 결과를 M 쿼리로 비교."], rows: [["원본", "4행 · 합계 42"], ["잘못 펼친 결과", "6행 · 합계 72"], ["키를 바로잡은 결과", "4행 · 합계 42"]] },
  { key: "excel-filter-spill", label: "Excel · FILTER", lines: ["#SPILL! 오류,", "지우기 전에 살펴보세요."], sub: ["막힌 셀과 출력 공간을 구분합니다.", "합성 5행에서 North 세 행을 확인하는 실습."], rows: [["조건", "region = North"], ["예상 레코드", "R1 · R3 · R4"], ["hours 합계", "6"]] },
  { key: "excel-trim-spaces", label: "Excel · 공백 정리", lines: ["TRIM으로 안 지워지는", "공백도 있습니다."], sub: ["일반 공백과 NBSP를 먼저 구분하세요.", "정리 전후의 값·길이를 실제 Excel로 비교."], rows: [["일반 공백", "32"], ["NBSP", "160"], ["좁은 NBSP", "8239"]] },
  { key: "excel-long-identifiers", label: "Excel · 긴 숫자 ID", lines: ["16글자인데,", "같은 ID가 아니었습니다."], sub: ["LEN이 같아도 EXACT는 FALSE일 수 있습니다.", "표시와 값 손상을 나누고 원본부터 보존하세요."], rows: [["숫자 → TEXT", "1234567890123450"], ["처음부터 Text", "1234567890123456"], ["EXACT", "FALSE"]] },
  { key: "ai-retry-safety", label: "AI API · 재시도", lines: ["AI가 답한 다음에도", "실패는 남아 있습니다."], sub: ["생성 실패와 저장 실패를 나누는 이유.", "재시도와 중복 결과의 경계를 작은 모델로."], rows: [["01", "응답 생성"], ["02", "결과 저장"], ["CHECK", "재시도는 어디부터?"]] },
  { key: "excel-native-checks", label: "개발기록 · 실제 Excel 검증", lines: ["글자 수는 같았는데,", "ID는 달라졌습니다."], sub: ["기대 결과와 실제 앱의 차이를 확인한 기록.", "대체 경로와 아직 풀지 못한 문제를 함께."], rows: [["문자 길이", "같음"], ["원본과 값 비교", "다름"], ["검증 기준", "길이 + 정확한 값"]] },
  { key: "deep-constellation-retrospective", label: "프로젝트 회고 · 활동 중단", lines: ["만들 수 있다는 것과", "팔 수 있다는 것은 달랐다."], sub: ["수익을 만들지 못한 AI 이미지 실험.", "제작보다 먼저 확인했어야 할 고객 행동."], rows: [["개발", "구현과 제작"], ["사업 검증", "매출로 이어지지 않음"], ["결정", "활동 중단 · 기록 보존"]] },
  { key: "templates", label: "무료 템플릿 · Markdown", lines: ["겪어본 문제를,", "다음 작업의 양식으로."], sub: ["콘텐츠 게시 · 가이드 검수 · AI 재시도.", "가입 없이 미리 보고 내려받는 빈 양식."], rows: [["01", "콘텐츠 게시"], ["02", "가이드 검수"], ["03", "실패·재시도 점검"]] },
  { key: "bampang", label: "밤팡! · 작은 가을 장터", lines: ["같은 밤을 모아 톡,", "작은 장터가 자라는 시간."], sub: ["밤팡 장터 · 60초 밤판 · 간식가게.", "브라우저에서 즐기는 작은 웹게임."], game: true },
];

for (const card of cards) {
  const diagram = card.game
    ? `<image href="data:image/svg+xml;base64,${Buffer.from(readFileSync(join(root, "assets/bampang-chestnut.svg"))).toString("base64")}" x="858" y="200" width="245" height="245"/><text x="980" y="480" text-anchor="middle" font-size="20">실제 게임 캐릭터</text>`
    : card.rows.map(([label, value], index) => {
      const top = 205 + index * 94;
      return `<text x="848" y="${top}" font-size="14" fill="#52644b">${escape(label)}</text><text x="848" y="${top + 42}" font-size="${value.length > 17 ? 21 : value.length > 12 ? 24 : 29}" font-weight="700">${escape(value)}</text>`;
    }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f6f7f2"/><path d="M0 0H1200V13H0z" fill="#213f32"/><g font-family="Noto Sans KR, Malgun Gothic, sans-serif" fill="#213f32"><text x="60" y="78" font-size="19" font-weight="700" letter-spacing="2">JH SOFT LABS / 회몬</text><text x="60" y="150" font-size="18" fill="#5d754b">${escape(card.label)}</text>${card.lines.map((line, index) => `<text x="56" y="${250 + index * 76}" font-size="${line.length > 18 ? 45 : 49}" font-weight="700" letter-spacing="-2">${escape(line)}</text>`).join("")}${card.sub.map((line, index) => `<text x="60" y="${414 + index * 38}" font-size="22" fill="#536258">${escape(line)}</text>`).join("")}<rect x="820" y="145" width="320" height="375" rx="4" fill="${card.game ? "#f1e5ca" : "#e6eddc"}"/>${diagram}<path d="M60 548H1140" stroke="#bfccb3"/><text x="60" y="592" font-size="17" fill="#536258">${card.game ? "게임 소개 · 설치 없이 플레이" : "설명용 예제 · 조건과 확인 범위는 본문에서"}</text><text x="1140" y="592" text-anchor="end" font-size="18" font-weight="700">jhsoftlabs.com</text></g></svg>`;
  const path = join(root, `assets/share-${card.key}`);
  writeFileSync(`${path}.svg`, svg + "\n");
  await sharp(Buffer.from(svg)).png().toFile(`${path}.png`);
  console.log(`Rendered share-${card.key}.png (1200x630)`);
}
