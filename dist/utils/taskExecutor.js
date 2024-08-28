"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTasksVoid = exports.runTasks = exports.runWithTimeoutAndRetries = exports.runWithTimeout = exports.chunkArray = void 0;
const chunkArray = (array, chunkSize) => {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
};
exports.chunkArray = chunkArray;
const runWithTimeout = async (promise, timeoutMs) => {
    let timeoutHandle = undefined;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
            reject(new Error("Operation timed out"));
        }, timeoutMs);
    });
    try {
        const result = await Promise.race([promise, timeoutPromise]);
        if (timeoutHandle)
            clearTimeout(timeoutHandle);
        return result;
    }
    catch (error) {
        if (timeoutHandle)
            clearTimeout(timeoutHandle);
        throw error;
    }
};
exports.runWithTimeout = runWithTimeout;
const runWithTimeoutAndRetries = async (fn, timeoutMs, retries = 3) => {
    let attempt = 0;
    while (attempt < retries) {
        let timeoutHandle = undefined;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error("Operation timed out"));
            }, timeoutMs);
        });
        try {
            const result = await Promise.race([fn, timeoutPromise]);
            if (timeoutHandle)
                clearTimeout(timeoutHandle);
            return result;
        }
        catch (error) {
            if (timeoutHandle)
                clearTimeout(timeoutHandle);
            if (error instanceof Error && error.message === "Operation timed out") {
                attempt++;
                if (attempt >= retries) {
                    throw error;
                }
                console.log(`Retrying (${attempt}/${retries})...`);
            }
            else {
                throw error; // No reintentar si el error no es un timeout
            }
        }
    }
    throw new Error('Max retries reached');
};
exports.runWithTimeoutAndRetries = runWithTimeoutAndRetries;
const runTasks = async (array, taskFunction, maxWorkers) => {
    const chunks = (0, exports.chunkArray)(array, maxWorkers);
    const results = [];
    for (const chunk of chunks) {
        const chunkResults = await Promise.all(chunk.map(async (el) => {
            try {
                return await taskFunction(el);
            }
            catch (error) {
                console.error(`Error processing task: ${error}`);
                return null;
            }
        }));
        results.push(...chunkResults.filter((result) => result !== null));
    }
    return results;
};
exports.runTasks = runTasks;
const runTasksVoid = async (array, taskFunction, maxWorkers) => {
    const tasks = [];
    const executeTask = async (element) => {
        try {
            await taskFunction(element);
        }
        catch (error) {
            console.error(`Error executing task: ${error}`);
        }
    };
    for (const element of array) {
        if (tasks.length >= maxWorkers) {
            await Promise.race(tasks);
        }
        const taskPromise = executeTask(element);
        taskPromise.then(() => {
            tasks.splice(tasks.indexOf(taskPromise), 1);
        });
        tasks.push(taskPromise);
    }
    await Promise.all(tasks);
};
exports.runTasksVoid = runTasksVoid;
async function withRetries(fn, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        }
        catch (error) {
            attempt++;
            if (attempt >= retries)
                throw error;
            console.log(`Retrying (${attempt}/${retries})...`);
        }
    }
    throw new Error('Max retries reached');
}
