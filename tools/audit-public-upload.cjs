const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const files = execFileSync("git", ["-c", "safe.directory=" + root, "ls-files", "--cached", "-z"], { cwd: root }).toString("utf8").split("\0").filter(Boolean);
const patterns = [
    ["GitHub credential", /(?:github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,})/],
    ["AWS access key", /(?:AKIA|ASIA)[A-Z0-9]{16}/],
    ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
    ["Service credential", /(?:sk_live_[A-Za-z0-9]{16,}|AIza[A-Za-z0-9_-]{30,})/],
    ["URL credential", /https?:\/\/[^\s/@:]+:[^\s/@]+@/],
];
const findings = [];
const publicEmails = new Set();
let bytes = 0;
for (const file of files) {
    const buffer = fs.readFileSync(path.join(root, file));
    bytes += buffer.length;
    if (/(?:^|\/)(?:\.env(?:\..*)?|credentials\.json|secrets\.json)$|\.(?:pem|key|p12|pfx|jks|keystore|class|war|log)$/i.test(file)) {
        findings.push({ file, kind: "Excluded file type staged" });
    }
    if (file.includes("/reference-header-") || file.includes("/reference-category-menu")) {
        findings.push({ file, kind: "Third-party source screenshot staged" });
    }
    if (!/\.(?:png|webp|woff2)$/i.test(file)) {
        const text = buffer.toString("utf8");
        patterns.forEach(([kind, pattern]) => {
            if (pattern.test(text)) {
                findings.push({ file, kind });
            }
        });
        for (const email of text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []) {
            if (!email.endsWith(".test") && !email.endsWith("@users.noreply.github.com")) {
                publicEmails.add(email);
            }
        }
    }
}
const required = [".project", ".classpath", ".settings/org.eclipse.wst.common.component", ".settings/org.eclipse.wst.common.project.facet.core.xml", "src/main/webapp/WEB-INF/web.xml", "src/main/java/.gitkeep", "README.md"];
required.forEach((file) => {
    if (!files.includes(file)) {
        findings.push({ file, kind: "Required project file missing" });
    }
});
console.log(JSON.stringify({ files: files.length, bytes, findings, otherEmailCount: publicEmails.size }, null, 4));
if (findings.length || publicEmails.size) {
    process.exitCode = 1;
}
