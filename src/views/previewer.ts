/**
 * Define the right-side leaf of view as Previewer view
*/

import { EditorView } from "@codemirror/view";
import { DropdownComponent, Editor, EventRef, getIcon, ItemView, MarkdownView, sanitizeHTMLToDom, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import { applyCSS } from 'src/assets/theme-apply';
import WeWritePlugin from 'src/main';
import { htmlRender } from 'src/render/image-render';
import { PreviewRender } from 'src/render/marked-extensions/extension';
import { uploadCanvas, uploadSVGs, uploadURLImage } from 'src/render/post-render';
import { WechatRender } from 'src/render/wechat-render';
import { SrcThumbList } from 'src/utils/src-thumb-list';
import { ResourceManager } from '../assets/resource-manager';
import { WechatClient } from '../wechat-api/wechat-client';
import { MPArticleHeader } from './mp-article-header';
import { ThemeManager } from './theme-manager';
import { ThemeSelector } from './theme-selector';

export const VIEW_TYPE_NP_PREVIEW = 'wechat-np-article-preview';
export interface ElectronWindow extends Window {
    WEBVIEW_SERVER_URL: string;
}


export class PreviewPanel extends ItemView implements PreviewRender {
    markdownView: MarkdownView | null = null;
    private articleDiv: HTMLDivElement;
    private listeners: EventRef[] = [];
    currentView: EditorView;
    observer: any;
    private wechatClient: WechatClient;
    private _plugin: WeWritePlugin
    private themeSelector: ThemeSelector;

    private draftHeader: MPArticleHeader
    editorView: EditorView | null = null;
    lastLeaf: WorkspaceLeaf | undefined;
    renderDiv: any;
    // styleEl: any;
    elementMap: Map<string, Node | string>;
    articleTitle: Setting;
    containerDiv: HTMLElement;
    getViewType(): string {
        return VIEW_TYPE_NP_PREVIEW;
    }
    getDisplayText(): string {
        return "WeChat Article Preview";
    }
    getIcon() {
        return 'scan-eye';
    }
    constructor(leaf: WorkspaceLeaf, plugin: WeWritePlugin) {
        super(leaf);
        this._plugin = plugin
        this.wechatClient = WechatClient.getInstance(this._plugin)
        this.themeSelector = new ThemeSelector(plugin)

    }

    async onOpen() {
        this.buildUI();
        this.startListen()
        this._plugin.messageService.registerListener(
            'src-thumb-list-updated', (data: SrcThumbList) => {
                console.log(`on messageService, data=>`, data);
                // this.update()
                this.articleDiv.empty();
                this.articleDiv.createDiv().setText('To Verify the Images in article')
                const ol = this.articleDiv.createEl('ol');
                data.list.forEach((articles, url) => {
                    const li = ol.createEl('li');
                    let a = '<ul>'
                    articles.forEach(url => {
                        a += `<li><a href="${url}">${url}</a><li>`
                    })
                    a += '</ul>'
                    li.innerHTML = `<img width="100px" src="${url}" alt="${url}" > ${a}`
                })
            }
        )
        this._plugin.messageService.registerListener('draft-title-updated', (title: string) => {
            console.log(`on messageService, title=>`, title);

            this.articleTitle.setName(title)
        })
        this.themeSelector.startWatchThemes()
        this.startWatchActiveNoteChange()
        this._plugin.messageService.registerListener('custom-theme-changed', async (theme: string) => {
            // this.setStyle(await this.getCSS())
        })

    }

    onFileContentRendered(view: MarkdownView) {
        // throw new Error('Method not implemented.');
        console.log(`onFile content rendered. `);

    }
    startWatchActiveNoteChange() {
        // throw new Error('Method not implemented.');
        console.log(`start watch activve note change. `);

    }

    async buildUI() {
        const container = this.containerEl.children[1];
        container.empty();

        const mainDiv = container.createDiv({ cls: 'previewer-container' });
        this.articleTitle = new Setting(mainDiv)
            .setName('Article Title')
            .setHeading()
            .addDropdown((dropdown: DropdownComponent) => {
                this.themeSelector.dropdown(dropdown);
            })
            .addExtraButton(
                (button) => {
                    button.setIcon('image-up')
                        .setTooltip('')
                        .onClick(async () => {
                            console.log(`upload materials.`);
                            // ResourceManager.getInstance(this._plugin).forceRenderActiveMarkdownView()
                            // ResourceManager.getInstance(this._plugin).scrollActiveMarkdownView()
                            uploadSVGs(this.articleDiv, this._plugin.wechatClient)
                            uploadCanvas(this.articleDiv, this._plugin.wechatClient)
                            uploadURLImage(this.articleDiv, this._plugin.wechatClient)

                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('refresh-cw')
                        .setTooltip('Rerender the article content.')
                        .onClick(async () => {
                            console.log(`rerender article content.`);
                            // this.articleDiv.innerHTML = await 
                            // this.parseActiveMarkdown();
                            this.renderDraft()
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('notepad-text-dashed')
                        .setTooltip('send to draft box.')
                        .onClick(async () => {
                            this.sendArticleToDraftBox()
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('newspaper')
                        .setTooltip('publish to MP directly.')
                    button.onClick(async () => {
                        console.log(`publish to MP directly.`);

                        // const renderer = new HtmlRender(this.app)
                        // // const node = await renderer.renderDocument(md, activeFile.path)
                        // const node = await renderer.renderMarkdown(md, activeFile.path)
                        // // console.log(`html render node=>`, node);

                        // this.articleDiv.empty();
                        // this.articleDiv.appendChild(node!);

                        await this.renderHTML()
                        // const html = applyCSS(this.articleDiv.innerHTML, await this.getCSS())
                        // this.articleDiv.innerHTML = html


                    })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('panel-left')
                        .setTooltip('show materials and drafts')
                    button.onClick(async () => {
                        this._plugin.showLeftView()
                    })
                }
            )

        this.draftHeader = new MPArticleHeader(this._plugin, mainDiv)

        this.renderDiv = mainDiv.createDiv({ cls: 'render-div' });
        this.renderDiv.id = 'render-div';
        this.renderDiv.setAttribute('style', '-webkit-user-select: text; user-select: text;');

        //TODO: keep the shadow dom for future use, here for computed style from obsidian and all other plugins
        let shadowDom = this.renderDiv.shawdowRoot;
        if (shadowDom === undefined || shadowDom === null) {

            shadowDom = this.renderDiv//.attachShadow({ mode: 'open' });
        }

        this.containerDiv = shadowDom.createDiv({ cls: 'wewrite-article' });
        this.articleDiv = this.containerDiv.createDiv({ cls: 'article-div' });

    }
    async sendArticleToDraftBox() {
        console.log(`send article to draft box.`);

        console.log('checking svg....')
        await uploadSVGs(this.articleDiv, this._plugin.wechatClient)
        console.log('checking svg.... done')

        console.log('checking canvas....')
        await uploadCanvas(this.articleDiv, this._plugin.wechatClient)
        console.log('checking canvas.... done')

        console.log('checking blob image....')
        await uploadURLImage(this.articleDiv, this._plugin.wechatClient)
        console.log('checking blob image.... done.')

        console.log(`start uploading draft content:`, this.getArticleContent());
        console.log(`images in articleDiv:`, this.articleDiv.querySelectorAll('img'));

        const media_id = await this.wechatClient.sendArticleToDraftBox(this.draftHeader.getActiveLocalDraft()!, this.getArticleContent())
        console.log(`sending article finished: media_id=${media_id}`);
        
        if (media_id) {
            const news_item = await this.wechatClient.getDraftById(this._plugin.settings.selectedAccount!, media_id)
            if (news_item) {
                console.log(`news_item=>`, news_item[0]);

                open(news_item[0].url)
            }
        }
    }
    public getArticleContent() {
        return this.articleDiv.innerHTML
    }
    async getCSS() {
        return await ThemeManager.getInstance(this._plugin).getCSS()
    }

    async onClose() {
        // Clean up our view
        this.stopListen()
        this.themeSelector.stopWatchThemes()

    }


    async parseActiveMarkdown() {
        const mview = ResourceManager.getInstance(this._plugin).getCurrentMarkdownView()
        if (!mview) {
            console.log(`not a markdown view`);
            return 'not a markdown view';
        }
        const mode = (mview.currentMode as any).type
        console.log('markdown view mode:', mode)
        this.articleDiv.empty();
        // if (mode !== 'preview') {
        //     this.articleDiv.innerHTML = `<h1>Please switch MarkdownView to preview mode</h1>`
        //     return
        // }
        this.elementMap = new Map<string, HTMLElement | string>()
        const activeFile = this.app.workspace.getActiveFile();
        console.log(`activeFile =>`, activeFile);

        if (!activeFile) {
            console.log(`no active file`);
            return `<h1>No active file</h1>`
        }
        if (activeFile.extension !== 'md') {
            console.log(`not a markdown file`);
            return `<h1>Not a markdown file</h1>`
        }
        // const md = await this.app.vault.adapter.read(activeFile!.path)

        // this.setStyle(await this.getCSS())
        let html = await WechatRender.getInstance(this._plugin, this).parseNote(activeFile.path, this.articleDiv, this)


        html = `<section class="wewrite-article-content" id="article-section">${html}</section>`;
        this.articleDiv.innerHTML = html
        // const doc = sanitizeHTMLToDom(html);
        // this.articleDiv.empty();

        // if (doc.firstChild) {
        //     this.articleDiv.appendChild(doc.firstChild);
        //     }
        // this.articleDiv.innerHTML = html

        // render the async part of the doc.
        // console.log(`this.elementMap=>`, this.elementMap);
        this.elementMap.forEach(async (node: HTMLElement | string, id: string) => {
            const item = this.articleDiv.querySelector('#' + id) as HTMLElement;
            console.log(`id=${id}, item=>`, item);
            // console.log(`node`);

            if (!item) return;
            if (typeof node === 'string') {
                const tf = ResourceManager.getInstance(this._plugin).getFileOfLink(node)
                if (tf) {
                    const file = this._plugin.app.vault.getFileByPath(tf.path)
                    // console.log(`file=>`, file);
                    if (file) {
                        // const content = await this._plugin.app.vault.adapter.read(file.path);
                        const body = await WechatRender.getInstance(this._plugin, this).parseNote(file.path, this.articleDiv, this);
                        // console.log(`body=>`, body);
                        // console.log(`item=>`, item);

                        item.innerHTML = body

                    }
                }
            } else {
                console.log(`after rendering: node=>`, node, item);

                item.appendChild(node)
            }

        })
        return this.articleDiv.innerHTML
    }
    async renderDraft() {

        await this.parseActiveMarkdown();
        // await ThemeProcessor.getInstance(this._plugin).processNamedStyle(this.articleDiv, 'wewrite-style')
        // extractUniqueStyles(this.articleDiv)
        // processStyle(this.articleDiv)
        // setFullStyle(this.articleDiv)
        const html = applyCSS(this.articleDiv.firstChild, await this.getCSS())
        // this.articleDiv.innerHTML = html

    }
    async renderHTML() {
        const activeFile = this.app.workspace.getActiveFile();
        // RenderCache.getInstance(this._plugin).seaarchResource(activeFile!.path)
        // // console.log(`activeFile =>`, activeFile);

        if (!activeFile) {
            console.log(`no active file`);
            return `<h1>No active file</h1>`
        }
        if (activeFile.extension !== 'md') {
            console.log(`not a markdown file`);
            return `<h1>Not a markdown file</h1>`
        }
        const md = await this.app.vault.adapter.read(activeFile!.path)
        this.articleDiv.empty();
        await htmlRender(this.app, md, activeFile.path, this.articleDiv)
        console.log(`getIcon file`, getIcon('file'));
        console.log(`getIcon LiAlignJustify`, getIcon('LiAlignJustify'));


    }
    startListen() {
        this.registerEvent(
            this._plugin.app.vault.on('rename', (file: TFile) => {
                console.log(`File renamed: ${file.path}`);
                //TODO: localdraft is not valid any more
                this.draftHeader.onNoteRename(file)
            })
        );
        const ec = this.app.workspace.on('editor-change', (editor: Editor, info: MarkdownView) => {

            this.onEditorChange(editor, info);

        });
        this.listeners.push(ec);

        // const el = this.app.workspace.on('active-leaf-change', () => this.update())
        const el = this.app.workspace.on('active-leaf-change', async () => {
            if (await this.draftHeader.updateLocalDraft()) {
                this.renderDraft()
            }
        })
        this.listeners.push(el);
    }
    stopListen() {
        this.listeners.forEach(e => this.app.workspace.offref(e))
    }

    onEditorChange(editor: Editor, info: MarkdownView) {
        console.log(`onEditorChange:`, editor);
        this.renderDraft()
    }
    updateElementByID(id: string, html: string): void {
        const item = this.articleDiv.querySelector('#' + id) as HTMLElement;
        if (!item) return;
        const doc = sanitizeHTMLToDom(html);
        console.log(`doc=>`, doc);

        item.empty();
        if (doc.childElementCount > 0) {
            for (const child of doc.children) {
                item.appendChild(child.cloneNode(true)); // 使用 cloneNode 复制节点以避免移动它
            }
        }
        else {
            item.innerText = '渲染失败';
        }
    }
    addElementByID(id: string, node: HTMLElement | string): void {


        // console.log(`id=${id}, before add this.elementMap=>`, this.elementMap)
        if (typeof node === 'string') {
            this.elementMap.set(id, node);
        } else {
            this.elementMap.set(id, node.cloneNode(true));

        }
        // console.log(`after add this.elementMap=>`, this.elementMap)
    }




}
