import { TextAxis } from '@client/app/viz/textAxis';
import { TextColumn } from '@client/app/data/data';
import { DataTree } from '@client/app/data/dataTree';

export type Person = {
    family_name: string;
    gender: string;
    given_name: string;
    party: string;
    person_id: number;
    source_id: string;
    status: string;
    year_of_birth: number;
};

export class PersonOverviewChart {
    private canvasElm: HTMLCanvasElement;
    constructor(canvasElm: HTMLCanvasElement) {
        this.canvasElm = canvasElm;
    }

    public draw(data: Person[], axisLevels: TextColumn<Person>[]) {
        const bounds = {
            x: 0,
            y: 0,
            width: this.canvasElm.width,
            height: this.canvasElm.height,
        };

        const dataTree = new DataTree<Person>(data);
        dataTree.setLevels(axisLevels);
        const xAxis = new TextAxis<Person>(dataTree);
        xAxis.createLayout(bounds);

        //Items should always be individuals
        const chartLevels = axisLevels.concat([new TextColumn<Person>('source_id')]);
        const chartTree = new DataTree<Person>(data);
        chartTree.setLevels(chartLevels);

        const context = this.canvasElm.getContext('2d');
        if (context === null) {
            throw Error('penis');
        }
        context.clearRect(0, 0, 10000, 10000);

        context.font = '12px Arial';
        context.fillStyle = 'black';

        xAxis.draw(context);

        const drawBounds = {
            x: bounds.x,
            y: xAxis.bounds.y + xAxis.bounds.height,
            height: bounds.height - xAxis.bounds.height,
            width: bounds.width,
        };

        const nodes = chartTree.getNodesAtLevel(chartLevels.length - 2);

        //basically a bar chart
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const [x1, x2] = xAxis.getNodeInterval(node);
            const width = x2 - x1 + 1;
            const midX = x1 + (width - 1) / 2;
            const radius = 3;
            for (let j = 0; j < node.children.length; j++) {
                const y = radius + drawBounds.y + j * radius * 2;

                context.beginPath();
                context.arc(midX, y, radius, 0, Math.PI * 2);
                context.fillStyle = 'rgb(70, 70, 128)';
                context.fill();
            }
        }
    }
}
