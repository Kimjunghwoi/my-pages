(() => {
  "use strict";

  const search = document.getElementById("collection-search");
  const filterBar = document.getElementById("filter-bar");
  const buttons = [...filterBar.querySelectorAll("[data-filter]")];
  const categories = new Set(buttons.map((button) => button.dataset.filter));
  const rows = [...document.querySelectorAll(".resource")].map((element) => ({
    element,
    categories: element.dataset.category.split(" "),
    searchText: normalize(`${element.textContent} ${element.dataset.keywords || ""}`),
  }));
  const more = document.getElementById("collection-more");
  const reset = document.getElementById("collection-reset");
  const count = document.getElementById("result-count");
  const empty = document.getElementById("collection-empty");
  const limit = 6;
  const state = { filter: "all", query: "", expanded: false };
  let searchTimer;

  function normalize(value) {
    return value.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
  }

  function render() {
    const terms = normalize(state.query).split(" ").filter(Boolean);
    const matches = rows.filter((row) =>
      (state.filter === "all" || row.categories.includes(state.filter)) &&
      terms.every((term) => row.searchText.includes(term))
    );
    const visible = new Set(state.expanded ? matches : matches.slice(0, limit));
    rows.forEach((row) => { row.element.hidden = !visible.has(row); });
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === state.filter));
    });
    const label = buttons.find((button) => button.dataset.filter === state.filter).textContent;
    count.textContent = `${label} ${matches.length}개${matches.length > visible.size ? ` · ${visible.size}개 표시` : ""}`;
    empty.hidden = matches.length !== 0;
    reset.hidden = state.filter === "all" && !state.query;
    more.hidden = matches.length <= limit;
    more.setAttribute("aria-expanded", String(state.expanded));
    more.textContent = state.expanded ? "간추려 보기 ↑" : `나머지 ${matches.length - limit}개 링크 더 보기 ↓`;
  }

  function writeUrl(mode = "replace") {
    const url = new URL(window.location.href);
    if (state.filter === "all") url.searchParams.delete("tab");
    else url.searchParams.set("tab", state.filter);
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    if (url.href !== window.location.href) {
      window.history[mode === "push" ? "pushState" : "replaceState"](null, "", url);
    }
  }

  function readUrl() {
    const params = new URLSearchParams(window.location.search);
    state.filter = categories.has(params.get("tab")) ? params.get("tab") : "all";
    state.query = (params.get("q") || "").slice(0, 120);
    state.expanded = false;
    search.value = state.query;
    render();
  }

  function clearSearch() {
    clearTimeout(searchTimer);
    state.filter = "all";
    state.query = "";
    state.expanded = false;
    search.value = "";
    writeUrl("push");
    render();
    search.focus({ preventScroll: true });
  }

  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button || state.filter === button.dataset.filter) return;
    clearTimeout(searchTimer);
    state.filter = button.dataset.filter;
    state.expanded = false;
    writeUrl("push");
    render();
  });
  search.addEventListener("input", () => {
    state.query = search.value.trim();
    state.expanded = false;
    render();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => writeUrl(), 200);
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && search.value) {
      event.preventDefault();
      clearTimeout(searchTimer);
      search.value = "";
      state.query = "";
      state.expanded = false;
      writeUrl();
      render();
    }
  });
  reset.addEventListener("click", clearSearch);
  document.getElementById("empty-reset").addEventListener("click", clearSearch);
  more.addEventListener("click", () => {
    state.expanded = !state.expanded;
    render();
    if (state.expanded) {
      const revealed = rows.filter((row) => !row.element.hidden)[limit];
      if (revealed) revealed.element.focus({ preventScroll: true });
    } else {
      more.scrollIntoView({ block: "nearest" });
    }
  });
  window.addEventListener("popstate", () => {
    clearTimeout(searchTimer);
    readUrl();
  });
  document.addEventListener("keydown", (event) => {
    const editing = event.target.closest("input, textarea, select, [contenteditable]");
    if (event.key === "/" && !editing && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
      event.preventDefault();
      search.focus();
    }
  });

  // Keep links shared from earlier versions pointing to the unified library.
  const legacySections = new Set(["#archive", "#recent-updates", "#navigator"]);
  function resolveLegacySection() {
    if (!legacySections.has(window.location.hash)) return;
    const url = new URL(window.location.href);
    url.hash = "collection";
    window.history.replaceState(null, "", url);
    document.getElementById("collection").scrollIntoView();
  }
  window.addEventListener("hashchange", resolveLegacySection);
  document.querySelector(".collection-controls").hidden = false;
  document.getElementById("current-year").textContent = new Date().getFullYear();
  readUrl();
  resolveLegacySection();
})();
