# Cloudflare Pages 이전

## 상태

- 대상: 메인 홈페이지 `jhsoftlabs.com`, 저장소 `Kimjunghwoi/my-pages`.
- Pages 프로젝트 `jhsoftlabs` 배포 성공: https://jhsoftlabs.pages.dev/
- 첫 배포: commit `83b12aa14ab05603d8ddbae8383452dba5a19fdc`, deployment `9068634d-e715-4e66-8ccf-eacc25b338fc`.
- Porkbun 네임서버를 `chad.ns.cloudflare.com`, `leah.ns.cloudflare.com`으로 변경하고 재조회했습니다. 1.1.1.1 및 8.8.8.8에서도 새 NS가 반환됩니다.
- 2026-09-13 22시대 KST 이전 완료. Cloudflare zone 활성화 후 apex를 `jhsoftlabs.pages.dev` CNAME (Proxied / Auto TTL)으로 연결했습니다. Pages 대시보드에서 `jhsoftlabs.com Active`, `SSL enabled`를 확인했습니다.
- 운영 주소 https://jhsoftlabs.com/ 는 Cloudflare HTTPS 200으로 응답합니다. HTTP는 HTTPS로 301 이동합니다. 이전 네임서버를 캐시한 방문자는 잠시 보존된 Vercel 배포를 볼 수 있습니다.
- `csv`, `image`, `interview`의 앱 배포는 이 작업에 포함되지 않습니다.

## 중요한 범위 차이

`csv.jhsoftlabs.com` 같은 하위 도메인은 Porkbun DNS에 CNAME만 연결할 수 있지만, 메인 `jhsoftlabs.com`을 Pages에 연결하려면 같은 Cloudflare 계정에 도메인 zone을 추가하고 네임서버를 Cloudflare로 변경해야 합니다. 도메인 등록/갱신은 Porkbun에 남습니다.

네임서버 변경은 모든 하위 도메인과 메일의 DNS에 영향을 줄 수 있습니다. 2026-09-13 사용자가 `my-pages` GitHub 앱 연결과 DNS 관리처 이전을 승인했습니다. 기존 DNS 레코드를 완전히 복제하고 대조해야 하며 자동 스캔만 믿지 않습니다. Porkbun 공식 안내에서 MX/SPF/DKIM/DMARC를 유지하면 외부 DNS에서도 메일 전달을 계속 사용할 수 있음을 확인했습니다.

## 빌드와 공개 범위

```powershell
node scripts/verify-pages.mjs
```

Cloudflare Pages 설정:

- Framework preset: None
- Production branch: main
- Build command: `node scripts/verify-pages.mjs`
- Build output directory: `.pages-dist`
- Root directory: 저장소 루트
- Node.js: 22
- 서버 함수/유료 스토리지/AI API: 사용하지 않음

기존 GitHub 저장소를 이용한 Git integration을 우선합니다. Direct Upload는 별도 방식이며 Git integration으로 나중에 바꾸는 제약이 있습니다. 사용자 계정의 해당 저장소만 연결하고 다른 저장소 접근 권한을 불필요하게 늘리지 않습니다.

배포 출력만 업로드합니다. 저장소 루트나 `.vercelignore`에 의존해 공개 범위를 결정하면 안 됩니다. `docs`, `tests`, `.git`, `.github`, `.vercel`, `scripts`, `outputs`는 배포본에 포함되지 않습니다. 템플릿 Markdown은 의도된 공개 다운로드입니다.

기존 Vercel 원본의 HTML은 변경하지 않습니다. 빌드가 Pages 출력에서만 Vercel Analytics/Speed Insights를 제거합니다. 기존 통계는 Vercel에 남습니다. Pages 프로젝트의 무료 Web Analytics를 활성화하고 후속 자동 배포 `b650f2c` / `ef2489ec-f962-4ae2-b147-49b97a1dcf7d`에서 스니펫 삽입을 확인했습니다. 통계 이관이나 클릭 이벤트 추가를 의미하지 않습니다. 실제 방문 집계는 대시보드에 지연 반영될 수 있습니다. AdSense 소유 확인과 `ads.txt`는 유지합니다.

