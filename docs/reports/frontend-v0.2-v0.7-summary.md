# Frontend v0.2~v0.7 연속 구현 결과

작업일: 2026-11-08 KST. 프로젝트: `D:\2.Workspace\2026\daiso\daisomall`.

v0.2 → v0.3 → v0.4 → v0.5 → v0.6 → v0.7 순서로 구현·실행 검증·Markdown 기록을 완료했다. 중간 승인 대기 없이 진행했고 v0.8은 진행하지 않았다.

## 1. 구현한 화면과 기능

| 버전 | 완료 내용 | 진입점 |
| --- | --- | --- |
| v0.2 | 모자이크 메인, 배너 캐러셀·정지/재생, 주요 분류 바로가기, 추천 2개 섹션, 공통 상품 카드 | `/`, `index.jsp` |
| v0.3 | 공통 목록·상세·검색, 분류 경로, 하위 분류, 가격·구매 가능 필터, 5가지 정렬, 더 보기, 수량·합계·상품 상태 | `list.jsp`, `search.jsp?q=...`, `product.jsp?id=...` |
| v0.4 | 최하위 730개 경로별 생성 상품과 관찰 표본, 목록·상세·검색 연결 | `assets/mock/products.json` |
| v0.5 | 로그인·가입·마이페이지·회원정보·로그아웃, 중복 이메일 안내 | `login.jsp`, `signup.jsp`, `mypage.jsp`, `profile.jsp` |
| v0.6 | 장바구니·수량·삭제, 주문서·배송 정보, 금액·배송비, 모의 성공/실패·주문 완료·내역·상세 | `cart.jsp`, `checkout.jsp`, `payment-success.jsp`, `payment-failure.jsp`, `orders.jsp`, `order.jsp` |
| v0.7 | 별도 관리자 대시보드, 분류·상품·판매 상태·온라인/매장 재고·주문·사용자 관리 | `admin/`, `admin/?view=...` |

관리 view 키는 dashboard, categories, products, inventory, stores, orders, users다. 상품 등록·수정과 분류 편집은 같은 관리 페이지 안의 폼으로 제공한다. 주문 상세는 `admin/?view=orders&id=...`다.

PC Hover와 모바일 Tap 탐색, 방향키·Space·ESC·바깥 클릭·초점 복귀, activeNavigation, Context Path, 공통 JSP Include를 유지했다. 검색·회원·장바구니·주문조회는 실제 내부 화면에 연결했고 아직 없는 찜·브랜드 등은 클릭 시 준비 중 안내를 유지한다.

## 2. Mock으로만 동작하는 부분

- 초기 분류 871개, 생성 대표 상품 730개, 문서 관찰 표본 2개로 **기본 상품 총 732개**다. 모든 최하위 경로 730개가 최소 1개 상품을 가진다.
- 730개 상품의 이름·가격·평점·상태·재고·이미지는 생성 데이터다. 관찰 표본 2개의 이름·가격·분류만 Aside 문서에 근거하며 그 외 정보는 Mock이다. 관리자가 표본을 변경하면 수정 샘플로 표시한다.
- 모든 이미지와 배너 일러스트는 자체 SVG다. 실제 사진·재고·리뷰·판매량을 제공하지 않는다. 추천·랭킹·기획전 메뉴는 Mock 정렬·전시를 재사용한다. 실제 다이소몰 추천 알고리즘을 재현하지 않았다.
- 회원은 이메일과 임의 비밀번호 4자 이상으로 체험한다. 비밀번호를 저장하거나 대조하지 않는다. 관리자 역할·회원별 조회도 클라이언트 Mock이므로 실제 보안이 아니다.
- 결제 결과는 사용자가 성공/실패를 선택한다. 실제 결제·배송·PG·DB 재고 차감·환불이 없다. 성공·취소 시 변경하는 것은 해당 브라우저의 Mock 온라인 재고다.
- 서울·부산·제주는 가상의 체험 매장이다. 매장 정보와 재고는 실제 점포와 무관하다.

