# JH Soft Labs

개발자 회몬의 프로젝트와 글, 채널을 모은 정적 홈페이지.

- 운영 주소: https://jhsoftlabs.com/
- 기술: HTML, CSS, vanilla JavaScript. 설치나 빌드 단계가 없습니다.
- 호스팅: 기존 Vercel `mypages` 프로젝트.

Cloudflare Pages 이전 준비는 `docs/cloudflare-pages-migration.md`를 참고합니다. 아직 운영 호스팅과 DNS를 변경하지 않았습니다. Pages용 검증/배포본은 `node scripts/verify-pages.mjs`로 만들며, `.pages-dist`만 배포합니다. Vercel 원본은 복구용으로 유지합니다.

## 로컬 확인

```powershell
python -m http.server 8017 --bind 127.0.0.1
node --check script.js
node --check experiences.js
node --check tools/release-check/checklist.js
node --test tests/*.test.mjs
```

http://127.0.0.1:8017/ 에서 확인합니다. Vercel Analytics와 Speed Insights의 전용 경로는 일반 로컬 서버에서 404가 발생할 수 있으며 실제 Vercel 배포에서 검증합니다.

## 콘텐츠 수정

대표 프로젝트와 모든 링크는 `index.html`에 있습니다. JavaScript가 꺼져도 콘텐츠를 읽을 수 있습니다.

프로젝트 이름과 용도를 시각 예시보다 먼저 표시합니다. 자료 목록은 외부 링크 19개, 작업 기록 9개, 무료 템플릿 3개와 점검 도구 1개로 총 32개입니다. `project` 필터는 실제 서비스 세 개만, `record`는 작업 기록, `template`은 무료 양식과 점검 도구를 보여줍니다.

- 대표 프로젝트: `.project-grid`의 카드와 해당 `.resource` 항목을 함께 수정합니다.
- 글/가이드: `.resource-list`에 링크를 추가합니다. `data-category`에는 공백으로 구분한 주제들을 지정할 수 있습니다.
- 검색 보조어: `data-keywords`에 한영 별칭을 넣습니다. 방문자가 입력한 검색어는 HTML로 삽입하지 않습니다.
- 분류: `data-filter` 버튼과 `data-category`가 일치해야 합니다. `data`는 데이터 실무, `ai-side`는 AI·부업입니다.
- 영문 사이트에는 `EN`, 예시 시각물에는 예시임을 표시합니다. 확인되지 않은 이용 실적이나 가격을 쓰지 않습니다.
- `?tab=data&q=CSV`처럼 검색 상태를 URL로 공유할 수 있습니다. 예전 `#archive` 등의 링크도 컬렉션으로 연결됩니다.

## 체험과 제작기

- `experiences.js`는 고정된 상품 코드 `00123`의 숫자/텍스트 해석 예시만 전환합니다. 실제 파일을 받거나 네트워크·저장소에 데이터를 전송하지 않습니다. 스크립트가 실행되지 않으면 두 결과를 모두 표시합니다.
- 입문 경로는 네이티브 `details/summary`로 구성해 스크립트 없이도 사용할 수 있습니다. 기존 링크와 목적별 순서를 유지합니다.
- `stories/column-harbor.html`은 확인된 구현을 설명하는 정적 제작기입니다. 레이아웃은 `stories.css`, 공통 테마는 `styles.css`를 사용합니다.
- 제작기를 추가할 때 제목·설명·canonical·공유 메타·JSON-LD·작성일·사이트맵을 함께 갱신합니다. 게시/수정일은 실제 변경 날짜만 기록합니다.
- 상세 제작기에 홈페이지용 `script.js`를 로딩하지 않습니다. Vercel 분석은 기존 페이지뷰 수집만 유지하고 유료 사용자 정의 이벤트는 추가하지 않았습니다.

## 실험 기록과 무료 양식

