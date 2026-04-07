const identityHighlights = [
  {
    title: "면접 답변 진단 중심",
    description:
      "Interviewer Lens 소개 문구를 기준으로 보면, 질문 생성보다 '답변이 왜 약하게 들리는지'를 먼저 짚어주는 방향이 핵심입니다.",
  },
  {
    title: "AI 이미지 부업을 프로젝트로 운영",
    description:
      "Deep Constellation은 미용실, 피부과 같은 업종에 맞춰 AI 모델로 원하는 스타일의 이미지를 제작하는 실전형 AI 부업 프로젝트입니다.",
  },
  {
    title: "콘텐츠는 짧고, 아카이브는 깊게",
    description:
      "유튜브, X, 쓰레드, 인스타에서 빠르게 접점이 생기고, 노션과 서비스 페이지에서 더 깊게 읽는 구조입니다.",
  },
];

const channelLinks = [
  {
    title: "회몬의 유튜브 채널 구독하기",
    description: "이직, 연봉, 부업 관련 인사이트를 영상으로 받아볼 수 있습니다.",
    href: "https://youtube.com/@%ED%9A%8C%EB%AA%AC?sub_confirmation=1",
    tag: "YouTube",
    category: "social",
    type: "Channel",
  },
  {
    title: "회몬의 X 구경가기",
    description: "개발, 커리어, 면접 관련 짧고 빠른 인사이트를 확인할 수 있습니다.",
    href: "https://x.com/sashimi_mong",
    tag: "X",
    category: "social",
    type: "Channel",
  },
  {
    title: "회몬의 쓰레드 구경가기",
    description: "AI 툴 소개와 실제 사용 사례를 가볍게 둘러보기 좋습니다.",
    href: "https://www.threads.com/@sashimi_mong",
    tag: "Threads",
    category: "social",
    type: "Channel",
  },
  {
    title: "회몬의 인스타 구경가기",
    description: "면접 관련 릴스를 중심으로 짧은 콘텐츠를 볼 수 있습니다.",
    href: "https://www.instagram.com/sashimi_mong?igsh=MWtvYnZ6NTh2Zzh6YQ==",
    tag: "Instagram",
    category: "social",
    type: "Channel",
  },
  {
    title: "회몬에게 문의하기",
    description: "협업, 문의, 기타 연락이 필요하다면 오픈카카오톡으로 연결됩니다.",
    href: "https://open.kakao.com/o/sPFCjtni",
    tag: "Contact",
    category: "contact",
    type: "Contact",
  },
];

const projects = [
  {
    title: "Interviewer Lens",
    description:
      "개발자 면접 답변을 입력하면 탈락 포인트, 면접관 관점의 위험 신호, 예상 꼬리질문, 개선 초안을 보여주는 면접 답변 진단 프로젝트입니다.",
    href: "https://interview.jhsoftlabs.com",
    tag: "Interview Project",
    category: "project",
    type: "Project",
  },
  {
    title: "Deep Constellation",
    description:
      "미용실, 피부과 등에서 원하는 콘셉트와 스타일을 뽑아낼 수 있도록 AI 모델 기반 이미지를 제작하는 AI 이미지 부업 프로젝트입니다.",
    href: "https://image.jhsoftlabs.com/",
    tag: "AI Image Project",
    category: "project",
    type: "Project",
  },
];

