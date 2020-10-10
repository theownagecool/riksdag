import { SimpleDataObject, Column, TextColumn, MapLike } from '@client/app/data/data';

export class DataTree<T extends MapLike> {
    private root: BranchNode<T> = new BranchNode<T>('root', undefined, 0);
    private data: T[] = [];
    private levels: TextColumn<T>[] = [];

    constructor(data: T[]) {
        this.data = data;
    }

    public setLevels(levels: TextColumn<T>[]) {
        this.levels = levels;
        this.buildTree();
    }

    private buildTree() {
        this.root = dataToTree(this.data, this.levels);
    }

    public getDepth() {
        return this.levels.length;
    }

    public getRoot() {
        return this.root;
    }

    public getNodesAtLevel(level: number) {
        if (level === -1) {
            return [this.root];
        }
        if (level === 0) {
            return this.root.children;
        }
        const stack = this.root.children.slice();
        const items: BranchNode<T>[] = [];
        while (stack.length > 0) {
            const node = stack.pop() as BranchNode<T>;
            if (node.level === level) {
                Array.prototype.push.apply(items, node.children);
            } else {
                Array.prototype.push.apply(stack, node.children);
            }
        }
        return items;
    }

    public getNodePath(node: BranchNode<T>) {
        if (node === this.root) {
            return [];
        }
        const path = [node.key];
        let pointer = node.parent;
        while (pointer !== undefined) {
            if (pointer.key !== 'root') {
                path.push(pointer.key);
            }
            pointer = pointer.parent;
        }
        return path.reverse();
    }
}

export class BranchNode<T extends MapLike> {
    public children: BranchNode<T>[] = [];
    public key: string;
    public parent: BranchNode<T> | undefined;
    public level: number;
    public data: DataNode<T>[] = [];
    type: 'branch' = 'branch';

    constructor(key: string, parent: BranchNode<T> | undefined, level: number) {
        this.key = key;
        this.parent = parent;
        this.level = level;
    }
}

export class DataNode<T extends MapLike> {
    public value: SimpleDataObject<T>;
    public parent: Node<T>;
    public level: number;
    type: 'data' = 'data';

    constructor(value: SimpleDataObject<T>, parent: Node<T>, level: number) {
        this.value = value;
        this.parent = parent;
        this.level = level;
    }

    public getValue(col: Column<T>) {
        const value = col.getValue(this.value);
        return value;
    }
}

export type Node<T extends MapLike> = BranchNode<T> | DataNode<T>;

function dataToTree<T extends MapLike>(data: SimpleDataObject<T>[], levels: TextColumn<T>[]): BranchNode<T> {
    const root = new BranchNode<T>('root', undefined, 0);
    if (levels.length === 0) {
        root.data = _createDataNodes(data, root, 1);
    } else {
        const children = _dataToTreeRec<T>(data, root, levels, 0);
        root.children = children;
    }
    return root;
}

function _dataToTreeRec<T extends MapLike>(
    data: SimpleDataObject<T>[],
    parentNode: BranchNode<T>,
    levels: TextColumn<T>[],
    level: number
): BranchNode<T>[] {
    const key = levels[level].key;
    const groupedByKey = groupBy(data, key);
    const nodes = Object.keys(groupedByKey).map((groupKey) => {
        const node = new BranchNode(groupKey, parentNode, level + 1);
        const values = groupedByKey[groupKey];
        if (level < levels.length - 1) {
            const childNodes = _dataToTreeRec(values, node, levels, level + 1);
            node.children = childNodes;
        } else {
            const dataNodes = _createDataNodes(values, node, level);
            node.data = dataNodes;
        }
        return node;
    });
    return nodes;
}

function _createDataNodes<T extends MapLike>(data: SimpleDataObject<T>[], parentNode: BranchNode<T>, level: number) {
    return data.map((item) => new DataNode<T>(item, parentNode, level));
}

function groupBy(arr: any, key: string): any {
    return arr.reduce((acc: any, v: any) => {
        const groupKey = v[key];
        if (acc[groupKey] === undefined) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(v);
        return acc;
    }, {});
}
