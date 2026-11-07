<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%
    String adminSection = request.getParameter("view");
    if (adminSection == null) {
        adminSection = "dashboard";
    }
    if (!adminSection.matches("dashboard|categories|products|inventory|stores|orders|users")) {
        response.sendError(404);
        return;
    }
    request.setAttribute("adminSection", adminSection);
%>
<jsp:forward page="/WEB-INF/views/admin/layout.jsp" />