const notionResources = [
  {
    title: "AI 부업, 오늘부터 1일 차 루틴",
    description: "바로 실행할 수 있는 AI 부업 첫날 루틴을 짧고 명확하게 정리한 가이드입니다.",
    href: "https://standing-swing-3b7.notion.site/33929bec7df8800ca351f6688f23f7b3",
    tag: "AI Side Hustle",
    category: "ai-side",
    type: "Notion",
  },
  {
    title: "오늘 바로 시작하는 AI 부업 첫걸음",
    description: "AI 부업을 처음 시작하는 사람에게 필요한 가장 첫 단계들을 담았습니다.",
    href: "https://standing-swing-3b7.notion.site/AI-33629bec7df880a2b8fbf7edf41d3fad",
    tag: "Getting Started",
    category: "ai-side",
    type: "Notion",
  },
  {
    title: "[부록] 멘탈 관리: AI를 부리는 시니어의 마인드셋",
    description: "도구에 끌려가지 않고 AI를 활용하기 위한 시니어 관점의 사고방식을 다룹니다.",
    href: "https://standing-swing-3b7.notion.site/AI-33229bec7df8807ca997feb5dd0ab81d",
    tag: "Mindset",
    category: "ai-side",
    type: "Notion",
  },
  {
    title: "[2026 팀핏(Team-fit) 면접 대비 리스트] - 회몬의 압축본",
    description: "팀핏 면접을 준비할 때 꼭 점검해야 할 질문 포인트를 압축해서 정리했습니다.",
    href: "https://standing-swing-3b7.notion.site/2026-Team-fit-33029bec7df88090900fc00c8b2e7087",
    tag: "Interview",
    category: "interview",
    type: "Notion",
  },
  {
    title: "AI 코딩 테스트 승률 200% 올리는 프롬프트 원칙",
    description: "AI를 활용한 코딩 테스트에서 실수를 줄이고 효율을 높이는 프롬프트 원칙 모음입니다.",
    href: "https://standing-swing-3b7.notion.site/AI-200-33229bec7df880d480b5dadb72a54f83",
    tag: "Prompting",
    category: "interview",
    type: "Notion",
  },
  {
    title: "개발자 커리어 밸런스 자가진단",
    description: "현재 커리어 상태를 점검하고 다음 선택을 정리하는 데 도움이 되는 체크리스트입니다.",
    href: "https://standing-swing-3b7.notion.site/33529bec7df88091abe3c2fa8d49bfbd?pvs=74",
    tag: "Career",
    category: "career",
    type: "Notion",
  },
  {
    title: "[긴급 분석] 클로드 코드 소스 유출과 에이전트의 미래",
    description: "최근 이슈를 바탕으로 에이전트 시대의 변화와 시사점을 빠르게 정리한 분석 글입니다.",
    href: "https://standing-swing-3b7.notion.site/33529bec7df880359fe1c911a788c4e0",
    tag: "AI Analysis",
    category: "ai-side",
    type: "Notion",
  },
];

const categoryLabels = {
  all: "전체",
  interview: "면접",
  career: "커리어",
  "ai-side": "AI 부업",
  social: "채널",
  project: "프로젝트",
  contact: "문의",
};

const appState = {
  filter: "all",
  query: "",
  collectionExpanded: false
};

const metricsKey = "jhsoftlabs-click-metrics";

function createCard(item, className) {
  return `
    <article class="${className}">
      <div class="${className}__meta">
        <span class="${className}__tag">${item.tag}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="${className}__description">${item.description}</p>
      <a class="${className}__link" href="${item.href}" target="_blank" rel="noreferrer">
        바로가기 <span aria-hidden="true">↗</span>
      </a>
    </article>
  `;
}

function renderList(targetId, items, className) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = items.map((item) => createCard(item, className)).join("");
}

function createCollectionCard(item) {
  return `
    <article class="collection-card">
      <div class="collection-card__meta">
        <span class="collection-card__tag">${item.tag}</span>
        <span class="collection-card__type">${item.type}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="collection-card__description">${item.description}</p>
      <a class="collection-card__link" href="${item.href}" target="_blank" rel="noreferrer">
        바로가기 <span aria-hidden="true">↗</span>
      </a>
    </article>
  `;
}

function createProjectCard(item) {
  return `
    <article class="feature-card">
      <div class="feature-card__meta">
        <span class="feature-card__tag">${item.tag}</span>
        <span class="collection-card__type">${item.type}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="feature-card__description">${item.description}</p>
      <a class="feature-card__link" href="${item.href}" target="_blank" rel="noreferrer" data-track="${item.title}">
        프로젝트 보기 <span aria-hidden="true">↗</span>
      </a>
    </article>
  `;
}

