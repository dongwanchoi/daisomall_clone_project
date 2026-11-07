# Frontend v0.1 완료 보고서

작업일: 2026-11-07~08 KST. 범위: 공통 Header / Navigation / 3단계 카테고리 / Footer / 메인 기본 컨테이너.

## 1. 프로젝트 환경 확인

- 작업 경로: `D:\2.Workspace\2026\daiso\daisomall`. 기존 Eclipse Dynamic Web Project의 이름은 `daisomall`이다.
- 프로젝트 내부 임시 파일 `.frontend-write-probe` 생성·기록·삭제 성공 후 구현을 시작했다.
- `.classpath`와 facet 설정에서 Java 11, Apache Tomcat v9.0, Dynamic Web Module 4.0을 확인했다.
- 실제 실행에는 설치된 Temurin 11.0.32.101과 Apache Tomcat 9.0.123을 사용했다. Maven·Gradle·DB·백엔드 프레임워크를 추가하지 않았다.
- Aside 자료 폴더에 요청한 문서 7개와 스크린샷 48개가 존재한다. 문서와 CSV를 읽었고, 헤더·푸터·3단계 메뉴 캡처를 직접 열어 배치와 치수를 참고했다. 원본 자료는 수정하지 않았다. 48개 캡처 모두를 개별 시각 검토한 것은 아니다.

## 2. 기존 설정 및 웹 루트

- `.settings/org.eclipse.wst.common.component`의 `/src/main/webapp` 배포 루트, context root `daisomall`을 확인했다.
- `.project`, `.classpath`, `.settings/*`, 기존 `WEB-INF/web.xml`, `META-INF/MANIFEST.MF`를 수정하지 않았다. `WebContent`를 생성하지 않았다.
- 작업 전후 설정 파일 SHA-256 출력에서 동일한 해시를 확인했다. 주요 해시는 다음과 같다.

| 파일 | SHA-256 |
| --- | --- |
| `.project` | `7EDF36E00685F0EA2CEF5E19E1F57A1FDD4FEF9749C9EA406F0F10882D6C4A7E` |
| `.classpath` | `55CB4FB7B5517003566875F14C8C1F48CED2BCB448290DA532A556AF18185B5F` |
| `WEB-INF/web.xml` | `5DA2E5655A8A544E5F767846D9AB3930CC2977ADE4B07D01A1C07C3A0C37F3B6` |

## 3. 생성·수정 파일

기존 설정 변경 없이 다음 파일을 추가했다.

- `src/main/webapp/index.jsp`
- `src/main/webapp/WEB-INF/views/common/head.jspf`
- `src/main/webapp/WEB-INF/views/shop/home.jsp`
- `src/main/webapp/WEB-INF/views/shop/common/header.jspf`
- `src/main/webapp/WEB-INF/views/shop/common/navigation.jspf`
- `src/main/webapp/WEB-INF/views/shop/common/footer.jspf`
- `src/main/webapp/assets/css/variables.css`
- `src/main/webapp/assets/css/base.css`
- `src/main/webapp/assets/css/layout.css`
- `src/main/webapp/assets/css/components.css`
- `src/main/webapp/assets/css/responsive.css`
- `src/main/webapp/assets/js/common/navigation.js`
- `src/main/webapp/assets/mock/categories.json`
- `src/main/webapp/assets/images/favicon.svg`
- `src/main/webapp/assets/images/icons.svg`
- `tools/build-categories.cjs`: 원본 CSV → UTF-8, 공백 4칸 JSON 변환 도구. `node tools/build-categories.cjs`로 실행.
- `tools/PreviewServer.java`: 기존 서버 설정을 건드리지 않는 Java 11 / Tomcat 로컬 검증 도구.
- `tools/verify-frontend.cjs`: 계층 데이터 및 실제 브라우저 동작 검증 도구.
- `docs/reports/frontend-v0.1.md`: 이 보고서.
- `docs/reports/frontend-v0.1-evidence/results.json`, `home-{1440,1280,390}.png`, `categories-{1440,1280,390}.png`.

요청 구조에 검증·변환용 `tools/`와 보고서 증거 폴더를 추가했다. 검증용 라이브러리를 프로젝트에 설치하지 않았다.

## 4. JSP 공통 구조

`index.jsp` → JSP Forward → `/WEB-INF/views/shop/home.jsp`.

`home.jsp`에서 head, header, navigation, footer를 정적 JSP Include로 조립한다. 존재하지 않는 `/home` Redirect는 없다. 각 JSP 조각에 UTF-8 pageEncoding을 지정했다. CSS·JS·JSON·SVG 및 홈 URL은 `${pageContext.request.contextPath}`를 사용한다. WEB-INF 내부 뷰 직접 접근을 공개하지 않는다.

