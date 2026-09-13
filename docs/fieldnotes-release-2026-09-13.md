# 실험 기록·무료 템플릿 릴리즈

공개 승인일: 2026-09-13. 대상: `jhsoftlabs.com`, 기존 Vercel `mypages` 프로젝트.

## 릴리즈 범위

- 실험 기록 3편과 무료 Markdown 템플릿 3종, 전체 미리보기 페이지.
- 대표 프로젝트 아래 기록 목록, 기존 자료 검색의 기록/템플릿 필터.
- 기존 대표 서비스 3개와 외부 링크 19개 유지. 기존 제작기를 포함한 자료는 총 26개.
- 상세 채팅 출처 문서는 로컬에만 보관하며 Git·웹 배포에서 제외한다.

## 사전 점검

- 정적 HTML/CSS/JavaScript. 새 패키지, 환경 변수, 비밀키 없음.
- DB·DNS·하위 서비스·요금제·분석 이벤트 변경 없음.
- 31개 테스트, JavaScript 문법, Git 공백 검사 후 커밋·푸시.
- 기존 화면 검증: 320/768/1366px에서 홈·템플릿·새 글 3개에 가로 넘침 없음. 템플릿은 390px 키보드 펼침도 확인.
- `.vercelignore`의 `docs`, `tests`, `.github`, `README.md` 제외 규칙 유지.

## 배포 및 확인

1. GitHub `main`에 검증된 변경만 반영한다.
2. 기존 Vercel 프로젝트에 production 배포한다.
3. 실험 기록 3개, 템플릿 페이지와 다운로드 3개, 사이트맵의 HTTPS 응답을 확인한다.
4. 운영 Markdown 본문을 로컬 파일과 비교한다. 내부 출처 문서가 404인지 확인한다.
5. 운영 화면에서 기록/템플릿 링크와 펼침을 확인한다. GitHub Actions 결과도 확인한다.

## 복구

- 직전 정상 배포: `https://mypages-2amiaxp6b-kimjunghwois-projects.vercel.app`
- 배포 ID: `dpl_B34EzWbCwqBfcgJKuKrGsuiPg6sG`
- 문제가 생기면 Vercel에서 위 배포로 production rollback 후 도메인을 재확인한다. 데이터 마이그레이션이 없어 별도 DB 복구는 없다.
- 호스팅 복구와 별개로 GitHub에서 잘못된 변경을 되돌리는 수정 커밋을 준비한다. 다른 서비스의 배포는 건드리지 않는다.
