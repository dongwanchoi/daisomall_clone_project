(() => {
    "use strict";

    const app = window.Daiso;
    const { element, link, button } = app.ui;
    const root = document.querySelector("[data-page]");

    function field(form, label, name, type = "text", value = "") {
        const wrapper = element("label", "field", label);
        const input = element("input");
        input.name = name;
        input.type = type;
        input.value = value;
        input.required = true;
        input.maxLength = name === "name" ? 50 : 120;
        input.autocomplete = { email: "email", name: "name", phone: "tel", password: "current-password" }[name] || "off";
        if (name === "password") {
            input.minLength = 4;
        }
        wrapper.append(input);
        form.append(wrapper);
        return input;
    }

    app.ui.field = field;

    app.ready.then((repository) => {
        function refreshHeader() {
            const member = repository.getSession();
            const login = document.querySelector('[data-member-route="login"]');
            if (login) {
                const label = login.querySelector(".account-label");
                label.textContent = member ? "로그아웃" : "로그인·회원";
                login.title = member ? member.name + " · 로그아웃" : "로그인·회원";
            }
        }
        document.querySelectorAll("[data-member-route]").forEach((control) => {
            control.removeAttribute("data-unavailable");
            control.addEventListener("click", () => {
                if (control.dataset.memberRoute === "login" && repository.getSession()) {
                    repository.logout();
                    location.href = app.url("");
                } else {
                    location.href = app.url(control.dataset.memberRoute + ".jsp");
                }
            });
        });
        window.addEventListener("mock:session", refreshHeader);
        refreshHeader();
        if (!root || !["login", "signup", "mypage", "profile"].includes(root.dataset.page)) {
            return;
        }
        root.replaceChildren();
        const page = root.dataset.page;
        const member = repository.getSession();
        const panel = element("section", "member-panel");
        root.append(panel);
        const titles = { login: "로그인", signup: "회원가입", mypage: "마이페이지", profile: "회원정보" };
        panel.append(element("h1", "page-title", titles[page]));
        if (page === "mypage") {
            if (!member) {
                panel.append(element("p", "", "로그인 후 나의 쇼핑 내역을 확인하세요."), link("로그인", "login.jsp", {}, "button primary"));
                return;
            }
            panel.append(element("p", "member-greeting", member.name + "님, 반갑습니다."), element("p", "", member.email));
            const actions = element("div", "action-stack");
            actions.append(link("회원정보 수정", "profile.jsp", {}, "button secondary"));
            const orders = button("주문 내역", () => {
                if (app.features.orders) {
                    location.href = app.url("orders.jsp");
                } else {
                    app.ui.notice("주문 내역은 v0.6에서 연결됩니다.");
                }
            }, "button secondary");
            actions.append(orders, button("로그아웃", () => {
                repository.logout();
                location.href = app.url("login.jsp");
            }));
            if (member.role === "ADMIN") {
                actions.append(link("관리자 화면", "admin/", {}, "button secondary"));
            }
            panel.append(actions);
            return;
        }
        if (page === "profile" && !member) {
            panel.append(element("p", "", "Mock 로그인이 필요합니다."), link("로그인", "login.jsp", {}, "button"));
            return;
        }
        panel.append(element("p", "source-note", "학습용 Mock 회원 화면입니다. 실제 개인정보를 입력하지 마세요. 비밀번호는 검증·저장하지 않습니다."));
        const form = element("form", "member-form");
        const error = element("p", "error-message");
        error.setAttribute("role", "alert");
        const status = element("p", "form-status");
        status.setAttribute("role", "status");
        if (page !== "profile") {
            field(form, "이메일", "email", "email");
            const password = field(form, "임의 비밀번호 (4자 이상)", "password", "password");
            if (page === "signup") {
                password.autocomplete = "new-password";
            }
        } else {
            form.append(element("p", "", "이메일: " + member.email));
        }
        if (page !== "login") {
            field(form, "이름", "name", "text", member ? member.name : "");
            field(form, "전화번호 (예: 010-0000-0000)", "phone", "tel", member ? member.phone : "");
        }
        if (page === "signup") {
            const consent = element("label", "check-field");
            const checkbox = element("input");
            checkbox.type = "checkbox";
            checkbox.name = "consent";
            checkbox.required = true;
            consent.append(checkbox, element("span", "", "이 브라우저에 체험용 정보를 저장하는 것에 동의합니다."));
            form.append(consent);
        }
        const submit = element("button", "button primary", page === "profile" ? "회원정보 저장" : titles[page]);
        submit.type = "submit";
        form.append(error, status, submit);
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(form));
            error.textContent = "";
            try {
                if (page === "profile") {
                    repository.saveProfile(values);
                    status.textContent = "회원정보를 저장했습니다.";
                } else {
                    if (page === "signup") {
                        repository.register(values);
                    }
                    repository.login(values.email, values.password);
                    const next = new URLSearchParams(location.search).get("next");
                    location.href = app.url(next === "admin" && app.features.admin ? "admin/" : next === "checkout" && app.features.orders ? "checkout.jsp" : "mypage.jsp");
                }
            } catch (cause) {
                error.textContent = cause.message;
            }
        });
        panel.append(form);
        if (page === "login") {
            panel.append(link("회원가입", "signup.jsp", {}, "text-button"));
            panel.append(element("p", "", "체험 계정: demo@example.test / 임의 비밀번호 4자 이상"));
            panel.append(button("체험 회원으로 로그인", () => {
                form.elements.email.value = "demo@example.test";
                form.elements.password.value = "demo";
                form.requestSubmit();
            }, "button secondary"));
            panel.append(button("체험 관리자로 로그인", () => {
                form.elements.email.value = "admin@example.test";
                form.elements.password.value = "demo";
                form.requestSubmit();
            }, "button secondary"));
        }
    }).catch((error) => {
        if (root) {
            app.ui.error(root, error);
        }
    });
})();
