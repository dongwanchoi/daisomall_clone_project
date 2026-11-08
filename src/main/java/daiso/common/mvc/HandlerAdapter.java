package daiso.common.mvc;

import java.lang.reflect.InvocationTargetException;
import javax.servlet.http.HttpServletRequest;

public interface HandlerAdapter {
	boolean supports(HandlerMethod handler);
	String handle(HttpServletRequest request, HandlerMethod handler) throws IllegalAccessException, InvocationTargetException;
}