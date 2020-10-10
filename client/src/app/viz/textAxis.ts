import { MapLike } from '@client/app/data/data';
import { DataTree, BranchNode } from '@client/app/data/dataTree';

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type CellChildren = { [key: string]: Cell };

type Cell = {
    bounds: Bounds;
    key: string;
    children: CellChildren;
};

export class TextAxis<T extends MapLike> {
    private cellSize = 40;
    public bounds: Bounds = { x: 0, y: 0, width: 0, height: 0 };
    private rootCell: Cell = {
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        key: '',
        children: {},
    };
    private dataTree: DataTree<T>;

    constructor(dataTree: DataTree<T>) {
        this.dataTree = dataTree;
    }

    public getNodeInterval(node: BranchNode<T>) {
        const path = this.dataTree.getNodePath(node);

        let targetCell = this.rootCell;
        for (let key of path) {
            targetCell = targetCell.children[key];
        }

        return [targetCell.bounds.x, targetCell.bounds.x + targetCell.bounds.width];
    }

    public createLayout(bounds: Bounds): void {
        this.bounds = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
        };

        const depth = this.dataTree.getDepth();
        this.bounds.y = bounds.y;
        this.bounds.height = this.cellSize * depth;

        const children = this.createLayoutRec(this.dataTree.getRoot().children, bounds, 1);

        this.rootCell = {
            bounds: this.bounds,
            key: 'root',
            children: children,
        };
    }

    private createLayoutRec(nodes: BranchNode<T>[], bounds: Bounds, level: number): CellChildren {
        if (level === this.dataTree.getDepth() + 1) {
            return {};
        }
        const foo: CellChildren = {};
        const itemSize = bounds.width / nodes.length;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const cellBounds = {} as Bounds;
            cellBounds.x = bounds.x + i * itemSize;
            cellBounds.y = (level - 1) * this.cellSize;
            cellBounds.width = itemSize;
            cellBounds.height = this.cellSize;

            const childCells = this.createLayoutRec(node.children, cellBounds, level + 1);

            const cell: Cell = {
                key: node.key,
                bounds: cellBounds,
                children: childCells,
            };
            foo[node.key] = cell;
        }
        return foo;
    }

    public draw(context: CanvasRenderingContext2D) {
        context.save();
        // context.translate(this.bounds.x, this.bounds.y);
        this.drawRec(Object.values(this.rootCell.children), context);
        context.restore();
    }

    private drawRec(cells: Cell[], context: CanvasRenderingContext2D) {
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const bounds = cell.bounds;

            let text = cell.key;
            let textWidth = context.measureText(text).width;
            if (textWidth > bounds.width) {
                while (textWidth > bounds.width) {
                    text = text.substring(0, text.length - 2);
                    textWidth = context.measureText(text).width;
                }
            }
            const textX = bounds.x + (bounds.width - textWidth) / 2;
            const textY = bounds.y + bounds.height - 1 - 4;
            context.fillText(text, textX, textY);
            context.save();
            context.translate(0.5, 0.5);
            context.beginPath();
            context.moveTo(bounds.x, bounds.y + bounds.height - 1);
            context.lineTo(bounds.x + bounds.width - 1, bounds.y + bounds.height - 1);
            context.stroke();
            context.restore();

            this.drawRec(Object.values(cell.children), context);
        }
    }
}
