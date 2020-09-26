export function toArray<T>(items: ArrayLike<T>): ReadonlyArray<T> {
    return Array.prototype.slice.call(items)
}

export function findIndex<T>(items: ArrayLike<T>, condition: (item: T) => boolean): number | undefined {
    for (let i = 0; i < items.length; ++i) {
        const item = items[i]
        if (condition(item)) {
            return i
        }
    }
    return undefined
}

export function find<T>(items: ArrayLike<T>, condition: (item: T) => boolean): T | undefined {
    const index = findIndex(items, condition)
    return typeof index === 'undefined' ? undefined : items[index]
}

export function hasOwnProperty<T, K extends Array<string | number | symbol>>(value: T, ...keys: K): value is T & { [P in K[number]]: unknown } {
    return value && keys.every(key => Object.prototype.hasOwnProperty.call(value, key))
}