Pages는 `/stories/example.html`을 `/stories/example`로 리디렉션합니다. 출력의 내부 링크, canonical, OG URL, JSON-LD, sitemap을 이 기본 동작에 맞춥니다. 이미 공유된 `.html` 경로도 실제 응답을 확인해야 합니다. 디렉터리 URL(`/stories/`, `/templates/`, `/tools/release-check/`)과 앵커는 유지합니다. 최상위 `404.html`로 잘못된 주소가 홈페이지 200 응답으로 처리되지 않게 합니다.

## 전환 전 체크

1. 무료 요금제와 Pages 신규 생성 가능 여부, 계정 이메일 인증을 확인합니다.
2. Pages 임시 URL에서 홈페이지/글 9편/기록 목록/템플릿/점검 도구, 이미지, 다운로드, 검색·필터, 앵커, 실제 404와 깨진 링크를 확인합니다.
3. Pages의 `.html` 리디렉션과 확장자 없는 글 URL, query/hash 보존을 확인합니다.
4. 사용자의 DNS 관리처 이전 확인을 받은 뒤 Porkbun 전체 DNS를 내보냅니다. 레코드 이름·타입·값·우선순위·TTL을 기록하고 비공개 복구 자료에 보관합니다.
5. DNSSEC/DS 존재 여부와 메일 전달 서비스 의존성을 확인합니다. DNSSEC 변경이 필요하면 별도 영향 설명과 확인 후 안전한 절차로 진행합니다.
6. Cloudflare Free zone에 모든 기존 레코드를 복제합니다. 초기에는 기존 외부 호스팅 CNAME을 DNS only로 유지하고 대상·메일 레코드 값을 바꾸지 않습니다.
7. 기존 apex A 레코드를 유지한 상태로 DNS 레코드 대조를 끝낸 후, 실제 발급된 네임서버로 변경합니다. 네임서버 변경과 호스팅 전환을 동시에 수행하지 않습니다.
8. Cloudflare zone 활성화 및 메인·메일·하위 도메인 DNS 정상 여부를 확인한 뒤 Pages Custom domains에서 apex를 연결합니다. 새 Pages 대상은 대시보드가 발급한 값만 씁니다.
9. HTTPS, 리디렉션, 전체 공개 경로, `ads.txt`, sitemap을 확인합니다. 기존 Vercel 프로젝트와 도메인 연결은 복구를 위해 유지합니다.

## DNS 관측 (2026-09-13, 전체 백업 아님)

- NS: `curitiba.ns.porkbun.com`, `fortaleza.ns.porkbun.com`, `maceio.ns.porkbun.com`, `salvador.ns.porkbun.com`
- apex A: `76.76.21.21`, TTL 600
- csv CNAME: `custom-domains.chatgpt.site`, TTL 600
- image CNAME: `1b3a9b4eefd0bfd3.vercel-dns-017.com`, TTL 600
- interview CNAME: `29051257781cf6b6.vercel-dns-017.com`, TTL 600

특히 image는 이전 대화의 Netlify 정보와 다릅니다. 다음 실행 직전에 최신 레코드를 다시 확인합니다. 위 목록은 MX/TXT/CAA/와일드카드 등을 포함한 전체 export를 대신하지 않습니다.

전체 16개 레코드는 `outputs/dns-before-cloudflare-2026-09-13.zone`에 별도로 보관했습니다(웹 배포 및 Git 제외). 루트 SPF가 중복되어 있으므로 새 DNS에는 두 발송처를 포함한 `v=spf1 include:amazonses.com include:_spf.porkbun.com ~all` 한 개만 유지합니다. 발송처를 추가하거나 제거하는 변경은 아닙니다. 공개 DNS DS 조회에서 DS는 반환되지 않았습니다.

작업 도중 별도 CSV 이전으로 Porkbun의 csv 대상이 `column-harbor-jhsoftlabs.pages.dev`로 변경됐습니다. 네임서버 전환 전에 전체 DNS를 다시 읽어 최신 대상만 반영했습니다. 최종 원본은 `outputs/dns-immediately-before-switch-2026-09-13.zone`, Cloudflare 복제본은 `outputs/dns-cloudflare-import-2026-09-13.zone`에 있습니다. 원래 16개 중 중복 SPF 하나를 제외한 15개를 보존했습니다.

## 확인 결과

