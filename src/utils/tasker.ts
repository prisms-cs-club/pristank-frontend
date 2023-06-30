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
export class Tasker {
    tasks: { [key: string]: Task<any> };
    entry: string;
    results: { [key: string]: Promise<any>} = {};

    constructor(tasks: { [key: string]: Task<any> }, entry: string) {
        this.tasks = tasks;
        this.entry = entry;
    }

    /**
     * Start executing all tasks, starting from task given by `entry`.
     * @param taskStart Callback function when a task starts executing.
     * @param taskComplete Callback function when a task completes executing.
     * @param taskError Callback function when a task throws an error.
     * @returns The result of `entry` task.
     */
    start<T>(taskStart?: (name: string) => void, taskComplete?: (name: string) => void, taskError?: (name: string, error: any) => void) {
        const tasks = this.tasks;
        const results = this.results;
        function task(name: string) {
            if(tasks[name] == undefined) {
                // this task's name is not in the task list, thrown an error
                throw new Error(`Undefined task in tasker: \"${name}\"`);
            }
            if(results[name] == undefined) {
                // this task has not been executed yet
                const prereq = tasks[name].prerequisite.map(task);
                results[name] = Promise.all(prereq).then((prereqResult) => {
                    taskStart?.(name);
                    return tasks[name].callback(...prereqResult).then(
                        (value) => {
                            taskComplete?.(name);
                            return value;
                        },
                        error => {
                            taskError?.(name, error);
                            throw error;
                        }
                    );
                });
            }
            // this task has been executed, return the result
            return results[name];
        }
        return task(this.entry) as Promise<T>;
    }
}