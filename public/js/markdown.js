/**
 * Safe markdown renderer for assistant replies.
 *
 * Gemini answers use light markdown (**bold**, lists, headings). Rendering the
 * raw string as text shows literal asterisks; using innerHTML on it would be an
 * XSS hole. So: escape ALL HTML entities first, then convert a small whitelist
 * of markdown constructs on the escaped text. The only tags that can appear are
 * the ones this module emits.
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
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else if (numbered) {
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
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
