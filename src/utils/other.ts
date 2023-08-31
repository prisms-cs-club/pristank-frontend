/**
 * Get the value of a key in an object. If the key is not found, throw an error.
 * @param obj an object
 * @param key the key to reference
 * @param errorMessage optional. The error message to throw if the key is not found.
 * @returns The value of the key.
 */
export function strictField<T>(obj: { [key: string]: T }, key: string, errorMessage?: string): T {
    if(obj[key] == undefined) {
        throw (errorMessage != undefined)? new Error(errorMessage): new Error(`Field ${key} is missing.`);
    }
    return obj[key];
}

/**
 * Get the value of an index in an array. If the index is out of range, throw an error.
 * @param arr The array to reference
 * @param index The index
 * @param errorMessage optional. The error message to throw if the index is out of range.
 * @returns The value on the index.
 */
export function strictIndex<T>(arr: T[], index: number, errorMessage?: string): T {
    if(index >= 0 && index < arr.length) {
        throw (errorMessage != undefined)? new Error(errorMessage): new Error(`Index ${index} is out of range.`);
    }
    return arr[index];
}

/**
 * Checks if a value is not undefined.
 * ! This function is only enabled in development mode. In release mode, comment this out and de-comment
 * ! the function below.
 * @param val value to check
 * @param errorMessage Optional. The error message to throw if the value is undefined.
 * @returns the checked value
 */
export function assertDef<T>(val?: T, errorMessage?: string): T {
    if(val == undefined) {
        throw (errorMessage != undefined)? new Error(errorMessage): new Error(`Value is null.`);
    }
    return val;
}

//// export function assertDef<T>(val?: T, errorMessage?: string): T {
////     return val!!;
//// }

export function sortByKey<T>(arr: T[], key: (a: T) => number) {
    return arr.sort((a, b) => key(a) - key(b));
}