## 5. CSS·JavaScript 구현

- 1280px 최대 콘텐츠 폭, 40px 안내 띠, 84px 헤더 행, 44px 검색창, 56px 기본 내비게이션을 참조했다. 본문색 `#161D24`, 푸터 글자색 `#C5C8CE`, 밝은 회색 구획을 사용한다.
- 색상·폭 토큰, 기본 스타일, 레이아웃, 컴포넌트, 반응형을 5개 CSS로 분리했다.
- 카테고리는 3열 패널이며 각 열을 독립 스크롤한다. 버튼으로 열고 닫기, 바깥 클릭, ESC, 닫기 버튼, 선택 강조를 지원한다.
- 대분류 선택 후 중분류를 표시하고 중분류 선택 후 소분류를 표시한다. 상위 변경 시 하위 선택을 초기화한다. 소분류 없는 국민득템 중분류도 정상 처리한다.
- 기본 Tab/Shift+Tab, Enter/Space 버튼 조작 외에 위·아래·좌·우 화살표 및 Home/End 키를 지원한다. ESC 및 닫기 버튼은 카테고리 열기 버튼으로 초점을 돌린다. 선택한 버튼을 다시 생성하지 않아 초점을 유지한다.
- `aria-expanded`, `aria-controls`, `aria-pressed`, 이름 있는 영역과 제목, 상태 알림, 본문 바로가기를 제공한다.
- `loadCategories()`가 JSON 공급과 검증을 담당한다. 향후 `data-source`를 Servlet URL로 바꾸고 동일한 `categories` 계약을 반환하도록 연결할 수 있다.
- 데이터를 DOM API와 `textContent`로 출력한다. `innerHTML`을 사용하지 않는다. 로딩 실패 안내와 재시도 버튼을 제공한다.
- 검색·회원·찜·장바구니·전시 메뉴·약관 등 미구현 기능은 준비 중 안내를 출력한다. 회사소개 외부 링크에는 새 창 표시와 `noopener noreferrer`를 적용했다.
- 모바일은 검색창을 별도 행으로 옮기고 내비게이션은 자체 가로 스크롤한다. 카테고리는 3열을 유지하면서 터치·세로 스크롤로 탐색한다. 페이지 전체 가로 스크롤은 발생하지 않는다.

## 6. 카테고리 Mock Data 변환

| 항목 | 결과 |
| --- | --- |
| 전체 고유 노드 | 871 |
| 대분류 / 중분류 / 소분류 | 15 / 128 / 728 |
| 최하위 경로 | 730 |
| 중분류에서 끝나는 경로 | 2 |

CSV의 명칭·식별자·상위 식별자·단계·부모 내 순서를 각각 `name`, `id`, `parentId`, `level`, `displayOrder`로 보존했다. 원본 식별자가 명확하여 Mock ID를 새로 만들지 않았다. `isLeaf`, `type`, `sourceUrl`, `urlVerification`도 유지한다. 최상위의 `parentId`는 null이다.

전체 ID 고유성, 부모 존재와 바로 상위 단계 관계, 같은 부모 내 순서 고유성, leaf 일치 및 단계별 개수를 검증했다. 실제 URL 직접 이동 여부는 원본의 상태를 그대로 보존한다. 최하위 URL 직접 검증은 원본 조사 기준 86/730이며, 미방문 URL을 검증 완료로 바꾸지 않았다. UI에서는 실제 사이트 상품 목록 URL로 이동하지 않는다. 상품 데이터는 생성하지 않았다.

## 7. 실제 실행·테스트 결과

Tomcat 프로그램 폴더는 기본 권한에서 접근 거부되어 권한 요청 후 읽었다. 검증 서버는 별도 임시 CATALINA_BASE와 loopback `127.0.0.1:18089`, context `/daisomall`로 실행했다. 설치된 Tomcat의 설정이나 서비스는 변경하지 않았다.

캐시에 이미 있던 Playwright와 설치된 Chrome을 사용해 headless 브라우저로 검증했다. Aside 브라우저 프로필은 연결되지 않아 테스트에 사용하지 않았다.

| 검증 | 1440px | 1280px | 390px |
| --- | --- | --- | --- |
| `/daisomall/`, `/daisomall/index.jsp` 응답 | 200 | 200 | 200 |
| Header / Footer / CSS 5개 | 통과 | 통과 | 통과 |
| 문서 가로 넘침 | 없음 | 없음 | 없음 |
| 카테고리 열기·재클릭 닫기 | 통과 | 통과 | 터치 통과 |
| 대·중·소 표시와 소분류 선택 | 통과 | 통과 | 터치 통과 |
| 바깥 클릭·ESC·초점 복귀 | 통과 | 통과 | 통과 |
| 중분류 종료 경로 | 통과 | 통과 | 통과 |
| 키보드 우측 이동·Enter 선택 | 통과 | 통과 | 통과 |
| 검색 준비 중 안내 | 통과 | 통과 | 통과 |
| 정상 탐색 console error / pageerror | 0 / 0 | 0 / 0 | 0 / 0 |

