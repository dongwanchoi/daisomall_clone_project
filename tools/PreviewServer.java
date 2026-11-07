import java.nio.file.Files;
import java.nio.file.Path;
import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;

/** Isolated local JSP preview; does not modify the Eclipse or installed Tomcat configuration. */
public class PreviewServer {
    public static void main(String[] args) throws Exception {
        Path webRoot = Path.of(args[0]).toAbsolutePath();
        Path base = Files.createTempDirectory("daisomall-tomcat-");
        Tomcat tomcat = new Tomcat();
        tomcat.setBaseDir(base.toString());
        tomcat.setHostname("localhost");
        tomcat.setPort(18089);
        tomcat.getConnector().setProperty("address", "127.0.0.1");
        Context context = tomcat.addWebapp("/daisomall", webRoot.toString());
        context.setParentClassLoader(PreviewServer.class.getClassLoader());
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                tomcat.stop();
                tomcat.destroy();
            } catch (Exception error) {
                error.printStackTrace();
            }
        }));
        tomcat.start();
        tomcat.getServer().await();
    }
}
