(() => {
    "use strict";

    const root = document.querySelector('[data-page="home"]');
    if (!root) {
        return;
    }
    const app = window.Daiso;
    const { element, button, productCard } = app.ui;

    app.ready.then((repository) => {
        root.replaceChildren();
        const promotions = element("section", "promotion-grid");
        promotions.setAttribute("aria-label", "이번 주 기획전");
        const hero = element("div", "hero-carousel");
        hero.setAttribute("aria-roledescription", "캐러셀");
        hero.setAttribute("aria-label", "메인 기획전");
        const slide = element("div", "hero-slide");
        const slides = [
            { title: "따뜻한 일상을\n함께 준비해요", subtitle: "WINTER TOGETHER", color: "winter", description: "차곡차곡 채우는 나만의 겨울 생활" },
            { title: "작은 정리로\n달라지는 우리 집", subtitle: "LIVING ESSENTIALS", color: "living", description: "공간을 가볍게, 일상을 편안하게" },
            { title: "매일의 새로운\n발견을 만나보세요", subtitle: "EVERYDAY DISCOVERY", color: "beauty", description: "생활에 더하는 작고 기분 좋은 변화" },
        ];
        let current = 0;
        let paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let hovering = false;
        const counter = element("span", "carousel-counter");
        const pause = button("", () => {
            paused = !paused;
            updatePause();
        }, "carousel-control");
        function updatePause() {
            pause.textContent = paused ? "재생" : "정지";
            pause.setAttribute("aria-label", paused ? "배너 자동 재생" : "배너 자동 재생 정지");
        }
        function renderSlide() {
            const data = slides[current];
            slide.className = "hero-slide " + data.color;
            slide.replaceChildren(element("p", "hero-eyebrow", data.subtitle), element("h1", "hero-title", data.title), element("p", "hero-description", data.description));
            const image = element("img", "hero-illustration");
            image.src = app.url("assets/images/mock-product-" + current + ".svg");
            image.alt = "";
            slide.append(image);
            counter.textContent = current + 1 + " / " + slides.length;
        }
        function move(direction) {
            current = (current + direction + slides.length) % slides.length;
            renderSlide();
        }
        const controls = element("div", "carousel-controls");
        controls.append(counter, button("이전", () => move(-1), "carousel-control"), button("다음", () => move(1), "carousel-control"), pause);
        hero.append(slide, controls);
        hero.addEventListener("pointerenter", () => {
            hovering = true;
        });
        hero.addEventListener("pointerleave", () => {
            hovering = false;
        });
        const timer = setInterval(() => {
            if (!paused && !hovering && !document.hidden && !hero.contains(document.activeElement)) {
                move(1);
            }
        }, 6000);
        window.addEventListener("pagehide", () => clearInterval(timer), { once: true });
        updatePause();
        renderSlide();
        promotions.append(hero);
        ["겨울 생활 준비", "나를 위한 뷰티 루틴", "한 칸의 정리 습관", "오늘도 즐거운 문구 생활"].forEach((title, index) => {
            const tile = element("a", "promotion-tile tile-" + index);
            tile.href = app.url("list.jsp", { collection: "exhibition", sort: index % 2 ? "newest" : "rating" });
            tile.append(element("span", "eyebrow", "DAILY SELECTION"), element("h2", "", title), element("span", "tile-caption", "생활 속 작은 발견 →"));
            const image = element("img");
            image.src = app.url("assets/images/mock-product-" + (index + 2) % 6 + ".svg");
            image.alt = "";
            tile.append(image);
            promotions.append(tile);
        });
        root.append(promotions);
        const shortcuts = element("nav", "category-shortcuts");
        shortcuts.setAttribute("aria-label", "주요 카테고리 바로가기");
        repository.getVisibleCategories().filter((category) => category.level === 1).sort((left, right) => left.displayOrder - right.displayOrder).slice(0, 10).forEach((category, index) => {
            const shortcut = element("a", "category-shortcut");
            shortcut.href = app.url("list.jsp", { category: category.id });
            shortcut.dataset.categoryId = category.id;
            shortcut.append(element("span", "shortcut-icon", ["₩", "✦", "⌂", "○", "▤", "✎"][index % 6]), element("span", "", category.name));
            shortcuts.append(shortcut);
        });
        root.append(shortcuts);
        const strip = element("div", "campaign-strip");
        strip.append(element("strong", "", "필요한 순간, 가까운 생활"), element("span", "", "자체 제작 이미지와 Mock 상품으로 구성한 학습용 쇼핑몰입니다."));
        root.append(strip);
        ["오늘의 추천 상품", "일상에 더하는 작은 발견"].forEach((title, index) => {
            const section = element("section", "product-section");
            if (index === 0) {
                section.id = "featured";
            }
            section.append(element("p", "section-eyebrow", "EVERYDAY PICKS"), element("h2", "section-title", title));
            const grid = element("div", "product-grid");
            repository.queryProducts().slice(index * 6, index * 6 + 6).forEach((product) => grid.append(productCard(product, { details: true })));
            section.append(grid);
            root.append(section);
        });
    }).catch((error) => app.ui.error(root, error));
})();
