(() => {
  "use strict";

  const root = document.getElementById("check-panels");
  if (!root) return;
  const buttons = [...document.querySelectorAll("[data-check-kind]")];
  const panels = [...root.querySelectorAll("[data-check-panel]")].map((element) => ({
    element,
    id: element.dataset.checkPanel,
    title: element.querySelector("h2").textContent.trim(),
    items: [...element.querySelectorAll("[data-check-item]")].map((row) => ({
      row,
      title: row.querySelector("h3").textContent.trim(),
      detail: row.querySelector(".check-copy p").textContent.trim(),
      select: row.querySelector("select"),
    })),
  }));
  const labels = { unknown: "미확인", pass: "통과", recheck: "재확인 필요", na: "해당 없음" };
  const allowedStates = new Set(Object.keys(labels));
  const requested = new URLSearchParams(window.location.search).get("kind");
  let current = panels.find((panel) => panel.id === requested) || panels[0];
  const progress = document.getElementById("check-progress");
  const bar = document.getElementById("check-progress-bar");
  const output = document.getElementById("check-output-text");
  const outputDetails = document.getElementById("check-output");
  const message = document.getElementById("check-output-status");
  const confirm = document.getElementById("check-confirm");
  const reset = document.getElementById("check-reset");
  const stateOf = (item) => allowedStates.has(item.select.value) ? item.select.value : "unknown";

  function record() {
    return [
      `# 작업 점검 기록 · ${current.title}`,
      "",
      `기록 생성 시각 (UTC): ${new Date().toISOString()}`,
      "공개용 점검 도구 v1.0 · 회몬 / JH Soft Labs",
      `https://jhsoftlabs.com/tools/release-check/?kind=${current.id}`,
      "",
      "직접 선택한 상태입니다. 자동 검사·보안 감사·배포 안전의 증명이 아닙니다.",
      "확인 근거와 '해당 없음'의 이유를 아래에 추가하세요. 고객 원문·비밀키는 적지 마세요.",
      "",
      ...current.items.flatMap((item, index) => [
        `## ${index + 1}. ${item.title}`,
        `- 상태: ${labels[stateOf(item)]}`,
        `- 확인 방법: ${item.detail}`,
        "- 실제 결과 / 근거:",
        "- 해당 없음의 이유 (해당 시):",
        "- 다음에 할 일:",
        "",
      ]),
      "전체 빈 양식: https://jhsoftlabs.com/templates/",
      "",
    ].join("\n");
  }

  function render() {
    const counts = { unknown: 0, pass: 0, recheck: 0, na: 0 };
    current.items.forEach((item) => {
      const state = stateOf(item);
      item.select.value = state;
      item.row.dataset.checkState = state;
      counts[state]++;
    });
    panels.forEach((panel) => { panel.element.hidden = panel !== current; });
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.checkKind === current.id)));
    const reviewed = current.items.length - counts.unknown;
    progress.textContent = `${current.title} · ${reviewed}/${current.items.length}개 분류 · 재확인 ${counts.recheck}개 · 미확인 ${counts.unknown}개`;
    bar.max = current.items.length;
    bar.value = reviewed;
    Object.entries(counts).forEach(([key, count]) => { document.getElementById(`count-${key}`).textContent = String(count); });
    reset.disabled = reviewed === 0;
    output.value = record();
    message.textContent = "";
    confirm.hidden = true;
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    const next = panels.find((panel) => panel.id === button.dataset.checkKind);
    if (!next || next === current) return;
    current = next;
    const url = new URL(window.location.href);
    url.searchParams.set("kind", current.id);
    window.history.replaceState(null, "", url);
    render();
  }));
  panels.forEach((panel) => panel.items.forEach((item) => {
    item.select.value = "unknown";
    item.select.addEventListener("change", render);
  }));
  reset.addEventListener("click", () => {
    confirm.hidden = false;
    document.getElementById("check-reset-cancel").focus();
  });
  document.getElementById("check-reset-cancel").addEventListener("click", () => {
    confirm.hidden = true;
    reset.focus();
  });
  document.getElementById("check-reset-confirm").addEventListener("click", () => {
    current.items.forEach((item) => { item.select.value = "unknown"; });
    render();
    message.textContent = `${current.title}의 선택값을 초기화했습니다. 다른 주제의 기록은 유지합니다.`;
    buttons.find((button) => button.dataset.checkKind === current.id).focus();
  });

  function showFallback(text) {
    output.value = text;
    outputDetails.open = true;
    output.focus();
    output.select();
  }
  document.getElementById("check-select-text").addEventListener("click", () => {
    showFallback(record());
    message.textContent = "기록 전체를 선택했습니다. 복사 단축키 또는 기기의 복사 메뉴를 사용하세요.";
  });
  document.getElementById("check-copy").addEventListener("click", async () => {
    const text = record();
    try {
      await navigator.clipboard.writeText(text);
      message.textContent = "현재 점검 기록을 복사했습니다.";
    } catch {
      showFallback(text);
      message.textContent = "자동 복사를 사용할 수 없습니다. 아래 선택된 내용을 직접 복사하세요.";
    }
  });
  document.getElementById("check-download").addEventListener("click", () => {
    const text = record();
    let url, link;
    try {
      url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
      link = document.createElement("a");
      link.href = url;
      link.download = `work-check-${current.id}.md`;
      document.body.append(link);
      link.click();
      message.textContent = "다운로드를 요청했습니다. 파일이 보이지 않으면 ‘내보낼 내용 보기’에서 복사하세요.";
    } catch {
      showFallback(text);
      message.textContent = "다운로드를 시작하지 못했습니다. 아래 내용을 복사해 기록을 보관하세요.";
    } finally {
      link?.remove();
      // Keep the object URL alive until the browser has started consuming the download.
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
  document.querySelectorAll("[data-check-controls], [data-status-control]").forEach((element) => { element.hidden = false; });
  render();
})();
