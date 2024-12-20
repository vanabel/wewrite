/*
 * Copyright (c) 2024 Sun Booshi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { Token, Tokens, MarkedExtension } from "marked";
import { Notice, TAbstractFile, TFile, Vault, MarkdownView, requestUrl, sanitizeHTMLToDom } from "obsidian";
import { WeWriteMarkedExtension } from "./extension";
import { ResourceManager } from "src/assets/resource-manager";
import { handleRetriesFor } from "mathjax-full/js/util/Retries";

declare module 'obsidian' {
    interface Vault {
        config: {
            attachmentFolderPath: string;
            newLinkFormat: string;
            useMarkdownLinks: boolean;
        };
    }
}

const EmbedRegex = /^!\[\[(.*?)\]\]/; //![[]]

interface ImageInfo {
    resUrl: string;
    filePath: string;
    url: string | null;
}

function getEmbedType(link: string) {
    //![[成方金信-爱赢管理沙盘a.pdf#page=2&rect=19,63,994,743|成方金信-爱赢管理沙盘a, p.2]]
    const reg_pdf_crop = /^pdf#page=(\d+)(&rect=.*?)$/

    const sep = link.lastIndexOf('|')
    if (sep > 0) {
        link = link.substring(0, sep)
    }
    const index = link.lastIndexOf('.')
    if (index == -1) {
        return 'note'
    }
    const ext = link.substring(index + 1);
    if (reg_pdf_crop.test(ext)) {
        return 'pdf-crop'
    }
    switch (ext.toLocaleLowerCase()) {
        case 'md':
            return 'note'
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'bmp':
            return 'image'
        case 'webp':
            return 'webp'
        case 'svg':
            return 'svg'
        case 'pdf':
            return 'pdf'
        case 'mp4':
            return 'video'
        case 'mp3':
        case 'wma':
        case 'wav':
        case 'amr':
            return 'voice'
        case 'excalidraw':
            return 'excalidraw'
        default:
            return 'file'
    }

}

export class LocalImageManager {
    private images: Map<string, ImageInfo>;
    private static instance: LocalImageManager;

    private constructor() {
        this.images = new Map<string, ImageInfo>();
    }

    // 静态方法，用于获取实例
    public static getInstance(): LocalImageManager {
        if (!LocalImageManager.instance) {
            LocalImageManager.instance = new LocalImageManager();
        }
        return LocalImageManager.instance;
    }

    public setImage(path: string, info: ImageInfo): void {
        if (!this.images.has(path)) {
            this.images.set(path, info);
        }
    }

    // async uploadLocalImage(token: string, vault: Vault) {
    //     const keys = this.images.keys();
    //     for (let key of keys) {
    //         const value = this.images.get(key);
    //         if (value == null) continue;
    //         if (value.url != null) continue;
    //         const file = vault.getFileByPath(value.filePath);
    //         if (file == null) continue;
    //         const fileData = await vault.readBinary(file);
    //         const res = await wxUploadImage(new Blob([fileData]), file.name, token);
    //         if (res.errcode != 0) {
    //             const msg = `上传图片失败: ${res.errcode} ${res.errmsg}`;
    //             new Notice(msg);
    //             console.error(msg);
    //         }
    //         value.url = res.url;
    //     }
    // }

    replaceImages(root: HTMLElement) {
        const images = root.getElementsByTagName('img');
        const keys = this.images.keys();
        for (let key of keys) {
            const value = this.images.get(key);
            if (value == null) continue;
            if (value.url == null) continue;
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                if (img.src.startsWith('http')) {
                    continue;
                }
                if (img.src === key) {
                    img.setAttribute('src', value.url);
                    break;
                }
            }
        }
    }

    async cleanup() {
        this.images.clear();
    }
}


export class Embed extends WeWriteMarkedExtension {
    public static fileCache: Map<string, string> = new Map<string, string>();
    index: number = 0;
    pdfCropIndex: number = 0;
    embedMarkdownIndex: number = 0;
    excalidrawIndex: number = 0;

    generateId() {
        this.index += 1;
        return `fid-${this.index}`;
    }

    async prepare() {
        this.pdfCropIndex = 0;
        this.index = 0;
        this.embedMarkdownIndex = 0;
        this.excalidrawIndex = 0;
    }
    searchFile(originPath: string): TAbstractFile | null {
        const resolvedPath = this.resolvePath(originPath);
        const vault = this.plugin.app.vault;
        const attachmentFolderPath = vault.config.attachmentFolderPath || '';
        let localPath = resolvedPath;
        let file = null;

        // 然后从根目录查找
        file = vault.getFileByPath(resolvedPath);
        if (file) {
            return file;
        }

        file = vault.getFileByPath(originPath);
        if (file) {
            return file;
        }

        // 先从附件文件夹查找
        if (attachmentFolderPath != '') {
            localPath = attachmentFolderPath + '/' + originPath;
            file = vault.getFileByPath(localPath)
            if (file) {
                return file;
            }

            localPath = attachmentFolderPath + '/' + resolvedPath;
            file = vault.getFileByPath(localPath)
            if (file) {
                return file;
            }
        }

        // 最后查找所有文件
        const files = vault.getAllLoadedFiles();
        for (let f of files) {
            if (f.path.includes(originPath)) {
                return f;
            }
        }

        return null;
    }

    resolvePath(relativePath: string): string {
        const basePath = this.getActiveFileDir();
        if (!relativePath.includes('/')) {
            return relativePath;
        }
        const stack = basePath.split("/");
        const parts = relativePath.split("/");

        stack.pop(); // Remove the current file name (or empty string)

        for (const part of parts) {
            if (part === ".") continue;
            if (part === "..") stack.pop();
            else stack.push(part);
        }
        return stack.join("/");
    }

    getActiveFileDir() {
        const af = this.plugin.app.workspace.getActiveFile();
        if (af == null) {
            return '';
        }
        const parts = af.path.split('/');
        parts.pop();
        if (parts.length == 0) {
            return '';
        }
        return parts.join('/');
    }
    getImagePath(path: string) {
        const file = this.searchFile(path);

        if (file == null) {
            console.error('找不到文件：' + path);
            return '';
        }
        // const file = this._plugin.app.vault.getFileByPath(path);
        const resPath = this.plugin.app.vault.getResourcePath(file as TFile);
        const info = {
            resUrl: resPath,
            filePath: file.path,
            url: null
        };
        LocalImageManager.getInstance().setImage(resPath, info);
        return resPath;
    }

    isImage(file: string) {
        file = file.toLowerCase();
        return file.endsWith('.png')
            || file.endsWith('.jpg')
            || file.endsWith('.jpeg')
            || file.endsWith('.gif')
            || file.endsWith('.bmp')
            || file.endsWith('.webp');
    }

    parseImageLink(link: string) {
        if (link.includes('|')) {
            const parts = link.split('|');
            const path = parts[0];
            if (!this.isImage(path)) return null;

            let width = null;
            let height = null;
            if (parts.length == 2) {
                const size = parts[1].toLowerCase().split('x');
                width = parseInt(size[0]);
                if (size.length == 2 && size[1] != '') {
                    height = parseInt(size[1]);
                }
            }
            return { path, width, height };
        }
        if (this.isImage(link)) {
            return { path: link, width: null, height: null };
        }
        return null;
    }

    getHeaderLevel(line: string) {
        const match = line.trimStart().match(/^#{1,6}/);
        if (match) {
            return match[0].length;
        }
        return 0;
    }

    async getFileContent(file: TAbstractFile, header: string | null, block: string | null) {
        const content = await this.plugin.app.vault.adapter.read(file.path);
        if (header == null && block == null) {
            return content;
        }

        let result = '';
        const lines = content.split('\n');
        if (header) {
            let level = 0;
            let append = false;
            for (let line of lines) {
                if (append) {
                    if (level == this.getHeaderLevel(line)) {
                        break;
                    }
                    result += line + '\n';
                    continue;
                }
                if (!line.trim().startsWith('#')) continue;
                const items = line.trim().split(' ');
                if (items.length != 2) continue;
                if (header.trim() != items[1].trim()) continue;
                if (this.getHeaderLevel(line)) {
                    result += line + '\n';
                    level = this.getHeaderLevel(line);
                    append = true;
                }
            }
        }

        if (block) {
            let preline = '';
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.indexOf(block) >= 0) {
                    result = line.replace(block, '');
                    if (result.trim() == '') {
                        for (let j = i - 1; j >= 0; j--) {
                            const l = lines[j];
                            if (l.trim() != '') {
                                result = l;
                                break;
                            }
                        }
                    }
                    break;
                }
                preline = line;
            }
        }

        return result;
    }

    parseFileLink(link: string) {
        const info = link.split('|')[0];
        const items = info.split('#');
        let path = items[0];
        let header = null;
        let block = null;
        if (items.length == 2) {
            if (items[1].startsWith('^')) {
                block = items[1];
            } else {
                header = items[1];
            }
        }
        return { path, head: header, block };
    }

    async renderFile(link: string, id: string) {
        // let { path, head: header, block} = this.parseFileLink(link);
        // let file = null;
        // if (path === '') {
        //     file = this._plugin.app.workspace.getActiveFile();
        // }
        // else {
        //     if (!path.endsWith('.md')) {
        //         path = path + '.md';
        //     }
        //     file = this.assetsManager.searchFile(path);
        // }

        // if (file == null) {
        //     const msg = '找不到文件：' + path;
        //     console.error(msg)
        //     // this.callback.updateElementByID(id, msg);
        //     return;
        // }

        // const content = await this.getFileContent(file, header, block);
        // const body = await this.marked.parse(content);
        // // this.callback.updateElementByID(id, body);
    }

    async readBlob(src: string) {
        return await fetch(src).then(response => response.blob())
    }

    async getExcalidrawUrl(data: string) {
        const dom = sanitizeHTMLToDom(data);
        const img = dom.querySelector('img');
        return img?.getAttr("src")
    }

    parseLinkStyle(link: string) {
        let filename = '';
        let style = 'style="width:100%;height:100%"';
        let postion = 'left';
        const postions = ['left', 'center', 'right'];
        if (link.includes('|')) {
            const items = link.split('|');
            filename = items[0];
            let size = '';
            if (items.length == 2) {
                if (postions.includes(items[1])) {
                    postion = items[1];
                }
                else {
                    size = items[1];
                }
            }
            else if (items.length == 3) {
                size = items[1];
                if (postions.includes(items[1])) {
                    size = items[2];
                    postion = items[1];
                }
                else {
                    size = items[1];
                    postion = items[2];
                }
            }
            if (size != '') {
                const sizes = size.split('x');
                if (sizes.length == 2) {
                    style = `style="width:${sizes[0]}px;height:${sizes[1]}px;"`
                }
                else {
                    style = `style="width:${sizes[0]}px;"`
                }
            }
        }
        else {
            filename = link;
        }
        return { filename, style, postion };
    }

    parseExcalidrawLink(link: string) {
        let classname = 'note-embed-excalidraw-left';
        const postions = new Map<string, string>([
            ['left', 'note-embed-excalidraw-left'],
            ['center', 'note-embed-excalidraw-center'],
            ['right', 'note-embed-excalidraw-right']
        ])

        let { filename, style, postion } = this.parseLinkStyle(link);
        classname = postions.get(postion) || classname;

        console.log(`parseExcalidrawLink:`, filename);


        if (filename.endsWith('excalidraw') || filename.endsWith('excalidraw.md')) {
            return { filename, style, classname };
        }

        return null;
    }

    async renderExcalidraw(name: string, id: string) {
        try {
            // let container: HTMLElement | null = null;
            // const currentFile = this._plugin.app.workspace.getActiveFile();
            // const leaves = this._plugin.app.workspace.getLeavesOfType('markdown');
            // for (let leaf of leaves) {
            //     const markdownView = leaf.view as MarkdownView;
            //     console.log(`${markdownView.file?.path} == ${currentFile?.path}`);

            //     if (markdownView.file?.path === currentFile?.path) {
            //         container = markdownView.containerEl;
            //     }
            // }
            // if (container) {
            {
                // const containers = container.querySelectorAll('.internal-embed');
                const containers = ResourceManager.getInstance(this.plugin).queryElements('.internal-embed');

                for (let container of containers) {
                    console.log(`container:`, container);
                    if (name !== container.getAttribute('src')) {
                        continue;
                    }
                    console.log(`excalidraw: `, container.innerHTML);

                    const src = await this.getExcalidrawUrl(container.innerHTML);
                    console.log(`excalidraw src: `, src);

                    let svg = '';
                    if (src === undefined || !src) {
                        svg = '渲染失败';
                        console.log('Failed to get Excalidraw URL');
                    }
                    else {
                        const blob = await this.readBlob(src);
                        if (blob.type === 'image/svg+xml') {
                            svg = await blob.text();
                            Embed.fileCache.set(name, svg);
                        }
                        else {
                            svg = '暂不支持' + blob.type;
                        }
                    }
                    this.previewRender.updateElementByID(id, svg);
                }
            }
            // else {
            //     console.error('container is null ' + name);
            //     // this.callback.updateElementByID(id, '渲染失败');
            // }
        } catch (error) {
            console.error(error.message);
            // this.callback.updateElementByID(id, '渲染失败:' + error.message);
        }
    }

    parseSVGLink(link: string) {
        let classname = 'note-embed-svg-left';
        const postions = new Map<string, string>([
            ['left', 'note-embed-svg-left'],
            ['center', 'note-embed-svg-center'],
            ['right', 'note-embed-svg-right']
        ])

        let { filename, style, postion } = this.parseLinkStyle(link);
        classname = postions.get(postion) || classname;

        return { filename, style, classname };
    }

    async renderSVGFile(filename: string, id: string) {
        const file = this.searchFile(filename);

        if (file == null) {
            const msg = '找不到文件：' + file;
            console.error(msg)
            this.previewRender.updateElementByID(id, msg);
            // new Notice(msg, 0);
            return;
        }

        const content = await this.getFileContent(file, null, null);
        Embed.fileCache.set(filename, content);
        this.previewRender.updateElementByID(id, content);
    }

    markedExtension(): MarkedExtension {
        return {
            extensions: [{
                name: 'Embed',
                level: 'inline',
                start: (src: string) => {
                    const index = src.indexOf('![[');
                    // console.log(`embed start: ${index}`);

                    if (index === -1) return;
                    return index;
                },
                tokenizer: (src: string) => {
                    const matches = src.match(EmbedRegex);
                    if (matches == null) return;

                    const token: Token = {
                        type: 'Embed',//getEmbedType(matches[1]),
                        raw: matches[0],
                        href: matches[1],
                        text: matches[1]
                    };
                    console.log(`embed tokenizer: ${JSON.stringify(token)}`);

                    return token;
                },
                renderer: (token: Tokens.Generic) => {
                    const embedType = getEmbedType(token.href);
                    console.log(`embedType: ${embedType}`);

                    if (embedType == 'image' || embedType == 'webp') {
                        // images
                        let item = this.parseImageLink(token.href);
                        console.log(`localFile renderer: ${JSON.stringify(item)}`);
                        if (item) {
                            const src = this.getImagePath(item.path);
                            console.log(`localFile renderer: ${src}`);

                            const width = item.width ? `width="${item.width}"` : '';
                            const height = item.height ? `height="${item.height}"` : '';
                            return `<img src="${src}" alt="${token.text}" ${width} ${height} />`;
                        }
                    } else if (embedType == 'svg') {
                        const info = this.parseSVGLink(token.href);
                        const id = this.generateId();
                        let svg = '渲染中';
                        if (Embed.fileCache.has(info.filename)) {
                            svg = Embed.fileCache.get(info.filename) || '渲染失败';
                        }
                        else {
                            this.renderSVGFile(info.filename, id);
                        }
                        return `<span class="${info.classname}"><span class="note-embed-svg" id="${id}" ${info.style}>${svg}</span></span>`

                    } else if (embedType == 'excalidraw') {

                        return token.html;
                        // const info = this.parseExcalidrawLink(token.href);
                        // if (info) {
                        //     const id = this.generateId();
                        //     let svg = '渲染中';
                        //     if (Embed.fileCache.has(info.filename)) {
                        //         svg = Embed.fileCache.get(info.filename) || '渲染失败';
                        //     }
                        //     else {
                        //         this.renderExcalidraw(info.filename, id);
                        //     }
                        //     return `<span class="${info.classname}"><span class="note-embed-excalidraw" id="${id}" ${info.style}>${svg}</span></span>`
                        // }
                        // const containerId = `excalidraw-embed-${this.excalidrawIndex}`;
                        // this.renderExcalidrawDiv(token.href, containerId, this.excalidrawIndex);
                        // this.excalidrawIndex++
                        // return `<section id="${containerId}" class="wewrite excalidraw-embed" >embed excalidraw 渲染中...</section>`;

                    } else if (embedType == 'pdf-crop') {
                        return this.renderPdfCrop(token.href);
                    } else if (embedType == 'note') {
                        const containerId = `markdown-embed-${this.embedMarkdownIndex}`;
                        this.renderNote(token.href, containerId);
                        this.embedMarkdownIndex++
                        return `<section id="${containerId}" class="wewrite markdown-embed" >embed note 渲染中...</section>`;
                    }



                    // if (token.href.endsWith('.svg') || token.href.includes('.svg|')) {
                    //     const info = this.parseSVGLink(token.href);
                    //     const id = this.generateId();
                    //     let svg = '渲染中';
                    //     if (LocalFile.fileCache.has(info.filename)) {
                    //         svg = LocalFile.fileCache.get(info.filename) || '渲染失败';
                    //     }
                    //     else {
                    //         this.renderSVGFile(info.filename, id);
                    //     }
                    //     return `<span class="${info.classname}"><span class="note-embed-svg" id="${id}" ${info.style}>${svg}</span></span>`
                    // }

                    // const id = this.generateId();
                    // this.renderFile(token.href, id);
                    // // const tag = this.callback.settings.embedStyle === 'quote' ? 'blockquote' : 'section';
                    // const tag = 'section';
                    // return `<${tag} class="note-embed-file" id="${id}">渲染中</${tag}>`
                }

            }],
            async: true,
            walkTokens: async (token: Tokens.Generic) => {
                if (token.type !== 'Embed') return;
                const embedType = getEmbedType(token.href);
                if (embedType !== 'excalidraw') {
                    return;
                }
                await this.renderExcalidrawDiv(token)


            }
        };
    }

    async renderExcalidrawDiv(token: Tokens.Generic) {
        // define default failed
        token.html = "excalidraw渲染失败"

        const href = token.href;
        console.log(`renderExcalidrawDiv: ${href}`);
        const index = this.excalidrawIndex;
        this.excalidrawIndex++;

        let svg = Embed.fileCache.get(href);
        if (svg === undefined) {
            const root = this.plugin.resourceManager.getMarkdownRenderedElement(index, '.excalidraw-svg.excalidraw-embedded-img')
            if (!root) {
                return
            }
            const src = root.getAttr('src')
            const filesource = root.getAttr('filesource')
            console.log(`src=>`, src);
            console.log(`filesource=>`, filesource);

            if (!src) {
                // this.previewRender.updateElementByID(id, "excalidraw渲染失败")
                return
            }
            const blob = await this.readBlob(src);
            console.log(`blob=>`, blob);

            if (blob.type === 'image/svg+xml') {
                const svg = await blob.text();
                console.log(`svg=>`, svg);
                Embed.fileCache.set(href, svg);
            }
        }
        //else we have cached svg
        token.html = `<section class="excalidraw-svg" >${svg}</section>`
    }
    async renderNote(href: string, id: string) {
        //TODO：we should remove the support of note embed.
 
        console.log(`renderNote: ${href}`);

        const tf = ResourceManager.getInstance(this.plugin).getFileOfLink(href)
        if (tf) {
            const file = this.plugin.app.vault.getFileByPath(tf.path)
            console.log(`file=>`, file);
            if (file) {
                const content = await this.plugin.app.vault.adapter.read(file.path);
                const body = await this.marked.parse(content);
                console.log(`body=>`, body);
                this.previewRender.updateElementByID(id, body)
            }
        }

    }
    renderPdfCrop(href: string): string | false | undefined {
        const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.pdfCropIndex, '.pdf-cropped-embed')
        if (!root) {
            return '<span>Pdf-crop渲染失败</span>';
        }
        const containerId = `pdf-crop-img-${this.pdfCropIndex}`;
        this.pdfCropIndex++
        // return `<section id="${containerId}" class="admonition-parent admonition-${type}-parent">${root.outerHTML}</section>`;
        console.log(`pdf-crop root:`, root);
        this.previewRender.addElementByID(containerId, root)
        return `<section id="${containerId}" class="wewrite pdf-crop" ></section>`;
    }
}