function createRecentCard(item) {
  return `
    <article class="recent-card">
      <div class="recent-card__meta">
        <span class="recent-card__tag">${item.tag}</span>
        <span class="recent-card__eyebrow">${item.type}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="recent-card__description">${item.description}</p>
      <a class="recent-card__link" href="${item.href}" target="_blank" rel="noreferrer" data-track="${item.title}">
        바로 읽기 <span aria-hidden="true">↗</span>
      </a>
    </article>
  `;
}

function renderIdentity() {
  const target = document.getElementById("identity-list");
  if (!target) return;

  target.innerHTML = identityHighlights
    .map(
      (item) => `
        <li>
          <strong>${item.title}</strong>
          <span>${item.description}</span>
        </li>
      `
    )
    .join("");
}

function renderArchive() {
  const target = document.getElementById("archive-grid");
  if (!target) return;

  if (notionResources.length === 0) {
    target.innerHTML = `
      <article class="archive-empty">
        <span class="archive-empty__badge">Ready For Notion</span>
        <h3>추천 아카이브가 곧 여기에 채워집니다.</h3>
        <p>
          AI 부업, 면접, 커리어, 실전 활용 아카이브를 이 영역에서 바로
          둘러볼 수 있도록 준비 중입니다.
        </p>
      </article>
    `;
    return;
  }

  target.innerHTML = notionResources
    .map((item) => createCard(item, "archive-card"))
    .join("");
}

const allLinks = [...projects, ...channelLinks, ...notionResources];

function matchesQuery(item, query) {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [item.title, item.description, item.tag, item.type]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(normalized));
}

function renderFilters() {
  const filterBar = document.getElementById("filter-bar");
  if (!filterBar) return;

  const order = ["all", "interview", "career", "ai-side", "social", "project", "contact"];
  filterBar.innerHTML = order
    .map(
      (key, index) => `
        <button
          class="filter-button${index === 0 ? " is-active" : ""}"
          type="button"
          data-filter="${key}"
        >
          ${categoryLabels[key]}
        </button>
      `
    )
    .join("");
}

function renderCollection() {
  const target = document.getElementById("collection-grid");
  const moreButton = document.getElementById("collection-more");
  if (!target) return;

  const filteredItems =
    appState.filter === "all"
      ? allLinks
      : allLinks.filter((item) => item.category === appState.filter);

  const visibleItems = filteredItems.filter((item) => matchesQuery(item, appState.query));

  if (visibleItems.length === 0) {
    target.innerHTML = `
      <article class="archive-empty">
        <span class="archive-empty__badge">No Results</span>
        <h3>조건에 맞는 링크가 없습니다.</h3>
        <p>필터를 바꾸거나 검색어를 지우고 다시 확인해보세요.</p>
      </article>
    `;
    if (moreButton) {
      moreButton.hidden = true;
    }
    return;
  }

  const limit = 6;
  const shouldCollapse = visibleItems.length > limit;
  const renderedItems =
    shouldCollapse && !appState.collectionExpanded
      ? visibleItems.slice(0, limit)
      : visibleItems;

  target.innerHTML = renderedItems.map(createCollectionCard).join("");

  if (moreButton) {
    moreButton.hidden = !shouldCollapse;
    moreButton.textContent =
      shouldCollapse && !appState.collectionExpanded ? "더 보기" : "접기";
  }
}

function syncUrlState() {
  const url = new URL(window.location.href);
  if (appState.filter === "all") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", appState.filter);
  }

  if (appState.query) {
    url.searchParams.set("q", appState.query);
  } else {
    url.searchParams.delete("q");
  }

  window.history.replaceState({}, "", url);
}

