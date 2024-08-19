import { Attributes, ProductDetails } from "../types/index";
import { cleanText, cutText, isAllowBrand } from "../utils/flitersHelper";
import {
  extractChairsNumber,
  separateDimensionsAndWeight,
  weightToPounds,
  removeEmojis,
} from "../utils/helpers";
import { readJSON } from "../utils/jsonHelper";

export class Product {
  private seller_sku: string;
  private title: string;
  private price: number;
  private description: string;
  private attributes: Attributes;
  private category_id: string | null;
  private pictures: {
    source: string;
  }[];

  constructor(data: any) {
    const { title, price, description, sku } = data;
    this.title = title;
    this.price = price;
    this.description = description;
    this.pictures = [];
    this.seller_sku = sku;
    this.category_id = null;
    this.attributes = {};
  }

  setData(data: any){
    const { title, price, description, sku, pictures, category_id, attributes } = data;
    this.title = title;
    this.price = price;
    this.description = description;
    this.pictures = pictures;
    this.seller_sku = sku;
    this.category_id = category_id;
    this.attributes = attributes;
  }

  setImages(images: { source: string }[]) {
    this.pictures = images;
  }

  async setCategoryId(categoryId: string) {
    this.category_id = categoryId;
    if (categoryId === "MCO177108") {
      const attributeName = "Cantidad de sillas";
      const piecesCount = this.attributes["Número de piezas"];
      if (piecesCount && typeof piecesCount == "string") {
        this.attributes[attributeName] =
          parseInt(piecesCount.split(" ")[0]) - 1;
      } else {
        this.attributes[attributeName] = extractChairsNumber(
          `${this.title} ${this.description}`
        );
      }
      if (!this.attributes[attributeName])
        throw new Error(`Atributo faltante ${attributeName}`);
    } else {
      await this.setAttrByCategory(categoryId)
    }
  }

  setAttributes(details: any, specs: any) {
    const result: ProductDetails = {};
    const parsedKeys: Record<string, string> = {
      "Peso del paquete": "Peso",
      "Peso del artículo": "Peso",
      "Peso del producto": "Peso",
      "Dimensiones del paquete": "Dimensiones",
      "Dimensiones del paquete: largo x ancho x alto": "Dimensiones",
      "Dimensiones del producto": "Dimensiones",
      "Dimensiones del artículo Largo x Ancho x Altura": "Dimensiones",
      "Dimensiones del artículo LxWxH": "Dimensiones",
      "Número de artículos": "Unidades",
      "Fabricante": "Marca"
    };

    for (const key in details) {
      let rightKey = key.replace(":", "");
      if (Object.keys(parsedKeys).includes(rightKey)) {
        rightKey = parsedKeys[rightKey];
      }
      if (!result.hasOwnProperty(rightKey) && details[key].length < 200) {
        result[rightKey] = details[key];
      }
    }

    for (const key in specs) {
      let rightKey = key;
      if (Object.keys(parsedKeys).includes(rightKey)) {
        rightKey = parsedKeys[rightKey];
      }
      if (!result.hasOwnProperty(rightKey) && specs[key].length < 200) {
        result[rightKey] = specs[key];
      }
    }

    const { Dimensiones: dimensions } = result;
    if (!dimensions) throw new Error("Dimensiones no disponibles");

    const newDimensions = separateDimensionsAndWeight(dimensions);

    this.attributes = { ...result, ...newDimensions, SKU:this.seller_sku };
  }

  async setAttrByCategory(category_id: string) {
    const categories = await readJSON("data/categories.json");
    if (categories.hasOwnProperty(category_id)) {
      const { default_values, parsed_attributes } = categories[category_id];

      for (const [key, rightKey] of Object.entries(parsed_attributes)) {
        if (this.attributes.hasOwnProperty(key)) {
          const value = this.attributes[key];
          delete this.attributes[key];
          if (typeof rightKey === "string") {
            this.attributes[rightKey] = value;
          }
        }
      }

      for (const [key, value] of Object.entries(default_values)) {
        if (!this.attributes.hasOwnProperty(key) && typeof(value) === "string"){
          this.attributes[key] = value
        }
      }
    }
  }

  checkWeight() {
    const { Peso: weight } = this.attributes;
    if (weight && typeof weight == "string") {
      if (weight.split(" ")[1] === "lb") return true;
      const units = this.getUnits();
      this.attributes["Peso"] = weightToPounds(weight, units);
      return true;
    } else {
      return false;
    }
  }

  setWeight(weight: string) {
    const units = this.getUnits();
    this.attributes["Peso"] = weightToPounds(weight, units);
  }

  getUnits() {
    const { Unidades: units } = this.attributes;
    if (typeof units != "string") return 1;
    const cleanUnits = units
      ? units.replace(",", ".").split(" ")[0].trim()
      : "1";
    const rightUnits = parseInt(cleanUnits);
    return rightUnits;
  }

  correctTittle() {
    let newTitle = cleanText(this.title);
    const genericWord = isAllowBrand(newTitle);
    if (genericWord) {
      newTitle = `Producto genérico ${genericWord} ${newTitle}`;
    }
    this.title = cutText(newTitle, 60);
  }

  correctDescription() {
    let bodyDescription = cleanText(this.description);
    bodyDescription = cutText(bodyDescription, 50000 - 500);
    const attributesDescription: string[] = [];

    let weight: string | number | null = "";
    for (const attribute of Object.keys(this.attributes)) {
      if (attribute === "Peso") {
        weight = this.attributes[attribute];
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

  (descripción del producto en amazon)
  
  SKU: ${this.seller_sku}
  PESO: ${weight}
  
  Información adicional del producto
  ${attributesString}

  Descripción del producto
  ${removeEmojis(bodyDescription)}

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
      pictures: this.pictures
    };

    return item;
  }
}
