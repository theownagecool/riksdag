import { XMLCallbackReader, XMLNode } from './xml';

describe('xml tests', () => {
    it('should parse a simple text values', () => {
        const nodes: Array<XMLNode> = [];
        const rdr = new XMLCallbackReader({
            yee: (node) => {
                nodes.push(node);
            },
        });
        const xml = `
<root>
  <yee>1</yee>
  <yee>2</yee>
</root>
        `;
        rdr.parse(xml);

        expect(nodes.length).toBe(2);
        expect(nodes[0].value).toBe('1');
        expect(nodes[1].value).toBe('2');
    });

    it('should include nested nodes in output', () => {
        const nodes: Array<XMLNode> = [];
        const rdr = new XMLCallbackReader({
            yee: (node) => {
                nodes.push(node);
            },
        });
        const xml = `
<root>
  <yee>
    <boi />
  </yee>
</root>
        `;
        rdr.parse(xml);
        expect(nodes.length).toBe(1);
        expect(nodes[0].children.length).toBe(1);
        expect(nodes[0].children[0].name).toBe('boi');
    });

    it('should trigger several callbacks', () => {
        let a = false;
        let b = false;
        const rdr = new XMLCallbackReader({
            yee: (node) => {
                a = true;
            },
            boi: (node) => {
                b = true;
            },
        });
        const xml = `
<root>
  <yee>
    <boi />
  </yee>
</root>
        `;
        rdr.parse(xml);
        expect(a).toBe(true);
        expect(b).toBe(true);
    });
});
