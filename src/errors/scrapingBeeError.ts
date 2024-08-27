export class ScrapingBeeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, ScrapingBeeError.prototype);
  }
}
