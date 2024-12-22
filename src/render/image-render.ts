import { App, MarkdownEditView, MarkdownRenderChild, MarkdownRenderer, MarkdownView } from "obsidian";

export async function htmlRender(app:App, markdown: string, path: string, el:HTMLElement){
    const el1 = document.createElement('div');

    await MarkdownRenderer.render(app, markdown, el1.createDiv(),path,app.workspace.getActiveViewOfType(MarkdownView)
    || app.workspace.activeLeaf?.view
    || new MarkdownRenderChild(el1))

    el.empty()
    el.appendChild(el1)

}