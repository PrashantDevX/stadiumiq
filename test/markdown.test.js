import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../public/js/markdown.js';

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
