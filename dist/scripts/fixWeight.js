"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../db/database");
const product_1 = require("../db/models/product");
const list = [
    { weight: 6, category: "MCO38942" },
    { weight: 13, category: "MCO1015" },
    { weight: 32, category: "MCO6872" },
    { weight: 2, category: "MCO167791" },
    { weight: 30, category: "MCO3691" },
    { weight: 4, category: "MCO4707" },
    { weight: 4, category: "MCO1042" },
    { weight: 10, category: "MCO114643" },
];
(async () => {
    await (0, database_1.connectToDatabase)();
    for (const element of list) {
        const items = await (0, product_1.getBadWeight)(element.category);
        for (const item of items) {
            const { _id, ...itemData } = item;
            itemData.attributes["Peso"] = `${element.weight} lb`;
            itemData.weight = `${element.weight} lb`;
            //   console.log(itemData.sku);
            //   await input("Press any to continue")
            const result = await (0, product_1.updateProduct)(itemData, _id);
        }
    }
})();
