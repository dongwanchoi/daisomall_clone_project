<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html lang="ko">
    <head>
        <%@ include file="../common/head.jspf" %>
        <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/admin.css">
    </head>
    <body class="admin-body">
        <a class="skip-link" href="#admin-content">관리자 본문 바로가기</a>
        <header class="admin-header">
            <a href="${pageContext.request.contextPath}/admin/" class="admin-brand">DAISO <span>MANAGER</span></a>
            <span>체험용 관리자 · 실제 운영 시스템이 아닙니다</span>
            <a href="${pageContext.request.contextPath}/">고객 화면 보기 ↗</a>
        </header>
        <div class="admin-layout">
            <nav class="admin-sidebar" aria-label="관리 메뉴">
                <a href="${pageContext.request.contextPath}/admin/?view=dashboard" data-admin-link="dashboard">대시보드</a>
                <a href="${pageContext.request.contextPath}/admin/?view=categories" data-admin-link="categories">카테고리 관리</a>
                <a href="${pageContext.request.contextPath}/admin/?view=products" data-admin-link="products">상품 관리</a>
                <a href="${pageContext.request.contextPath}/admin/?view=inventory" data-admin-link="inventory">온라인 재고</a>
                <a href="${pageContext.request.contextPath}/admin/?view=stores" data-admin-link="stores">매장별 재고</a>
                <a href="${pageContext.request.contextPath}/admin/?view=orders" data-admin-link="orders">주문 관리</a>
                <a href="${pageContext.request.contextPath}/admin/?view=users" data-admin-link="users">사용자 관리</a>
            </nav>
            <main id="admin-content" class="admin-content" data-admin-page="${requestScope.adminSection}" tabindex="-1">
                <p role="status">관리 데이터를 불러오는 중입니다.</p>
            </main>
        </div>
    </body>
</html>
