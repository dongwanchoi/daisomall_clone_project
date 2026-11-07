# 다이소몰 클론 — Frontend v0.7

JSP 기반 쇼핑몰 프론트엔드 학습 프로젝트입니다. 다이소몰 공개 화면과 조사 자료를 참고해 고객·관리자 화면 흐름을 구현했습니다. 실제 다이소몰이나 운영 쇼핑 서비스가 아니며 결제·배송은 발생하지 않습니다.

## 기술 스택

- Java 11, Apache Tomcat 9
- Servlet 4.0 (`javax.servlet`), JSP 2.3
- HTML5, CSS3, Vanilla JavaScript
- Eclipse Dynamic Web Project
- 웹 루트: `src/main/webapp`
- Maven·Gradle·Spring·DB·커스텀 MVC 사용 없음

`.project`, `.classpath`, 공유 `.settings`, 기존 `WEB-INF/web.xml`을 포함합니다. 로컬 서버 캐시와 `build/classes` 등 빌드 산출물은 제외합니다.

## 구현 범위

| 버전 | 기능 |
| --- | --- |
| v0.1 | 공통 Header·Navigation·Footer, 3단계 카테고리, PC Hover·모바일 Tap·키보드 탐색, 반응형 |
| v0.2 | 메인 모자이크 배너·캐러셀·바로가기·추천 전시·공통 상품 카드 |
| v0.3 | 공통 상품 목록·상세·검색, 정렬·필터·더 보기 |
| v0.4 | 최하위 730개 분류별 대표 Mock 상품, 관찰 표본 구분 |
| v0.5 | 로그인·가입·로그아웃·마이페이지·회원정보 Mock 흐름 |
| v0.6 | 장바구니·수량·삭제·주문서·배송비·모의 결제 성공/실패·주문 내역 |
| v0.7 | 별도 관리자 대시보드·분류·상품·판매 상태·온라인/매장 재고·주문·사용자 관리 |

기존 카테고리는 871개(15 / 128 / 728), 최하위 경로는 730개입니다. 기본 상품은 임의 생성 730개와 문서에서 이름·가격·분류를 확인한 표본 2개로 총 732개입니다. 이미지·재고·평점은 모두 Mock이며 원본 실상품 사진을 사용하지 않습니다.

## Eclipse / Tomcat 실행

1. JDK 11과 Tomcat 9를 설치합니다.
2. Eclipse의 **File → Import → General → Existing Projects into Workspace**에서 이 저장소의 `daisomall` 프로젝트를 가져옵니다. 새 프로젝트를 만들거나 `WebContent`를 생성하지 않습니다.
3. JavaSE-11과 **Apache Tomcat v9.0** 런타임을 연결합니다. Tomcat 설치 경로는 개발자 환경에서 지정합니다.
4. Servers 뷰에서 Tomcat 9에 프로젝트를 추가하고 **Run on Server**로 실행합니다.
5. 기본 context root 기준 `http://localhost:8080/daisomall/`로 접속합니다. 포트는 로컬 Tomcat 설정에 맞춥니다.

초기 JSON과 이미지가 포함되어 있어 npm 설치나 데이터 생성은 필요 없습니다. 데이터 표시와 상호작용에는 JavaScript 및 브라우저 저장소가 필요합니다.

### 주요 화면

| 화면 | 프로젝트 context 기준 경로 |
| --- | --- |
| 메인 | `/` |
| 상품 목록·검색 | `/list.jsp`, `/search.jsp?q=소스병` |
| 상품 상세 예시 | `/product.jsp?id=REF-99962883` |
| 회원 | `/login.jsp`, `/signup.jsp`, `/mypage.jsp`, `/profile.jsp` |
| 쇼핑·주문 | `/cart.jsp`, `/checkout.jsp`, `/orders.jsp` |
| 관리자 | `/admin/` |

체험 회원은 `demo@example.test`, 체험 관리자는 `admin@example.test`입니다. 로그인 화면의 체험 버튼을 사용할 수 있습니다. 임의 비밀번호 4자 이상의 형식만 확인하며 실제 비밀번호를 저장·대조하지 않습니다. 실제 개인정보·비밀번호를 입력하지 마세요.

## Mock 저장과 한계

