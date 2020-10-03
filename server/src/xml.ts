import sax = require('sax');

export type XMLNode = {
    children: ReadonlyArray<XMLNode>;
    name: string;
    value: string;
};

type CallbackMap<C> = {
    [name: string]: (node: XMLNode, context?: C) => unknown;
};

// 2020-10-03
// we have to implement this fucking bullshit because
// node doesn't have any XML-related libraries at all
// in its stdlib.
export class XMLCallbackReader<C> {
    protected callbacks: CallbackMap<C>;
    protected stack: Array<XMLNode>;

    constructor(callbacks: CallbackMap<C>) {
        this.callbacks = callbacks;
        this.stack = [];
    }

    public parse(data: string, context?: C): C | undefined {
        this.stack = [];
        const parser = new sax.SAXParser(true);

        parser.onopentag = (tag) => {
            if (tag.name in this.callbacks || this.stack.length > 0) {
                const node: XMLNode = {
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
                this.callbacks[name].call(undefined, node!, context);
            }
        };

        parser.ontext = (value) => {
            const node = this.stack[this.stack.length - 1];
            if (node) {
                node.value += value;
            }
        };

        parser.write(data);

        return context;
    }
}
