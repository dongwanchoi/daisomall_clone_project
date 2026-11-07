<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<% request.setAttribute("activeNavigation", "home"); %>
<!DOCTYPE html>
<html lang="ko">
    <head>
        <%@ include file="../common/head.jspf" %>
    </head>
    <body>
        <a class="skip-link" href="#main-content">본문 바로가기</a>
        <%@ include file="common/header.jspf" %>
        <%@ include file="common/navigation.jspf" %>
        <main id="main-content" class="container storefront" data-page="home" tabindex="-1">
            <p class="empty-state" role="status">오늘의 생활 이야기를 불러오는 중입니다.</p>
            <noscript><p>카테고리 탐색에는 JavaScript가 필요합니다.</p></noscript>
        </main>
        <%@ include file="common/footer.jspf" %>
    </body>
</html>
