import {
  getTask,
  addLinks,
  createTask,
  deleteLink,
  deleteTask,
  updateCurrentUrl,
  insertSku,
} from "../db/models/task";

export class Task {
  public mainUrl: string;
  public linkList: string[];
  public category_id: string | null;
  public currentUrl: string | null;
  public type: "scraper" | "tracker";
  public weight: string;
  public skuList: string[]

  constructor(
    url: string,
    productUrls: string[],
    category: string,
    weight: string,
    skuList: string[]
  ) {
    this.mainUrl = url;
    this.linkList = productUrls;
    this.category_id = category;
    this.currentUrl = this.mainUrl;
    this.type = category ? "scraper" : "tracker";
    this.weight = weight;
    this.skuList = skuList
  }

  async saveTask() {
    const task = await Task.getLastTask();
    if (!task) {
      await createTask(this);
    }
  }

  static async getTasks(
    linkList: { url: string; category: string; weight: string }[]
  ) {
    const taskList = linkList.map(
      (element) => new Task(element.url, [], element.category, element.weight, [])
    );
    const lastTask = await this.getLastTask();
    if (lastTask) {
      taskList.unshift(lastTask);
    }

    return taskList;
  }

  setTask(data: Task) {
    this.mainUrl = data.mainUrl;
    this.linkList = data.linkList;
    this.currentUrl = data.currentUrl;
    this.category_id = data.category_id;
    this.type = data.type;
    this.weight = data.weight
  }

  static async getLastTask(): Promise<Task | null> {
    const lastTask = await getTask();
    const task = new Task("", [], "", "1", []);
    if (lastTask) {
      task.setTask(lastTask);
      return task;
    } else return null;
  }

  async endTask() {
    const finished = await deleteTask();
    return finished;
  }

  async deleteLinkElement(link: string) {
    const deleted = await deleteLink(link);
    return deleted;
  }

  async loadLinks(links: string[]) {
    this.linkList.push(...links);
    await addLinks(this.linkList);
  }

  inProgress() {
    return this.linkList.length > 0 && this.currentUrl != null;
  }

  async setCurrentUrl(url: string | null) {
    this.currentUrl = url;
    await updateCurrentUrl(url);
  }

  async addSku(sku:string) {
    this.skuList.push(sku)
    return await insertSku(sku)
  }
}