체험 계정은 `demo@example.test`, 관리자 계정은 `admin@example.test`다. 로그인 화면의 체험 버튼을 사용할 수 있다. 실제 개인정보를 입력하지 않는다.

## 3. 데이터 접근 분리와 저장 수명

Repository: `assets/js/data/mock-repository.js`. 공통 DOM·카드: `assets/js/common/shop-ui.js`. 페이지 처리: `assets/js/shop/{storefront,catalog,member,orders}.js`, `assets/js/admin/admin.js`.

JSP는 기본 진입점에서 WEB-INF 공통 뷰로 Forward한다. 상품별 JSP·업무 Servlet·Java Service/DAO·커스텀 MVC를 만들지 않았다. 초기 JSON과 임시 변경 상태를 분리했다.

- 초기 JSON: categories / products / members / stores.
- localStorage `daisomall.mock.v1`: 상품·분류 override, 추가 상품·회원, 회원/비회원별 장바구니, 주문.
- sessionStorage `daisomall.mock.session`: 현재 탭의 Mock 회원 ID.
- 새로고침 후에도 localStorage 변경은 유지한다. 같은 origin의 관리자 변경을 다른 탭 고객 화면에서 새로고침하면 확인할 수 있다.
- 관리자 대시보드 전체 초기화 시 seed로 복귀한다. 자동 seed 덮어쓰기는 하지 않는다. 서로 다른 origin끼리는 공유하지 않는다. 같은 origin의 다른 context 배포는 현재 키를 공유하므로 추후 인스턴스별 키 분리가 필요하다.
- 서버 동시성·실시간 동기화·변조 방지는 없다. 실제 서버 어댑터 전환 시 동기식 Mock 메서드를 await하는 화면 이벤트로 바꾸는 작업도 필요하다.

DTO·메서드·상태 전이·초기화·백엔드 책임은 [Mock Repository 계약](../mock-repository-contract.md)에 기록했다.

## 4. 실제 테스트 결과

설치된 Temurin Java 11과 Tomcat 9.0.123으로 기존 `tools/PreviewServer.java`를 실행했다. 임시 base와 loopback 18089 포트를 사용했고 기존 Tomcat·Eclipse 설정은 수정하지 않았다. 설치된 Chrome과 기존 캐시 Playwright로 1440×1000, 1280×1000, 모바일 390×844를 검사했다.

| 단계 | 실제 결과 파일 | 결과 |
| --- | --- | --- |
| v0.2 | [v0.2-results.json](frontend-commerce-evidence/v0.2-results.json) | 홈·캐러셀·공통 메뉴, 3개 폭 통과 |
| v0.3 | [v0.3-results.json](frontend-commerce-evidence/v0.3-results.json) | 목록·상세·검색·필터·이동·잘못된 ID 안내, 3개 폭 통과 |
| v0.4 | [v0.4-results.json](frontend-commerce-evidence/v0.4-results.json) | 분류 커버리지 전수·상품 상태, 이전 흐름 통과 |
| v0.5 | [v0.5-results.json](frontend-commerce-evidence/v0.5-results.json) | 가입·로그인·수정·로그아웃·새로고침·중복 오류 통과 |
| v0.6 | [v0.6-results.json](frontend-commerce-evidence/v0.6-results.json) | 담기·수량·삭제·배송비·실패/성공·멱등성·주문 내역 통과 |
| v0.7 최종 | [v0.7-results.json](frontend-commerce-evidence/v0.7-results.json) | 앞선 흐름 + 관리자 전체 화면·고객 반영 + 추가 검사 통과 |

최종 고객·관리자 검증의 정상 흐름은 **콘솔 오류 0, pageerror 0, 문서 가로 넘침 없음**이었다. 관리자 모바일 표 자체는 내부 가로 스크롤을 허용한다.

최종 추가 검사는 비회원 장바구니 로그인 병합, 비회원 모의 주문, 현재 회원의 타 소유 주문 조회 제한, 음수 담기 거부, 비관리자 변경 거부다. 모두 통과했다. 카테고리 JSON에 의도적 HTTP 503을 주입한 별도 실패 시험에서 화면 오류·카테고리 재시도·화면 재시도 복구도 통과했다. 이때 발생하는 의도적 리소스 503은 정상 흐름 콘솔 오류 집계와 구분한다.

