# Frontend v0.5 — Mock 회원 화면

2026-11-08 KST. 로그인·회원가입·마이페이지·회원정보 화면과 주문 내역 진입 버튼을 구현했다.

- `member.js`와 `members.json`, Repository의 회원 메서드를 추가했다. JSP는 공통 page와 Header/Navigation/Footer를 재사용한다.
- `demo@example.test` 체험 계정과 신규 가입 계정을 지원한다. 임의 비밀번호 4자 이상만 형식 확인하며 비밀번호를 저장·대조하지 않는다. 실제 인증이 아님을 폼에 표시했다.
- 가입·회원정보는 해당 브라우저 origin의 `localStorage[daisomall.mock.v1]`, 로그인 회원 ID는 현재 탭의 `sessionStorage[daisomall.mock.session]`에 저장한다. 초기 JSON은 읽기 전용 seed다. 초기화 시 변경과 세션을 제거한다. 실제 개인정보 입력을 요청하지 않는다.
- 중복 이메일, 전화번호·이름 검증, 미로그인 마이페이지 안내, 헤더 로그인/로그아웃 연동을 제공한다. 주문 내역은 다음 v0.6에서 연결한다.
- Java 11 / Tomcat 9, Chrome 1440·1280·390px에서 가입 → 마이페이지 → 정보 수정 → 새로고침 영속성 → 로그아웃 → 재로그인, 중복 가입 오류와 비밀번호 미저장을 검증했다. v0.2~0.4 및 공통 레이아웃 회귀도 통과했다. 콘솔 오류·가로 넘침 없음.
- [결과](frontend-commerce-evidence/v0.5-results.json)와 `v0.5-member-*.png` 참조.

실제 암호화·세션 인증·이메일 인증·권한 보안·서버 저장은 구현하지 않았다. 실물 모바일·다른 브라우저·스크린리더는 미검증이다. v0.6으로 진행한다.
