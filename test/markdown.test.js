import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, renderMarkdownNodes } from '../public/js/markdown.js';

function createFakeDocument() {
  const node = (tagName, textContent = '') => ({
    tagName,
    textContent,
    children: [],
    append(...children) {
      this.children.push(...children);
    },
  });

  return {
    createDocumentFragment: () => node('#fragment'),
    createElement: (tagName) => node(tagName.toUpperCase()),
    createTextNode: (text) => node('#text', text),
  };
}

function findNodes(root, tagName) {
  const nodes = [];
  for (const child of root.children ?? []) {
    if (child.tagName === tagName) nodes.push(child);
    nodes.push(...findNodes(child, tagName));
  }
  return nodes;
}

test('renders bold, italic and inline code', () => {
  const html = renderMarkdown('This is **bold**, *nice* and `code`.');
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>nice<\/em>/);
  assert.match(html, /<code>code<\/code>/);
});

test('renders bullet and numbered lists', () => {
  const html = renderMarkdown('- first\n- second\n\n1. one\n2) two');
  assert.match(html, /<ul><li>first<\/li><li>second<\/li><\/ul>/);
  assert.match(html, /<ol><li>one<\/li><li>two<\/li><\/ol>/);
});

test('renders • bullets produced by the offline engine', () => {
  const html = renderMarkdown('• Gate A\n• Gate B');
  assert.match(html, /<ul><li>Gate A<\/li><li>Gate B<\/li><\/ul>/);
});

test('escapes HTML — script injection is neutralised', () => {
  const html = renderMarkdown('<script>alert(1)</script> **bold** <img src=x onerror=alert(1)>');
  assert.ok(!html.includes('<script>'), 'raw <script> must never appear');
  assert.ok(!html.includes('<img'), 'raw <img> must never appear');
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<strong>bold<\/strong>/);
});

test('headings become h4 and blank lines split paragraphs', () => {
  const html = renderMarkdown('## Title\n\nline one\nline two');
  assert.match(html, /<h4>Title<\/h4>/);
  assert.match(html, /<p>line one<\/p><p>line two<\/p>/);
});

test('handles empty and non-string input safely', () => {
  assert.equal(renderMarkdown(''), '');
  assert.equal(renderMarkdown(null), '');
});

test('renders safe DOM nodes without interpreting model text as HTML', () => {
  const fragment = renderMarkdownNodes(
    '## Title\n\n- **bold** and *calm*\n- `route`\n\n1. first\n2. second\n\n<script>alert(1)</script>',
    createFakeDocument(),
  );

  assert.equal(fragment.children[0].tagName, 'H4');
  assert.equal(findNodes(fragment, 'UL').length, 1);
  assert.equal(findNodes(fragment, 'OL').length, 1);
  assert.equal(findNodes(fragment, 'STRONG').length, 1);
  assert.equal(findNodes(fragment, 'EM').length, 1);
  assert.equal(findNodes(fragment, 'CODE').length, 1);
  assert.equal(findNodes(fragment, 'SCRIPT').length, 0);
  assert.match(findNodes(fragment, '#text').at(-1).textContent, /<script>alert\(1\)<\/script>/);
});

test('requires a document to create browser markdown nodes', () => {
  assert.throws(() => renderMarkdownNodes('hello', null), /Document is required/);
});