JSON을 HTTP 503으로 강제한 별도 테스트에서 오류 안내 → 재시도 → 정상 복구를 검증했다. 이 의도적 실패 테스트는 정상 탐색의 콘솔 오류 집계와 구분한다. JavaScript `node --check` 통과. 테스트 결과는 [results.json](frontend-v0.1-evidence/results.json)에 저장했다.

캡처: [PC 1440](frontend-v0.1-evidence/home-1440.png), [PC 1280](frontend-v0.1-evidence/home-1280.png), [모바일 390](frontend-v0.1-evidence/home-390.png), [모바일 카테고리](frontend-v0.1-evidence/categories-390.png).

### 재현 명령

프로젝트 루트의 PowerShell에서 실행한다. Tomcat 폴더 읽기 권한이 필요하다.

```powershell
& 'C:\Program Files\Eclipse Adoptium\jdk-11.0.32.101-hotspot\bin\java.exe' `
    --class-path 'C:\Program Files\Apache Software Foundation\Tomcat 9.0\lib\*;C:\Program Files\Apache Software Foundation\Tomcat 9.0\bin\tomcat-juli.jar' `
    tools/PreviewServer.java src/main/webapp
```

접속 주소는 `http://127.0.0.1:18089/daisomall/`이다. 별도 터미널에서 다음 검증을 실행한다. 환경별 Playwright 경로를 조정한다.

