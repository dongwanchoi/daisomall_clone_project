const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../src/main/webapp");
const stage = Number(process.argv[2] || 3);
const pages = [
    { file: "list.jsp", view: "catalog", version: 3 },
    { file: "search.jsp", view: "catalog", version: 3 },
    { file: "product.jsp", view: "product", version: 3 },
    { file: "login.jsp", view: "login", version: 5 },
    { file: "signup.jsp", view: "signup", version: 5 },
    { file: "mypage.jsp", view: "mypage", version: 5 },
    { file: "profile.jsp", view: "profile", version: 5 },
    { file: "cart.jsp", view: "cart", version: 6 },
    { file: "checkout.jsp", view: "checkout", version: 6 },
    { file: "payment-success.jsp", view: "payment-success", version: 6 },
    { file: "payment-failure.jsp", view: "payment-failure", version: 6 },
    { file: "orders.jsp", view: "orders", version: 6 },
    { file: "order.jsp", view: "order", version: 6 },
];
for (const page of pages.filter((item) => item.version <= stage)) {
    const source = `<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
    request.setAttribute("pageName", "${page.view}");
    request.setAttribute("activeNavigation", ${page.view === "catalog" ? 'request.getParameter("collection")' : '""'});
%>
<jsp:forward page="/WEB-INF/views/shop/page.jsp" />
`;
    fs.writeFileSync(path.join(root, page.file), source);
}
console.log("Generated public JSP entry points through v0." + stage);
