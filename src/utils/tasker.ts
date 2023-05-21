export type Task<R> = {
    prerequisite: string[];
    callback: (...prereq: any[]) => Promise<R>;
}

/**
 * A simple tasker that can execute tasks and handle prerequisites.
 * 
 * One entry task is specified, and the loader will return the result of entry task when all required
 * tasks finished loading.
 * 
 * The tasker itself cannot detect circular dependencies, so the user should check for dependency issues
 * before calling the tasker.
 * 
 * The tasker also does not strictly check for types.
 * @param tasks List of all tasks with their name.
 * @param entry The entry task to start with.
 * @returns The result of entry task.
 */
export function Tasker<T>(tasks: { [key: string]: Task<any> }, entry: string) {
    const results: { [key: string]: Promise<any>} = {};
    function task(name: string) {
        if(tasks[name] == undefined) {
            // this task's name is not in the task list, thrown an error
            throw new Error(`Undefined task in tasker: \"${name}\"`);
        }
        if(results[name] == undefined) {
            // this task has not been executed yet
            results[name] = new Promise((resolve, reject) => {
                const prereq = tasks[name].prerequisite.map(task);
                Promise.all(prereq).then((prereqResult) => {
                    console.log(`Executing task \"${name}\"...`);
                    try {
                        resolve(tasks[name].callback(...prereqResult));
                    } catch(e) {
                        reject(e);
                    }
                }).then(() => {
                    console.log(`Task \"${name}\" done.`);
                });
            });
        }
        // this task has been executed, return the result
        return results[name];
    }
    return task(entry) as Promise<T>;
}