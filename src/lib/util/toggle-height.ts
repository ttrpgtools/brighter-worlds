export function toggleHeight(node: HTMLElement) {
  const fn = () => {
    node.classList.toggle('line-clamp-1');
    node.classList.toggle('cursor-s-resize');
    node.classList.toggle('cursor-n-resize');
  }
  node.addEventListener('click', fn);
  node.classList.add('line-clamp-1');
  node.classList.add('cursor-s-resize');
  return {
    destroy() {
      node.removeEventListener('click', fn);
    }
  }
}
