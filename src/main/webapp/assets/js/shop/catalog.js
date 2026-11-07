(() => {
    "use strict";

    const app = window.Daiso;
    app.features = { ...app.features, catalog: true };
    const { element, link, button, productCard, money, empty, notice } = app.ui;
    document.addEventListener("category:select", (event) => {
        if (event.detail.isLeaf || event.detail.navigate) {
            location.href = app.url("list.jsp", { category: event.detail.id });
        }
    });
    document.querySelectorAll("[data-navigation-key]").forEach((item) => {
        const key = item.dataset.navigationKey;
        const choices = { new: "newest", ranking: "recommended", rating: "rating", exhibitions: "recommended", "open-run": "newest", season: "newest", "selling-out": "recommended", beauty: "recommended", health: "recommended" };
        if (choices[key]) {
            item.removeAttribute("data-unavailable");
            item.addEventListener("click", () => {
                location.href = app.url("list.jsp", { sort: choices[key], category: key === "beauty" ? "CTGR_01050" : undefined, collection: key });
            });
        }
    });

    function pathToCategory(categories, id) {
        const path = [];
        let category = categories.find((item) => item.id === id);
        while (category) {
            path.unshift(category);
            category = categories.find((item) => item.id === category.parentId);
        }
        return path;
    }

    function breadcrumbs(categories, categoryId) {
        const nav = element("nav", "breadcrumbs");
        nav.setAttribute("aria-label", "현재 위치");
        nav.append(link("홈", ""));
        pathToCategory(categories, categoryId).forEach((category) => nav.append(element("span", "", "›"), link(category.name, "list.jsp", { category: category.id })));
        return nav;
    }

    function renderCatalog(root, repository) {
        const params = new URLSearchParams(location.search);
        const categoryId = params.get("category");
        const query = params.get("q") || "";
        const categories = repository.getVisibleCategories();
        const category = categories.find((item) => item.id === categoryId);
        if (categoryId && !category) {
            empty(root, "존재하지 않는 카테고리입니다.");
            root.append(link("전체 상품 보기", "list.jsp", {}, "button"));
            return;
        }
        root.append(breadcrumbs(categories, categoryId), element("h1", "page-title", query ? "‘" + query + "’ 검색 결과" : category ? category.name : "전체 상품"));
        const chips = element("nav", "category-chips");
        chips.setAttribute("aria-label", "하위 카테고리");
        categories.filter((item) => item.parentId === (categoryId || null)).sort((left, right) => left.displayOrder - right.displayOrder).forEach((child) => chips.append(link(child.name, "list.jsp", { category: child.id }, "category-chip")));
        root.append(chips);
        const layout = element("div", "catalog-layout");
        const filter = element("form", "catalog-filter");
        const filterTitle = element("h2", "", "상품 필터");
        const priceLabel = element("label", "field", "최대 가격");
        const price = element("select");
        price.name = "maxPrice";
        [["", "전체 가격"], ["1000", "1,000원 이하"], ["3000", "3,000원 이하"], ["5000", "5,000원 이하"]].forEach(([value, label]) => {
            const option = element("option", "", label);
            option.value = value;
            price.append(option);
        });
        price.value = params.get("maxPrice") || "";
        priceLabel.append(price);
        const stockLabel = element("label", "check-field");
        const stock = element("input");
        stock.type = "checkbox";
        stock.name = "available";
        stock.checked = params.get("available") === "true";
        stockLabel.append(stock, element("span", "", "구매 가능한 상품만"));
        filter.append(filterTitle, priceLabel, stockLabel);
        const section = element("section", "catalog-products");
        const toolbar = element("div", "catalog-toolbar");
        const count = element("p", "result-count");
        const sortLabel = element("label", "sort-label", "정렬 ");
        const sort = element("select");
        sort.name = "sort";
        [["recommended", "추천순"], ["newest", "신상품순"], ["priceAsc", "가격낮은순"], ["priceDesc", "가격높은순"], ["rating", "별점순"]].forEach(([value, label]) => {
            const option = element("option", "", label);
            option.value = value;
            sort.append(option);
        });
        sort.value = params.get("sort") || "recommended";
        if (!sort.value) {
            sort.value = "recommended";
        }
        sortLabel.append(sort);
        toolbar.append(count, sortLabel);
        const grid = element("div", "product-grid catalog-grid");
        const more = button("상품 더 보기", () => {
            visible += 30;
            update(false);
        }, "button secondary load-more");
        let visible = 30;
        function update(reset = true) {
            if (reset) {
                visible = 30;
            }
            const products = repository.queryProducts({ categoryId, query, sort: sort.value, maxPrice: price.value || Infinity, availableOnly: stock.checked });
            count.textContent = "전체 " + products.length + "개";
            grid.replaceChildren();
            products.slice(0, visible).forEach((product) => grid.append(productCard(product, { details: true })));
            if (!products.length) {
                empty(grid, "조건에 맞는 상품이 없습니다. 필터나 검색어를 바꿔 보세요.");
            }
            more.hidden = visible >= products.length;
            const next = new URL(location.href);
            [["sort", sort.value], ["maxPrice", price.value], ["available", stock.checked ? "true" : ""]].forEach(([key, value]) => {
                if (value) {
                    next.searchParams.set(key, value);
                } else {
                    next.searchParams.delete(key);
                }
            });
            history.replaceState(null, "", next);
        }
        [price, stock, sort].forEach((control) => control.addEventListener("change", () => update()));
        filter.addEventListener("submit", (event) => event.preventDefault());
        filter.append(button("필터 초기화", () => {
            price.value = "";
            stock.checked = false;
            sort.value = "recommended";
            update();
        }, "text-button"));
        section.append(toolbar, grid, more);
        layout.append(filter, section);
        root.append(layout);
        update();
    }

    function renderProduct(root, repository) {
        const product = repository.getProduct(new URLSearchParams(location.search).get("id"));
        if (!product) {
            empty(root, "상품을 찾을 수 없습니다.");
            root.append(link("상품 목록으로", "list.jsp", {}, "button"));
            return;
        }
        root.append(breadcrumbs(repository.getCategories(), product.categoryId));
        const layout = element("div", "product-detail-layout");
        const image = element("img", "detail-image");
        image.src = app.url(product.image);
        image.alt = product.name + " 자체 제작 Mock 이미지";
        const info = element("section", "detail-info");
        info.append(element("p", "eyebrow", product.brand), element("h1", "page-title", product.name), element("p", "detail-price", money(product.price)));
        info.append(element("p", "", "★ " + product.rating + " · 리뷰 " + product.reviewCount + " (Mock)"));
        info.append(element("p", "source-note", product.source.note), element("p", "", "품번 " + product.id));
        const status = product.status === "SCHEDULED" ? "판매 예정" : product.status === "SOLD_OUT" || !product.onlineStock ? "품절" : "구매 가능";
        info.append(element("p", "stock-status", status + " · 온라인 Mock 재고 " + product.onlineStock + "개"));
        const delivery = element("div", "delivery-summary");
        delivery.append(element("strong", "", "택배배송"), element("p", "", "배송비 3,000원 · 상품 30,000원 이상 무료"));
        info.append(delivery);
        const stores = element("details", "store-stock");
        stores.append(element("summary", "", "체험 매장 재고 보기"));
        repository.getStores().forEach((store) => stores.append(element("p", "", store.name + " · " + (product.storeStocks[store.id] || 0) + "개 (Mock)")));
        info.append(stores);
        const quantityLabel = element("label", "field", "수량");
        const quantity = element("input");
        quantity.type = "number";
        quantity.name = "quantity";
        quantity.min = "1";
        quantity.max = String(Math.min(99, product.onlineStock));
        quantity.value = "1";
        quantityLabel.append(quantity);
        const total = element("p", "detail-total", "합계 " + money(product.price));
        quantity.addEventListener("input", () => {
            total.textContent = "합계 " + money(product.price * Math.max(0, Number(quantity.value)));
        });
        const add = button("장바구니 담기", () => {
            if (!quantity.checkValidity()) {
                quantity.reportValidity();
                return;
            }
            if (app.repository.addCart) {
                try {
                    app.repository.addCart(product.id, Number(quantity.value));
                    notice("장바구니에 담았습니다.");
                } catch (error) {
                    notice(error.message);
                }
            } else {
                notice("장바구니 기능은 다음 단계에서 연결됩니다.");
            }
        }, "button primary");
        add.disabled = status !== "구매 가능";
        info.append(quantityLabel, total, add);
        layout.append(image, info);
        root.append(layout);
        const description = element("section", "product-description");
        description.append(element("h2", "", "상품 설명"), element("p", "", product.description));
        const details = element("details");
        details.append(element("summary", "", "상품 정보 및 반품 안내"), element("p", "", "본 화면은 학습용 Mock입니다. 제조·인증·반품 정책은 실제 구매 정보가 아니며 백엔드 연동 전 별도 확정합니다."));
        description.append(details);
        root.append(description);
    }

    const root = document.querySelector('[data-page="catalog"], [data-page="product"]');
    if (root) {
        app.ready.then((repository) => {
            root.replaceChildren();
            if (root.dataset.page === "catalog") {
                renderCatalog(root, repository);
            } else {
                renderProduct(root, repository);
            }
        }).catch((error) => app.ui.error(root, error));
    }
})();
