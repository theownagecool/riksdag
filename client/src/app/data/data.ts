export type MapLike = {
    [key: string]: unknown;
};

export type SimpleDataObject<T extends MapLike> = { [key in keyof T]: T[key] };

export type KeysOfValueType<T, KType> = {
    [K in keyof T]: K extends string ? (T[K] extends KType ? K : never) : never;
}[keyof T];

export type FilterBy<T, U> = {
    [K in KeysOfValueType<T, U>]: U;
};

export type StringKeys<T> = KeysOfValueType<T, string>;
export type NumericKeys<T> = KeysOfValueType<T, number>;

export class ColumnFactory<T extends MapLike> {
    public makeTextColumn<K extends StringKeys<T>>(key: K): Column<T> {
        return new TextColumn<T>(key);
    }
}
export class TextColumn<T extends MapLike> {
    public key: StringKeys<T>;
    constructor(key: StringKeys<T>) {
        this.key = key;
    }

    public getValue(data: T): string {
        return data[this.key] as string;
    }
}

export class NumericColumn<T extends MapLike> {
    public key: NumericKeys<T>;
    constructor(key: NumericKeys<T>) {
        this.key = key;
    }

    public getValue(data: T): number {
        return data[this.key] as number;
    }
}

export type Column<T extends MapLike> = NumericColumn<T> | TextColumn<T>;
