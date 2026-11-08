package daiso.common.mvc;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import javax.servlet.ServletContext;

import daiso.common.annotation.DaisoController;
import daiso.common.annotation.DaisoGetMapping;
import daiso.common.annotation.DaisoPostMapping;

public class AnnotationHandlerMapping implements HandlerMapping {
	private final Map<String, HandlerMethod> handlers = new HashMap<>();
	private final ServletContext context;

	public AnnotationHandlerMapping(ServletContext context) throws ReflectiveOperationException {
		this.context = context;
		scan("/WEB-INF/classes/");
	}

	private void scan(String directory) throws ReflectiveOperationException {
		Set<String> paths = context.getResourcePaths(directory);
		if (paths == null) {
			throw new IllegalStateException("클래스 탐색 경로를 찾을 수 없습니다: " + directory);
		}
		for (String path : paths) {
			if (path.endsWith("/")) {
				scan(path);
				continue;
			}
			if (!path.endsWith(".class") || path.contains("$")) {
				continue;
			}
			String className = path.replace("/WEB-INF/classes/", "").replace("/", ".").replace(".class", "");
			Class<?> clazz = Class.forName(className, false, getClass().getClassLoader());
			if (!clazz.isAnnotationPresent(DaisoController.class)) {
				continue;
			}
			registerController(clazz);
		}
	}

	private void registerController(Class<?> clazz) throws ReflectiveOperationException {
		Object controller = clazz.getConstructor().newInstance();
		for (Method method : clazz.getDeclaredMethods()) {
			DaisoGetMapping get = method.getAnnotation(DaisoGetMapping.class);
			DaisoPostMapping post = method.getAnnotation(DaisoPostMapping.class);

			if (get == null && post == null) {
				continue;
			}
			if (get != null && post != null) {
				throw new IllegalStateException("하나의 메서드에 GET/POST 동시 선언 불가");
			}
			if (!Modifier.isPublic(method.getModifiers()) || method.getReturnType() != String.class) {
				throw new IllegalStateException("잘못된 Controller 메서드: " + method.getName());
			}
			if (get != null) {
				register("GET", get.value(), controller, method);
			}
			if (post != null) {
				register("POST", post.value(), controller, method);
			}
		}
	}

	private void register(String httpMethod, String path, Object controller, Method method) {
		if (path == null || !path.startsWith("/")) {
			throw new IllegalStateException("잘못된 URL: " + path);
		}

		String key = httpMethod + " " + path;
		HandlerMethod previous = handlers.putIfAbsent(key, new HandlerMethod(controller, method));
		if (previous != null) {
			throw new IllegalStateException("중복 URL 매핑: " + key);
		}
		context.log("[ROUTE] " + key + " -> " + controller.getClass().getSimpleName() + "." + method.getName());
	}

	@Override
	public HandlerMethod getHandler(String httpMethod, String path) {
		return handlers.get(httpMethod + " " + path);
	}

	@Override
	public boolean hasPath(String path) {
		return handlers.containsKey("GET " + path) || handlers.containsKey("POST " + path);
	}
}