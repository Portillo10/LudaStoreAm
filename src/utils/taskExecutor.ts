const chunkArray = (array: any[], chunkSize: number) => {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

export const runWithTimeout = async <R>(
  promise: Promise<R>,
  timeoutMs: number
): Promise<R> => {
  let timeoutHandle: NodeJS.Timeout | undefined = undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error("Operation timed out"));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutHandle) clearTimeout(timeoutHandle);
    return result;
  } catch (error) {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    throw error;
  }
};

export const runWithTimeoutAndRetries = async <R>(
  fn: Promise<R>,
  timeoutMs: number,
  retries: number = 3,
): Promise<R> => {
  let attempt = 0;

  while (attempt < retries) {
    let timeoutHandle: NodeJS.Timeout | undefined = undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error("Operation timed out"));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([fn, timeoutPromise]);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      return result;
    } catch (error) {
      if (timeoutHandle) clearTimeout(timeoutHandle);

      if (error instanceof Error && error.message === "Operation timed out") {
        attempt++;
        if (attempt >= retries) {
          throw error;
        }
        console.log(`Retrying (${attempt}/${retries})...`);
      } else {
        throw error; // No reintentar si el error no es un timeout
      }
    }
  }

  throw new Error('Max retries reached');
}

export const runTasks = async <T, R>(
  array: T[],
  taskFunction: (taskElement: T) => Promise<R>,
  maxWorkers: number
) => {
  const chunks: any[][] = chunkArray(array, maxWorkers);
  const results: R[] = [];
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (el) => {
        try {
          return await taskFunction(el);
        } catch (error) {
          console.error(`Error processing task: ${error}`);
          return null;
        }
      })
    );

    results.push(...chunkResults.filter((result) => result !== null));
  }
  return results;
};

export const runTasksVoid = async <T, R>(
  array: T[],
  taskFunction: (taskElement: T) => Promise<R>,
  maxWorkers: number
) => {
  const tasks: Promise<void>[] = []

  const executeTask = async (element: T) => {
    try {
      await taskFunction(element);
    } catch (error) {
      console.error(`Error executing task: ${error}`);
    }
  };

  for (const element of array) {
    if (tasks.length >= maxWorkers) {
      await Promise.race(tasks)
    }
    const taskPromise = executeTask(element)
    taskPromise.then(() => {
      tasks.splice(tasks.indexOf(taskPromise), 1)
    })

    tasks.push(taskPromise)
  }

  await Promise.all(tasks)
};

async function withRetries<T>(fn: () => Promise<T>, retries: number = 3): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= retries) throw error;
      console.log(`Retrying (${attempt}/${retries})...`);
    }
  }
  throw new Error('Max retries reached');
}

