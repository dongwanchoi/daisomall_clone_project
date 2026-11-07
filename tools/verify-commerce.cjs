const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const crypto = require("node:crypto");

const stage = Number(process.argv[2] || 2);
const base = "http://127.0.0.1:18089/daisomall/";
const output = path.resolve("docs/reports/frontend-commerce-evidence");
fs.mkdirSync(output, { recursive: true });

async function main() {
    if (stage >= 4) {
        const raw = fs.readFileSync("src/main/webapp/assets/mock/categories.json");
        assert.equal(crypto.createHash("sha256").update(raw).digest("hex"), "35610b03fbc6ba5543e2904cf9b49ebe5b70df6b686fc8fb40a673a2e8dc1cac");
        const categories = JSON.parse(raw).categories;
        const products = JSON.parse(fs.readFileSync("src/main/webapp/assets/mock/products.json", "utf8")).products;
        assert.equal(categories.length, 871);
        const leaves = categories.filter((category) => category.isLeaf);
        assert.equal(leaves.length, 730);
        assert.equal(products.length, 732);
        assert.equal(new Set(products.map((product) => product.id)).size, products.length);
        leaves.forEach((leaf) => assert(products.some((product) => product.categoryId === leaf.id)));
        products.forEach((product) => assert(leaves.some((leaf) => leaf.id === product.categoryId)));
    }
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const results = { version: "0." + stage, viewports: [] };
    try {
        for (const width of [1440, 1280, 390]) {
            const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390 });
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("console", (message) => {
                if (message.type() === "error") {
                    errors.push(message.text());
                }
            });
            async function visit(file = "") {
                const response = await page.goto(base + file);
                assert.equal(response.status(), 200, file);
                await page.locator(".site-footer").waitFor();
            }
            async function noOverflow() {
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Overflow at " + page.url());
            }
            async function activate(locator) {
                if (width === 390) {
                    await locator.tap();
                } else {
                    await locator.click();
                }
            }
            await visit();
            await page.locator(".hero-title").waitFor();
            assert.equal(await page.locator(".product-card").count(), 12);
            await page.getByRole("button", { name: "배너 자동 재생 정지", exact: true }).click();
            const before = await page.locator(".hero-title").textContent();
            await page.getByRole("button", { name: "다음", exact: true }).click();
            assert.notEqual(await page.locator(".hero-title").textContent(), before);
            await page.getByRole("button", { name: "이전", exact: true }).click();
            assert.equal(await page.locator(".hero-title").textContent(), before);
            await noOverflow();
            await page.screenshot({ path: path.join(output, `v0.${stage}-home-${width}.png`), fullPage: true });
            await activate(page.locator("#category-toggle"));
            await page.locator("#category-roots button").first().waitFor();
            assert.equal(await page.locator("#category-roots button").count(), 15);
            const beauty = page.locator("#category-roots button").filter({ hasText: "뷰티/위생" });
            if (width === 390) {
                await beauty.tap();
                await page.locator("#category-children button").first().tap();
            } else {
                await beauty.hover();
                await page.locator("#category-children button").first().hover();
            }
            assert.equal(await page.locator("#category-leaves button").count(), 6);
            await page.keyboard.press("Escape");
            assert(await page.locator("#category-panel").isHidden());
            assert(await page.locator("#category-toggle").evaluate((element) => element === document.activeElement));
            await activate(page.locator("#category-toggle"));
            await page.locator("#search-query").click();
            assert(await page.locator("#category-panel").isHidden());
            await activate(page.locator("#category-toggle"));
            await page.locator("#category-roots button").filter({ hasText: "뷰티/위생" }).focus();
            await page.keyboard.press("ArrowRight");
            assert(await page.locator("#category-children button").first().evaluate((element) => element === document.activeElement && element.matches(":focus-visible")));
            await page.keyboard.press("Space");
            await page.keyboard.press("ArrowRight");
            assert(await page.locator("#category-leaves button").first().evaluate((element) => element === document.activeElement));
            await page.keyboard.press("Escape");
            if (stage >= 3) {
                await page.locator(".search-form input").fill("3색 소스병");
                await page.locator(".search-form").press("Enter");
                await page.locator(".product-card").first().waitFor();
                assert((await page.locator("h1").textContent()).includes("소스병"));
                assert.equal(await page.locator(".product-card").count(), 1);
                await page.locator(".product-name").first().click();
                await page.locator(".detail-price").waitFor();
                assert((await page.locator("h1").textContent()).includes("3색 소스병"));
                await page.locator('[name="quantity"]').fill("2");
                assert((await page.locator(".detail-total").textContent()).includes("2,000"));
                await noOverflow();
                await page.screenshot({ path: path.join(output, `v0.${stage}-product-${width}.png`), fullPage: true });
                await visit("list.jsp");
                await page.locator(".product-card").first().waitFor();
                await page.locator('[name="sort"]').selectOption("priceAsc");
                const prices = await page.locator(".product-price").allTextContents();
                const numeric = prices.map((price) => Number(price.replace(/\D/g, "")));
                assert.deepEqual(numeric, [...numeric].sort((left, right) => left - right));
                await page.locator('[name="maxPrice"]').selectOption("1000");
                assert((await page.locator(".product-price").allTextContents()).every((price) => Number(price.replace(/\D/g, "")) <= 1000));
                await noOverflow();
                await page.screenshot({ path: path.join(output, `v0.${stage}-catalog-${width}.png`), fullPage: true });
                await visit("search.jsp?q=definitely-no-matching-product");
                await page.locator(".catalog-grid .empty-state").waitFor();
                await visit("product.jsp?id=missing");
                await page.locator("#main-content .empty-state").filter({ hasText: "상품을 찾을 수 없습니다" }).waitFor();
                await visit("list.jsp?category=missing");
                await page.locator("#main-content .empty-state").filter({ hasText: "존재하지 않는" }).waitFor();
                await visit();
                await page.locator(".hero-title").waitFor();
                await activate(page.locator("#category-toggle"));
                await page.locator("#category-roots button").first().waitFor();
                const rootCategory = page.locator("#category-roots button").filter({ hasText: "뷰티/위생" });
                if (width === 390) {
                    await rootCategory.tap();
                    await page.locator("#category-children button").first().tap();
                } else {
                    await rootCategory.hover();
                    await page.locator("#category-children button").first().hover();
                }
                await activate(page.locator("#category-leaves button").first());
                await page.waitForURL("**/list.jsp?category=**");
                await page.locator(".product-card").first().waitFor();
                if (stage >= 4) {
                    const unavailable = await page.evaluate(() => window.Daiso.repository.getProducts().filter((product) => product.status !== "AVAILABLE").slice(0, 2).map((product) => product.id));
                    assert.equal(unavailable.length, 2);
                    for (const id of unavailable) {
                        await visit("product.jsp?id=" + encodeURIComponent(id));
                        await page.locator(".stock-status").waitFor();
                        assert(await page.getByRole("button", { name: "장바구니 담기", exact: true }).isDisabled());
                    }
                }
            }
            if (stage >= 5) {
                await visit("mypage.jsp");
                await page.locator(".member-panel").waitFor();
                assert((await page.locator("#main-content").textContent()).includes("로그인 후"));
                await visit("signup.jsp");
                await page.locator(".member-form").waitFor();
                await page.locator('[name="email"]').fill("review" + width + "@example.test");
                await page.locator('[name="password"]').fill("test-password-123");
                await page.locator('[name="name"]').fill("테스트 회원");
                await page.locator('[name="phone"]').fill("010-1234-5678");
                await page.locator('[name="consent"]').check();
                await page.locator('.member-form button[type="submit"]').click();
                await page.waitForURL("**/mypage.jsp");
                await page.locator(".member-greeting").waitFor();
                assert((await page.locator(".member-greeting").textContent()).includes("테스트 회원"));
                assert(await page.evaluate(() => !localStorage.getItem("daisomall.mock.v1").includes("test-password-123")));
                await page.getByRole("link", { name: "회원정보 수정" }).click();
                await page.locator('[name="name"]').fill("수정 회원");
                await page.getByRole("button", { name: "회원정보 저장", exact: true }).click();
                await page.getByRole("status").filter({ hasText: "회원정보를 저장" }).waitFor();
                await page.reload();
                await page.locator('[name="name"]').waitFor();
                assert.equal(await page.locator('[name="name"]').inputValue(), "수정 회원");
                await noOverflow();
                await page.screenshot({ path: path.join(output, `v0.${stage}-member-${width}.png`), fullPage: true });
                await visit("mypage.jsp");
                await page.locator(".member-panel").getByRole("button", { name: "로그아웃", exact: true }).click();
                await page.waitForURL("**/login.jsp");
                await page.locator(".member-form").waitFor();
                await page.locator('[name="email"]').fill("review" + width + "@example.test");
                await page.locator('[name="password"]').fill("another-mock-password");
                await page.locator('.member-form button[type="submit"]').click();
                await page.waitForURL("**/mypage.jsp");
                await page.locator(".member-greeting").waitFor();
                assert((await page.locator(".member-greeting").textContent()).includes("수정 회원"));
                await visit("signup.jsp");
                await page.locator(".member-form").waitFor();
                await page.locator('[name="email"]').fill("review" + width + "@example.test");
                await page.locator('[name="password"]').fill("duplicate");
                await page.locator('[name="name"]').fill("중복 회원");
                await page.locator('[name="phone"]').fill("010-1234-5678");
                await page.locator('[name="consent"]').check();
                await page.locator('.member-form button[type="submit"]').click();
                await page.locator('[role="alert"]').filter({ hasText: "이미 등록" }).waitFor();
            }
            if (stage >= 6) {
                await visit("product.jsp?id=REF-99962883");
                await page.locator('[name="quantity"]').waitFor();
                const initialStock = await page.evaluate(() => window.Daiso.repository.getProduct("REF-99962883").onlineStock);
                await page.locator('[name="quantity"]').fill("2");
                await page.getByRole("button", { name: "장바구니 담기", exact: true }).click();
                await page.locator("#common-feature-status").filter({ hasText: "담았습니다" }).waitFor();
                await activate(page.locator('[data-shopping-route="cart"]'));
                await page.locator(".cart-row").waitFor();
                assert.equal(await page.locator('.cart-row [name="quantity"]').inputValue(), "2");
                await page.locator('.cart-row [name="quantity"]').fill("3");
                await page.locator('.cart-row [name="quantity"]').dispatchEvent("change");
                assert((await page.locator(".totals-panel").textContent()).includes("6,000"));
                await page.locator('.cart-row [name="quantity"]').fill("99");
                await page.locator('.cart-row [name="quantity"]').dispatchEvent("change");
                await page.locator('[role="alert"]').filter({ hasText: "재고" }).waitFor();
                assert.equal(await page.locator('.cart-row [name="quantity"]').inputValue(), "3");
                await noOverflow();
                await page.screenshot({ path: path.join(output, `v0.${stage}-cart-${width}.png`), fullPage: true });
                async function checkout(outcome) {
                    await page.getByRole("link", { name: "주문하기", exact: true }).click();
                    await page.locator(".checkout-form").waitFor();
                    await page.locator('[name="recipient"]').fill("테스트 수령인");
                    await page.locator('[name="phone"]').fill("010-0000-0000");
                    await page.locator('[name="postcode"]').fill("12345");
                    await page.locator('[name="address"]').fill("서울 테스트로 100 Mock 배송지");
                    await page.locator('[name="outcome"]').selectOption(outcome);
                    await noOverflow();
                    await page.screenshot({ path: path.join(output, `v0.${stage}-checkout-${width}.png`), fullPage: true });
                    await page.getByRole("button", { name: "모의 결제하기", exact: true }).click();
                    await page.waitForURL("**/payment-" + outcome + ".jsp?**");
                    await page.locator(".order-status").waitFor();
                }
                await checkout("failure");
                assert((await page.locator("h1").textContent()).includes("실패"));
                assert.equal(await page.evaluate(() => window.Daiso.repository.getProduct("REF-99962883").onlineStock), initialStock);
                assert.equal(await page.evaluate(() => window.Daiso.repository.getCart()[0].quantity), 3);
                await page.getByRole("link", { name: "장바구니에서 다시 시도" }).click();
                await page.locator(".cart-row").waitFor();
                await checkout("success");
                assert((await page.locator("h1").textContent()).includes("주문이 완료"));
                assert.equal(await page.evaluate(() => window.Daiso.repository.getCart().length), 0);
                assert.equal(await page.evaluate(() => window.Daiso.repository.getProduct("REF-99962883").onlineStock), initialStock - 3);
                assert(await page.evaluate(() => {
                    const repository = window.Daiso.repository;
                    const order = repository.getOrders()[0];
                    const replay = repository.placeOrder({ token: order.checkoutToken });
                    return replay.id === order.id && repository.getOrders().length === 2;
                }));
                await noOverflow();
                await page.screenshot({ path: path.join(output, `v0.${stage}-payment-${width}.png`), fullPage: true });
                await page.getByRole("link", { name: "주문 내역 보기" }).click();
                await page.locator(".order-summary").first().waitFor();
                assert.equal(await page.locator(".order-summary").count(), 2);
                await page.getByRole("link", { name: "주문 상세", exact: true }).first().click();
                await page.locator(".order-status").waitFor();
                assert.equal(await page.locator(".order-status").textContent(), "결제 완료");
                await visit("cart.jsp");
                await page.locator(".empty-state").filter({ hasText: "비어" }).waitFor();
                const expensiveId = await page.evaluate(() => window.Daiso.repository.getProducts().find((product) => product.price === 5000 && product.status === "AVAILABLE").id);
                await visit("product.jsp?id=" + encodeURIComponent(expensiveId));
                await page.locator('[name="quantity"]').fill("6");
                await page.getByRole("button", { name: "장바구니 담기", exact: true }).click();
                await visit("cart.jsp");
                await page.locator(".cart-row").waitFor();
                assert.equal(await page.evaluate(() => window.Daiso.repository.cartTotals().shipping), 0);
                await page.getByRole("button", { name: "삭제", exact: true }).click();
                await page.locator(".empty-state").filter({ hasText: "비어" }).waitFor();
            }
            if (stage >= 7) {
                const adminPage = await context.newPage();
                adminPage.on("pageerror", (error) => errors.push(error.message));
                adminPage.on("console", (message) => {
                    if (message.type() === "error") {
                        errors.push(message.text());
                    }
                });
                async function adminVisit(view) {
                    const response = await adminPage.goto(base + "admin/?view=" + view);
                    assert.equal(response.status(), 200);
                    await adminPage.locator("#admin-content h1").waitFor();
                }
                async function adminNoOverflow() {
                    assert(await adminPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Admin overflow at " + adminPage.url());
                }
                async function searchAdmin(query) {
                    await adminPage.locator('.admin-search [name="query"]').fill(query);
                    await adminPage.locator(".admin-search").getByRole("button", { name: "검색", exact: true }).click();
                }
                async function editProduct() {
                    await adminVisit("products");
                    await searchAdmin("REF-99962883");
                    await adminPage.locator("tbody").getByRole("button", { name: "수정", exact: true }).click();
                }
                await adminVisit("dashboard");
                await adminPage.getByRole("link", { name: "관리자 로그인", exact: true }).click();
                await adminPage.getByRole("button", { name: "체험 관리자로 로그인", exact: true }).click();
                await adminPage.waitForURL("**/admin/");
                await adminPage.locator(".admin-stat").first().waitFor();
                assert.equal(await adminPage.locator(".site-header").count(), 0);
                await adminNoOverflow();
                await adminPage.screenshot({ path: path.join(output, `v0.${stage}-admin-dashboard-${width}.png`), fullPage: true });
                await editProduct();
                await adminPage.locator('#product-editor [name="name"]').fill("관리자 수정 소스병 " + width);
                await adminPage.locator('#product-editor [name="price"]').fill("2500");
                await adminPage.getByRole("button", { name: "상품 저장", exact: true }).click();
                await adminPage.locator(".form-status").filter({ hasText: "저장했습니다" }).waitFor();
                await visit("product.jsp?id=REF-99962883");
                await page.locator(".detail-price").waitFor();
                assert((await page.locator("h1").textContent()).includes("관리자 수정"));
                assert((await page.locator(".detail-price").textContent()).includes("2,500"));
                assert((await page.locator(".source-note").textContent()).includes("관리자에서 변경한 Mock"));
                await adminPage.locator('#product-editor [name="status"]').selectOption("SOLD_OUT");
                await adminPage.getByRole("button", { name: "상품 저장", exact: true }).click();
                await page.reload();
                await page.locator(".stock-status").waitFor();
                assert(await page.getByRole("button", { name: "장바구니 담기", exact: true }).isDisabled());
                await adminPage.locator('#product-editor [name="status"]').selectOption("AVAILABLE");
                await adminPage.getByRole("button", { name: "상품 저장", exact: true }).click();
                await adminVisit("inventory");
                await searchAdmin("REF-99962883");
                await adminPage.getByRole("button", { name: "재고 수정", exact: true }).click();
                await adminPage.locator('.admin-editor-form [name="quantity"]').fill("9");
                await adminPage.getByRole("button", { name: "재고 저장", exact: true }).click();
                await page.reload();
                await page.locator(".stock-status").waitFor();
                assert((await page.locator(".stock-status").textContent()).includes("9개"));
                await adminVisit("stores");
                await searchAdmin("REF-99962883");
                await adminPage.getByRole("button", { name: "재고 수정", exact: true }).click();
                await adminPage.locator('[name="location"]').selectOption("busan");
                await adminPage.locator('.admin-editor-form [name="quantity"]').fill("42");
                await adminPage.getByRole("button", { name: "재고 저장", exact: true }).click();
                await page.reload();
                await page.locator(".store-stock summary").click();
                assert((await page.locator(".store-stock").textContent()).includes("부산 체험 매장 · 42개"));
                await adminVisit("products");
                await adminPage.getByRole("button", { name: "상품 등록", exact: true }).click();
                await adminPage.locator('#product-editor [name="name"]').fill("관리자 신규 상품 " + width);
                await adminPage.locator('#product-editor [name="price"]').fill("4500");
                await adminPage.getByRole("button", { name: "상품 저장", exact: true }).click();
                await adminPage.locator(".form-status").filter({ hasText: "저장했습니다" }).waitFor();
                const productCount = await adminPage.evaluate(() => window.Daiso.repository.getProducts().length);
                assert.equal(productCount, 733);
                await visit("search.jsp?q=" + encodeURIComponent("관리자 신규 상품 " + width));
                await page.locator(".product-card").waitFor();
                assert.equal(await page.locator(".product-card").count(), 1);
                await adminNoOverflow();
                await adminPage.screenshot({ path: path.join(output, `v0.${stage}-admin-products-${width}.png`), fullPage: true });
                await adminVisit("categories");
                await searchAdmin("CTGR_01050");
                await adminPage.locator("tbody").getByRole("button", { name: "수정", exact: true }).click();
                await adminPage.locator('#category-editor [name="name"]').fill("뷰티 체험 " + width);
                await adminPage.getByRole("button", { name: "분류 저장", exact: true }).click();
                await visit();
                await page.locator(".hero-title").waitFor();
                await activate(page.locator("#category-toggle"));
                await page.locator("#category-roots button").filter({ hasText: "뷰티 체험 " + width }).waitFor();
                await adminPage.locator('#category-editor [name="visible"]').selectOption("false");
                await adminPage.getByRole("button", { name: "분류 저장", exact: true }).click();
                await page.reload();
                await page.locator(".hero-title").waitFor();
                await activate(page.locator("#category-toggle"));
                await page.locator("#category-roots button").first().waitFor();
                assert.equal(await page.locator("#category-roots button").count(), 14);
                await adminPage.locator('#category-editor [name="visible"]').selectOption("true");
                await adminPage.getByRole("button", { name: "분류 저장", exact: true }).click();
                await adminVisit("orders");
                assert.equal(await adminPage.locator("tbody tr").count(), 2);
                await adminPage.getByRole("link", { name: "상세", exact: true }).first().click();
                await adminPage.locator(".admin-order-status").waitFor();
                const orderId = new URL(adminPage.url()).searchParams.get("id");
                await adminPage.locator('.admin-editor-form [name="status"]').selectOption("PREPARING");
                await adminPage.getByRole("button", { name: "주문 상태 저장", exact: true }).click();
                await adminPage.locator(".admin-order-status").filter({ hasText: "배송 준비" }).waitFor();
                await visit("order.jsp?id=" + orderId);
                await page.locator(".order-status").waitFor();
                assert.equal(await page.locator(".order-status").textContent(), "배송 준비");
                assert.equal(await page.evaluate((id) => window.Daiso.repository.getOrder(id).items[0].price, orderId), 1000);
                await adminPage.locator('.admin-editor-form [name="status"]').selectOption("CANCELLED");
                await adminPage.getByRole("button", { name: "주문 상태 저장", exact: true }).click();
                await adminPage.locator(".admin-order-status").filter({ hasText: "주문 취소" }).waitFor();
                await page.reload();
                await page.locator(".order-status").waitFor();
                assert.equal(await page.locator(".order-status").textContent(), "주문 취소");
                assert.equal(await page.evaluate(() => window.Daiso.repository.getProduct("REF-99962883").onlineStock), 12);
                assert(await adminPage.evaluate(() => {
                    const repository = window.Daiso.repository;
                    const failed = repository.getAllOrders().find((order) => order.status === "PAYMENT_FAILED");
                    try {
                        repository.updateOrderStatus(failed.id, "PAID");
                        return false;
                    } catch (error) {
                        return error.message.includes("허용되지 않는");
                    }
                }));
                await adminVisit("users");
                await searchAdmin("review" + width + "@example.test");
                await adminPage.getByRole("button", { name: "상태 수정", exact: true }).click();
                await adminPage.locator('.admin-editor-form [name="status"]').selectOption("SUSPENDED");
                await adminPage.getByRole("button", { name: "회원 상태 저장", exact: true }).click();
                await visit("mypage.jsp");
                await page.locator(".member-panel").waitFor();
                assert((await page.locator("#main-content").textContent()).includes("로그인 후"));
                await adminPage.locator('.admin-editor-form [name="status"]').selectOption("ACTIVE");
                await adminPage.getByRole("button", { name: "회원 상태 저장", exact: true }).click();
                await page.reload();
                await page.locator(".member-greeting").waitFor();
                await adminNoOverflow();
                await adminPage.screenshot({ path: path.join(output, `v0.${stage}-admin-users-${width}.png`), fullPage: true });
                await adminVisit("dashboard");
                adminPage.once("dialog", (dialog) => dialog.accept());
                await adminPage.getByRole("button", { name: "Mock 데이터 전체 초기화", exact: true }).click();
                await adminPage.waitForURL("**/login.jsp?next=admin");
                await visit();
                await page.locator(".hero-title").waitFor();
                assert.equal(await page.evaluate(() => window.Daiso.repository.getProducts().length), 732);
                assert.equal(await page.evaluate(() => window.Daiso.repository.getOrders().length), 0);
                await adminPage.close();
            }
            await visit("tests/common-layout.jsp");
            assert.equal(await page.locator('.navigation-links [aria-current="page"]').getAttribute("data-navigation-key"), "ranking");
            await noOverflow();
            assert.deepEqual(errors, []);
            results.viewports.push({ width, jsp: "passed", carousel: "passed", sharedNavigation: "passed", catalog: stage >= 3 ? "passed" : "pending", member: stage >= 5 ? "passed" : "pending", orders: stage >= 6 ? "passed" : "pending", admin: stage >= 7 ? "passed" : "pending", overflow: false, consoleErrors: errors });
            await context.close();
        }
        if (stage >= 7) {
            const context = await browser.newContext();
            const page = await context.newPage();
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(base + "product.jsp?id=REF-99962883");
            await page.getByRole("button", { name: "장바구니 담기", exact: true }).click();
            await page.locator('[data-member-route="login"]').click();
            await page.getByRole("button", { name: "체험 회원으로 로그인", exact: true }).click();
            await page.waitForURL("**/mypage.jsp");
            await page.locator('[data-shopping-route="cart"]').click();
            await page.locator(".cart-row").waitFor();
            assert.equal(await page.locator('.cart-row [name="quantity"]').inputValue(), "1");
            assert(await page.evaluate(() => {
                const repository = window.Daiso.repository;
                try {
                    repository.addCart("REF-99962883", -1);
                    return false;
                } catch (error) {
                    return repository.getCart()[0].quantity === 1;
                }
            }));
            await page.locator('[data-member-route="login"]').click();
            await page.waitForURL(base);
            await page.goto(base + "product.jsp?id=REF-1060398");
            await page.getByRole("button", { name: "장바구니 담기", exact: true }).click();
            await page.locator('[data-shopping-route="cart"]').click();
            await page.getByRole("link", { name: "주문하기", exact: true }).click();
            await page.locator('[name="recipient"]').fill("비회원 체험");
            await page.locator('[name="phone"]').fill("010-0000-0000");
            await page.locator('[name="postcode"]').fill("12345");
            await page.locator('[name="address"]').fill("비회원 테스트 주소 100");
            await page.getByRole("button", { name: "모의 결제하기", exact: true }).click();
            await page.waitForURL("**/payment-success.jsp?**");
            await page.locator(".order-status").waitFor();
            const guestOrderId = new URL(page.url()).searchParams.get("id");
            assert.equal(await page.evaluate((id) => window.Daiso.repository.getOrder(id).memberId, guestOrderId), "guest");
            await page.goto(base + "login.jsp");
            await page.getByRole("button", { name: "체험 회원으로 로그인", exact: true }).click();
            await page.waitForURL("**/mypage.jsp");
            assert.equal(await page.evaluate((id) => window.Daiso.repository.getOrder(id), guestOrderId), null);
            assert.equal(await page.evaluate(() => window.Daiso.repository.getCart().length), 1);
            assert(await page.evaluate(() => {
                try {
                    window.Daiso.repository.updateInventory("REF-1060398", "online", 100);
                    return false;
                } catch (error) {
                    return error.message.includes("관리자");
                }
            }));
            assert.deepEqual(errors, []);
            results.additional = { guestCartMerge: "passed", guestCheckout: "passed", orderOwnership: "passed", negativeQuantity: "passed", mockAdminGuard: "passed" };
            await page.route("**/assets/mock/categories.json", (route) => route.fulfill({ status: 503, body: "expected test failure" }));
            await page.goto(base);
            await page.locator('#main-content .error-message').waitFor();
            await page.locator("#category-toggle").click();
            await page.locator("#category-retry").waitFor();
            await page.unroute("**/assets/mock/categories.json");
            await page.locator("#category-retry").click();
            await page.locator("#category-roots button").first().waitFor();
            assert.equal(await page.locator("#category-roots button").count(), 15);
            await page.keyboard.press("Escape");
            await page.getByRole("button", { name: "다시 시도", exact: true }).click();
            await page.locator(".hero-title").waitFor();
            assert.deepEqual(errors, []);
            results.additional.seedErrorRecovery = "503 notice, category retry, page retry passed";
            await context.close();
        }
        fs.writeFileSync(path.join(output, `v0.${stage}-results.json`), JSON.stringify(results, null, 4) + "\n");
        console.log(JSON.stringify(results, null, 4));
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
