import {
  getTask,
  addLinks,
  createTask,
  deleteLink,
  deleteTask,
  updateCurrentUrl,
} from "../db/models/task";

export class Task {
  public mainUrl: string;
  public linkList: string[];
  public category_id: string | null;
  public currentUrl: string | null;
  public type: "scraper" | "tracker";

  constructor(url: string, productUrls: string[], category: string) {
    this.mainUrl = url;
    this.linkList = productUrls;
    this.category_id = category;
    this.currentUrl = this.mainUrl;
    this.type = category ? "scraper" : "tracker";
  }

  async saveTask() {
    const task = await Task.getLastTask();
    if (!task) {
      await createTask(this);
    }
    // console.log("si sirbe");
  }

  static async getTasks(linkList: { url: string; category: string }[]) {
    const taskList = linkList.map(
      (element) => new Task(element.url, [], element.category)
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
  }

  static async getLastTask(): Promise<Task | null> {
    const lastTask = await getTask();
    const task = new Task("", [], "");
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
}
