/**
 * Safe markdown renderer for assistant replies.
 *
 * Gemini answers use light markdown (**bold**, lists, headings). Text is
 * converted into either a small, escaped HTML representation for unit tests or
 * DOM nodes for the UI. The UI path creates elements and text nodes directly,
 * so model output is never inserted as raw HTML.
 */

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Inline transforms: bold, italic, inline code. Input is already escaped. */
function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, '$1<em>$2</em>');
}

/**
 * Convert a markdown string to safe HTML (paragraphs, headings, ul/ol lists).
 * @param {string} text
 * @returns {string} HTML composed only of p/h4/ul/ol/li/strong/em/code/br tags.
 */
export function renderMarkdown(text) {
  const lines = escapeHtml(String(text ?? '')).split(/\r?\n/);
  const out = [];
  let list = null; // 'ul' | 'ol' | null

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•]|•)\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^\s*#{1,4}\s+(.*)$/);

    if (bullet) {
      if (list !== 'ul') {
        closeList();
        out.push('<ul>');
        list = 'ul';
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else if (numbered) {
      if (list !== 'ol') {
        closeList();
        out.push('<ol>');
        list = 'ol';
      }
      out.push(`<li>${inline(numbered[1])}</li>`);
    } else if (heading) {
      closeList();
      out.push(`<h4>${inline(heading[1])}</h4>`);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('');
}

/** Append inline markdown as DOM nodes. Text content is never interpreted as HTML. */
function appendInlineNodes(parent, text, doc) {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*)/g;
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parent.append(doc.createTextNode(text.slice(cursor, index)));

    const token = match[0];
    const tag = token.startsWith('`')
      ? 'code'
      : token.startsWith('*') && !token.startsWith('**')
        ? 'em'
        : 'strong';
    const delimiter = tag === 'code' || tag === 'em' ? 1 : 2;
    const node = doc.createElement(tag);
    node.textContent = token.slice(delimiter, -delimiter);
    parent.append(node);
    cursor = index + token.length;
  }

  if (cursor < text.length) parent.append(doc.createTextNode(text.slice(cursor)));
}

/**
 * Convert Markdown into safe browser DOM nodes for an assistant reply.
 * @param {string} text
 * @param {Document} [doc]
 * @returns {DocumentFragment}
 */
export function renderMarkdownNodes(text, doc = globalThis.document) {
  if (!doc) throw new TypeError('A Document is required to render markdown nodes.');

  const fragment = doc.createDocumentFragment();
  const lines = String(text ?? '').split(/\r?\n/);
  let list = null;

  const closeList = () => {
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•])\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^\s*#{1,4}\s+(.*)$/);

    if (bullet || numbered) {
      const tag = bullet ? 'ul' : 'ol';
      if (!list || list.tagName.toLowerCase() !== tag) {
        list = doc.createElement(tag);
        fragment.append(list);
      }
      const item = doc.createElement('li');
      appendInlineNodes(item, (bullet ?? numbered)[1], doc);
      list.append(item);
    } else if (heading) {
      closeList();
      const node = doc.createElement('h4');
      appendInlineNodes(node, heading[1], doc);
      fragment.append(node);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      const node = doc.createElement('p');
      appendInlineNodes(node, line, doc);
      fragment.append(node);
    }
  }

  return fragment;
}
