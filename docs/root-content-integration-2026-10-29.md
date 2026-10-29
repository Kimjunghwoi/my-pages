# 메인 콘텐츠 통합 설계

## 화면과 동작

- `/`: 한국어 CSV·Excel 문제 해결 입구. 실제 도구, 한국어 예제, 영어 가이드와 Excel 학습 순서로 연결한다.
- `/workspace`, `/workspace/*`: 기존 Column Harbor의 10개 브라우저 도구와 학습 자료. 파일을 서버로 전송하지 않는다.
- `/guides`, `/guides/*`: 기존 공개 영문 가이드. 본문·샘플·검증 한계·발행일을 보존한다.
- `/learn/excel`, `/learn/excel/*`: 기존 Excel 학습 과정. 기존 브라우저 저장 기능을 유지한다.
- `/csv-checker`: 기존 CSV 홈의 실제 검사기와 도구 설명.
- `/method`: Column Harbor의 제작·검증 방법. `/about/`: 기존 메인 프로필·프로젝트·SNS·자료 목록.
- 기존 `/data-guides/`, `/stories/`, `/templates/`, `/tools/`, `/projects/` 주소와 콘텐츠는 유지한다.

## 데이터와 소유권

CSV 소스 저장소는 계속 Column Harbor 프로젝트가 소유한다. 메인 저장소에는 검증한 정적 공개 산출물만 `integrations/column-harbor/public/`에 스냅샷으로 보관한다. 원본 소스, 운영 문서, 계정 자료, `.openai`, `.git`, 소스맵은 수집하지 않는다. 가져오기 도구가 검증 stamp·소스 커밋·파일 해시·공개 경로를 확인한다. 앞으로 CSV 소스를 바꾼 뒤 검증·가져오기·메인 배포를 실행해야 하며 두 프로젝트가 자동 동기화된다고 설명하지 않는다.

원본은 건드리지 않고 ignored `_workspace/`의 별도 작업본에서 메인 origin으로 다시 빌드한다. React Flight 직렬화에는 문자열의 바이트 길이가 포함되므로 빌드 후 URL 치환을 하지 않는다. 통합 산출물의 HTML·TXT·JS는 검증한 빌드와 바이트가 같아야 하며 `.gitattributes`로 Git의 줄바꿈 변환도 막는다. 광고 컴포넌트와 SDK는 해당 빌드 전에 제외한다. 소유 확인 메타 태그와 루트 ads.txt만 유지한다.

`index.html`은 기존 프로필 원본으로 유지하고 빌드에서 `/about/`으로 배치한다. 실제 메인 원본은 `hosting/content-home.html`이다. 기존 프로필 회귀 검사는 유지하고 실제 통합 산출물 검사를 별도로 수행한다. 로컬 확인도 저장소 루트가 아니라 `.pages-dist`를 제공한다.

## URL 계약과 API

서버 API·회원·데이터베이스는 추가하지 않는다. 입력은 브라우저 메모리의 사용자 파일, 결과는 로컬 미리보기·다운로드다. CSV의 호스트만 메인으로 바꾸고 `/workspace`, `/guides`, `/learn`, `/samples`, `/_next` 경로는 유지한다. 이전 홈은 `/csv-checker`, 제작 방법은 `/method`로 매핑한다. 메인과 겹치는 privacy·robots·sitemap·404는 메인 산출물이 소유한다.

301은 새 배포 검증 후에만 적용한다. 알 수 없는 주소는 실제 404로 남긴다. query는 보존한다. 쿠키·localStorage는 origin별이므로 기존 CSV의 저장한 링크·학습 진도·정리 설정이 자동 이전되지는 않는다. 원본 저장소 값을 삭제하거나 몰래 다른 origin으로 전송하지 않는다. 브라우저 저장에 대한 안내를 통합 페이지에 제공한다.

기존 CSV의 `/about`, `/about/`, `/about.html`은 `/method`로 따로 매핑한다. 나머지 페이지는 같은 경로의 메인 주소로 301 이동한다. `__legacy=1`을 명시한 요청은 이전 저장값 확인을 위해 기존 서버에 남긴다. 이미 열린 이전 탭의 지연 로딩이 깨지지 않도록 `/_next/` 정적 자산도 기존 서버에 남긴다. 이는 사용자와 크롤러에 동일하게 적용되는 주소·복구 규칙이며 심사자를 구별하는 설정이 아니다. 기존 CNAME 대상은 유지하고 CSV 레코드의 proxy만 활성화한다. 다른 DNS와 www 규칙은 수정하지 않는다.

