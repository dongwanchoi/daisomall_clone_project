package daiso.common.mvc;

public interface HandlerMapping {
	HandlerMethod getHandler(String httpMethod, String path);
    boolean hasPath(String path);
}
