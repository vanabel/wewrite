export function removeChilds(root: HTMLElement, query: string) {
    const nodes = root.querySelectorAll(query);
    nodes.forEach(node => node.remove());
}