관리자 수정 검사는 실제 브라우저 폼과 별도 탭으로 진행했다. 상품 이름·가격·상태·재고·매장 재고·분류명·노출 변경, 상품 신규 등록·검색 반영, 주문 상태 변경·취소 재고 복원, 회원 중지·복원, 전체 초기화가 통과했다. 주문 가격 스냅샷은 상품 수정 이후에도 유지됐다.

모든 애플리케이션 JavaScript 파일에 `node --check`를 실행해 통과했다. 기존 분류 JSON SHA-256은 `35610B03FBC6BA5543E2904CF9B49EBE5B70DF6B686FC8FB40A673A2E8DC1CAC`로 동일하며, `.project`, `.classpath`, `WEB-INF/web.xml` 해시도 기존 보고서와 동일하다. `.settings`를 수정하지 않았고 WebContent·Maven·Gradle·DB·ERD를 추가하지 않았다. Commit·Push 없음.

해결되지 않은 실행 실패는 확인되지 않았다. 단, 아래 항목은 통과로 간주하지 않는다.

- 실제 모바일 기기, Safari/Firefox, 스크린리더·고배율 확대의 전수 접근성 검증.
- Eclipse UI의 직접 Publish·Run on Server 흐름. JSP는 실제 Tomcat에서 별도 실행했다.
- 732개 모든 상세 페이지의 개별 브라우저 방문. 분류·상품 연결 관계는 전수 데이터 검증했다.
- 다중 탭 동시 쓰기·저장 용량 한계·동시 주문 경쟁의 보장.
- 서버 인증·권한·실제 결제·실재고·DB CRUD·실제 배송.

## 5. 캡처

버전별 원본 크기 PNG는 `docs/reports/frontend-commerce-evidence/`에 있다. 대표 최종 캡처:

- [PC 메인 1440](frontend-commerce-evidence/v0.7-home-1440.png), [모바일 메인 390](frontend-commerce-evidence/v0.7-home-390.png)
- [상품 목록](frontend-commerce-evidence/v0.7-catalog-1440.png), [상품 상세](frontend-commerce-evidence/v0.7-product-390.png)
- [회원정보](frontend-commerce-evidence/v0.7-member-390.png), [장바구니](frontend-commerce-evidence/v0.7-cart-390.png)
- [주문서](frontend-commerce-evidence/v0.7-checkout-390.png), [주문 완료](frontend-commerce-evidence/v0.7-payment-390.png)
- [관리자 대시보드](frontend-commerce-evidence/v0.7-admin-dashboard-1440.png), [관리자 상품 모바일](frontend-commerce-evidence/v0.7-admin-products-390.png), [사용자 관리](frontend-commerce-evidence/v0.7-admin-users-390.png)

디자인 반복 비교는 수행하지 않았다. 최종 메인과 관리자 모바일 캡처를 열어 기본 표시 상태를 확인했다. 기존 v0.1 증거는 별도 폴더에 보존했다.

## 6. 실제 사이트와 디자인 차이

- 원본 1280px 콘텐츠·모자이크 배너·메인 6열/목록 5열·3:4 이미지 비율을 참고했다. 배너 수·행 수·색상·캠페인·퀵링크는 단순화했다.
- 로고·일부 아이콘은 기존 자체 대체 자산이며 상품·배너는 색상별 자체 SVG다. 실상품 사진과 프로모션을 복제하지 않았다.
- 폰트는 기존 v0.1의 로컬 SUITE·Pretendard와 라이선스를 유지한다. 픽셀 단위 비교·세부 간격 일치는 이번 작업 기준이 아니다.
- 목록은 가상 연속 스크롤 대신 30개 단위 더 보기다. 필터·상세 설명·옵션·리뷰·회원·결제는 화면 흐름 확인을 위한 단순 구성이다.
- 실제 사이트의 로그인 후·관리자 UI는 검증된 레퍼런스가 없으므로 독자적인 학습용 디자인이다. 관리자 화면은 고객 화면과 분리했다.

