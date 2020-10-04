import { Database, QueryResult } from './db';
import { hasOwnProperty, repeat } from '../../../common/util';

type DeriveType<T> = T extends Field<infer R, any> ? R : never;

type ModelDefinition<T> = {
    [K in keyof T]: Field<any, any>;
};

type ModelMethods = {
    delete(): Promise<unknown>;
    save(): Promise<unknown>;
};
export type Model<T extends ModelDefinition<any>, PK extends string> = { [K in keyof T]: DeriveType<T[K]> } &
    { readonly [K in PK]?: number } &
    ModelMethods;

type ModelClass<T extends ModelDefinition<any>, PK extends string> = {
    new (args: ModelConstructorArgs<T>): Model<T, PK>;
};

type RequiredConstructorKeys<T extends ModelDefinition<any>> = {
    [K in keyof T]-?: T[K]['defaultValue'] extends undefined ? K : never;
}[keyof T];

type OptionalConstructorKeys<T extends ModelDefinition<any>> = {
    [K in keyof T]-?: T[K]['defaultValue'] extends DeriveType<T[K]> ? K : never;
}[keyof T];

type ModelConstructorArgs<T extends ModelDefinition<any>> = { [K in RequiredConstructorKeys<T>]: DeriveType<T[K]> } &
    { [K in OptionalConstructorKeys<T>]?: DeriveType<T[K]> };

type DatabaseResolver = () => Database | undefined;

function buildColumnsAndValues<T extends ModelDefinition<any>>(
    model: ModelBase<T>
): [ReadonlyArray<string>, ReadonlyArray<any>] {
    const columns: Array<string> = [];
    const values: Array<any> = [];
    const pkName = model.getPrimaryKeyName();

    for (const key in model) {
        // "undefined" means that we should use the database default
        // for the column (if set). we also exclude the primary key
        // to make it impossible to accidentally change the ID of
        // an old model.
        if (hasOwnProperty(model, key) && typeof model[key] !== 'undefined' && key !== pkName) {
            columns.push(key);
            values.push(model[key]);
        }
    }

    return [columns, values];
}

export abstract class ModelBase<T extends ModelDefinition<any>> {
    public abstract getDefinition(): T;
    public abstract getPrimaryKeyName(): string;
    public abstract getTableName(): string;

    public static resolveDatabase: DatabaseResolver = () => undefined;

    public async save(): Promise<unknown> {
        const db = ModelBase.resolveDatabase();

        if (typeof db === 'undefined') {
            return Promise.reject(new Error('Could not resolve database connection.'));
        }

        const pkName = this.getPrimaryKeyName();
        const isNewRecord = typeof (this as Model<T, any>)[pkName] === 'undefined';

        if (isNewRecord) {
            const result = await this.insert(db);
            (this as any)[pkName] = result.lastId;
            return result;
        } else {
            return this.update(db);
        }
    }

    protected insert(db: Database): Promise<QueryResult> {
        const tableName = this.getTableName();
        const [columns, values] = buildColumnsAndValues(this);
        const columnsAsString = columns.join(', ');
        const placeholdersAsString = repeat('?', columns.length).join(', ');
        const query = `
INSERT INTO ${tableName} (${columnsAsString})
     VALUES (${placeholdersAsString})`;

        return db.execute(query, values);
    }

    protected update(db: Database): Promise<unknown> {
        const tableName = this.getTableName();
        const pkName = this.getPrimaryKeyName();
        const [columns, values] = buildColumnsAndValues(this);
        const statements = columns.map((c) => `${c} = ?`).join(', ');
        const query = `
UPDATE ${tableName}
   SET ${statements}
 WHERE ${pkName} = ?`;

        const pk = (this as any)[pkName];

        return db.execute(query, values.concat(pk));
    }
}

export class Field<T, D extends T | undefined> {
    public readonly defaultValue: D;

    constructor(defaultValue: D) {
        this.defaultValue = defaultValue;
    }

    public default<V extends T>(value: V): Field<T, V> {
        return new Field(value);
    }

    public nullable(): Field<T | null, D> {
        return new Field(this.defaultValue);
    }

    public static boolean() {
        return new Field<boolean, undefined>(undefined);
    }
    public static number() {
        return new Field<number, undefined>(undefined);
    }
    public static string() {
        return new Field<string, undefined>(undefined);
    }
}

export function createModel<T extends ModelDefinition<any>, PK extends string>(
    tableName: string,
    primaryKeyName: PK,
    definition: T
): ModelClass<T, PK> {
    class ModelImpl extends ModelBase<T> {
        constructor(args: ModelConstructorArgs<T>) {
            super();

            Object.defineProperty(this, primaryKeyName, {
                enumerable: true,
                value: (args as any)[primaryKeyName],
                writable: true,
            });

            for (const key in definition) {
                const value = (args as any)[key] ?? definition[key].defaultValue;

                Object.defineProperty(this, key, {
                    enumerable: true,
                    value,
                    writable: true,
                });
            }
        }

        public getDefinition() {
            return definition;
        }

        public getPrimaryKeyName() {
            return primaryKeyName;
        }

        public getTableName() {
            return tableName;
        }
    }

    return (ModelImpl as unknown) as ModelClass<T, PK>;
}

export type DeriveModel<T> = T extends ModelClass<infer U, infer PK> ? Model<U, PK> : never;
