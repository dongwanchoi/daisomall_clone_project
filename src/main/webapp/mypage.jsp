<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
    request.setAttribute("pageName", "mypage");
    request.setAttribute("activeNavigation", "");
%>
<jsp:forward page="/WEB-INF/views/shop/page.jsp" />
