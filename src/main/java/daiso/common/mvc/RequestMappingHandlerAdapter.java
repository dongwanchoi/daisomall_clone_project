package daiso.common.mvc;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

import javax.servlet.http.HttpServletRequest;

import daiso.common.annotation.DaisoRequestParam;

public class RequestMappingHandlerAdapter implements HandlerAdapter {
	@Override
	public boolean supports(HandlerMethod handler) {
		Method method = handler.getMethod();
		if (method.getReturnType() != String.class) {
			return false;
		}
		for (Parameter parameter : method.getParameters()) {
			Class<?> type = parameter.getType();
			if (type == HttpServletRequest.class) {
				continue;
			}
			DaisoRequestParam annotation = parameter.getAnnotation(DaisoRequestParam.class);
			if (annotation == null || annotation.value().isBlank()) {
				return false;
			}
			if (type != String.class && type != int.class && type != Integer.class) {
				return false;
			}
		}
		return true;
	}

	@Override
	public String handle(HttpServletRequest request, HandlerMethod handler) throws IllegalAccessException, InvocationTargetException {
		Method method = handler.getMethod();
		Parameter[] parameters = method.getParameters();
		Object[] arguments = new Object[parameters.length];
		for (int i = 0; i < parameters.length; i++) {
			Parameter parameter = parameters[i];
			Class<?> type = parameter.getType();
			if (type == HttpServletRequest.class) {
				arguments[i] = request;
				continue;
			}
			DaisoRequestParam annotation = parameter.getAnnotation(DaisoRequestParam.class);
			String name = annotation.value();
			String value = request.getParameter(name);
			if (value == null || value.isBlank()) {
				throw new IllegalArgumentException("필수 파라미터 누락: " + name);
			}
			if (type == String.class) {
				arguments[i] = value;

			} else if (type == int.class || type == Integer.class) {
				try {
					arguments[i] = Integer.parseInt(value);
				} catch (NumberFormatException e) {
					throw new IllegalArgumentException("숫자 변환 실패: " + name, e);
				}
			}
		}
		return (String) method.invoke(handler.getController(), arguments);
	}
}