검증에 사용한 임시 서버는 작업 종료 시 중지했다. 다시 확인하려면 위 명령으로 실행한다. Eclipse에서는 기존 Tomcat 9 서버에 프로젝트를 배포하고 `/daisomall/`로 진입한다.

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\Users\user\AppData\Local\npm-cache\_npx\e41f203b7505f1fb\node_modules\playwright'
node tools/verify-frontend.cjs
node --check src/main/webapp/assets/js/common/navigation.js
```

## 8. 검증하지 못한 항목

- Eclipse UI의 서버 등록·Publish·Run on Server 흐름은 실행하지 않았다. JSP는 실제 Tomcat 9에서 별도 실행했다.
- 실물 모바일, 모바일 Safari, Firefox, 스크린리더는 검증하지 않았다. 모바일 결과는 Chrome 터치·모바일 에뮬레이션이다.
- URL 직접 이동 730개 전수 조사와 실제 회사소개 외부 링크 이동은 이번 범위에서 수행하지 않았다.
- 모든 카테고리의 버튼 조작을 브라우저에서 전수 반복하지는 않았다. 데이터 871개 전체는 구조 검증했고, 브라우저는 대표 3단계와 중분류 종료 경로를 검증했다.
- 독립된 루트 context 배포는 실행하지 않았다. 리소스는 context path 표현식으로 구성했고 `/daisomall` 배포에서 동작을 확인했다.

## 9. 실제 다이소몰 화면과의 차이

- 로고는 텍스트와 자체 사각 심볼로 구성한 임시 표현이다. SVG 아이콘도 직접 작성한 대체 자산이다. 실제 로고·브랜드 서체·상품 사진을 복사하지 않았다. 설치 폰트에 따라 글자 폭·굵기가 다르다.
- 원본 1440px 캡처의 스크롤바를 제외한 폭은 1425px, 좌측 여백은 72.5px이었다. 클론은 브라우저 가용 폭에 따라 1280px 컨테이너를 중앙 배치한다.
- 검색창 치수와 헤더 구조를 참고했지만 회원 아이콘 아래 텍스트, 전체 카테고리 문구, 학습용 안내를 추가했다. 작은 PC 폭에서는 배송 내비가 두 번째 행으로 배치된다.
- 원본의 배너·상품 진열·광고 팝업·퀵링크·고정 최근 상품 패널은 구현하지 않았다. 본문은 v0.1 범위 안내 컨테이너이다.
- 카테고리에는 접근성을 위한 열 제목, 닫기 버튼, 선택 상태·준비 중 안내를 추가했다. 신상·전체 조회 필터를 별도 상품 카테고리로 만들지 않았다.
- 실제 푸터의 SNS·앱스토어·인증 마크·패밀리사이트·상세 사업자 정보는 일부 생략했다. 문서에서 확인한 고객센터·운영 시간·운영 주체·사업자번호만 표기했다. 약관 본문이나 확인되지 않은 주소·대표자 정보는 만들지 않았다.
- 원본 모바일 조사에서는 PC 폭 유지가 관찰됐지만 실제 모바일 사이트는 미확인이었다. 클론은 요청 기준에 맞춰 독자적인 반응형을 적용했다.

## 10. 발견 오류·개선 사항

- 초기 JSP 조각에 pageEncoding이 없어서 한글 렌더링이 깨지고 가로 넘침이 발생했다. 모든 조각에 UTF-8을 명시하여 해결했다.
- 기본 favicon 요청의 404 콘솔 오류를 자체 SVG favicon 연결로 해결했다.
- 로컬 `python.exe`는 실행 불가였으므로 초기 CSV 변환은 PowerShell로 수행했다. 이후 Node 변환 도구로 동일한 결과가 생성됨을 확인했다.
- 서버 시작 시 Tomcat의 Java 11 reflective-access 경고 및 기본 설정 파일 부재 관련 진단 로그가 있다. 별도 임시 base를 사용하는 검증 실행에서 HTTP 및 JSP 렌더링은 정상 통과했다.
- 배포 전 실제 로고·서체·이미지 사용 기준, 푸터 정보 범위, 약관 화면과 카테고리 공급 endpoint 계약을 확정할 필요가 있다.

## 11. v0.2 전 검토

- 공통 헤더의 치수·아이콘·로고 대체 표현과 작은 PC 폭의 배송 링크 줄바꿈 승인.
- 390px의 3열 터치 메뉴 및 독립 열 스크롤 사용성 검토.
- 메인 배너와 상품 진열의 구성·표본 데이터·자산 범위 확정.
- 후속 상품 목록 이동 방식과 카테고리 ID 계약 결정.
- 실제 모바일·스크린리더·Eclipse 배포 검증 계획 수립.

v0.1에서 작업을 종료한다. Git Commit·Push, DB 접근, 인증·장바구니 저장·주문·결제·커스텀 MVC를 수행하지 않았다. v0.2는 사용자 검토·승인 후 별도 지시로 진행한다.

## 12. v0.1 코드 리뷰 반영 (2026-11-08)

### 변경 내용

- `navigation.js`에서 홈 전용 `#category-selection`, `#feature-status` 참조를 제거했다. 선택 경로는 Navigation 내부의 `#common-category-selection`, 준비 중 알림은 Header에 포함된 `#common-feature-status`에서 제공한다. `home.jsp`의 중복 상태 요소는 삭제했다.
- 카테고리 초기화를 `initializeCategories()`로 분리하고 필요한 공통 요소가 없으면 초기화를 생략한다. 상태 출력 요소는 존재할 때만 사용하고, 검색 이벤트는 실제 존재하는 폼에만 등록한다. Header만 사용하거나 공통 요소가 없는 페이지에서 스크립트를 로드해도 null 참조 예외가 발생하지 않도록 했다.
- Navigation의 고정 `current`와 `aria-current`를 제거했다. 페이지에서 `request.setAttribute("activeNavigation", "home")`처럼 키를 설정하면 공통 JSP가 `data-active-navigation`으로 전달하고 스크립트가 일치하는 메뉴 하나에 활성 스타일과 `aria-current="page"`를 적용한다. 미설정·알 수 없는 키는 어떤 메뉴도 활성화하지 않는다. HTML 속성으로 전달할 값은 영문 소문자와 하이픈으로 제한한다.
- 메뉴에는 `data-navigation-key`를 부여했다. 지원 키는 `home`, `brand`, `season`, `new`, `open-run`, `exhibitions`, `ranking`, `rating`, `selling-out`, `beauty`, `health`, `pickup`, `today-delivery`, `bulk-order`다. 향후 JSP 또는 Controller에서 요청 속성만 변경하면 된다. 활성 표시 자체는 JavaScript 실행 후 적용된다.
- `tests/common-layout.jsp`를 추가했다. 공통 head·Header·Navigation·Footer를 Include하고 홈 전용 요소 없이 카테고리, 검색, 미구현 메뉴를 검증한다. 활성 키는 `ranking`으로 지정했다. 실제 랭킹 기능은 구현하지 않았고 운영 내비게이션에서도 이 테스트 페이지를 연결하지 않았다.
- 390px에서는 3열 구조를 유지하며 메뉴 글자 크기를 12px에서 14px로 확대했다. 카테고리명과 화살표를 분리해 긴 이름은 줄바꿈하고 화살표는 줄어들지 않게 했다. 열 제목은 각 열 내부 스크롤 중 상단에 남도록 했다. 기존 최소 44px 터치 높이를 유지한다.

