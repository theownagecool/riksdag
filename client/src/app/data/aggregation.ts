import { Column, MapLike, NumericColumn } from '@client/app/data/data';
import { Node } from '@client/app/data/dataTree';

export class SumAggregate {
    aggregate<T extends MapLike>(col: NumericColumn<T>, node: Node<T>): number {
        switch (node.type) {
            case 'branch':
                return node.children.reduce((acc, node) => acc + this.aggregate(col, node), 0);
            case 'data':
                const value = node.getValue(col) as number;
                return value;
        }
    }
}

export class CountAggregate {
    aggregate<T extends MapLike>(col: Column<T>, node: Node<T>): number {
        switch (node.type) {
            case 'branch':
                if (node.data.length > 0) {
                    return node.data.reduce((acc, node) => acc + this.aggregate(col, node), 0);
                }
                return node.children.reduce((acc, node) => acc + this.aggregate(col, node), 0);
            case 'data':
                return node.getValue(col) !== undefined ? 1 : 0;
        }
    }
}
