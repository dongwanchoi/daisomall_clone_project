(() => {
    "use strict";

    const script = document.currentScript;
    const base = new URL("../../../", script.src);
    const storageKey = "daisomall.mock.v1";
    const copy = (value) => JSON.parse(JSON.stringify(value));

    async function readJson(file) {
        const response = await fetch(new URL("assets/mock/" + file, base));
        if (!response.ok) {
            throw new Error("초기 데이터를 불러오지 못했습니다: " + response.status);
        }
        return response.json();
    }

    function readState() {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return { schemaVersion: 1, productOverrides: {}, categoryOverrides: {}, createdProducts: [], carts: {}, orders: [], members: [] };
        }
        const state = JSON.parse(raw);
        if (state.schemaVersion !== 1 || !state.productOverrides || !Array.isArray(state.orders)) {
            throw new Error("Mock 저장 형식이 올바르지 않습니다. Mock 데이터 초기화가 필요합니다.");
        }
        return state;
    }

    function writeState(state) {
        localStorage.setItem(storageKey, JSON.stringify(state));
        window.dispatchEvent(new Event("mock:changed"));
    }

    window.Daiso = {
        base,
        storageKey,
        url(file, params = {}) {
            const url = new URL(file, base);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    url.searchParams.set(key, value);
                }
            });
            return url.href;
        },
    };

    window.Daiso.ready = Promise.all([readJson("categories.json"), readJson("products.json"), readJson("members.json"), readJson("stores.json")]).then(([categoryData, productData, memberData, storeData]) => {
        const repository = {
            getCategories() {
                const state = readState();
                return copy(categoryData.categories.map((category) => ({ ...category, ...state.categoryOverrides[category.id] })));
            },
            getVisibleCategories() {
                const categories = repository.getCategories();
                const visibleIds = new Set();
                for (let level = 1; level <= 3; level += 1) {
                    categories.forEach((category) => {
                        if (category.level === level && category.visible !== false && (!category.parentId || visibleIds.has(category.parentId))) {
                            visibleIds.add(category.id);
                        }
                    });
                }
                return categories.filter((category) => visibleIds.has(category.id));
            },
            getProducts() {
                const state = readState();
                return copy([...productData.products, ...state.createdProducts].map((product) => ({ ...product, ...state.productOverrides[product.id] })));
            },
            getProduct(id) {
                return repository.getProducts().find((product) => product.id === id) || null;
            },
            queryProducts({ categoryId, query = "", sort = "recommended", maxPrice = Infinity, availableOnly = false } = {}) {
                const categories = repository.getVisibleCategories();
                const descendants = new Set(categoryId && categories.some((category) => category.id === categoryId) ? [categoryId] : categoryId ? [] : categories.map((category) => category.id));
                for (let level = 1; level <= 3; level += 1) {
                    categories.forEach((category) => {
                        if (descendants.has(category.parentId)) {
                            descendants.add(category.id);
                        }
                    });
                }
                const keyword = query.trim().toLocaleLowerCase();
                const matches = repository.getProducts().filter((product) => descendants.has(product.categoryId)
                    && (product.name + " " + product.brand).toLocaleLowerCase().includes(keyword)
                    && product.price <= Number(maxPrice)
                    && (!availableOnly || product.status === "AVAILABLE" && product.onlineStock > 0));
                const comparators = {
                    recommended: (left, right) => right.sales - left.sales,
                    priceAsc: (left, right) => left.price - right.price,
                    priceDesc: (left, right) => right.price - left.price,
                    newest: (left, right) => right.createdAt.localeCompare(left.createdAt),
                    rating: (left, right) => right.rating - left.rating,
                };
                return matches.sort(comparators[sort] || comparators.recommended);
            },
            getMembers() {
                const state = readState();
                const members = new Map(memberData.members.map((member) => [member.id, member]));
                state.members.forEach((member) => members.set(member.id, member));
                return copy(Array.from(members.values()));
            },
            getSession() {
                const id = sessionStorage.getItem("daisomall.mock.session");
                return repository.getMembers().find((member) => member.id === id && member.status === "ACTIVE") || null;
            },
            login(email, password) {
                const member = repository.getMembers().find((item) => item.email === email.trim().toLowerCase());
                if (!member || member.status !== "ACTIVE" || typeof password !== "string" || password.length < 4) {
                    throw new Error("체험 가능한 회원 이메일과 4자 이상의 임의 비밀번호를 입력해 주세요.");
                }
                const state = readState();
                if (state.carts.guest && state.carts.guest.length) {
                    const merged = new Map((state.carts[member.id] || []).map((line) => [line.productId, line.quantity]));
                    state.carts.guest.forEach((line) => merged.set(line.productId, Math.min(99, (merged.get(line.productId) || 0) + line.quantity)));
                    state.carts[member.id] = Array.from(merged, ([productId, quantity]) => ({ productId, quantity }));
                    delete state.carts.guest;
                    writeState(state);
                }
                sessionStorage.setItem("daisomall.mock.session", member.id);
                window.dispatchEvent(new Event("mock:session"));
                return copy(member);
            },
            logout() {
                sessionStorage.removeItem("daisomall.mock.session");
                window.dispatchEvent(new Event("mock:session"));
            },
            register({ email, name, phone, password }) {
                const normalizedEmail = email.trim().toLowerCase();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !name.trim()
                        || !/^[0-9 -]{8,20}$/.test(phone) || password.length < 4) {
                    throw new Error("이메일, 이름, 전화번호와 4자 이상 비밀번호를 확인해 주세요.");
                }
                if (repository.getMembers().some((member) => member.email === normalizedEmail)) {
                    throw new Error("이미 등록된 이메일입니다.");
                }
                const state = readState();
                const member = { id: "member-" + crypto.randomUUID(), email: normalizedEmail, name: name.trim(), phone, role: "MEMBER", status: "ACTIVE" };
                state.members.push(member);
                writeState(state);
                return copy(member);
            },
            saveProfile({ name, phone }) {
                const member = repository.getSession();
                if (!member) {
                    throw new Error("Mock 로그인이 필요합니다.");
                }
                if (!name.trim() || !/^[0-9 -]{8,20}$/.test(phone)) {
                    throw new Error("이름과 전화번호를 확인해 주세요.");
                }
                const updated = { ...member, name: name.trim(), phone };
                const state = readState();
                state.members = state.members.filter((item) => item.id !== member.id);
                state.members.push(updated);
                writeState(state);
                return copy(updated);
            },
            getOwnerId() {
                const member = repository.getSession();
                return member ? member.id : "guest";
            },
            getCart() {
                const state = readState();
                return (state.carts[repository.getOwnerId()] || []).map((line) => {
                    const product = repository.getProduct(line.productId);
                    return {
                        ...line,
                        product,
                        lineTotal: product ? product.price * line.quantity : 0,
                        purchasable: Boolean(product && product.status === "AVAILABLE" && product.onlineStock >= line.quantity),
                    };
                });
            },
            addCart(productId, quantity = 1) {
                repository.validateQuantity(productId, quantity);
                const state = readState();
                const owner = repository.getOwnerId();
                const lines = state.carts[owner] || [];
                const existing = lines.find((line) => line.productId === productId);
                const nextQuantity = (existing ? existing.quantity : 0) + quantity;
                repository.validateQuantity(productId, nextQuantity);
                if (existing) {
                    existing.quantity = nextQuantity;
                } else {
                    lines.push({ productId, quantity });
                }
                state.carts[owner] = lines;
                writeState(state);
            },
            validateQuantity(productId, quantity) {
                const product = repository.getProduct(productId);
                if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
                    throw new Error("수량은 1~99 사이의 정수여야 합니다.");
                }
                if (!product || product.status !== "AVAILABLE" || quantity > product.onlineStock) {
                    throw new Error("구매 가능한 상태와 온라인 재고를 확인해 주세요.");
                }
            },
            setCartQuantity(productId, quantity) {
                repository.validateQuantity(productId, quantity);
                const state = readState();
                const line = (state.carts[repository.getOwnerId()] || []).find((item) => item.productId === productId);
                if (!line) {
                    throw new Error("장바구니에서 상품을 찾을 수 없습니다.");
                }
                line.quantity = quantity;
                writeState(state);
            },
            removeCart(productId) {
                const state = readState();
                const owner = repository.getOwnerId();
                state.carts[owner] = (state.carts[owner] || []).filter((line) => line.productId !== productId);
                writeState(state);
            },
            cartTotals() {
                const items = repository.getCart();
                const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0);
                const shipping = subtotal > 0 && subtotal < 30000 ? 3000 : 0;
                return { subtotal, shipping, total: subtotal + shipping };
            },
            placeOrder({ recipient, phone, postcode, address, memo = "", outcome, token }) {
                const state = readState();
                const owner = repository.getOwnerId();
                const previous = state.orders.find((order) => order.checkoutToken === token && order.memberId === owner);
                if (previous) {
                    return copy(previous);
                }
                if (!recipient || !recipient.trim() || !/^[0-9 -]{8,20}$/.test(phone || "")
                        || !/^\d{5}$/.test(postcode || "") || !address || address.trim().length < 5
                        || !["success", "failure"].includes(outcome) || !token) {
                    throw new Error("배송 정보와 모의 결제 결과를 확인해 주세요.");
                }
                const cart = repository.getCart();
                if (!cart.length || cart.some((line) => !line.purchasable)) {
                    throw new Error("장바구니와 구매 가능한 재고를 다시 확인해 주세요.");
                }
                cart.forEach((line) => repository.validateQuantity(line.productId, line.quantity));
                const totals = repository.cartTotals();
                const order = {
                    id: "ORDER-" + Date.now() + "-" + crypto.randomUUID().slice(0, 8),
                    checkoutToken: token,
                    memberId: owner,
                    createdAt: new Date().toISOString(),
                    status: outcome === "success" ? "PAID" : "PAYMENT_FAILED",
                    recipient: recipient.trim(),
                    phone,
                    postcode,
                    address: address.trim(),
                    memo: memo.trim(),
                    items: cart.map((line) => ({ productId: line.productId, name: line.product.name, image: line.product.image, price: line.product.price, quantity: line.quantity, lineTotal: line.lineTotal })),
                    totals,
                    mockPayment: true,
                };
                if (outcome === "success") {
                    cart.forEach((line) => {
                        state.productOverrides[line.productId] = { ...state.productOverrides[line.productId], onlineStock: line.product.onlineStock - line.quantity };
                    });
                    state.carts[owner] = [];
                }
                state.orders.unshift(order);
                writeState(state);
                return copy(order);
            },
            getOrders() {
                return copy(readState().orders.filter((order) => order.memberId === repository.getOwnerId()));
            },
            getOrder(id) {
                return repository.getOrders().find((order) => order.id === id) || null;
            },
            requireAdmin() {
                const member = repository.getSession();
                if (!member || member.role !== "ADMIN") {
                    throw new Error("체험 관리자 로그인이 필요합니다.");
                }
                return member;
            },
            getStores() {
                return copy(storeData.stores);
            },
            saveCategory(id, { name, displayOrder, visible }) {
                repository.requireAdmin();
                const category = repository.getCategories().find((item) => item.id === id);
                const order = Number(displayOrder);
                if (!category || !name.trim() || name.trim().length > 100 || !Number.isInteger(order) || order < 1 || order > 999) {
                    throw new Error("분류명과 표시 순서를 확인해 주세요.");
                }
                const state = readState();
                const conflict = repository.getCategories().find((item) => item.parentId === category.parentId && item.displayOrder === order && item.id !== id);
                if (conflict) {
                    state.categoryOverrides[conflict.id] = { ...state.categoryOverrides[conflict.id], displayOrder: category.displayOrder };
                }
                state.categoryOverrides[id] = { name: name.trim(), displayOrder: order, visible: Boolean(visible) };
                writeState(state);
            },
            saveProduct(id, values) {
                repository.requireAdmin();
                const category = repository.getCategories().find((item) => item.id === values.categoryId && item.isLeaf);
                const price = Number(values.price);
                const stock = Number(values.onlineStock);
                if (!category || !values.name.trim() || values.name.trim().length > 150
                        || !Number.isInteger(price) || price < 1 || price > 10000000
                        || !Number.isInteger(stock) || stock < 0 || stock > 999999
                        || !["AVAILABLE", "SOLD_OUT", "SCHEDULED"].includes(values.status)
                        || !/^assets\/images\/mock-product-[0-5]\.svg$/.test(values.image)
                        || values.description.length > 2000 || values.brand.length > 100) {
                    throw new Error("상품명·분류·가격·재고·이미지 및 상태를 확인해 주세요.");
                }
                const changes = { name: values.name.trim(), categoryId: values.categoryId, price, onlineStock: stock, status: values.status, image: values.image, description: values.description, brand: values.brand };
                const state = readState();
                let productId = id;
                if (id) {
                    const original = repository.getProduct(id);
                    if (!original) {
                        throw new Error("상품을 찾을 수 없습니다.");
                    }
                    if (original.source.kind === "REFERENCE" && (original.name !== changes.name || original.price !== changes.price || original.categoryId !== changes.categoryId)) {
                        changes.source = { kind: "ADMIN_EDITED", reference: original.source.reference, note: "관찰 표본을 관리자에서 변경한 Mock 상품입니다. 현재 이름·가격·분류는 원본 관찰값이 아닙니다." };
                    }
                    state.productOverrides[id] = { ...state.productOverrides[id], ...changes };
                } else {
                    productId = "CUSTOM-" + crypto.randomUUID();
                    state.createdProducts.push({ id: productId, ...changes, storeStocks: { seoul: 0, busan: 0, jeju: 0 }, rating: 0, reviewCount: 0, sales: 0, createdAt: new Date().toISOString(), source: { kind: "GENERATED", reference: null, note: "관리자에서 임의 생성한 Mock 상품" } });
                }
                writeState(state);
                return repository.getProduct(productId);
            },
            updateInventory(productId, location, quantity) {
                repository.requireAdmin();
                const product = repository.getProduct(productId);
                const stock = Number(quantity);
                if (!product || !Number.isInteger(stock) || stock < 0 || stock > 999999
                        || !["online", ...storeData.stores.map((store) => store.id)].includes(location)) {
                    throw new Error("상품·재고 위치와 0 이상의 정수 수량을 확인해 주세요.");
                }
                const state = readState();
                const changes = location === "online" ? { onlineStock: stock } : { storeStocks: { ...product.storeStocks, [location]: stock } };
                state.productOverrides[productId] = { ...state.productOverrides[productId], ...changes };
                writeState(state);
            },
            getAllOrders() {
                repository.requireAdmin();
                return copy(readState().orders);
            },
            orderTransitions(status) {
                return { PAID: ["PREPARING", "CANCELLED"], PREPARING: ["SHIPPED", "CANCELLED"], SHIPPED: ["DELIVERED"], DELIVERED: [], CANCELLED: [], PAYMENT_FAILED: [] }[status] || [];
            },
            updateOrderStatus(id, status) {
                repository.requireAdmin();
                const state = readState();
                const order = state.orders.find((item) => item.id === id);
                if (!order || !repository.orderTransitions(order.status).includes(status)) {
                    throw new Error("허용되지 않는 주문 상태 변경입니다.");
                }
                if (status === "CANCELLED") {
                    order.items.forEach((item) => {
                        const product = repository.getProduct(item.productId);
                        state.productOverrides[item.productId] = { ...state.productOverrides[item.productId], onlineStock: product.onlineStock + item.quantity };
                    });
                }
                order.status = status;
                writeState(state);
            },
            updateMemberStatus(id, status) {
                const admin = repository.requireAdmin();
                const member = repository.getMembers().find((item) => item.id === id);
                if (!member || !["ACTIVE", "SUSPENDED"].includes(status) || admin.id === id) {
                    throw new Error("회원과 상태를 확인해 주세요. 현재 관리자는 변경할 수 없습니다.");
                }
                const state = readState();
                state.members = state.members.filter((item) => item.id !== id);
                state.members.push({ ...member, status });
                writeState(state);
            },
            reset() {
                localStorage.removeItem(storageKey);
                sessionStorage.removeItem("daisomall.mock.session");
                window.dispatchEvent(new Event("mock:changed"));
            },
        };
        window.Daiso.repository = repository;
        window.Daiso.state = { read: readState, write: writeState, copy };
        return repository;
    });
})();
