package daiso.common.mvc;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import daiso.common.annotation.DaisoResponseBody;

@WebServlet("/app/*")
public class FrontControllerServlet extends HttpServlet {
	private HandlerMapping handlerMapping;
	private HandlerAdapter handlerAdapter;
	private ViewResolver viewResolver;

	@Override
	public void init() throws ServletException {
		try {
			handlerMapping = new AnnotationHandlerMapping(getServletContext());
			handlerAdapter = new RequestMappingHandlerAdapter();
			viewResolver = new JspViewResolver();

		} catch (ReflectiveOperationException e) {
			throw new ServletException("초기화 실패", e);
		}
	}

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		dispatch(request, response);
	}

	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		dispatch(request, response);
	}

	private void dispatch(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String path = request.getPathInfo();
		if (path == null) {
			path = "/";
		}
		HandlerMethod handler = handlerMapping.getHandler(request.getMethod(), path);
		if (handler == null) {
			response.sendError(handlerMapping.hasPath(path) ? 405 : 404);
			return;
		}
		if (!handlerAdapter.supports(handler)) {
			throw new ServletException("지원하지 않는 Controller 메서드");
		}

		try {
			String result = handlerAdapter.handle(request, handler);

			if (handler.getMethod().isAnnotationPresent(DaisoResponseBody.class)) {
				response.setContentType("text/plain; charset=UTF-8");
				response.getWriter().write(result == null ? "" : result);
				return;
			}
			if (result != null && result.startsWith("redirect:/")) {
				String target = result.substring("redirect:".length());
				String url = request.getContextPath() + request.getServletPath() + target;
				response.sendRedirect(response.encodeRedirectURL(url));
				return;
			}

			String jspPath;
			
			try {
				jspPath = viewResolver.resolve(result);
			} catch (IllegalArgumentException e) {
				throw new ServletException("잘못된 View 이름", e);
			}
			request.getRequestDispatcher(jspPath).forward(request, response);
		} catch (IllegalArgumentException e) {
			response.sendError(400, e.getMessage());
		} catch (IllegalAccessException e) {
			throw new ServletException("메서드 접근 실패", e);
		} catch (InvocationTargetException e) {
			throw new ServletException("Controller 실행 실패", e.getCause());
		}
	}
}