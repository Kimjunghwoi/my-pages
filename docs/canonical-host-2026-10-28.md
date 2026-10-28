# www 호스트 정규화

## 수정 범위

`www.jhsoftlabs.com`이 wildcard DNS를 통해 예전 링크 서비스로 이동한 뒤 404를 반환하는 문제를 수정했다. 본문이나 폴더 구조를 바꾸는 이전 작업은 아니다. 루트, CSV, 면접, 이미지, 메일과 기존 wildcard 레코드는 유지한다.

Cloudflare zone에서 다음 설정을 적용한다.

- DNS: `www` A 레코드, `192.0.2.1`, Proxied. 이 주소는 실제 호스팅 서버가 아니라 Cloudflare가 안내하는 리디렉션 전용 예약 주소다. 리디렉션은 origin에 요청을 보내기 전에 처리된다.
- Single Redirect 이름: `Canonical www to jhsoftlabs.com`.
- 조건: `(http.host eq "www.jhsoftlabs.com")`.
- Dynamic URL: `concat("https://jhsoftlabs.com", http.request.uri.path)`.
- 상태: `301`, Preserve query string 활성화.

다른 하위 도메인을 포함하는 광범위한 조건이나 모든 경로를 홈으로 보내는 설정을 사용하지 않는다. HTTPS 검증, 방화벽, 인증 보호를 약화하지 않는다. 기존 공개 DNS 16개는 그대로 두고 www 한 개만 추가한다.

## 검증과 회귀 방지

`scripts/canonical-hosts.mjs`는 HTTP/HTTPS www 주소가 HTTPS 루트 호스트로 영구 이동하면서 경로·쿼리를 보존하는 계약을 정의한다. `tests/canonical-hosts.test.mjs`는 임시 리디렉션, 예전 외부 링크 서비스, 경로/쿼리 유실, 루프, 다른 제품 호스트의 오용을 거부한다.

`scripts/check-public.mjs`는 이 계약을 공개 주소에서 검사한다. 알 수 없는 경로도 그대로 이동한 뒤 실제 404가 돼야 한다. 홈으로 보내 200을 반환하는 soft 404로 숨기지 않는다.

```powershell
node scripts/verify-pages.mjs
node scripts/check-public.mjs --report outputs/reviews/indexing-2026-10-28/public.json
```

2026-10-28 실제 HTTP 확인에서 www의 두 프로토콜, 가이드 하위 경로·쿼리, 존재하지 않는 경로가 모두 Cloudflare의 올바른 301 응답을 반환했다. 사이트 공개 산출물은 변경하지 않았다. 계정 보고서·원본 DNS·화면 증빙은 ignored `outputs/reviews/indexing-2026-10-28/`에만 보관한다.

## 색인 판정과 구분

Google의 리디렉션 URL·정상 canonical 대체 URL은 개별 색인이 없어도 정상이다. CSV/TSV/XLSX 같은 실습 파일을 글처럼 모두 색인시키지 않는다. HTML의 정상 응답·canonical·수집 허용과 Google의 최종 색인 선택도 별개다. 재검증 접수는 완료된 색인이 아니며, 기존 정상 URL에 대한 반복 요청은 하지 않는다.

## 복구

이 규칙과 새 www 레코드만 이번 변경이다. 원래 www는 wildcard를 상속했으므로 복구가 정말 필요한 경우 새 레코드와 규칙만 되돌릴 수 있다. 다만 이는 예전 잘못된 404 연결로 복귀하므로 정상 운영 복구 수단으로 권장하지 않는다. DNS 원본과 변경 후 비교는 로컬 기록으로 확인한다. 메인 콘텐츠를 복구해야 하는 상황과 혼동하지 않는다.
