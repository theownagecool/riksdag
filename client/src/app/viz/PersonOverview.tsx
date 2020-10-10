import { KeysOfValueType, TextColumn } from '@client/app/data/data';
import { Person, PersonOverviewChart } from '@client/app/viz/personOverviewChart';
import * as React from 'react';

type PersonOverviewProps = {
    persons: Person[];
};

type PersonsOverviewState = {
    cols: TextColumn<Person>[];
    numSelectors: number;
};

export class PersonOverview extends React.Component<PersonOverviewProps, PersonsOverviewState> {
    private chartRef: React.RefObject<HTMLCanvasElement>;
    private chart: PersonOverviewChart | undefined;

    constructor(props: PersonOverviewProps) {
        super(props);
        this.chartRef = React.createRef();

        this.state = {
            cols: [new TextColumn<Person>('gender'), new TextColumn<Person>('party')],
            numSelectors: 2,
        };
    }

    componentDidMount() {
        if (this.chartRef.current !== null) {
            this.chart = new PersonOverviewChart(this.chartRef.current);
            this.chart.draw((this.props.persons as unknown) as any, this.state.cols);
        }
    }

    componentDidUpdate() {
        this?.chart?.draw((this.props.persons as unknown) as any, this.state.cols);
    }

    private updateCols(colKey: KeysOfValueType<Person, string>, index: number) {
        let newCols = this.state.cols.slice();
        newCols[index] = new TextColumn<Person>(colKey);
        this.setState({
            ...this.state,
            cols: newCols,
        });
    }

    private getColSelectors() {
        const selectors = [];
        for (let i = 0; i < this.state.numSelectors; i++) {
            const selector = (
                <PersonColumnsSelect
                    key={i}
                    index={i}
                    updateCols={this.updateCols.bind(this)}
                    selectedValue={this.state.cols[i]?.key}
                    removeCol={this.removeSelector.bind(this)}
                />
            );
            selectors.push(selector);
        }
        return selectors;
    }

    private addSelector() {
        this.setState({
            ...this.state,
            numSelectors: this.state.numSelectors + 1,
        });
    }

    private removeSelector(index: number) {
        const newCols = this.state.cols.slice();
        newCols.splice(index, 1);
        this.setState({
            numSelectors: this.state.numSelectors - 1,
            cols: newCols,
        });
    }

    render() {
        return (
            <div>
                <div style={{ display: 'flex', flexDirection: 'row', height: '24px' }}>
                    {this.getColSelectors()}
                    <button onClick={this.addSelector.bind(this)}>Add column</button>
                </div>
                <canvas ref={this.chartRef} width="800px" height="800px"></canvas>
            </div>
        );
    }
}

type PersonColumnSelectProps = {
    updateCols: Function;
    index: number;
    selectedValue: string;
    removeCol: Function;
};
function PersonColumnsSelect(props: PersonColumnSelectProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <select value={props.selectedValue} onChange={(v) => props.updateCols(v.target.value as any, props.index)}>
                <option value="gender">Gender</option>
                <option value="party">Party</option>
                <option value="given_name">Given Name</option>
                <option value="family_name">Family Name</option>
                <option value="year_of_birth">Year of Birth</option>
            </select>
            <button onClick={() => props.removeCol(props.index)}>-</button>
        </div>
    );
}
