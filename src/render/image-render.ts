import { App, MarkdownEditView, MarkdownRenderChild, MarkdownRenderer, MarkdownView } from "obsidian";
// import * as htmlToImage from 'html-to-image'
import domtoimage from 'dom-to-image'
export async function htmlRender(app: App, markdown: string, path: string, el: HTMLElement) {
    const el1 = document.createElement('div');

    await MarkdownRenderer.render(app, markdown, el1.createDiv(), path, app.workspace.getActiveViewOfType(MarkdownView)
        || app.workspace.activeLeaf?.view
        || new MarkdownRenderChild(el1))

    await removeButton(el1)
    
    el.empty()
    el.appendChild(el1)

}

export async function removeButton(el: HTMLElement) {
    const nodes = el.querySelectorAll('button.copy-code-button')
    nodes.forEach(node => node.remove())

    const images = el.querySelectorAll('img')
    images.forEach(async img => {
        if (img.src.startsWith("blob:app://obsidian.md/")) {
            console.log(`to convert blot to data url`);
            const dataUrl = await blob2DataUrl(img.src)
            img.src = dataUrl

        } else {
            console.log(`other image:`, img.src);

        }
    })

    await mjx2DataUrl(el)
}

async function blob2DataUrl(src: string): Promise<string> {
    const blob = await fetch(src).then(response => response.blob())
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            if (reader.result) {
                resolve(reader.result.toString());
            } else {
                reject(new Error("Failed to read blob"));
            }
        };

        reader.onerror = reject;

        reader.readAsDataURL(blob);
    });

}

async function mjx2DataUrl(el: HTMLElement) {
    const nodes = el.querySelectorAll('.math')
    nodes.forEach(async node => {
        const svg = await domtoimage.toPng(node as HTMLElement)
        const img = new Image()
        img.src = svg
        node.empty()
        node.appendChild(img)

    })
}