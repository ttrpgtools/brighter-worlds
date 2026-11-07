import sanitizeHtml from 'sanitize-html';

/** Retain ordinary formatting, stripping active HTML, handlers, styles and unsafe URL schemes. */
export function sanitizeDescription(text: string) {
  return sanitizeHtml(text, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    parseStyleAttributes: false,
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
  });
}
