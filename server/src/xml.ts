import sax = require('sax');

export type XMLNode<Name> = {
    children: ReadonlyArray<XMLNode<unknown>>;
    name: Name;
    value: string;
};

type CallbackMap<Names extends string> = {
    [N in Names]: (node: XMLNode<N>) => unknown;
};

// 2020-10-03
// we have to implement this fucking bullshit because
// node doesn't have any XML-related libraries at all
// in its stdlib.
export class XMLCallbackReader<Names extends string> {
    protected callbacks: CallbackMap<Names>;
    protected stack: Array<XMLNode<any>>;

    constructor(callbacks: CallbackMap<Names>) {
        this.callbacks = callbacks;
        this.stack = [];
    }

    public parse(data: string): void {
        this.stack = [];
        const parser = new sax.SAXParser(true);

        parser.onopentag = (tag) => {
            if (tag.name in this.callbacks || this.stack.length > 0) {
                const node: XMLNode<any> = {
                    children: [],
                    name: tag.name,
                    value: '',
                };
                const last = this.stack[this.stack.length - 1];
                if (last) {
                    last.children = last.children.concat(node);
                }
                this.stack.push(node);
            }
        };

        parser.onclosetag = (name) => {
            const node = this.stack.pop();
            if (name in this.callbacks) {
                this.callbacks[name as Names].call(
                    undefined,
                    node as XMLNode<any>
                );
            }
        };

        parser.ontext = (value) => {
            const node = this.stack[this.stack.length - 1];
            if (node) {
                node.value += value;
            }
        };

        parser.write(data);
    }
}
