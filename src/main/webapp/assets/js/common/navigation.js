(() => {
    "use strict";

    // Replace this provider with a Servlet endpoint while preserving the payload contract.
    async function loadCategories(url) {
        if (window.Daiso && window.Daiso.repository) {
            return window.Daiso.repository.getVisibleCategories();
        }
        const response = await fetch(url, { credentials: "same-origin" });
        if (!response.ok) {
            throw new Error("Category response: " + response.status);
        }
        const payload = await response.json();
        if (!Array.isArray(payload.categories) || payload.categories.length === 0) {
            throw new Error("Invalid category payload");
        }
        const ids = new Map();
        payload.categories.forEach((item) => {
            if (typeof item.id !== "string" || ids.has(item.id)
                    || typeof item.name !== "string" || ![1, 2, 3].includes(item.level)
                    || !Number.isInteger(item.displayOrder)) {
                throw new Error("Invalid category node");
            }
            ids.set(item.id, item);
        });
        payload.categories.forEach((item) => {
            const parent = ids.get(item.parentId);
            if (item.level === 1 ? item.parentId !== null : !parent || parent.level !== item.level - 1) {
                throw new Error("Invalid category parent");
            }
        });
        return payload.categories;
    }

    function initializeCategories() {
        const toggle = document.querySelector("#category-toggle");
        const panel = document.querySelector("#category-panel");
        const lists = ["category-roots", "category-children", "category-leaves"]
            .map((id) => document.getElementById(id));
        const loadStatus = document.querySelector("#category-load-status");
        const retry = document.querySelector("#category-retry");
        const selection = document.querySelector("#common-category-selection");
        const close = document.querySelector("#category-close");
        if (!toggle || !panel || !loadStatus || !retry || !close || lists.some((list) => !list)) {
            return;
        }
        const selected = [null, null, null];
        let categories = [];
        let loading = false;

        function childrenOf(parentId) {
            return categories.filter((item) => item.parentId === parentId)
                .sort((left, right) => left.displayOrder - right.displayOrder);
        }

        function setOpen(open, restoreFocus = false) {
            panel.hidden = !open;
            toggle.setAttribute("aria-expanded", String(open));
            if (restoreFocus) {
                toggle.focus();
            }
            if (open && categories.length === 0 && !loading) {
                initialize();
            }
        }

        function renderLevel(level, parentId) {
            const list = lists[level - 1];
            list.replaceChildren();
            const items = childrenOf(parentId);
            items.forEach((item) => {
                const row = document.createElement("li");
                const button = document.createElement("button");
                button.type = "button";
                button.className = "category-item";
                button.dataset.id = item.id;
                const label = document.createElement("span");
                label.className = "category-item-label";
                label.textContent = item.name;
                button.append(label);
                button.setAttribute("aria-pressed", String(selected[level - 1] === item.id));
                if (childrenOf(item.id).length > 0) {
                    button.setAttribute("aria-controls", lists[level].id);
                    const arrow = document.createElement("span");
                    arrow.className = "category-item-arrow";
                    arrow.textContent = "›";
                    arrow.setAttribute("aria-hidden", "true");
                    button.append(arrow);
                }
                button.addEventListener("pointerenter", (event) => {
                    if (item.level < 3 && event.pointerType === "mouse"
                            && window.matchMedia("(any-hover: hover)").matches) {
                        browse(item);
                    }
                });
                button.addEventListener("click", () => {
                    browse(item);
                    confirmSelection(item);
                });
                row.append(button);
                list.append(row);
            });
            if (items.length === 0) {
                showEmpty(list, "하위 분류가 없습니다.");
            }
        }

        function showEmpty(list, message) {
            list.replaceChildren();
            const row = document.createElement("li");
            row.className = "category-empty";
            row.textContent = message;
            list.append(row);
        }

        function browse(item) {
            if (selected[item.level - 1] === item.id) {
                return;
            }
            selected[item.level - 1] = item.id;
            for (let index = item.level; index < selected.length; index += 1) {
                selected[index] = null;
            }
            // Keep the activated element mounted so keyboard focus remains stable.
            lists[item.level - 1].querySelectorAll("button").forEach((button) => {
                button.setAttribute("aria-pressed", String(button.dataset.id === item.id));
            });
            if (item.level < 3) {
                renderLevel(item.level + 1, item.id);
            }
            if (item.level === 1) {
                showEmpty(lists[2], "중분류를 선택해 주세요.");
            }
        }

        function confirmSelection(item) {
            const path = selected.filter(Boolean).map((id) => categories.find((node) => node.id === id).name);
            if (selection) {
                selection.textContent = "선택한 카테고리: " + path.join(" › ")
                    + (childrenOf(item.id).length === 0 ? " · 상품 목록을 엽니다." : "");
            }
            panel.dispatchEvent(new CustomEvent("category:select", {
                bubbles: true,
                detail: { id: item.id, path: selected.filter(Boolean), isLeaf: item.isLeaf },
            }));
        }

        async function initialize() {
            loading = true;
            loadStatus.hidden = false;
            loadStatus.textContent = "카테고리를 불러오는 중입니다.";
            retry.hidden = true;
            panel.setAttribute("aria-busy", "true");
            try {
                categories = await loadCategories(panel.dataset.source);
                renderLevel(1, null);
                showEmpty(lists[1], "대분류를 선택해 주세요.");
                showEmpty(lists[2], "중분류를 선택해 주세요.");
                loadStatus.textContent = "전체 카테고리를 불러왔습니다.";
                loadStatus.classList.add("visually-hidden");
            } catch (error) {
                loadStatus.classList.remove("visually-hidden");
                loadStatus.textContent = "카테고리를 불러오지 못했습니다. 다시 시도해 주세요.";
                retry.hidden = false;
            } finally {
                loading = false;
                panel.removeAttribute("aria-busy");
            }
        }

        toggle.addEventListener("click", () => setOpen(panel.hidden));
        close.addEventListener("click", () => setOpen(false, true));
        retry.addEventListener("click", initialize);
        document.addEventListener("click", (event) => {
            if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) {
                setOpen(false, panel.contains(document.activeElement));
            }
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !panel.hidden) {
                event.preventDefault();
                setOpen(false, true);
            }
        });
        panel.addEventListener("keydown", (event) => {
            const button = event.target.closest(".category-item");
            if (!button) {
                return;
            }
            const level = lists.findIndex((list) => list.contains(button));
            const buttons = Array.from(lists[level].querySelectorAll("button"));
            const index = buttons.indexOf(button);
            let target;
            if (event.key === "ArrowDown") {
                target = buttons[(index + 1) % buttons.length];
            } else if (event.key === "ArrowUp") {
                target = buttons[(index + buttons.length - 1) % buttons.length];
            } else if (event.key === "Home") {
                target = buttons[0];
            } else if (event.key === "End") {
                target = buttons[buttons.length - 1];
            } else if (event.key === "ArrowRight" && level < 2) {
                const item = categories.find((node) => node.id === button.dataset.id);
                browse(item);
                target = lists[level + 1].querySelector("button");
            } else if (event.key === "ArrowLeft" && level > 0) {
                target = lists[level - 1].querySelector('[aria-pressed="true"]');
            }
            if (target) {
                event.preventDefault();
                target.focus();
            }
        });

    }

    initializeCategories();

    document.querySelectorAll("[data-active-navigation]").forEach((navigation) => {
        navigation.querySelectorAll("[data-navigation-key]").forEach((item) => {
            const active = item.dataset.navigationKey === navigation.dataset.activeNavigation;
            item.classList.toggle("current", active);
            if (active) {
                item.setAttribute("aria-current", "page");
            } else {
                item.removeAttribute("aria-current");
            }
        });
    });

    let noticeTimer;
    function announceUnavailable(label) {
        const featureStatus = document.querySelector("#common-feature-status");
        if (featureStatus) {
            featureStatus.textContent = label.trim() + " 기능은 준비 중입니다. 현재는 공통 레이아웃 미리보기입니다.";
            clearTimeout(noticeTimer);
            noticeTimer = setTimeout(() => {
                featureStatus.textContent = "";
            }, 5000);
        }
    }

    document.querySelectorAll("[data-unavailable]").forEach((button) => {
        button.addEventListener("click", () => {
            if (button.hasAttribute("data-unavailable")) {
                announceUnavailable(button.textContent);
            }
        });
    });
    document.querySelectorAll(".search-form").forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            if (window.Daiso && window.Daiso.features && window.Daiso.features.catalog) {
                const input = form.querySelector('[name="query"]');
                location.href = window.Daiso.url("search.jsp", { q: input.value.trim() });
            } else {
                announceUnavailable("검색");
            }
        });
    });
})();
