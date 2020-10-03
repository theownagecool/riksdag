import { XMLCallbackReader, XMLNode } from './xml';

describe('xml tests', () => {
    it('should parse a simple text values', () => {
        const rdr = new XMLCallbackReader<Array<XMLNode>>({
            yee: (node, ctx) => {
                ctx.push(node);
            },
        });
        const xml = `
<root>
  <yee>1</yee>
  <yee>2</yee>
</root>
        `;
        const nodes = rdr.parse(xml, []);

        expect(nodes.length).toBe(2);
        expect(nodes[0].value).toBe('1');
        expect(nodes[1].value).toBe('2');
    });

    it('should include nested nodes in output', () => {
        const rdr = new XMLCallbackReader<Array<XMLNode>>({
            yee: (node, ctx) => {
                ctx.push(node);
            },
        });
        const xml = `
<root>
  <yee>
    <boi />
  </yee>
</root>
        `;
        const nodes = rdr.parse(xml, []);
        expect(nodes.length).toBe(1);
        expect(nodes[0].children.length).toBe(1);
        expect(nodes[0].children[0].name).toBe('boi');
    });

    it('should trigger several callbacks', () => {
        const rdr = new XMLCallbackReader<[boolean, boolean]>({
            yee: (node, ctx) => {
                ctx[0] = true;
            },
            boi: (node, ctx) => {
                ctx[1] = true;
            },
        });
        const xml = `
<root>
  <yee>
    <boi />
  </yee>
</root>
        `;
        const result = rdr.parse(xml, [false, false]);
        expect(result[0]).toBe(true);
        expect(result[1]).toBe(true);
    });
});
