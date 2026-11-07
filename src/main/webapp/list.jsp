<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
    request.setAttribute("pageName", "catalog");
    request.setAttribute("activeNavigation", request.getParameter("collection"));
%>
<jsp:forward page="/WEB-INF/views/shop/page.jsp" />