## 7. v0.8 검토할 문제 목록 — 이번에 수정하지 않음

1. 사용자가 실제 서버에서 전체 화면을 검토한 뒤 디자인 간격·모바일 표·접근성 우선순위를 결정한다.
2. 카테고리별 이미지를 다양화하고 배너·실상품 자료의 사용 기준을 확정한다.
3. 테마·랭킹·기획전 메뉴의 현재 단순 Mock 정렬을 별도 큐레이션 계약으로 확장할지 결정한다. 브랜드·찜·약관 등 남은 준비 중 기능의 범위도 확정한다.
4. 필터·목록 수량 증가 시 서버 페이지 조회, 키보드 초점 유지·오류 메시지 이동을 검토한다.
5. Mock 상태의 다중 탭 충돌·저장 용량·인스턴스 키 분리와 서버 이전 방식을 결정한다.
6. 회원·관리자·주문 화면을 실제 모바일·다른 브라우저·스크린리더로 검사한다.
7. 주문 취소 이후 환불·송장·재고 예약·반품 정책과 매장 판매 정책을 팀원과 합의한다.

## 8. 추후 백엔드 연동

Servlet Controller → Service → DAO/JDBC에서 JSON DTO와 Repository 메서드의 책임을 인계해야 한다. 실제 인증·세션·관리자 인가, 비밀번호 처리, 입력 검증, 주문 금액 재계산, 결제 승인 검증, 재고 원자 처리, 멱등성 저장·감사 기록은 서버가 담당한다. 해당 업무 구현·ERD·DDL은 이번 작업에서 수행하지 않았다.

## 9. 실행·재검증

기존 Eclipse Tomcat 9 서버에 프로젝트를 배포하고 `/daisomall/`로 접속한다. 새 프로젝트·빌드 도구 설치는 필요 없다. 독립 검증 서버를 다시 사용하려면 프로젝트 루트 PowerShell에서 실행한다.

```powershell
& 'C:\Program Files\Eclipse Adoptium\jdk-11.0.32.101-hotspot\bin\java.exe' `
    --class-path 'C:\Program Files\Apache Software Foundation\Tomcat 9.0\lib\*;C:\Program Files\Apache Software Foundation\Tomcat 9.0\bin\tomcat-juli.jar' `
    tools/PreviewServer.java src/main/webapp
```

검증 주소: `http://127.0.0.1:18089/daisomall/`. 관리자: 같은 주소의 `admin/`.

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\Users\user\AppData\Local\npm-cache\_npx\e41f203b7505f1fb\node_modules\playwright'
node tools/verify-frontend.cjs
# 동일한 최종 검사:
node tools/verify-commerce.cjs 7
```

기존 `verify-frontend.cjs`는 더 이상 과거 v0.1의 화면 고정값을 검사하지 않고 현재 회귀 모음에 위임한다. Playwright·Chrome 경로는 환경별로 조정한다. 테스트 브라우저는 별도 임시 context를 사용하여 사용자의 실제 브라우저 계정·장바구니를 변경하지 않는다.

초기 상품 재생성은 `node tools/build-products.cjs` 또는 `node tools/build-products.cjs --all-leaves`다. `--sample`은 개발용 소량 데이터이므로 완성본에는 사용하지 않는다. 화면 JSP 진입점 재생성은 `node tools/build-pages.cjs 6`이다. 관리자 JSP는 직접 제공한다. 실행 시 seed를 재생성할 필요는 없다.

## 10. 버전별 작업 기록

[v0.2](frontend-v0.2.md) · [v0.3](frontend-v0.3.md) · [v0.4](frontend-v0.4.md) · [v0.5](frontend-v0.5.md) · [v0.6](frontend-v0.6.md) · [v0.7](frontend-v0.7.md).

검증용 임시 Tomcat 실행 세션을 종료했다. v0.7까지 완료하고 종료한다. v0.8은 사용자 검토 후 별도 지시로 진행한다.
