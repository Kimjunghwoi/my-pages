# 한국어 데이터 실무 가이드 허브 — 구현 경계

## 동작과 성공 기준

- 주 사용 행동: `jhsoftlabs.com` 방문자가 링크 모음에서 떠나지 않고, 메인 도메인 안에서 CSV·Excel·Power Query 문제 해결 글을 읽는다.
- 입력: 브라우저에서 정적 HTML을 요청하고 글 또는 관련 글 링크를 선택한다.
- 출력: 한국어 가이드 목록, 네 편의 독립 본문, 합성 예제, 확인 항목, 공식 문서와 Column Harbor 원문 링크.
- 성공: 홈에서 허브가 발견되고, 모든 글이 JavaScript 없이 읽히며, canonical·구조화 데이터·사이트맵·내부 링크가 일치하고 Pages 검증이 통과한다.
- 이번 범위 밖: 광고 승인 보장, 새 광고 슬롯, 검색 순위 주장, 사용자 파일 입력, 댓글·회원·이메일 수집, 자동 번역, 새 분석 이벤트.

## 화면 목록

| 화면 | 주 CTA |
|---|---|
| 홈의 데이터 실무 섹션 | 한국어 가이드 허브 또는 대표 글 열기 |
| `/data-guides/` 목록 | 증상별 네 글 중 하나 선택 |
| CSV 한 열 가이드 | 원문을 보존한 채 올바른 구분자로 다시 가져오기 |
| 앞자리 0 가이드 | 식별자 열을 Text로 지정해 재가져오기 |
| Power Query 병합 가이드 | 펼치기 전 매치 수를 점검하고 관계에 맞는 출력 선택 |
| FILTER #SPILL 가이드 | 막힌 범위를 안전하게 진단하고 합성 예제로 확인 |

## 데이터 모델

- `Guide`: slug, title, description, published/modified date, sections, references, related links.
- 식별자는 파일명과 canonical 경로다. 정적 HTML이 유일한 공개 원본이며 운영자만 Git으로 수정한다.
- 영어 Column Harbor 글은 중복 게시 원본이 아니라 더 긴 실습·다운로드 참고 자료로 연결한다.

## API와 상태

- 서버 API 없음. 요청/응답 계약은 정적 `GET` → HTML 200, 없는 경로 → 기존 404다.
- 클라이언트 상태·영구 저장 없음. 페이지의 목차 앵커만 사용한다.
- 인증·권한 없음. 쓰기는 Git 배포 권한을 가진 운영자에게만 있다.

## 외부 연동

| 서비스 | 비밀값 | 환경 차이 | 실패 시 |
|---|---|---|---|
| Cloudflare Pages | 저장소에 없음 | main 자동 배포 | 이전 commit을 revert 후 재검증 |
| Cloudflare Web Analytics | Pages가 배포본에 삽입 | 로컬에는 없음 | 글 읽기에는 영향 없음 |
| Column Harbor·공식 문서 | 없음 | HTTPS 외부 링크 | 본문 자체의 예제와 절차는 남음 |

## 릴리즈 점검

- 환경 변수·DB·SMTP·리디렉션·DNS 변경 없음.
- 모든 새 HTML의 제목, description, canonical, OG, JSON-LD, 날짜, breadcrumb, 허브 복귀 링크를 확인한다.
- 빌드 허용 경로에 `data-guides/*.html`만 추가하고 다른 저장소 파일은 공개하지 않는다.
- 사이트맵, 홈 탐색, 전체 로컬 링크·앵커, 외부 링크 안전 속성을 자동 검사한다.
- 롤백: 이 기능 commit을 revert하고 기존 `main` Pages 절차로 배포한다. 이전 운영 commit은 `f40bc13`이다.
