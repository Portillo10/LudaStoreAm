import Tesseract from "tesseract.js";

export const solveCaptcha = async (image: string | Buffer): Promise<string> => {
  try {
    const result = await Tesseract.recognize(image, "eng", {
      logger: (m) => console.log(m.status),
    });

    return result.data.text.trim();
  } catch (error) {
    console.error("Error al procesar el captcha:", error);
    throw new Error("No se pudo resolver el captcha");
  }
};
