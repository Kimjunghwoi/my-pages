# JH Soft Labs

개발자 회몬의 프로젝트와 글, 채널을 모은 정적 홈페이지.

- 운영 주소: https://jhsoftlabs.com/
- 기술: HTML, CSS, vanilla JavaScript. 설치나 빌드 단계가 없습니다.
- 호스팅: 기존 Vercel `mypages` 프로젝트.

## 로컬 확인

```powershell
python -m http.server 8017 --bind 127.0.0.1
node --check script.js
node --test tests/site.test.mjs
```

http://127.0.0.1:8017/ 에서 확인합니다. Vercel Analytics와 Speed Insights의 전용 경로는 일반 로컬 서버에서 404가 발생할 수 있으며 실제 Vercel 배포에서 검증합니다.

## 콘텐츠 수정

대표 프로젝트와 모든 링크는 `index.html`에 있습니다. JavaScript가 꺼져도 콘텐츠를 읽을 수 있습니다.

- 대표 프로젝트: `.project-grid`의 카드와 해당 `.resource` 항목을 함께 수정합니다.
- 글/가이드: `.resource-list`에 링크를 추가합니다. `data-category`에는 공백으로 구분한 주제들을 지정할 수 있습니다.
- 검색 보조어: `data-keywords`에 한영 별칭을 넣습니다. 방문자가 입력한 검색어는 HTML로 삽입하지 않습니다.
- 분류: `data-filter` 버튼과 `data-category`가 일치해야 합니다. `data`는 데이터 실무, `ai-side`는 AI·부업입니다.
- 영문 사이트에는 `EN`, 예시 시각물에는 예시임을 표시합니다. 확인되지 않은 이용 실적이나 가격을 쓰지 않습니다.
- `?tab=data&q=CSV`처럼 검색 상태를 URL로 공유할 수 있습니다. 예전 `#archive` 등의 링크도 컬렉션으로 연결됩니다.

## 배포 전

테스트와 320px/390px/768px/1440px 브라우저 확인 후 기존 프로젝트에 배포합니다.

```powershell
vercel --prod --yes
```

DNS는 별도 변경할 필요가 없습니다. `ads.txt`, AdSense 소유 확인 메타, Vercel Analytics/Speed Insights 스크립트를 유지합니다. 소셜 공유 이미지는 `assets/share-card.svg`의 래스터 버전인 `assets/og-card.png`입니다.

최근 사이트 확인 내용은 `docs/site-audit.md`를 참고하세요.