수정 파일: `navigation.js`, `home.jsp`, `header.jspf`, `navigation.jspf`, `components.css`, `responsive.css`, `tools/verify-frontend.cjs`, 이 보고서. 테스트 JSP와 `frontend-v0.1-evidence/reuse-categories-390.png`를 추가하고 기존 캡처 6장 및 결과 JSON을 최신 테스트로 갱신했다.

### 데이터·설정 보존

카테고리 JSON은 수정하지 않았다. 수정 전후 SHA-256은 모두 `35610B03FBC6BA5543E2904CF9B49EBE5B70DF6B686FC8FB40A673A2E8DC1CAC`이다. 871개 고유 ID, 15/128/728 단계별 개수, 730개 최하위 경로, 부모 관계, 형제 순서 및 leaf 속성 검증이 다시 통과했다. `.project`, `.classpath`, `web.xml` 해시도 기존 보고서의 값과 동일하다. 다른 Eclipse 설정은 수정하지 않았다.

### 실제 실행·회귀 검증

설치된 Java 11 및 Tomcat 9.0.123의 격리 검증 서버와 Chrome headless / Playwright를 다시 사용했다. 명령은 위 재현 명령과 동일하다. 테스트 결과는 [results.json](frontend-v0.1-evidence/results.json), 모바일 재사용 화면은 [reuse-categories-390.png](frontend-v0.1-evidence/reuse-categories-390.png)에 저장했다.

| 검증 항목 | 1440px | 1280px | 390px |
| --- | --- | --- | --- |
| 홈·index.jsp·재사용 테스트 JSP HTTP 응답 | 200 | 200 | 200 |
| 홈 활성 `home` → 재사용 JSP 활성 `ranking` 전환 | 통과 | 통과 | 통과 |
| 홈 전용 ID 없이 카테고리 대·중·소 선택 | 통과 | 통과 | 터치 통과 |
| 재사용 JSP 검색·회원·Footer 약관 준비 중 안내 | 통과 | 통과 | 통과 |
| Navigation·알림 요소 없는 경우 예외 방지 | 통과 | 통과 | 통과 |
| Header·Navigation·검색폼 모두 없는 문서에서 스크립트 로드 | 통과 | 통과 | 통과 |
| 활성 키가 비었을 때 기존 활성 상태 제거 | 통과 | 통과 | 통과 |
| 문서 가로 넘침 | 없음 | 없음 | 없음 |
| 정상 탐색 console error / pageerror | 0 / 0 | 0 / 0 | 0 / 0 |

기존 열기·버튼 재클릭·바깥 클릭·ESC·닫기 버튼·초점 복귀·키보드 단계 이동·Enter 선택·중분류 종료 경로와 검색 준비 중 안내도 통과했다. 별도 JSON 503 강제 실패 → 재시도 복구 테스트가 통과했다. `node --check`도 통과했다.

390px에서 렌더링된 카테고리 버튼의 글자 크기 14px, 터치 영역 높이 최소 44px, 버튼 내부 가로 넘침 없음을 추가 검증했다. 이 검증은 대표 뷰티/위생 → 스킨케어 경로 기준이며 모든 871개 항목의 시각 배치를 전수 검사한 것은 아니다.

### 남은 검증 한계와 종료

실물 모바일, Safari/Firefox, 스크린리더 및 Eclipse UI에서 직접 Publish하는 절차는 이번 수정에서도 실행하지 않았다. 자동 검증은 Chrome headless와 390px 터치 에뮬레이션 기준이다. 공통 알림은 Header에 포함되므로 Header 없이 사용하는 페이지에서는 준비 중 알림 출력을 생략하며 예외는 발생하지 않는다.

v0.2, Maven·Gradle, DB, MVC 프레임워크를 추가하지 않았다. Commit·Push를 수행하지 않았으며 리뷰 수정 범위에서 작업을 종료한다.

## 13. v0.1 디자인 피드백 수정 (2026-11-08)

### 피드백과 원인

원본 `main-pc-header-top.png`, `category-menu-three-level.webp`, `main-layout.md`, `common-components.md`를 다시 열어 비교했다.

