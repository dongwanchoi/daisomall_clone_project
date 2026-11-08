package daiso.common.mvc;

public class JspViewResolver implements ViewResolver {
	private final String prefix = "/WEB-INF/views/";
	private final String suffix = ".jsp";

	@Override
	public String resolve(String viewName) {
		if (viewName == null || !viewName.matches("[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*")) {
			throw new IllegalArgumentException("잘못된 View 이름: " + viewName);
		}
		return prefix + viewName + suffix;
	}
}