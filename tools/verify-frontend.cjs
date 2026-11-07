// Current regression suite includes the shared v0.1 layout and v0.2–v0.7 workflows.
if (!process.argv[2]) {
    process.argv[2] = "7";
}
require("./verify-commerce.cjs");
