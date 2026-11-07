# Mock Repository 계약

## 구조와 로딩

`assets/js/data/mock-repository.js`의 `window.Daiso.ready`가 JSON 초기 로딩 완료를 제공한다. 페이지는 완료 후 `Daiso.repository`를 사용한다. JSP는 진입점·공통 레이아웃·페이지 키만 담당한다. DOM 구성은 `shop-ui.js`, `storefront.js`, `catalog.js`, `member.js`, `orders.js`, `admin.js`로 나눈다. 업무 Servlet·DB·MVC는 없다.

초기 파일은 `categories.json`, `products.json`, `members.json`, `stores.json`이다. 로딩 실패는 화면 오류와 다시 시도·초기화 버튼으로 표시한다. 현재 Repository 조회·변경은 동기식이고 초기 로딩만 Promise다. 서버 어댑터로 교체할 때 DTO와 검증 의미를 유지하되 네트워크 작업을 await하는 이벤트 핸들러로 바꿔야 한다. JDBC를 바로 붙일 수 있는 구현이라고 주장하지 않는다.

## DTO

| DTO | 주요 필드 |
| --- | --- |
| Category | id, parentId, name, level, displayOrder, isLeaf, type, sourceUrl, urlVerification, 선택 visible |
| Product | id, categoryId, name, price, status, onlineStock, storeStocks, image, description, brand, rating, reviewCount, sales, createdAt, source |
| Product.source | kind: GENERATED / REFERENCE / ADMIN_EDITED, reference, note |
| Member | id, email, name, phone, role: MEMBER / ADMIN, status: ACTIVE / SUSPENDED |
| CartLine | productId, quantity; 조회 시 product, lineTotal, purchasable 포함 |
| Order | id, checkoutToken, memberId, createdAt, status, recipient, phone, postcode, address, memo, items, totals, mockPayment |
| Order.items | productId, name, image, price, quantity, lineTotal; 주문 시점 스냅샷 |
| Order.totals | subtotal, shipping, total; 원 단위 정수 |
| Store | id: seoul / busan / jeju, name, mock |

관찰 표본의 이름·가격·분류를 관리자가 수정하면 ADMIN_EDITED로 구분한다. seed JSON은 보존하고 변경값을 별도 저장한다.

## 메서드와 서버 교체 책임

| 영역 | Repository 메서드 | 추후 서버 책임 |
| --- | --- | --- |
| 분류 | getCategories, getVisibleCategories, saveCategory | 계층·노출·순서 검증과 저장 |
| 상품 | getProducts, getProduct, queryProducts, saveProduct | 검색·필터·정렬·서버 페이지 조회·상품 저장 |
| 회원 | getMembers, getSession, register, login, logout, saveProfile, updateMemberStatus | 실제 암호·인증·인가·개인정보 |
| 장바구니 | getCart, addCart, setCartQuantity, removeCart, cartTotals | 회원 식별, 가격·재고 재검증 |
| 주문 | placeOrder, getOrders, getOrder | 결제 결과 검증·트랜잭션·멱등성 |
| 관리자 | requireAdmin, getAllOrders, orderTransitions, updateOrderStatus | 서버 권한·감사 기록 |
| 재고 | getStores, updateInventory | 온라인·매장 재고·동시성 |
| 초기화 | reset | 개발 Mock 전용; 운영 API로 노출하지 않음 |

`queryProducts` 조건은 categoryId, query, sort, maxPrice, availableOnly다. 대·중분류 ID는 모든 하위 상품을 합산한다. 정렬 키는 recommended, priceAsc, priceDesc, newest, rating이다. 목록은 30개 단위 프론트 더 보기이며 서버 offset/cursor 계약은 후속 확정이 필요하다.

## 저장 범위와 초기화

- `localStorage[daisomall.mock.v1]`: schemaVersion=1, productOverrides, categoryOverrides, createdProducts, carts, orders, members.
- `sessionStorage[daisomall.mock.session]`: 탭의 Mock 회원 ID. 비밀번호·실제 인증 토큰을 저장하지 않는다.
- 같은 프로토콜·호스트·포트의 페이지·탭에서 localStorage를 공유한다. context path가 달라도 같은 origin이면 키가 공유되므로 같은 origin의 여러 배포 인스턴스는 추후 키 분리가 필요하다.
- localStorage는 새로고침·브라우저 재실행 후에도 남는다. sessionStorage는 탭 세션 수명을 따른다. 다른 탭의 관리자 변경은 고객 화면 새로고침·재진입 시 반영하며 실시간 푸시는 없다.
- 관리자 대시보드 초기화는 변경·등록 회원·장바구니·주문을 제거하고 JSON seed로 돌아간다. 현재 탭 세션도 제거한다. 다른 탭의 회원 ID가 남아도 해당 회원이 없으면 비로그인으로 처리한다.
- 손상된 저장 데이터는 자동 덮어쓰기하지 않고 오류·초기화를 안내한다. 저장 용량·접근 오류는 저장 실패로 표시한다.
- 클라이언트에서 변조 가능한 학습용 데이터다. 동시 편집은 마지막 저장 우선이며 다중 탭 트랜잭션·실제 보안·백업을 보장하지 않는다. 실제 개인정보 입력 금지.

## 주문·재고·노출 규칙

수량은 1~99 정수이며 판매 중·온라인 재고 범위 안에서만 담기·주문한다. 배송비는 상품 합계 30,000원 미만 3,000원, 이상 0원이다. 주문 제출 시 최신 가격·상태·재고를 다시 확인한다.

성공은 PAID, 실패는 PAYMENT_FAILED다. 실패 시 장바구니·재고를 보존한다. 성공 시 해당 장바구니를 비우고 Mock 온라인 재고를 차감한다. checkoutToken과 소유자가 같은 요청은 기존 주문을 반환한다. 회원별 주문 조회·관리자 전체 조회 구분은 Mock UI 계약이며 실제 보안 경계가 아니다.

PAID → PREPARING → SHIPPED → DELIVERED, PAID 또는 PREPARING → CANCELLED를 허용한다. 취소 시 온라인 Mock 재고를 한 번 복원하며 취소·배송 완료·실패에서는 다음 전이가 없다. 실제 환불·PG·DB 재고와 연계하지 않는다.

분류 숨김은 메뉴·검색·목록에 적용하며 원본 계층·상품 ID는 유지한다. 기존 장바구니·직접 상세 URL의 상품 자체를 삭제하지 않는다. 판매 금지는 상품 상태로 관리한다. 비회원 장바구니는 로그인 시 회원 장바구니와 병합하며 수량·재고 초과분은 주문 전 재조정해야 한다.
