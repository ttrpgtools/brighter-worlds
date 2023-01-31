import snarkdown from 'snarkdown';

export function renderUnsafe(markdown: string) {
  return snarkdown(markdown);
}

export function renderSafe(markdown: string) {
  const html = snarkdown(markdown);
  const doc = new DOMParser().parseFromString(`<!DOCTYPE html><html><body>${html}`, 'text/html');
  doc.normalize();
  _sanitize(doc.body);
  return doc.body.innerHTML;
}

function _sanitize(node: Element) {
  if (node.nodeType === 3) return;
  if (node.nodeType !== 1 || /^(script|iframe|object|embed|svg)$/i.test(node.tagName)) {
    return node.remove();
  }
  for (let i = node.attributes.length; i--;) {
    const name = node.attributes[i].name;
    if (!/^(class|id|name|href|src|alt|align|valign)$/i.test(name)) {
      node.attributes.removeNamedItem(name);
    }
  }
  for (let i=node.childNodes.length; i--; ) _sanitize(node.childNodes[i] as Element);
}