- 로컬 및 GitHub CI: 53개 테스트 통과. 공개 파일 35개, 로컬 기준 613,454bytes.
- Pages HTTP: 공개 파일, 다운로드, sitemap, ads.txt, 기존 글 9개의 308 리디렉션과 query 유지, 없는 주소와 비공개 경로의 404 등 48개 확인 통과.
- SVG 3개는 Windows CRLF와 Git Linux LF 차이만 있습니다. 원본 바이트를 재조회하여 줄바꿈 정규화 후 동일함을 확인했습니다. 직접 요청한 `/404` 파일은 200이지만 존재하지 않는 임의 주소는 정상 404입니다.
- 브라우저: 프로젝트 카드, 데모 전환, 검색/필터 조합, 점검 도구 페이지 진입 확인.
- 양쪽 할당 네임서버에서 15개 레코드씩 30개 DNS 대조 통과. CNAME은 DNS only로 유지했습니다.
- 네임서버 변경 후 메인, csv, image, interview의 HTTPS 200 확인. 메일은 MX/SPF/DKIM/DMARC를 대조했으며 실제 발송/수신 테스트를 수행한 것은 아닙니다.
- 상세 근거는 `outputs/pages-live-verification-2026-09-13-final.json`, `outputs/dns-authoritative-verification-2026-09-13.json`, `outputs/post-nameserver-http-2026-09-13.json`에 보관했습니다.
- 최종 운영 도메인: 49개 HTTP 점검에서 실패 없음. 모든 HTML은 허용된 Cloudflare 통계 삽입 외 원본과 동일하며, 14개 HTML에서 통계 스크립트 삽입을 확인했습니다. `robots.txt` 자동 관리 기능은 사용하지 않아 기존 파일을 그대로 제공합니다.
- 최종 두 네임서버에서 메인 외 14개 레코드씩 28개 보존 검사 통과. 메인, csv, image, interview 모두 HTTPS 200으로 응답했습니다. 근거는 `outputs/production-pages-verification-2026-09-13.json`, `outputs/final-dns-and-services-2026-09-13.json`입니다.
- 브라우저에서 운영 홈페이지를 열어 렌더링을 확인했고, 임시 주소에서 기존 글의 `.html?migration=check#main`이 확장자 없는 경로로 query/hash를 보존하며 이동함을 확인했습니다.

## 이후 운영

- DNS는 이제 Cloudflare에서 관리합니다. Porkbun에 남아 있는 이전 DNS 목록을 수정해도 현재 권한 DNS에는 적용되지 않습니다. 도메인 갱신은 계속 Porkbun에서 합니다.
- `main` push로 Pages가 자동 배포하며 GitHub CI와 Pages 빌드에서 검증 명령이 실행됩니다. 무료 플랜만 사용했고 Workers, 유료 저장소, 서버 API를 추가하지 않았습니다.
- 메일 전달은 기존 Porkbun MX와 발송 인증 레코드를 유지합니다. 실제 송수신 확인은 별도 운영 점검 사항입니다.
- Vercel 프로젝트와 기존 도메인 연결은 즉시 복구 경로로 남겨 두었습니다. 이전 통계도 그대로 남습니다. DNS 전파가 안정된 뒤 필요에 따라 정리할 수 있으나 이번 작업에서는 삭제하지 않았습니다.

## 복구

호스팅 전환 이후 문제가 생기면 기존 Vercel 배포/도메인 연결을 보존한 상태에서 Cloudflare의 apex를 기록해 둔 Vercel 대상(현재 A `76.76.21.21`)으로 되돌리고 DNS only로 설정합니다. 다른 서비스 레코드는 건드리지 않습니다. 네임서버 변경 자체에 문제가 있으면 저장해 둔 원래 네임서버를 Porkbun에서 복구하되 DNS 캐시로 복구가 즉시 완료되지는 않을 수 있습니다.

전환 전 DNS export, 배포 URL/버전, 인증서 상태, 실제 검증 결과가 갖춰지기 전에는 이전 완료라고 기록하지 않습니다.

## 공식 문서

- 도메인: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Git integration: https://developers.cloudflare.com/pages/get-started/git-integration/
- 정적 라우팅과 404: https://developers.cloudflare.com/pages/configuration/serving-pages/
- 한도: https://developers.cloudflare.com/pages/platform/limits/
- 외부 DNS에서 Porkbun 메일 유지: https://kb.porkbun.com/article/47-how-to-use-porkbun-email-when-your-dns-is-hosted-elsewhere
- Pages 무료 방문 통계: https://developers.cloudflare.com/pages/how-to/web-analytics/