- 초기 JSON과 교체 가능한 Repository 계층을 분리했습니다. 실제 Servlet/JDBC 연동은 없습니다.
- 변경 데이터는 같은 origin의 `localStorage[daisomall.mock.v1]`, 탭 로그인 ID는 `sessionStorage[daisomall.mock.session]`에 저장합니다.
- 새로고침 후에도 Mock 변경이 남습니다. 관리자 대시보드의 전체 초기화로 seed 상태로 돌아갈 수 있습니다.
- 관리자 변경은 같은 origin 고객 화면의 새로고침·재진입 시 반영합니다. 다른 origin과는 공유하지 않으며 서버 저장·실시간 동기화·동시성·보안을 보장하지 않습니다.
- 결제 결과는 체험자가 선택합니다. 성공·취소 시 변경되는 재고는 브라우저의 Mock 재고뿐입니다. 실제 PG·결제·배송·재고 DB에 접근하지 않습니다.
- 관리자 권한과 회원별 주문 구분은 클라이언트 Mock입니다. 실제 인증·인가·개인정보 보호 수단으로 사용하면 안 됩니다.
- v0.8 통합 수정은 포함하지 않습니다. 실제 운영 전에는 인증·주문·결제·재고 처리와 데이터 검증을 서버에서 구현해야 합니다.

## 검증 및 문서

Java 11 / Tomcat 9.0.123과 Chrome headless에서 1440px·1280px·390px 검증을 수행했습니다. 실제 Eclipse Publish, 실물 모바일, Safari/Firefox 및 스크린리더는 미검증입니다. 세부 통과 항목과 범위는 보고서를 확인하세요.

- [v0.2~v0.7 최종 보고서](docs/reports/frontend-v0.2-v0.7-summary.md)
- [v0.1 작업·디자인 기록](docs/reports/frontend-v0.1.md)
- [Mock Repository 데이터 계약](docs/mock-repository-contract.md)
- [최종 자동 검사 결과](docs/reports/frontend-commerce-evidence/v0.7-results.json)
- [메인 PC 캡처](docs/reports/frontend-commerce-evidence/v0.7-home-1440.png)
- [관리자 PC 캡처](docs/reports/frontend-commerce-evidence/v0.7-admin-dashboard-1440.png)

`tools/PreviewServer.java`는 설치된 Tomcat 라이브러리로 별도 임시 검증 서버를 실행하는 보조 도구입니다. 경로는 환경에 맞춰 지정해야 하며, 일반 실행에는 Eclipse의 Tomcat 서버를 사용하면 됩니다. 독립 검증 서버 명령은 최종 보고서에 있습니다.

Playwright가 설치된 환경에서 서버를 실행한 뒤 테스트할 수 있습니다. 프로젝트에 npm 의존성이나 패키지 관리자를 추가하지 않습니다.

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\node_modules\playwright'
node tools/verify-frontend.cjs
```

생성 도구 `build-products.cjs`, `build-pages.cjs`와 테스트는 Node.js가 필요합니다. `build-categories.cjs`는 별도의 로컬 Aside CSV를 읽으며 그 연구 자료는 공개 저장소에 포함하지 않습니다. 제공된 카테고리 JSON만으로 실행할 수 있습니다.

## 공개 자료와 라이선스

- 원본 사이트 캡처 2개와 외부 조사 자료는 재배포 권한이 확인되지 않아 Git에서 제외합니다. 과거 작업 보고서의 해당 원본 캡처 링크는 로컬 연구 자료를 가리키므로 공개 저장소에서는 열리지 않을 수 있습니다.
- 저장소의 애플리케이션 캡처는 자체 구현 화면과 테스트용 가상 회원·배송 정보입니다. 실제 사용자 데이터를 포함하지 않습니다.
- 로컬 SUITE·Pretendard 웹폰트와 원저작권·SIL OFL 라이선스를 함께 제공합니다. [폰트 출처 및 라이선스](src/main/webapp/assets/fonts/README.md)를 보존하세요.
- 다이소 관련 상표·명칭의 권리는 각 권리자에게 있습니다. 이 프로젝트가 공식 서비스이거나 원본 자산의 재사용 권한을 부여하는 것은 아닙니다.

업로드 브랜치는 `dev`입니다. 이 초기 업로드에서는 `main` 브랜치를 생성·수정·병합하지 않습니다.
