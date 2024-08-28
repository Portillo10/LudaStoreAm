"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const task_1 = require("../db/models/task");
class Task {
    mainUrl;
    linkList;
    category_id;
    currentUrl;
    type;
    weight;
    skuList;
    constructor(url, productUrls, category, weight, skuList) {
        this.mainUrl = url;
        this.linkList = productUrls;
        this.category_id = category;
        this.currentUrl = this.mainUrl;
        this.type = category ? "scraper" : "tracker";
        this.weight = weight;
        this.skuList = skuList;
    }
    async saveTask() {
        const task = await Task.getLastTask();
        if (!task) {
            await (0, task_1.createTask)(this);
        }
    }
    static async getTasks(linkList) {
        const taskList = linkList.map((element) => new Task(element.url, [], element.category, element.weight, []));
        const lastTask = await this.getLastTask();
        if (lastTask) {
            taskList.unshift(lastTask);
        }
        return taskList;
    }
    setTask(data) {
        this.mainUrl = data.mainUrl;
        this.linkList = data.linkList;
        this.currentUrl = data.currentUrl;
        this.category_id = data.category_id;
        this.type = data.type;
        this.weight = data.weight;
    }
    static async getLastTask() {
        const lastTask = await (0, task_1.getTask)();
        const task = new Task("", [], "", "1", []);
        if (lastTask) {
            task.setTask(lastTask);
            return task;
        }
        else
            return null;
    }
    async endTask() {
        const finished = await (0, task_1.deleteTask)();
        return finished;
    }
    async deleteLinkElement(link) {
        const deleted = await (0, task_1.deleteLink)(link);
        return deleted;
    }
    async loadLinks(links) {
        this.linkList.push(...links);
        await (0, task_1.addLinks)(this.linkList);
    }
    inProgress() {
        return this.linkList.length > 0 && this.currentUrl != null;
    }
    async setCurrentUrl(url) {
        this.currentUrl = url;
        await (0, task_1.updateCurrentUrl)(url);
    }
    async addSku(sku) {
        this.skuList.push(sku);
        return await (0, task_1.insertSku)(sku);
    }
}
exports.Task = Task;
