/**
 * Url handling
 */
import { App, arrayBufferToBase64, sanitizeHTMLToDom, TAbstractFile, TFile } from 'obsidian';

export function isMarkdownFile(file: TFile | TAbstractFile) {
	return ['md', 'markdown'].includes((file as TFile)?.extension ?? '');
}

export function getMetadata(file: TFile, app: App) {
	return app.metadataCache.getFileCache(file)?.frontmatter;
}

export class UrlUtils {
    private app:App;
    constructor(app: App) {
        this.app = app;
    }
    public parseObsidianUrl(url: string): string | null {
        const regex = /obsidian:\/\/open\?vault=(.*?)&file=([^,]*),?(.*)$/;
        const match = url.match(regex);
        
        if (match && match[2]) {
            return decodeURIComponent(match[2]);
        }
        return null;
    }
    public getFileFromPath(filePath: string): TFile | null {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile) {
            return file;
        }
        return null;
    }
    public async getDisplayUrl(file: TFile): Promise<string | null> {
        if (file) {
            try {
                const fileContent = await this.app.vault.readBinary(file);
                const base64String = arrayBufferToBase64(fileContent);
                const mimeType = file.extension === 'png' ? 'image/png' : 'application/octet-stream'; // 根据文件扩展名确定 MIME 类型
                return `data:${mimeType};base64,${base64String}`;
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
        return null;
    }
    public async getInternalLinkDisplayUrl(internalLink: string): Promise<string | null> {
        const filePath = this.parseObsidianUrl(internalLink);
        
        if (filePath) {
            const file = this.getFileFromPath(filePath);
            
            if (file) {
                return this.getDisplayUrl(file);
            }
        }
        return null;
    }
}

export function DomToDom(node:HTMLElement, queies:string[]){
    let index = 0;
    const nodeMap = new Map<string, HTMLElement >();
    for (const query of queies) {
        const elements = node.querySelectorAll(query);
        for (const element of elements) {
            const replaceNode = createDiv()
            replaceNode.id = `wewrite-replace-${index}`
            nodeMap.set(replaceNode.id, element as HTMLElement)
            element.replaceWith(replaceNode);
            index++;
        }
    }
    const html = node.innerHTML
    const root = sanitizeHTMLToDom(html)
    for (const [id, element] of nodeMap) {
        const replaceNode = root.querySelector(`#${id}`)
        if (replaceNode) {
            replaceNode.replaceWith(element)
        }
    }
    return root
}