## 상태 소유권

- 도구의 파일과 결과: 기존 React 컴포넌트의 탭 메모리. 네트워크·분석·AI로 보내지 않는다.
- 학습 진도·저장 링크·정리 설정: 기존 제한된 localStorage 키와 검증 로직.
- 홈과 프로필 검색/분류: 기존 vanilla JavaScript. 프로필의 상대 경로는 빌드에서 루트 기준으로 해석한다.
- 가이드/도구 목록과 수: 검증한 snapshot manifest에서 파생한다. 발행일을 일괄 변경하지 않는다.

## 외부 연동

| 서비스 | 변경 | 실패 시 동작 |
| --- | --- | --- |
| Cloudflare Pages | 메인 단일 정적 산출물, 기존 Git 연결 | 이전 성공 배포로 복구 |
| Cloudflare DNS/Redirects | 새 주소 검사 후 CSV 호스트 전용 301 | 기존 CSV 배포·DNS 보존, 새 규칙만 중지 |
| Google AdSense | 기존 소유 확인과 ads.txt 보존, 새 광고 요청 비활성 | 광고 유무가 본문·도구를 방해하지 않음 |
| Cloudflare Analytics | 기존 Pages 페이지뷰만, 방문자 파일/결과 이벤트 없음 | 도구와 글은 계속 작동 |
| 외부 프로젝트/SNS | 프로필에서 기존 링크 유지 | 해당 서비스의 별도 정책 적용 |

## 릴리즈 조건과 한계

새 시크릿·회원 권한·결제·AI 호출·외부 메시지는 추가하지 않는다. 메인/CSV 기존 테스트, 전체 통합 링크·canonical·sitemap·다운로드 해시·소스 비공개 경계·실제 404 검사, 데스크톱/모바일 도구·학습·프로필 브라우저 검증을 수행한다. 공개 후 실제 응답을 확인하고 그다음 영구 이동을 적용한다. 기존 배포는 삭제하지 않는다.

이는 콘텐츠와 기능의 주소를 합치는 제품 개선이다. AdSense 승인·검색 순위·수익·일정은 보장하지 않는다. 재검토 요청은 소유자가 별도로 진행하며, 이번 배포에서 요청 제한을 우회하거나 사이트를 삭제·재등록하지 않는다.

## 적용 및 복구 순서

앱 커밋 `69c9139`의 메인 Pages 배포가 성공한 뒤 공개 130개 canonical 페이지를 포함한 979개 HTTP·자산 검사를 통과했다. 이후 CSV 전용 규칙 두 개와 기존 CNAME의 proxy를 활성화했다. 기존 CSV 106개 경로의 HTTP/HTTPS, 쿼리, 소개 주소 예외, 저장값 복구와 이전 클라이언트 자산까지 220개 검사를 통과했다. 실제 없는 경로는 메인으로 이동한 뒤에도 404다. 기존 www, image, interview와 다른 DNS 값은 보존했다.

기능·콘텐츠를 이전 메인 배포로 복구해야 한다면 **먼저 CSV 전용 두 규칙을 중지**해 옛 CSV 배포로 돌아가게 하고, 필요하면 CSV proxy를 DNS only로 복구한다. 그다음 메인 Pages를 이전 성공 배포로 복구한다. 메인만 먼저 되돌리면 CSV의 새 폴더 경로가 사라진 상태로 301을 보내므로 잘못된 순서다. 기존 CSV custom domain/Pages/Sites, www 규칙과 메일 레코드를 삭제하지 않는다. 브라우저 저장값도 지우지 않는다.

메인 통합 검사는 `node scripts/verify-pages.mjs`, 공개 전체 검사는 `node scripts/audit-integrated.mjs https://jhsoftlabs.com`, 이전 주소 검사는 `node scripts/check-csv-migration.mjs`로 재현한다. 실제 계정 보고서와 원본 DNS·화면·내부 시험 로그는 ignored `outputs/root-integration-2026-10-29/`에만 보관한다.
