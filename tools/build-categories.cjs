const fs = require("node:fs");
const path = require("node:path");

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (character === '"') {
            if (quoted && text[index + 1] === '"') {
                field += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (character === "," && !quoted) {
            row.push(field);
            field = "";
        } else if (character === "\n" && !quoted) {
            row.push(field.replace(/\r$/, ""));
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += character;
        }
    }
    if (quoted) {
        throw new Error("Unclosed CSV quote");
    }
    if (field || row.length) {
        row.push(field.replace(/\r$/, ""));
        rows.push(row);
    }
    return rows;
}

const root = path.resolve(__dirname, "..");
const source = path.resolve(root, "../references/artifacts/category-tree.csv");
const [headers, ...rows] = parseCsv(fs.readFileSync(source, "utf8").replace(/^\uFEFF/, ""));
const categories = rows.map((values) => {
    if (values.length !== headers.length) {
        throw new Error("CSV column count mismatch");
    }
    const row = Object.fromEntries(headers.map((name, index) => [name, values[index]]));
    return {
        id: row["카테고리 식별자"],
        parentId: row["상위 식별자"] || null,
        name: row["카테고리명"],
        level: Number(row["단계"]),
        displayOrder: Number(row["동일 부모 내 순서"]),
        isLeaf: row["최하위 여부"] === "true",
        type: row["분류 유형"],
        sourceUrl: row["URL"],
        urlVerification: row["URL 확인 상태"],
    };
});
const payload = { source: "Aside category-tree.csv", observedOn: "2026-11-07", categories };
fs.writeFileSync(path.join(root, "src/main/webapp/assets/mock/categories.json"), JSON.stringify(payload, null, 4) + "\n");
console.log(`Converted ${categories.length} nodes from the read-only Aside CSV.`);
