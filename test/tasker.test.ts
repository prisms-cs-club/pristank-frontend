import { expect, test } from "@jest/globals";
import { Task, Tasker } from "../src/utils/tasker"

test("tasker without exceptions", async () => {
    const task1 = {
        prerequisite: [],
        callback: async () => {
            return [1, 2, 3];
        }
    };
    const task2 = {
        prerequisite: ["task1"],
        callback: async (ret1: any) => {
            ret1.push(2);
            return ret1;
        }
    };
    const loader = Tasker<number[]>({ "task1": task1, "task2": task2 }, "task2");
    expect(await loader).toStrictEqual([1, 2, 3, 2]);
});

test("tasker with exceptions", async () => {
    const task1 = {
        prerequisite: [],
        callback: async () => {
            return [1, 2, 3];
        }
    }
    const task2 = {
        prerequisite: ["task1"],
        callback: async (ret1: any) => {
            throw new Error("task2 failed");
        }
    }
    const loader = Tasker<number[]>({ "task1": task1, "task2": task2 }, "task2");
    try {
        await loader;
    } catch(e: any) {
        expect(e.message).toBe("task2 failed");
    }
});

test("tasker with multiple requirements", async () => {
    var task1Counter = 0;      // records the number of times task1 is executed
                               // if correctly implemented, task1 should only be executed once
    const task1 = {
        prerequisite: [],
        callback: async () => {
            task1Counter++;
            return [1, 2, 3];
        }
    }
    const task2 = {
        prerequisite: ["task1"],
        callback: async (ret1: any) => {
            const ret2 = ret1.slice();
            ret2.push(2);
            return ret2;
        }
    }
    const task3 = {
        prerequisite: ["task1", "task2"],
        callback: async (ret1: any, ret2: any) => {
            ret1 = ret1.concat(ret2);
            return ret1;
        }
    }
    const loader = Tasker<number[]>({ "task1": task1, "task2": task2, "task3": task3 }, "task3");
    expect(await loader).toStrictEqual([1, 2, 3, 1, 2, 3, 2]);
    expect(task1Counter).toBe(1);
});

test("tasker with unknown requirement", async () => {
    const task1 = {
        prerequisite: ["task0"],
        callback: async () => {
            return [1, 2, 3];
        }
    }
    const loader = Tasker({ "task1": task1 }, "task1");
    try {
        await loader;
    } catch(e: any) {
        expect(e.message).toBe("Undefined task in tasker: \"task0\"");
    }
})