"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const flitersHelper_1 = require("../utils/flitersHelper");
const helpers_1 = require("../utils/helpers");
const jsonHelper_1 = require("../utils/jsonHelper");
class Product {
    seller_sku;
    title;
    price;
    description;
    attributes;
    category_id;
    condition;
    pictures;
    constructor(data) {
        const { title, price, description, sku, condition } = data;
        this.title = title;
        this.price = price;
        this.description = description;
        this.pictures = [];
        this.seller_sku = sku;
        this.category_id = null;
        this.attributes = {};
        this.condition = condition;
    }
    setData(data) {
        const { title, price, description, sku, pictures, category_id, attributes, condition, } = data;
        this.title = title;
        this.price = price;
        this.description = description;
        this.pictures = pictures;
        this.seller_sku = sku;
        this.category_id = category_id;
        this.attributes = attributes;
        this.condition = condition;
    }
    setImages(images) {
        this.pictures = images;
    }
    async setCategoryId(categoryId) {
        this.category_id = categoryId;
        if (categoryId === "MCO177108") {
            const attributeName = "Cantidad de sillas";
            const piecesCount = this.attributes["Número de piezas"];
            if (piecesCount && typeof piecesCount == "string") {
                this.attributes[attributeName] =
                    parseInt(piecesCount.split(" ")[0]) - 1;
            }
            else {
                this.attributes[attributeName] = (0, helpers_1.extractChairsNumber)(`${this.title} ${this.description}`);
            }
            if (!this.attributes[attributeName])
                throw new Error(`Atributo faltante ${attributeName}`);
        }
        else if (categoryId === "MCO3384") {
            const { Ancho: width } = this.attributes;
            this.attributes["Ancho del parlante"] = width;
        }
        else if (categoryId === "MCO416860") {
            const DIN = (0, helpers_1.extractDIN)(this.title);
            this.attributes["Dimensiones estándar del estéreo"] = DIN || "2 DIN";
        }
        // await this.setAttrByCategory(categoryId);
    }
    setAttributes(details, specs) {
        const result = {};
        const parsedKeys = {
            "Peso del paquete": "Peso",
            "Peso del artículo": "Peso",
            "Peso del producto": "Peso",
            "Dimensiones del paquete": "Dimensiones",
            "Dimensiones del paquete: largo x ancho x alto": "Dimensiones",
            "Dimensiones del producto": "Dimensiones",
            "Dimensiones del artículo Largo x Ancho x Altura": "Dimensiones",
            "Dimensiones del artículo LxWxH": "Dimensiones",
            "Número de artículos": "Unidades",
            Fabricante: "Marca",
            "Número de pieza del fabricante": "Número de pieza",
        };
        for (const key in details) {
            if ((0, helpers_1.hasContactInfo)(details[key]))
                continue;
            let rightKey = key.replace(":", "");
            if (Object.keys(parsedKeys).includes(rightKey)) {
                rightKey = parsedKeys[rightKey];
            }
            if (!result.hasOwnProperty(rightKey) &&
                details[key] &&
                details[key].length < 200 &&
                !(0, flitersHelper_1.isForbbidenWord)(details[key])) {
                if (rightKey.toLocaleLowerCase().includes("marca") &&
                    details[key] &&
                    ((0, flitersHelper_1.isForbiddenProduct)(details[key]) || (0, flitersHelper_1.isAllowBrand)(details[key]))) {
                    result[rightKey] = "Producto genérico";
                }
                else {
                    result[rightKey] = details[key];
                }
            }
        }
        for (const key in specs) {
            if ((0, helpers_1.hasContactInfo)(specs[key]))
                continue;
            if ((0, flitersHelper_1.isForbiddenProduct)(specs[key]))
                throw new Error("Producto prohibido.");
            let rightKey = key;
            if (Object.keys(parsedKeys).includes(rightKey)) {
                rightKey = parsedKeys[rightKey];
            }
            if (!result.hasOwnProperty(rightKey) &&
                specs[key].length < 200 &&
                !(0, flitersHelper_1.isForbbidenWord)(specs[key])) {
                if (rightKey.toLocaleLowerCase().includes("marca") &&
                    details[key] &&
                    (0, flitersHelper_1.isAllowBrand)(details[key])) {
                    result[rightKey] = "Producto genérico";
                }
                else {
                    result[rightKey] = specs[key];
                }
            }
        }
        const { Dimensiones: dimensions } = result;
        if (!dimensions)
            throw new Error("Dimensiones no disponibles");
        // const splitedDimensions = dimensions.split("x");
        // const depth =
        //   splitedDimensions[0].split('"')[0].split(" ")[0].trim() + " pulgadas";
        // const width =
        //   splitedDimensions[1].split('"')[0].split(" ")[0].trim() + " pulgadas";
        // const height =
        //   splitedDimensions[2].split('"')[0].split(" ")[0].trim() + " pulgadas";
        const newDimensions = (0, helpers_1.separateDimensionsAndWeight)(dimensions);
        this.attributes = {
            ...result,
            ...newDimensions,
            "Dimensiones del producto": dimensions,
            SKU: this.seller_sku,
            // Largo: depth,
            // Ancho: width,
            // Alto: height,
        };
    }
    async setAttrByCategory(category_id) {
        const categories = await (0, jsonHelper_1.readJSON)("data/categories.json");
        if (categories.hasOwnProperty(category_id)) {
            const { default_values, parsed_attributes } = categories[category_id];
            for (const [key, rightKey] of Object.entries(parsed_attributes)) {
                if (typeof rightKey === "string" &&
                    this.attributes.hasOwnProperty(key) &&
                    !this.attributes.hasOwnProperty(rightKey)) {
                    const value = this.attributes[key];
                    delete this.attributes[key];
                    this.attributes[rightKey] = value;
                }
            }
            for (const [key, value] of Object.entries(default_values)) {
                if (!this.attributes.hasOwnProperty(key) && typeof value === "string") {
                    this.attributes[key] = value;
                }
            }
        }
    }
    checkWeight() {
        const { Peso: weight } = this.attributes;
        if (weight && typeof weight == "string") {
            if (weight.split(" ")[1] === "lb")
                return true;
            const units = this.getUnits();
            this.attributes["Peso"] = (0, helpers_1.weightToPounds)(weight, units);
            return true;
        }
        else {
            return false;
        }
    }
    setWeight(weight) {
        const units = this.getUnits();
        this.attributes["Peso"] = (0, helpers_1.weightToPounds)(weight, units);
    }
    setDefaultWeight(weight) {
        this.attributes["Peso"] = weight;
    }
    getUnits() {
        const { Unidades: units } = this.attributes;
        if (typeof units != "string")
            return 1;
        const cleanUnits = units
            ? units.replace(",", ".").split(" ")[0].trim()
            : "1";
        const rightUnits = parseInt(cleanUnits);
        return rightUnits;
    }
    correctTittle() {
        let newTitle = (0, flitersHelper_1.cleanText)(this.title);
        const genericWord = (0, flitersHelper_1.isAllowBrand)(newTitle);
        if (genericWord) {
            newTitle = `Producto genérico ${genericWord} ${newTitle}`;
        }
        this.title = (0, flitersHelper_1.cutText)(newTitle, 60);
    }
    correctDescription() {
        let bodyDescription = (0, flitersHelper_1.cleanText)(this.description);
        bodyDescription = (0, flitersHelper_1.cutText)(bodyDescription, 50000 - 5000);
        const attributesDescription = [];
        for (const attribute of Object.keys(this.attributes)) {
            if (attribute === "Peso" || attribute === "Dimensiones") {
                continue;
            }
            attributesDescription.push(`${attribute}: ${this.attributes[attribute]}`);
        }
        const attributesString = attributesDescription.join("\n");
        this.description = `
  ----------- POLITICAS - PRODUCTOS IMPORTADOS-----------
  ---------------------------------------------------------------------------
  ---------------------- TIEMPOS DE ENVÍO -------------------------
  --------------------------- DE 10 A 13 DÍAS ---------------------------
  ---------- HÁBILES A CIUDADES PRINCIPALES -----------------
  ----------------------------------------------------------------------------

  --- El producto se importa una vez el cliente realiza la compra
  --- Si su producto requiere confirmación de talla, color u otras características es necesario confirmar la disponibilidad  y el precio  antes de realizar la compra.
  
  Información adicional
  ${attributesString}

  Descripción
  ${!(0, helpers_1.hasContactInfo)(bodyDescription) ? (0, helpers_1.removeEmojis)(bodyDescription) : ""}

  Algunos municipios no tienen cobertura por nuestro proveedor logístico, ante la cual se entregan en una oficina o corresponsal asignada.

  * Productos, stock y tiempos de entrega sujetos a cambios
  * Envío Internacional

  «=========================================================»

  Somos facilitadores, traemos los productos desde el exterior para ti. El proceso se realiza con proveedores internacionales. Por ende, pueden existir variaciones de stock y/o precio, como resultado de la actualización automática realizada diariamente

  «=========================================================»
  «=========================================================»

  Los repuestos electrónicos para vehículos no cuentan con Garantía del proveedor. Ante lo cual no nos hacemos responsables.
  «=========================================================»

  ¿TIENEN ALGUNA GARANTÍA

  Nuestros proveedores nos ofrecen una garantía de 30 días la cual extendemos a nuestros clientes, esta cubre daños por defectos del material o errores en la fabricación. 

  No cubre mala manipulación por parte del usuario.

  ¿QUÉ PUEDO HACER EN CASO DE RETRACTO

  En caso de que ya no desee el producto recibido, puede realizar la devolución del mismo en un periodo no mayor a 5 días, a partir de su entrega. Para ello, deberá pagar el costo del retorno hacia EE.UU. Este varía de acuerdo al tamaño y peso del producto.

  -----------------------------------------------------------------------------
  ---------------------- TIEMPOS DE ENVÍO ---------------------------
  ------------------------ DE 10 A 13 DÍAS -------------------------------
  ---------- HÁBILES A CIUDADES PRINCIPALES -----------------
  -----------------------------------------------------------------------------
    `;
    }
    dumpsProduct() {
        const product = JSON.stringify(this);
        return JSON.parse(product);
    }
    getItemInfo() {
        const item = {
            title: this.title,
            sku: this.seller_sku,
            price: this.price,
            weight: this.attributes["Peso"],
            dimensions: this.attributes["Dimensiones"],
            category_id: this.category_id,
            description: this.description,
            attributes: this.attributes,
            pictures: this.pictures,
            condition: this.condition,
        };
        return item;
    }
}
exports.Product = Product;
