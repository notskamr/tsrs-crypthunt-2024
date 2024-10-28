export function cryptoRand() {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return (randomBuffer[0] / (0xffffffff + 1));
}

export function forEach<T = any>(array: T[], callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any) {
    callbackfn.bind(thisArg);
    for (let i = 0; i < array.length; i++) {
        callbackfn(array[i], i, array);
    }
}

export function map<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => any, thisArg?: any) {
    callbackfn.bind(thisArg);
    const newArray: any[] = [];
    for (let i = 0; i < array.length; i++) {
        newArray.push(callbackfn(array[i], i, array));
    }
    return newArray;
}

export function reduce(array: Array<any>, callbackfn: (previousValue: any, currentValue: any, currentIndex: number, array: any[]) => any, initialValue?: any) {
    let accumulator = initialValue;
    for (let i = 0; i < array.length; i++) {
        accumulator = callbackfn(accumulator, array[i], i, array);
    }
    return accumulator;
}

export function sum(array: Array<number>) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

export function average(array: Array<number>) {
    return sum(array) / array.length;
}

export function max(array: Array<number>) {
    return reduce(array, (max, current) => current > max ? current : max, array[0]);
}

export function min(array: Array<number>) {
    return reduce(array, (min, current) => current < min ? current : min, array[0]);
}

export function range(start: number, end: number) {
    const array: number[] = [];
    for (let i = Math.floor(start); i < Math.floor(end); i++) {
        array.push(i);
    }
    return array;
}

export function filter<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any) {
    return array.filter(callbackfn, thisArg);
}