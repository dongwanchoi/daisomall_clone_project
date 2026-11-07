const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../src/main/webapp/assets");
const categories = JSON.parse(fs.readFileSync(path.join(root, "mock/categories.json"), "utf8")).categories;
const expanded = !process.argv.includes("--sample");
const leaves = categories.filter((category) => category.isLeaf);
const selected = expanded ? leaves : leaves.filter((category) => category.type === "일반 상품군").slice(0, 12);
const palette = ["#f3e2d7", "#dce9df", "#dde7f2", "#efe0ef", "#f5edcf", "#e6e3dc"];
const products = selected.map((category, index) => ({
    id: "MOCK-" + category.id,
    categoryId: category.id,
    name: category.name + " 대표 샘플 " + (index + 1),
    price: [1000, 2000, 3000, 5000, 1500][index % 5],
    image: "assets/images/mock-product-" + (index % 6) + ".svg",
    description: category.name + " 분류 화면을 확인하기 위한 임의 생성 상품입니다. 실제 판매 상품이 아닙니다.",
    status: index % 29 === 28 ? "SOLD_OUT" : index % 31 === 30 ? "SCHEDULED" : "AVAILABLE",
    onlineStock: index % 29 === 28 ? 0 : 20 + index % 30,
    storeStocks: { seoul: 5 + index % 8, busan: index % 6, jeju: 3 },
    brand: "샘플 생활연구소",
    rating: Number((4.1 + index % 9 / 10).toFixed(1)),
    reviewCount: index * 7,
    sales: 1000 - index,
    createdAt: new Date(Date.UTC(2026, 9, 1 + index % 28)).toISOString(),
    source: { kind: "GENERATED", reference: null, note: "임의 생성 Mock 상품·평점·재고" },
}));
const observed = [
    { id: "REF-99962883", categoryName: "소스병/양념통", name: "3색 소스병 소형 브라운", price: 1000 },
    { id: "REF-1060398", categoryName: "네임펜/매직", name: "모나미 키친 마카 420 검정", price: 1000 },
];
for (const item of observed) {
    const category = leaves.find((node) => node.name === item.categoryName);
    products.unshift({
        ...products[0],
        id: item.id,
        categoryId: category.id,
        name: item.name,
        price: item.price,
        description: "Aside product-layout.md에서 이름·가격·분류를 확인한 표본입니다. 이미지·재고·평점은 임의 Mock이며 판매 정보가 아닙니다.",
        source: { kind: "REFERENCE", reference: "Aside product-layout.md, 2026-11-07", note: "이름·가격·분류만 관찰 자료; 나머지는 Mock" },
    });
}
fs.writeFileSync(path.join(root, "mock/products.json"), JSON.stringify({ schemaVersion: 1, seedVersion: expanded ? "0.4" : "0.2", products }, null, 4) + "\n");
fs.mkdirSync(path.join(root, "images"), { recursive: true });
palette.forEach((color, index) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
    <rect width="300" height="400" fill="${color}" />
    <ellipse cx="150" cy="316" rx="78" ry="13" fill="#161d24" opacity="0.08" />
    <rect x="88" y="126" width="124" height="181" rx="${index % 2 ? 8 : 30}" fill="#fff" />
    <rect x="115" y="108" width="70" height="24" rx="6" fill="#a99887" />
    <rect x="102" y="184" width="96" height="70" rx="3" fill="${color}" />
    <path d="M133 217h34m-17-17v34" stroke="#9a8674" stroke-width="3" />
    <text x="150" y="356" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#786e64">MOCK LIVING / ${index + 1}</text>
</svg>
`;
    fs.writeFileSync(path.join(root, "images/mock-product-" + index + ".svg"), svg);
});
console.log(`Generated ${products.length} products; ${selected.length}/${leaves.length} leaves covered by generated representatives.`);
