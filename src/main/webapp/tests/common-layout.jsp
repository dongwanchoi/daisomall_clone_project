<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<% request.setAttribute("activeNavigation", "ranking"); %>
<!DOCTYPE html>
<html lang="ko">
    <head>
        <%@ include file="../WEB-INF/views/common/head.jspf" %>
    </head>
    <body>
        <a class="skip-link" href="#main-content">본문 바로가기</a>
        <%@ include file="../WEB-INF/views/shop/common/header.jspf" %>
        <%@ include file="../WEB-INF/views/shop/common/navigation.jspf" %>
        <main id="main-content" class="container home-content" tabindex="-1">
            <h1>공통 레이아웃 재사용 테스트</h1>
            <p>홈 전용 요소 없이 공통 컴포넌트를 조립한 검증용 JSP입니다.</p>
            <p>랭킹 활성 표시는 페이지별 설정 검증용이며 상품 기능은 제공하지 않습니다.</p>
        </main>
        <%@ include file="../WEB-INF/views/shop/common/footer.jspf" %>
    </body>
</html>
