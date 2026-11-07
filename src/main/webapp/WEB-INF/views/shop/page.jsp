<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
    String shopPage = String.valueOf(request.getAttribute("pageName"));
    if (!shopPage.matches("catalog|product|login|signup|mypage|profile|cart|checkout|payment-success|payment-failure|orders|order")) {
        response.sendError(404);
        return;
    }
%>
<!DOCTYPE html>
<html lang="ko">
    <head>
        <%@ include file="../common/head.jspf" %>
    </head>
    <body>
        <a class="skip-link" href="#main-content">본문 바로가기</a>
        <%@ include file="common/header.jspf" %>
        <%@ include file="common/navigation.jspf" %>
        <main id="main-content" class="container shop-page" data-page="<%= shopPage %>" tabindex="-1">
            <p class="empty-state" role="status">화면을 불러오는 중입니다.</p>
            <noscript><p>이 Mock 쇼핑몰의 데이터 표시에 JavaScript가 필요합니다.</p></noscript>
        </main>
        <%@ include file="common/footer.jspf" %>
    </body>
</html>