function setActiveFilter(filter) {
  const filterBar = document.getElementById("filter-bar");
  if (!filterBar) return;
  appState.filter = filter;
  appState.collectionExpanded = false;
  filterBar
    .querySelectorAll(".filter-button")
    .forEach((node) => node.classList.toggle("is-active", node.dataset.filter === filter));
  renderCollection();
  syncUrlState();
}

function hydrateInitialState() {
  const url = new URL(window.location.href);
  const requestedFilter = url.searchParams.get("tab");
  const requestedQuery = url.searchParams.get("q");

  if (requestedFilter && categoryLabels[requestedFilter]) {
    appState.filter = requestedFilter;
  }

  if (requestedQuery) {
    appState.query = requestedQuery;
  }
}

function bindCollectionFilters() {
  const filterBar = document.getElementById("filter-bar");
  if (!filterBar) return;

  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    setActiveFilter(button.dataset.filter);
  });

  document.querySelectorAll("[data-filter-link]").forEach((link) => {
    link.addEventListener("click", () => {
      setActiveFilter(link.dataset.filterLink);
    });
  });
}

function bindCollectionSearch() {
  const input = document.getElementById("collection-search");
  if (!input) return;
  input.value = appState.query;
  input.addEventListener("input", (event) => {
    appState.query = event.target.value.trim();
    appState.collectionExpanded = false;
    renderCollection();
    syncUrlState();
  });
}

function bindCollectionMore() {
  const button = document.getElementById("collection-more");
  if (!button) return;
  button.addEventListener("click", () => {
    appState.collectionExpanded = !appState.collectionExpanded;
    renderCollection();
  });
}

function renderProfileSummary() {
  const channelCount = document.getElementById("channel-count");
  const archiveCount = document.getElementById("archive-count");

  if (channelCount) {
    channelCount.textContent = String(channelLinks.length);
  }

  if (archiveCount) {
    archiveCount.textContent = String(notionResources.length);
  }
}

function renderRecentUpdates() {
  const target = document.getElementById("recent-grid");
  if (!target) return;

  const recentItems = [
    notionResources[0],
    notionResources[1],
    projects[0]
  ].filter(Boolean);

  target.innerHTML = recentItems.map(createRecentCard).join("");
}

function readMetrics() {
  try {
    return JSON.parse(window.localStorage.getItem(metricsKey) || "{}");
  } catch {
    return {};
  }
}

function writeMetrics(metrics) {
  window.localStorage.setItem(metricsKey, JSON.stringify(metrics));
}

function renderMetricsPanel() {
  const container = document.getElementById("metrics-panel");
  const body = document.getElementById("metrics-body");
  if (!container || !body) return;

  const metrics = Object.entries(readMetrics())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (metrics.length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  body.innerHTML = metrics
    .map(
      ([label, count]) => `
        <div class="metrics-item">
          <strong>${label}</strong>
          <span>${count} clicks</span>
        </div>
      `
    )
    .join("");
}

function bindClickTracking() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-track]");
    if (!link) return;

    const label = link.dataset.track;
    const metrics = readMetrics();
    metrics[label] = (metrics[label] || 0) + 1;
    writeMetrics(metrics);
    renderMetricsPanel();
  });
}

function mountMetricsPanel() {
  const template = document.getElementById("metrics-template");
  if (!template) return;
  document.body.appendChild(template.content.cloneNode(true));
  document.getElementById("metrics-close")?.addEventListener("click", () => {
    const panel = document.getElementById("metrics-panel");
    if (panel) panel.hidden = true;
  });
  renderMetricsPanel();
}

hydrateInitialState();
renderIdentity();
renderProfileSummary();
renderList("channel-grid", channelLinks, "card");
document.getElementById("project-grid").innerHTML = projects.map(createProjectCard).join("");
renderArchive();
renderRecentUpdates();
renderFilters();
bindCollectionFilters();
bindCollectionSearch();
bindCollectionMore();
setActiveFilter(appState.filter);
mountMetricsPanel();
bindClickTracking();

document.getElementById("current-year").textContent = new Date().getFullYear();
