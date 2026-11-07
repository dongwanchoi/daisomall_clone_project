(() => {
    "use strict";

    const app = window.Daiso;
    app.features = { ...app.features, orders: true };
    const { element, link, button, money, empty, field } = app.ui;
    const labels = { PAID: "결제 완료", PAYMENT_FAILED: "결제 실패", PREPARING: "배송 준비", SHIPPED: "배송 중", DELIVERED: "배송 완료", CANCELLED: "주문 취소" };
    app.ui.orderStatus = (status) => labels[status] || status;
    const root = document.querySelector("[data-page]");

    function totalsPanel(totals) {
        const panel = element("section", "totals-panel");
        panel.append(element("h2", "", "주문 금액"));
        [["상품 금액", totals.subtotal], ["배송비", totals.shipping], ["총 결제 금액", totals.total]].forEach(([label, value]) => {
            const row = element("div", "total-row");
            row.append(element("span", "", label), element("strong", "", money(value)));
            panel.append(row);
        });
        return panel;
    }

    function itemList(items) {
        const list = element("ul", "order-items");
        items.forEach((item) => {
            const row = element("li");
            row.append(link(item.name, "product.jsp", { id: item.productId }), element("span", "", item.quantity + "개 · " + money(item.lineTotal)));
            list.append(row);
        });
        return list;
    }

    function renderCart(repository) {
        root.replaceChildren(element("h1", "page-title", "장바구니"));
        const items = repository.getCart();
        if (!items.length) {
            empty(root, "장바구니가 비어 있습니다.");
            root.append(link("상품 둘러보기", "list.jsp", {}, "button primary"));
            return;
        }
        const layout = element("div", "checkout-layout");
        const list = element("div", "cart-list");
        const error = element("p", "error-message");
        error.setAttribute("role", "alert");
        items.forEach((line) => {
            const row = element("article", "cart-row");
            row.dataset.productId = line.productId;
            if (line.product) {
                const image = element("img");
                image.src = app.url(line.product.image);
                image.alt = "";
                const info = element("div", "cart-product-info");
                info.append(link(line.product.name, "product.jsp", { id: line.productId }), element("p", "", money(line.product.price)));
                if (!line.purchasable) {
                    info.append(element("p", "error-message", "판매 상태 또는 재고를 확인해 주세요."));
                }
                row.append(image, info);
            } else {
                row.append(element("p", "", "삭제되었거나 존재하지 않는 상품"));
            }
            const quantityLabel = element("label", "field", "수량");
            const quantity = element("input");
            quantity.type = "number";
            quantity.name = "quantity";
            quantity.min = "1";
            quantity.max = "99";
            quantity.value = line.quantity;
            quantity.addEventListener("change", () => {
                try {
                    repository.setCartQuantity(line.productId, Number(quantity.value));
                    renderCart(repository);
                } catch (cause) {
                    error.textContent = cause.message;
                    quantity.value = line.quantity;
                }
            });
            quantityLabel.append(quantity);
            row.append(quantityLabel, element("strong", "", money(line.lineTotal)), button("삭제", () => {
                repository.removeCart(line.productId);
                renderCart(repository);
            }, "text-button"));
            list.append(row);
        });
        list.append(error);
        const totals = totalsPanel(repository.cartTotals());
        if (items.every((line) => line.purchasable)) {
            totals.append(link("주문하기", "checkout.jsp", {}, "button primary"));
        } else {
            totals.append(element("p", "error-message", "모든 상품의 상태와 재고를 확인한 후 주문할 수 있습니다."));
        }
        layout.append(list, totals);
        root.append(layout);
    }

    function renderCheckout(repository) {
        root.append(element("h1", "page-title", "주문서"));
        const items = repository.getCart();
        if (!items.length) {
            empty(root, "주문할 상품이 없습니다.");
            root.append(link("장바구니로", "cart.jsp", {}, "button"));
            return;
        }
        root.append(element("p", "source-note", "실제 결제가 발생하지 않는 모의 주문입니다. 테스트용 배송 정보를 입력해 주세요."));
        const layout = element("div", "checkout-layout");
        const form = element("form", "checkout-form");
        form.append(element("h2", "", "배송 정보"));
        const member = repository.getSession();
        field(form, "받는 분", "recipient", "text", member ? member.name : "");
        field(form, "연락처", "phone", "tel", member ? member.phone : "");
        const postcode = field(form, "우편번호 (5자리)", "postcode");
        postcode.pattern = "[0-9]{5}";
        postcode.maxLength = 5;
        field(form, "주소", "address");
        const memo = field(form, "배송 요청사항 (선택)", "memo");
        memo.required = false;
        const paymentLabel = element("label", "field", "모의 결제 결과 선택");
        const payment = element("select");
        payment.name = "outcome";
        [["success", "성공"], ["failure", "실패"]].forEach(([value, label]) => {
            const option = element("option", "", label);
            option.value = value;
            payment.append(option);
        });
        paymentLabel.append(payment);
        form.append(paymentLabel);
        const error = element("p", "error-message");
        error.setAttribute("role", "alert");
        const submit = element("button", "button primary", "모의 결제하기");
        submit.type = "submit";
        form.append(error, submit);
        const token = crypto.randomUUID();
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            submit.disabled = true;
            try {
                const order = repository.placeOrder({ ...Object.fromEntries(new FormData(form)), token });
                location.href = app.url(order.status === "PAYMENT_FAILED" ? "payment-failure.jsp" : "payment-success.jsp", { id: order.id });
            } catch (cause) {
                error.textContent = cause.message;
                submit.disabled = false;
            }
        });
        const totals = totalsPanel(repository.cartTotals());
        totals.prepend(itemList(items.map((line) => ({ ...line.product, productId: line.productId, quantity: line.quantity, lineTotal: line.lineTotal }))));
        layout.append(form, totals);
        root.append(layout);
    }

    function renderOrders(repository) {
        root.append(element("h1", "page-title", "주문 내역"));
        if (!repository.getSession()) {
            root.append(element("p", "source-note", "현재 브라우저의 비회원 체험 주문만 표시합니다."));
        }
        const orders = repository.getOrders();
        if (!orders.length) {
            empty(root, "주문 내역이 없습니다.");
        }
        orders.forEach((order) => {
            const row = element("article", "order-summary");
            row.append(element("p", "", new Date(order.createdAt).toLocaleString("ko-KR")), element("h2", "", labels[order.status]), itemList(order.items), element("strong", "", money(order.totals.total)), link("주문 상세", "order.jsp", { id: order.id }, "button secondary"));
            root.append(row);
        });
    }

    function renderOrder(repository, page) {
        const order = repository.getOrder(new URLSearchParams(location.search).get("id"));
        if (!order) {
            empty(root, "현재 회원의 주문을 찾을 수 없습니다.");
            root.append(link("주문 내역", "orders.jsp", {}, "button"));
            return;
        }
        const failed = order.status === "PAYMENT_FAILED";
        const title = page === "order" ? "주문 상세" : failed ? "모의 결제에 실패했습니다" : "주문이 완료되었습니다";
        root.append(element("h1", "page-title", title), element("p", "order-status", labels[order.status]), element("p", "order-number", order.id));
        root.append(element("p", "source-note", failed ? "결제 실패로 장바구니와 Mock 재고를 유지했습니다. 다시 주문할 수 있습니다." : "실제 결제나 배송이 발생하지 않는 체험 주문입니다."));
        const layout = element("div", "checkout-layout");
        const detail = element("section", "order-detail");
        detail.append(itemList(order.items), element("h2", "", "배송 정보"), element("p", "", order.recipient + " · " + order.phone), element("p", "", "(" + order.postcode + ") " + order.address), element("p", "", order.memo));
        layout.append(detail, totalsPanel(order.totals));
        root.append(layout, link(failed ? "장바구니에서 다시 시도" : "주문 내역 보기", failed ? "cart.jsp" : "orders.jsp", {}, "button primary"));
    }

    app.ready.then((repository) => {
        document.querySelectorAll('[data-shopping-route="cart"]').forEach((control) => {
            control.removeAttribute("data-unavailable");
            control.addEventListener("click", () => {
                location.href = app.url("cart.jsp");
            });
        });
        document.querySelectorAll('[data-shopping-route="orders"]').forEach((control) => {
            control.removeAttribute("data-unavailable");
            control.addEventListener("click", () => {
                location.href = app.url("orders.jsp");
            });
        });
        if (!root || !["cart", "checkout", "payment-success", "payment-failure", "orders", "order"].includes(root.dataset.page)) {
            return;
        }
        root.replaceChildren();
        const page = root.dataset.page;
        if (page === "cart") {
            renderCart(repository);
        } else if (page === "checkout") {
            renderCheckout(repository);
        } else if (page === "orders") {
            renderOrders(repository);
        } else {
            renderOrder(repository, page);
        }
    }).catch((error) => {
        if (root) {
            app.ui.error(root, error);
        }
    });
})();
