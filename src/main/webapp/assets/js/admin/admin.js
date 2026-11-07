(() => {
    "use strict";

    const app = window.Daiso;
    app.features = { ...app.features, admin: true };
    const root = document.querySelector("[data-admin-page]");
    if (!root) {
        return;
    }
    const { element, link, button, field, money, empty } = app.ui;
    const section = root.dataset.adminPage;
    const titles = { dashboard: "운영 대시보드", categories: "카테고리 관리", products: "상품 관리", inventory: "온라인 재고 관리", stores: "매장별 재고 관리", orders: "주문 관리", users: "사용자 관리" };

    function selectField(form, label, name, options, value) {
        const wrapper = element("label", "field", label);
        const select = element("select");
        select.name = name;
        options.forEach(([id, text]) => {
            const option = element("option", "", text);
            option.value = id;
            select.append(option);
        });
        if (value !== undefined) {
            select.value = value;
        }
        wrapper.append(select);
        form.append(wrapper);
        return select;
    }

    function formFeedback(form, action, label = "저장") {
        const status = element("p", "form-status");
        status.setAttribute("role", "status");
        const error = element("p", "error-message");
        error.setAttribute("role", "alert");
        const submit = element("button", "button primary", label);
        submit.type = "submit";
        form.append(error, status, submit);
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            error.textContent = "";
            status.textContent = "";
            try {
                action(Object.fromEntries(new FormData(form)));
                status.textContent = "저장했습니다. 고객 화면의 새 조회에 반영됩니다.";
            } catch (cause) {
                error.textContent = cause.message;
            }
        });
        return status;
    }

    function table(headers) {
        const wrapper = element("div", "admin-table-scroll");
        wrapper.tabIndex = 0;
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute("aria-label", titles[section] + " 표 (가로 스크롤 가능)");
        const node = element("table", "admin-table");
        const caption = element("caption", "visually-hidden", titles[section]);
        const head = element("thead");
        const row = element("tr");
        headers.forEach((header) => {
            const th = element("th", "", header);
            th.scope = "col";
            row.append(th);
        });
        head.append(row);
        const body = element("tbody");
        node.append(caption, head, body);
        wrapper.append(node);
        return { wrapper, body };
    }

    function addRow(body, values) {
        const row = element("tr");
        values.forEach((value) => {
            const cell = element("td");
            if (value instanceof Node) {
                cell.append(value);
            } else {
                cell.textContent = value;
            }
            row.append(cell);
        });
        body.append(row);
    }

    function searchBox(label = "이름 또는 ID 검색") {
        const form = element("form", "admin-search");
        const input = field(form, label, "query");
        input.required = false;
        const submit = element("button", "button", "검색");
        submit.type = "submit";
        form.append(submit);
        root.append(form);
        return { form, input };
    }

    function dashboard(repository) {
        const orders = repository.getAllOrders();
        const products = repository.getProducts();
        const grid = element("div", "admin-stats");
        [["상품", products.length + "개"], ["카테고리", repository.getCategories().length + "개"], ["주문", orders.length + "건"], ["결제된 주문 금액", money(orders.filter((order) => !["PAYMENT_FAILED", "CANCELLED"].includes(order.status)).reduce((sum, order) => sum + order.totals.total, 0))]].forEach(([label, value]) => {
            const card = element("section", "admin-stat");
            card.append(element("h2", "", label), element("strong", "", value));
            grid.append(card);
        });
        root.append(grid);
        const panel = element("section", "admin-panel");
        panel.append(element("h2", "", "작업 안내"), element("p", "", "같은 브라우저·같은 접속 주소의 Mock 데이터만 변경됩니다. 다른 탭의 고객 화면은 새로고침하면 최신 값을 조회합니다."));
        panel.append(element("p", "", "원본 JSON은 수정하지 않습니다. 초기화하면 생성 상품·회원·장바구니·주문·관리 변경을 모두 제거합니다."));
        panel.append(button("Mock 데이터 전체 초기화", () => {
            if (window.confirm("이 브라우저의 체험 데이터와 주문을 모두 초기화할까요?")) {
                repository.reset();
                location.href = app.url("login.jsp", { next: "admin" });
            }
        }, "button secondary"));
        root.append(panel);
    }

    function categoryManager(repository) {
        const editor = element("section", "admin-panel");
        editor.id = "category-editor";
        editor.append(element("p", "", "목록에서 분류를 선택하세요. ID·상위 관계·계층은 변경하지 않습니다. 같은 순서가 있으면 서로 교환합니다."));
        const { form, input } = searchBox();
        const categoryTable = table(["ID", "이름", "단계", "상위 ID", "순서", "노출", "관리"]);
        let limit = 40;
        const more = button("카테고리 더 보기", () => {
            limit += 40;
            render();
        }, "button secondary");
        const count = element("p", "admin-count");
        function edit(category) {
            editor.replaceChildren(element("h2", "", "분류 수정 · " + category.id));
            const editForm = element("form", "admin-editor-form");
            field(editForm, "분류명", "name", "text", category.name);
            const order = field(editForm, "표시 순서", "displayOrder", "number", category.displayOrder);
            order.min = 1;
            order.max = 999;
            selectField(editForm, "메뉴 노출", "visible", [["true", "노출"], ["false", "숨김"]], category.visible === false ? "false" : "true");
            formFeedback(editForm, (values) => {
                repository.saveCategory(category.id, { ...values, visible: values.visible === "true" });
                render();
            }, "분류 저장");
            editor.append(editForm);
            editor.scrollIntoView({ block: "start" });
        }
        function render() {
            const query = input.value.trim().toLowerCase();
            const categories = repository.getCategories().filter((category) => (category.name + " " + category.id).toLowerCase().includes(query));
            count.textContent = categories.length + "개 분류";
            categoryTable.body.replaceChildren();
            categories.slice(0, limit).forEach((category) => addRow(categoryTable.body, [category.id, category.name, category.level, category.parentId || "—", category.displayOrder, category.visible === false ? "숨김" : "노출", button("수정", () => edit(category), "text-button")]));
            more.hidden = categories.length <= limit;
        }
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            limit = 40;
            render();
        });
        root.append(editor, count, categoryTable.wrapper, more);
        render();
    }

    function productManager(repository) {
        const editor = element("section", "admin-panel");
        editor.id = "product-editor";
        const count = element("p", "admin-count");
        const { form, input } = searchBox();
        const productTable = table(["상품 ID", "상품명", "가격", "상태", "온라인 재고", "관리"]);
        let limit = 30;
        const more = button("상품 더 보기", () => {
            limit += 30;
            render();
        }, "button secondary");
        function edit(product) {
            editor.replaceChildren(element("h2", "", product ? "상품 수정 · " + product.id : "상품 등록"));
            const editForm = element("form", "admin-editor-form");
            field(editForm, "상품명", "name", "text", product ? product.name : "");
            field(editForm, "브랜드", "brand", "text", product ? product.brand : "샘플 생활연구소");
            const categories = repository.getCategories();
            const options = categories.filter((category) => category.isLeaf).map((category) => {
                const parent = categories.find((node) => node.id === category.parentId);
                const grandparent = parent && categories.find((node) => node.id === parent.parentId);
                return [category.id, [grandparent && grandparent.name, parent && parent.name, category.name].filter(Boolean).join(" › ")];
            });
            selectField(editForm, "카테고리 (최하위)", "categoryId", options, product ? product.categoryId : undefined);
            const price = field(editForm, "가격 (원)", "price", "number", product ? product.price : 1000);
            price.min = 1;
            price.max = 10000000;
            const stock = field(editForm, "온라인 재고", "onlineStock", "number", product ? product.onlineStock : 10);
            stock.min = 0;
            stock.max = 999999;
            selectField(editForm, "판매 상태", "status", [["AVAILABLE", "판매 중"], ["SOLD_OUT", "품절"], ["SCHEDULED", "판매 예정"]], product ? product.status : "AVAILABLE");
            selectField(editForm, "Mock 이미지", "image", Array.from({ length: 6 }, (_, index) => ["assets/images/mock-product-" + index + ".svg", "샘플 이미지 " + (index + 1)]), product ? product.image : undefined);
            const descriptionLabel = element("label", "field", "상품 설명");
            const description = element("textarea");
            description.name = "description";
            description.maxLength = 2000;
            description.rows = 4;
            description.value = product ? product.description : "관리자에서 만든 체험용 상품입니다.";
            descriptionLabel.append(description);
            editForm.append(descriptionLabel);
            formFeedback(editForm, (values) => {
                const saved = repository.saveProduct(product ? product.id : null, values);
                product = saved;
                render();
            }, "상품 저장");
            editor.append(editForm);
            editor.scrollIntoView({ block: "start" });
        }
        function render() {
            const query = input.value.trim().toLowerCase();
            const products = repository.getProducts().filter((product) => (product.name + " " + product.id).toLowerCase().includes(query));
            count.textContent = products.length + "개 상품";
            productTable.body.replaceChildren();
            products.slice(0, limit).forEach((product) => addRow(productTable.body, [product.id, product.name, money(product.price), product.status, product.onlineStock, button("수정", () => edit(product), "text-button")]));
            more.hidden = products.length <= limit;
        }
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            limit = 30;
            render();
        });
        root.append(button("상품 등록", () => edit(null), "button primary"), editor, count, productTable.wrapper, more);
        render();
    }

    function inventoryManager(repository) {
        const { form, input } = searchBox();
        const stockTable = table(["상품 ID", "상품명", "온라인", "서울", "부산", "제주", "관리"]);
        const editor = element("section", "admin-panel");
        const count = element("p");
        let limit = 30;
        const more = button("재고 더 보기", () => {
            limit += 30;
            render();
        }, "button secondary");
        function edit(product) {
            editor.replaceChildren(element("h2", "", product.name + " 재고 수정"));
            const editForm = element("form", "admin-editor-form");
            const locations = section === "inventory" ? [["online", "온라인"]] : repository.getStores().map((store) => [store.id, store.name]);
            const select = selectField(editForm, "재고 위치", "location", locations);
            const quantity = field(editForm, "재고 수량", "quantity", "number", section === "inventory" ? product.onlineStock : product.storeStocks[select.value]);
            quantity.min = 0;
            quantity.max = 999999;
            select.addEventListener("change", () => {
                const current = repository.getProduct(product.id);
                quantity.value = select.value === "online" ? current.onlineStock : current.storeStocks[select.value];
            });
            formFeedback(editForm, (values) => {
                repository.updateInventory(product.id, values.location, values.quantity);
                render();
            }, "재고 저장");
            editor.append(editForm);
            editor.scrollIntoView({ block: "start" });
        }
        function render() {
            const query = input.value.trim().toLowerCase();
            const products = repository.getProducts().filter((product) => (product.id + " " + product.name).toLowerCase().includes(query));
            count.textContent = products.length + "개 상품";
            stockTable.body.replaceChildren();
            products.slice(0, limit).forEach((product) => addRow(stockTable.body, [product.id, product.name, product.onlineStock, product.storeStocks.seoul, product.storeStocks.busan, product.storeStocks.jeju, button("재고 수정", () => edit(product), "text-button")]));
            more.hidden = products.length <= limit;
        }
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            limit = 30;
            render();
        });
        root.append(editor, count, stockTable.wrapper, more);
        render();
    }

    function orderManager(repository) {
        const params = new URLSearchParams(location.search);
        const id = params.get("id");
        const orders = repository.getAllOrders();
        if (id) {
            const order = orders.find((item) => item.id === id);
            if (!order) {
                empty(root, "주문을 찾을 수 없습니다.");
                return;
            }
            const panel = element("section", "admin-panel");
            panel.append(element("h2", "", order.id), element("p", "", "회원 ID: " + order.memberId), element("p", "admin-order-status", app.ui.orderStatus(order.status)), element("p", "", order.recipient + " / " + order.address), element("p", "", order.phone));
            const items = element("ul", "order-items");
            order.items.forEach((item) => items.append(element("li", "", item.name + " · " + item.quantity + "개 · " + money(item.lineTotal))));
            panel.append(items, element("p", "", "결제 합계 " + money(order.totals.total)));
            const transitions = repository.orderTransitions(order.status);
            if (transitions.length) {
                const form = element("form", "admin-editor-form");
                selectField(form, "변경할 주문 상태", "status", transitions.map((status) => [status, app.ui.orderStatus(status)]));
                formFeedback(form, (values) => {
                    repository.updateOrderStatus(order.id, values.status);
                    location.reload();
                }, "주문 상태 저장");
                panel.append(form);
            } else {
                panel.append(element("p", "", "현재 상태에서 변경 가능한 다음 상태가 없습니다."));
            }
            root.append(panel, link("주문 목록으로", "admin/", { view: "orders" }, "button secondary"));
            return;
        }
        const { form, input } = searchBox("주문 ID 또는 회원 ID 검색");
        const orderTable = table(["주문 ID", "회원 ID", "주문 일시", "금액", "상태", "관리"]);
        function render() {
            orderTable.body.replaceChildren();
            const query = input.value.trim().toLowerCase();
            orders.filter((order) => (order.id + " " + order.memberId).toLowerCase().includes(query)).forEach((order) => addRow(orderTable.body, [order.id, order.memberId, new Date(order.createdAt).toLocaleString("ko-KR"), money(order.totals.total), app.ui.orderStatus(order.status), link("상세", "admin/", { view: "orders", id: order.id }, "text-button")]));
        }
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            render();
        });
        root.append(orderTable.wrapper);
        if (!orders.length) {
            empty(root, "체험 주문이 없습니다. 고객 화면에서 모의 주문을 만들어 보세요.");
        }
        render();
    }

    function userManager(repository) {
        const { form, input } = searchBox("회원 이름 또는 이메일 검색");
        const userTable = table(["회원 ID", "이름", "이메일", "유형", "상태", "관리"]);
        const editor = element("section", "admin-panel");
        function edit(member) {
            editor.replaceChildren(element("h2", "", member.name + " 상태 관리"));
            const editForm = element("form", "admin-editor-form");
            selectField(editForm, "회원 상태", "status", [["ACTIVE", "활성"], ["SUSPENDED", "이용 중지"]], member.status);
            formFeedback(editForm, (values) => {
                repository.updateMemberStatus(member.id, values.status);
                render();
            }, "회원 상태 저장");
            editor.append(editForm);
            editor.scrollIntoView({ block: "start" });
        }
        function render() {
            const query = input.value.trim().toLowerCase();
            userTable.body.replaceChildren();
            repository.getMembers().filter((member) => (member.name + " " + member.email).toLowerCase().includes(query)).forEach((member) => {
                const editButton = button("상태 수정", () => edit(member), "text-button");
                editButton.disabled = member.id === repository.getSession().id;
                addRow(userTable.body, [member.id, member.name, member.email, member.role, member.status, editButton]);
            });
        }
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            render();
        });
        root.append(editor, userTable.wrapper);
        render();
    }

    app.ready.then((repository) => {
        root.replaceChildren(element("p", "admin-eyebrow", "MOCK COMMERCE OPERATIONS"), element("h1", "page-title", titles[section]));
        document.querySelectorAll("[data-admin-link]").forEach((item) => {
            if (item.dataset.adminLink === section) {
                item.setAttribute("aria-current", "page");
            }
        });
        try {
            repository.requireAdmin();
        } catch (error) {
            root.append(element("p", "source-note", "관리자 체험 로그인이 필요합니다. 이 화면의 권한 검사는 실제 보안 인증이 아닙니다."), link("관리자 로그인", "login.jsp", { next: "admin" }, "button primary"));
            return;
        }
        const renderers = { dashboard, categories: categoryManager, products: productManager, inventory: inventoryManager, stores: inventoryManager, orders: orderManager, users: userManager };
        renderers[section](repository);
    }).catch((error) => app.ui.error(root, error));
})();