- **브랜드와 회색 안내 영역:** 공통 Header의 준비 중 알림을 문서 흐름에 삽입해 클릭 후 Navigation 위에 회색 띠가 남았고, 브랜드 문구가 별도 영역처럼 보였다. 원본 캡처에는 두 번째 브랜드 버튼이나 해당 개발 안내 띠가 없다. 두 번째 브랜드 메뉴를 새로 만들지 않고 알림을 화면 하단의 고정 알림으로 분리했다. 최초 진입에서는 숨겨지고 기능 클릭 시에만 표시되며 5초 후 비운다. Navigation의 브랜드는 배경·테두리·둥근 모서리 없이 56px 높이, 좌우 패딩 0, 텍스트와 6px CSS 화살표 사이 7px 간격으로 정리했다.
- **Hover 미작동:** 하위 목록 갱신이 click에만 연결되어 있었다. 실제 마우스 `pointerenter`와 hover 지원 여부를 확인해 대·중분류 탐색을 수행하도록 했다. Touch의 합성 마우스 동작으로 분류가 바뀌지 않도록 `pointerType === "mouse"` 조건을 사용한다.
- **스킨케어 강조와 빈 소분류:** 기존 CSS `:hover`만으로 행은 강조됐지만 데이터 탐색은 실행되지 않아 시각 상태와 소분류가 달랐다. Hover가 실제 부모 ID에 따른 탐색을 수행하게 수정했다.
- **선택·포커스 혼동:** 기존 빨간 활성 글자와 터치 강조가 원본과 달랐다. 원본의 검정 글자·옅은 회색 행 배경·밝은 회색 화살표를 적용하고, 키보드의 파란 `:focus-visible` 테두리는 별도로 유지했다. 원본 캡처에서 색 있는 좌측 강조선은 확인되지 않아 추가하지 않았다.
- **추가 안내 요소:** 원본에는 카테고리 제목줄, 열 제목, 하단 선택 경로 띠가 없다. 시각적인 제목줄·선택 띠를 제거하고 열 제목과 클릭 선택 결과는 스크린리더용 숨김 요소로 유지했다. 안내·로딩 실패·실제 빈 목록은 필요한 경우에만 표시한다.

### 변경한 파일

- JSP: `WEB-INF/views/shop/common/header.jspf`, `navigation.jspf`.
- CSS: `variables.css`, `base.css`, `layout.css`, `components.css`, `responsive.css`.
- JavaScript: `assets/js/common/navigation.js`.
- 테스트: `tools/verify-frontend.cjs`.
- 로컬 폰트: `assets/fonts/SUITE-Variable.woff2`, `PretendardVariable.woff2`, 각 `*-LICENSE.txt`, `README.md`.
- 이 보고서 및 기존 증거 폴더의 `design-*` 파일. 비교용 원본 캡처 2개는 읽기 전용 자료에서 복사했고 원본 파일은 수정하지 않았다. 이전 증거 파일도 보존했다.

새 JSP 화면을 추가하지 않았다. 이전 리뷰의 `tests/common-layout.jsp`를 재사용 검증에 계속 사용한다.

### 변경 전후 UI

| 항목 | 변경 전 | 변경 후 |
| --- | --- | --- |
| 브랜드 메뉴 | 문자 화살표, 기본 14px 서체 | SUITE 16px/700, CSS 꺾쇠, 56px 행 |
| 준비 중 안내 | Header 아래 회색 띠와 문서 밀림 | 기본 숨김, 클릭 시 고정 알림 |
| 회원 아이콘 | 아이콘 아래 상시 텍스트 | 원본처럼 아이콘 중심, 이름은 접근성용 숨김 |
| 검색창 | 시스템 대체 서체 | SUITE 14px/44px, 494×44px 기본 치수 유지 |
| 카테고리 | 상단 48px 제목줄, 하단 선택 띠 | 추가 띠 제거, 770px 3열 패널 |
| 카테고리 활성 행 | 빨간 텍스트 | 검정 텍스트 + `#F6F7F8`, 활성 화살표 |
| 행 간격 | 제목줄 아래에서 시작 | 열 상하 8px, 44px 행, PC 좌우 16px |
| 닫기 | `닫기 ×` 텍스트 버튼 | 우측 상단 12px X, 28px 버튼, Hover 회색 배경 |
| 모바일 닫기 | 패널 제목줄 안 | 패널 바로 위 우측의 44px 터치 버튼 |
| Footer | 시스템 fallback에 의존 | Pretendard, 13px/18.2px |

카테고리 패널 높이는 PC 최대 680px의 열 높이와 외곽 테두리이며 가용 viewport 높이에 따라 제한한다. 모바일은 기존 3열·14px·44px 최소 터치 높이와 독립 스크롤 구조를 유지한다. 텍스트와 화살표를 별도 요소로 유지해 긴 한글 이름을 줄바꿈한다. 터치 기본 하이라이트를 제거하되 키보드 포커스는 제거하지 않았다.

### 폰트 확인과 사용 근거