- 대표 프로젝트 다음의 `#fieldnotes`에서 실험 기록 3편과 무료 템플릿으로 이동합니다. 기존 서비스 카드의 우선순위는 유지합니다.
- `stories/index.html`: 개발기록 전체 9편을 프로젝트별로 모은 목록입니다. JavaScript 없이 각 프로젝트 구역으로 이동하고 모든 글을 읽을 수 있습니다. 홈의 3편은 추천 목록이며 전체 최신순 목록이 아닙니다.
- 새 글을 추가할 때 홈의 자료 목록, 개발기록 목록 및 JSON-LD의 순서·개수, 사이트맵과 회귀 검사를 함께 갱신합니다.
- `stories/ai-answer-fidelity.html`: 원문 밖 경험을 만드는 초안을 방어한 생성·표시·복사 경계.
- `stories/guest-trial-funnel.html`: 게스트 복사 회귀와 체험·전환 계측의 한계.
- `stories/shorts-release-pipeline.html`: 첫 홍보영상의 검수와 제작·후속 게시·미측정 성과 구분.
- `stories/homepage-information-order.html`: 이 홈페이지의 정보 순서·점진 향상·검증 범위 개선.
- 이번 공개 편집의 근거는 `docs/development-records-sources-2026-09-13.md`에만 남기며 Git·웹 배포에서 제외합니다. 검토용 개선 제안은 완료 성과에 포함하지 않습니다.
- `stories/salon-publishing.html`: 이미지 제작 이후 게시·배포·소개 단계의 시행착오.
- `stories/guides-that-work.html`: 가이드 예제 검증과 공개·검색 성과의 구분.
- `stories/ai-retry-safety.html`: AI 요청의 실패·재시도 처리와 운영 적용 검증.
- `stories/excel-native-checks.html`: 실제 Excel에서 발견한 ID 손상·필터 상태의 차이, 대체 경로와 미해결 원인. 특정 엔진의 합성 자료 검사임을 명시합니다.
- `tools/release-check/`: AI 서비스·웹사이트·가이드의 6개 항목을 직접 분류하고 Markdown으로 내보내는 도구입니다. 상태는 탭 메모리에만 있으며 새로고침하면 초기화됩니다. 자유 입력·저장소·서버 전송·자동 검사·사용자 정의 분석 이벤트는 없습니다. 기존 페이지뷰 분석과는 구분합니다.
- 점검 항목의 원본은 도구 HTML입니다. 변경 시 항목 ID·설명·관련 링크와 `tests/checklist.test.mjs`를 함께 확인합니다. 브라우저 API 실패 시 결과 텍스트를 직접 선택할 수 있습니다.
- `templates/index.html`: 네이티브 `details` 미리보기와 실제 Markdown 파일 다운로드. 입력·로그인·저장 기능은 없습니다.
- 양식 수정 시 `templates/*.md`와 해당 HTML의 `<pre>`를 함께 갱신합니다. `tests/content.test.mjs`가 내용 일치를 검사합니다.
- 상세 작성 근거는 로컬 전용 문서 `docs/fieldnotes-sources-2026-09-13.md`에 있으며 Git과 웹 배포에서 제외합니다. 원문 채팅, 고객 정보, 내부 운영 자료를 공개 경로로 옮기지 않습니다.
- 새 글과 양식의 공개 범위는 2026-09-13에 검토·승인됐습니다. 글의 게시일과 템플릿 버전 날짜도 같은 날짜로 유지합니다.

## 배포 전

테스트와 320px/390px/768px/1440px 브라우저 확인 후 기존 프로젝트에 배포합니다.

```powershell
vercel --prod --yes
```

DNS는 별도 변경할 필요가 없습니다. `ads.txt`, AdSense 소유 확인 메타, Vercel Analytics/Speed Insights 스크립트를 유지합니다. 소셜 공유 이미지는 `assets/share-card.svg`의 래스터 버전인 `assets/og-card.png`입니다.

기존 개선 검증은 `docs/enhancement-plan-2026-09-13.md`, 새 콘텐츠 릴리즈 절차는 `docs/fieldnotes-release-2026-09-13.md`를 참고하세요.
