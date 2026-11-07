(() => {
    "use strict";

    const app = window.Daiso;
    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        if (text !== undefined) {
            node.textContent = text;
        }
        return node;
    }

    function link(label, file, params, className) {
        const node = element("a", className, label);
        node.href = app.url(file, params);
        return node;
    }

    function button(label, action, className = "button") {
        const node = element("button", className, label);
        node.type = "button";
        node.addEventListener("click", action);
        return node;
    }

    let noticeTimer;
    function notice(message) {
        const output = document.querySelector("#common-feature-status");
        if (output) {
            output.textContent = message;
            clearTimeout(noticeTimer);
            noticeTimer = setTimeout(() => {
                output.textContent = "";
            }, 5000);
        }
    }

    function productCard(product, { details = false } = {}) {
        const card = element("article", "product-card");
        card.dataset.productId = product.id;
        const cover = details ? link("", "product.jsp", { id: product.id }, "product-cover") : element("div", "product-cover");
        const image = element("img");
        image.src = app.url(product.image);
        image.alt = product.name + " (자체 제작 Mock 이미지)";
        image.loading = "lazy";
        cover.append(image);
        const unavailable = product.status !== "AVAILABLE" || product.onlineStock < 1;
        if (unavailable) {
            cover.append(element("span", "product-status", product.status === "SCHEDULED" ? "판매 예정" : "품절"));
        }
        card.append(cover, element("p", "product-price", money(product.price)));
        card.append(details ? link(product.name, "product.jsp", { id: product.id }, "product-name") : element("p", "product-name", product.name));
        const badges = element("div", "product-badges");
        const sourceLabels = { REFERENCE: "관찰 표본", GENERATED: "생성 샘플", ADMIN_EDITED: "수정 샘플" };
        badges.append(element("span", "badge", "택배배송"), element("span", "badge", sourceLabels[product.source.kind] || "Mock 상품"));
        card.append(badges, element("p", "product-rating", "★ " + product.rating.toFixed(1) + " (" + product.reviewCount + ") · Mock"));
        return card;
    }

    function money(value) {
        return new Intl.NumberFormat("ko-KR").format(value) + "원";
    }

    function empty(root, message) {
        root.append(element("p", "empty-state", message));
    }

    function error(root, cause) {
        root.replaceChildren(element("h1", "page-title", "화면을 표시하지 못했습니다"), element("p", "error-message", cause.message));
        root.append(button("다시 시도", () => location.reload()), button("Mock 데이터 초기화", () => {
            if (window.confirm("이 브라우저의 Mock 변경과 주문을 모두 초기화할까요?")) {
                if (app.repository) {
                    app.repository.reset();
                } else {
                    localStorage.removeItem(app.storageKey);
                    sessionStorage.removeItem("daisomall.mock.session");
                }
                location.reload();
            }
        }, "button secondary"));
    }

    app.ui = { element, link, button, notice, productCard, money, empty, error };
})();