Aside는 원본 본문 Pretendard, 주요 Navigation·검색 SUITE 사용을 기록했다. 이전에는 해당 폰트를 선언만 하고 제공하지 않아 대부분 시스템 한글 서체로 렌더링됐다. 이번에는 공식 저장소에서 배포하는 수정하지 않은 WOFF2를 로컬로 제공한다. [SUITE 공식 안내](https://github.com/sun-typeface/SUITE/blob/main/README.md)와 [공식 라이선스](https://github.com/sun-typeface/SUITE/blob/main/LICENSE), [Pretendard 공식 안내](https://github.com/orioncactus/pretendard/blob/main/packages/pretendard/docs/en/README.md)와 [공식 라이선스](https://github.com/orioncactus/pretendard/blob/main/LICENSE)에서 OFL 배포를 확인하고 저작권·라이선스 파일을 함께 보관했다. 실제 다이소몰 서버의 폰트 파일을 복사하지 않았다.

다운로드일은 2026-11-08이며 출처 경로는 `assets/fonts/README.md`에 기록했다. 페이지 실행 중 외부 CDN 연결은 필요 없다. SUITE는 Navigation·검색·카테고리, Pretendard는 일반 본문·Header 보조 안내·Footer에 사용한다. SUITE 700/16px/19px와 카테고리 700/16px/20px를 기준으로 조정했다. 모바일 Navigation은 기존 13px, 카테고리는 14px를 유지한다.

| 파일 | SHA-256 |
| --- | --- |
| SUITE-Variable.woff2 | `FC5E0648D5413B55B79EBBAB0F50DE561A026574CBA3A9C8EB03D5BDDD432263` |
| PretendardVariable.woff2 | `9599F12FD42FC0BCE1CD50B47A0C022E108D7AA64DD0D1BB0ED44F3282D900B4` |

### Hover·Click·Touch·Keyboard 동작

- `browse()`는 활성 탐색 경로와 하위 목록만 갱신한다. 같은 항목이면 기존 DOM을 유지하며 mouseleave 시 목록을 초기화하지 않는다. 열 사이를 이동해도 이미 표시한 하위 목록을 유지한다.
- `confirmSelection()`은 클릭·Enter·Space에서만 숨김 상태 안내와 `category:select` 이벤트를 제공한다. Hover나 방향키로 하위 열을 여는 동작은 확정 이벤트를 발생시키지 않는다. 실제 URL 이동은 전혀 수행하지 않는다.
- 대분류 변경 시 중분류를 새로 표시하고 소분류 선택 안내로 돌아간다. 중분류 Hover/Click 시 실제 자식을 즉시 표시한다. 자식이 없는 국민득템 중분류는 ‘하위 분류가 없습니다’로 구분한다.
- ESC, 바깥 클릭, 열기 버튼 재클릭, 닫기 버튼, 초점 복귀와 Arrow/Home/End 키 탐색을 유지했다.

### 브라우저 실행·회귀 검증 결과

Java 11 + Tomcat 9.0.123 격리 서버에서 실제 JSP를 실행하고 설치된 Chrome headless / Playwright로 검사했다. 실행 명령은 앞 절과 동일하며, 최신 결과 파일은 [design-results.json](frontend-v0.1-evidence/design-results.json)이다.

| 검증 | 1440px | 1280px | 390px |
| --- | --- | --- | --- |
| 홈·index.jsp·재사용 JSP HTTP 응답 | 200 | 200 | 200 |
| 대분류 Hover → 중분류 | 통과 | 통과 | 적용 대상 아님 |
| 스킨케어 Hover → 스킨/토너 등 6개 | 통과 | 통과 | Tap 통과 |
| 다른 대분류·중분류 Hover 갱신 | 통과 | 통과 | Tap 탐색 통과 |
| 열 경계 이동 시 소분류 DOM 유지 | 통과 | 통과 | 적용 대상 아님 |
| Hover 확정 이벤트 0회 / 클릭 확정 1회·URL 유지 | 통과 | 통과 | Tap 후 URL 유지 |
| Enter·Space·방향키·Home·End | 통과 | 통과 | 통과 |
| 키보드 focus-visible 유지 / 마우스 Hover 포커스 없음 | 통과 | 통과 | 키보드 검사 통과 |
| 열기·닫기·바깥 클릭·ESC·닫기 초점 복귀 | 통과 | 통과 | 통과 |
| 브랜드 클릭 안내 표시·Navigation 위치 불변 | 통과 | 통과 | 통과 |
| 다른 JSP 재사용·activeNavigation·요소 부재 방어 | 통과 | 통과 | 통과 |
| SUITE·Pretendard 로컬 로드 | 통과 | 통과 | 통과 |
| 문서 가로 넘침 | 없음 | 없음 | 없음 |
| 정상 탐색 console error / pageerror | 0 / 0 | 0 / 0 | 0 / 0 |

JSON HTTP 503 실패 후 재시도 복구, 카테고리 중분류 종료 경로, 검색 준비 중 안내, 모바일 터치 영역 및 버튼 내부 넘침 검증도 통과했다. `node --check` 통과. 구조 검사 결과는 871개, 15/128/728, 최하위 730개로 동일하다. JSON SHA-256은 `35610B03FBC6BA5543E2904CF9B49EBE5B70DF6B686FC8FB40A673A2E8DC1CAC`이며 기존과 동일하다. Eclipse 설정·web.xml·Include·Context Path 구조를 변경하지 않았다.

알림이 5초 후 지워지도록 구현했으나 자동 회귀 테스트에서는 타이머 만료까지 기다리는 검사는 하지 않았다. 기본 숨김, 클릭 표시, 고정 위치와 문서 밀림 방지만 실제 검증했다.

### PC·모바일 비교 증거

헤더는 원본과 수정 결과 모두 **1440×182**로 준비했다.

| 영역 | 원본 / 변경 전 | 수정 후 |
| --- | --- | --- |
| PC 헤더 1440×182 | [Aside 원본](frontend-v0.1-evidence/reference-header-1440.png) | [수정 헤더](frontend-v0.1-evidence/design-header-1440.png) |
| PC 카테고리 | [Aside 원본](frontend-v0.1-evidence/reference-category-menu.webp) | [1440 화면 패널](frontend-v0.1-evidence/design-category-panel-1440.png), [1280 화면 패널](frontend-v0.1-evidence/design-category-panel-1280.png) |
| PC 전체 상태 | [이전 v0.1](frontend-v0.1-evidence/home-1440.png) | [1440](frontend-v0.1-evidence/design-home-1440.png), [1280](frontend-v0.1-evidence/design-home-1280.png) |
| PC Hover | 원본 3단계 캡처 참조 | [1440×1000](frontend-v0.1-evidence/design-hover-1440.png), [1280×1000](frontend-v0.1-evidence/design-hover-1280.png) |
| 키보드 포커스 | 기존 동작 유지 | [1440 키보드](frontend-v0.1-evidence/design-keyboard-1440.png) |
| 모바일 390px | [이전 메뉴](frontend-v0.1-evidence/categories-390.png) | [수정 메뉴](frontend-v0.1-evidence/design-categories-390.png), [홈](frontend-v0.1-evidence/design-home-390.png), [재사용 JSP](frontend-v0.1-evidence/design-reuse-categories-390.png) |

원본 카테고리 캡처는 1296×694의 주변 화면 포함 이미지이고 수정 패널 단독 캡처는 770×682다. 메뉴 자체 너비는 770px로 맞췄지만 동일 좌표의 픽셀 오차율을 계산한 것은 아니다. 두 캡처와 최신 모바일 캡처를 직접 열어 시각 검토했다.

### 남은 차이·미검증 항목

- 로고는 기존 자체 대체 표현이고 배송·회원 아이콘도 원본 자산과 동일하지 않다. 일부 헤더 좌표와 글자 간격은 다르다. 원본 캡처에는 세로 스크롤바가 포함돼 중앙 컨테이너가 7.5px 더 왼쪽에 있다.
- 원본 카테고리에는 조회 필터 ‘NEW 신상’이 있지만 871개 분류 노드가 아니므로 추가하지 않았다. 따라서 스킨케어 등 중분류 시작 행이 원본보다 한 행 위다.
- 원본 캡처에서 별도 닫기 아이콘은 확인되지 않았다. 기존 닫기 기능을 보존하기 위해 작은 X 버튼을 우측 상단에 남겼다. 정확한 원본 닫기 인터랙션을 확인했다고 주장하지 않는다.
- 원본은 PC 좁은 화면에서 고정 폭이 관찰됐지만 클론은 기존 반응형 구조를 유지한다. 1280px의 배송 링크 줄바꿈, 390px의 3열·독립 스크롤·44px 닫기 영역은 클론의 접근성 조정이다.
- 다운로드한 공식 폰트 버전과 원본 사이트가 사용한 세부 버전·래스터링은 같다고 검증하지 않았다. 원본과 동일한 폰트 계열을 적용했으며 OS별 렌더링 차이는 남을 수 있다.
- Footer의 회사·멤버십·고객센터는 기존 v0.1 범위를 유지한다. 원본 SNS·앱스토어·인증 표시와 v0.2의 배너·상품 진열을 추가하지 않았다.
- 실물 모바일·Safari/Firefox·스크린리더·Eclipse 직접 Publish는 미검증이다. 카테고리 전수 데이터 관계는 검사했지만 871개 버튼을 브라우저에서 전수 Hover한 것은 아니다.

검증용 임시 Tomcat 실행 세션을 종료했다. v0.1 디자인 수정 범위에서 종료한다. v0.2, 신규 업무 화면, DB·MVC·Maven·Gradle을 추가하지 않았고 Commit·Push도 수행하지 않았다.
