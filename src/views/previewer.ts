/**
 * Define the right-side leaf of view as Previewer view
*/

import { EditorView } from "@codemirror/view";
// import i18next from 'i18next';
import { debounce, DropdownComponent, Editor, EventRef, ItemView, MarkdownView, Notice, sanitizeHTMLToDom, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import WeWritePlugin from 'src/main';
import { PreviewRender } from 'src/render/marked-extensions/extension';
import { uploadCanvas, uploadSVGs, uploadURLImage } from 'src/render/post-render';
import { WechatRender } from 'src/render/wechat-render';
import { SrcThumbList } from 'src/utils/src-thumb-list';
import { ResourceManager } from '../assets/resource-manager';
import { WechatClient } from '../wechat-api/wechat-client';
import { MPArticleHeader } from './mp-article-header';
import { ThemeManager } from './theme-manager';
import { ThemeSelector } from './theme-selector';
import { WebViewModal } from './webview';
import { $t } from 'src/lang/i18n';

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
    private plugin: WeWritePlugin
    private themeSelector: ThemeSelector;
    private debouncedRender: Function;
    private debounce: Function;
    private debouncedUpdate = debounce(async () => {
        await this.renderDraft();
    }, 5000);

    private draftHeader: MPArticleHeader
    articleProperties: Map<string, string> = new Map();
    editorView: EditorView | null = null;
    lastLeaf: WorkspaceLeaf | undefined;
    renderDiv: any;
    elementMap: Map<string, Node | string>;
    articleTitle: Setting;
    containerDiv: HTMLElement;
    mpModal: WebViewModal;
    getViewType(): string {
        return VIEW_TYPE_NP_PREVIEW;
    }
    getDisplayText(): string {
        return $t('views.preivewer.wewrite-previewer');
    }
    getIcon() {
        return 'pen-tool';
    }
    constructor(leaf: WorkspaceLeaf, plugin: WeWritePlugin) {
        super(leaf);
        this.plugin = plugin
        this.wechatClient = WechatClient.getInstance(this.plugin)
        this.themeSelector = new ThemeSelector(plugin)
        this.debouncedRender = debounce(async () => {
            await this.renderDraft();
        }, 4000);
    }

    async onOpen() {
        this.buildUI();
        this.startListen()
        this.plugin.messageService.registerListener(
            'src-thumb-list-updated', (data: SrcThumbList) => {
                this.articleDiv.empty();
                this.articleDiv.createDiv().setText($t('views.preivewer.to-verify-the-images-in-article'))
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
        this.plugin.messageService.registerListener('draft-title-updated', (title: string) => {

            this.articleTitle.setName(title)
        })
        this.themeSelector.startWatchThemes()
        this.startWatchActiveNoteChange()
        this.plugin.messageService.registerListener('custom-theme-changed', async (theme: string) => {
			this.getArticleProperties()
            this.articleProperties.set('custom_theme', theme)
            this.setArticleProperties()
        })


    }

    onFileContentRendered(view: MarkdownView) {
        //TODO
        // throw new Error('Method not implemented.');

    }
    startWatchActiveNoteChange() {
        //TODO
        // throw new Error('Method not implemented.');

    }

    getArticleProperties() {
        const activeFile = this.plugin.app.workspace.getActiveFile()
        if (activeFile?.extension === 'md' || activeFile?.extension === 'markdown') {
            const cache = this.app.metadataCache.getCache(activeFile.path);
            const frontmatter = cache?.frontmatter;
            this.articleProperties.clear()
            if (frontmatter !== undefined && frontmatter !== null) {
                Object.keys(frontmatter).forEach(key => {
                    this.articleProperties.set(key, frontmatter[key])
                })
            }
        }
        return this.articleProperties
    }
    async setArticleProperties() {
        const path = this.getCurrentMarkdownFile()

        if (path && this.articleProperties.size > 0) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (!(file instanceof TFile)) {
                throw new Error($t('views.preivewer.file-not-found-path', [path]));
            }

            const content = await this.app.vault.read(file);
            const frontmatterString = Array.from(this.articleProperties.entries())
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join('\n');
            console.log(`frontmatterString: `, frontmatterString);

            let updatedContent
            if (content.startsWith('---')) {
                updatedContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontmatterString}\n---`);
            } else {
                updatedContent = `---\n${frontmatterString}\n---\n${content}`
            }

            await this.app.vault.modify(file, updatedContent);
        }
    }


    public getCurrentMarkdownFile() {
        const currentFile = this.plugin.app.workspace.getActiveFile();
        const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
        for (let leaf of leaves) {
            const markdownView = leaf.view as MarkdownView;
            if (markdownView.file?.path === currentFile?.path) {
                return markdownView.file?.path;
            }
        }
        return null
    }
    async buildUI() {
        const container = this.containerEl.children[1];
        container.empty();

        const mainDiv = container.createDiv({ cls: 'wewrite-previewer-container' });
        this.articleTitle = new Setting(mainDiv)
            .setName($t('views.preivewer.article-title'))
            .setHeading()
            .addDropdown((dropdown: DropdownComponent) => {
                this.themeSelector.dropdown(dropdown);
            })
            .addExtraButton(
                (button) => {
                    button.setIcon('anchor')
                        .setTooltip($t('views.preivewer.testing-button'))
                        .onClick(async () => {
                            console.log(`testing...`);


                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('refresh-cw')
                        .setTooltip($t('views.preivewer.render-article'))
                        .onClick(async () => {
                            this.renderDraft()
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('send-horizontal')
                        .setTooltip($t('views.preivewer.send-article-to-draft-box'))
                        .onClick(async () => {
                            if (await this.checkCoverImage()) {
                                this.sendArticleToDraftBox()
                            } else {
                                new Notice($t('views.preivewer.please-set-cover-image'))
                            }
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('clipboard-copy')
                        .setTooltip($t('views.preivewer.copy-article-to-clipboard'))
                        .onClick(async () => {
                            const data = this.getArticleContent()
                            await navigator.clipboard.write([new ClipboardItem({
                                'text/html': new Blob([data], { type: 'text/html' })
                            })])
                            new Notice($t('views.preivewer.article-copied-to-clipboard'))
                        })
                }
            )

        this.draftHeader = new MPArticleHeader(this.plugin, mainDiv)

        this.renderDiv = mainDiv.createDiv({ cls: 'render-container' });
        this.renderDiv.id = 'render-div';
        let shadowDom = this.renderDiv.shawdowRoot;
        if (shadowDom === undefined || shadowDom === null) {

            shadowDom = this.renderDiv//.attachShadow({ mode: 'open' });
        }

        this.containerDiv = shadowDom.createDiv({ cls: 'wewrite-article' });
        this.articleDiv = this.containerDiv.createDiv({ cls: 'article-div' });

    }
    async checkCoverImage() {
        return this.draftHeader.checkCoverImage()
    }
    async sendArticleToDraftBox() {
        await uploadSVGs(this.articleDiv, this.plugin.wechatClient)
        await uploadCanvas(this.articleDiv, this.plugin.wechatClient)
        await uploadURLImage(this.articleDiv, this.plugin.wechatClient)

        const media_id = await this.wechatClient.sendArticleToDraftBox(this.draftHeader.getActiveLocalDraft()!, this.getArticleContent())

        if (media_id) {
            this.draftHeader.updateDraftDraftId(media_id)
            const news_item = await this.wechatClient.getDraftById(this.plugin.settings.selectedAccount!, media_id)
            if (news_item) {

                open(news_item[0].url)
                const item = {
                    media_id: media_id,
                    content: {
                        news_item: news_item
                    },
                    update_time: Date.now()
                }
                this.plugin.messageService.sendMessage('draft-item-updated', item)
            }
        }
    }
    public getArticleContent() {
        return this.articleDiv.innerHTML
    }
    async getCSS() {
        return await ThemeManager.getInstance(this.plugin).getCSS()
    }

    async onClose() {
        // Clean up our view
        this.stopListen()
        this.themeSelector.stopWatchThemes()

    }


    async parseActiveMarkdown() {
        // get properties
        const prop = this.getArticleProperties()
        const mview = ResourceManager.getInstance(this.plugin).getCurrentMarkdownView()
        if (!mview) {
            return $t('views.preivewer.not-a-markdown-view');
        }
        this.articleDiv.empty();
        this.elementMap = new Map<string, HTMLElement | string>()
        const activeFile = this.app.workspace.getActiveFile();

        if (!activeFile) {
            return `<h1>No active file</h1>`
        }
        if (activeFile.extension !== 'md') {
            return `<h1>Not a markdown file</h1>`
        }
        let html = await WechatRender.getInstance(this.plugin, this).parseNote(activeFile.path, this.articleDiv, this)

        // return;
        html = `<div class="wewrite-article-content wewrite" id="article-section">${html}</div>`;

        this.articleDiv.innerHTML = html

        this.elementMap.forEach(async (node: HTMLElement | string, id: string) => {
            const item = this.articleDiv.querySelector('#' + id) as HTMLElement;

            if (!item) return;
            if (typeof node === 'string') {
                const tf = ResourceManager.getInstance(this.plugin).getFileOfLink(node)
                if (tf) {
                    const file = this.plugin.app.vault.getFileByPath(tf.path)
                    if (file) {
                        const body = await WechatRender.getInstance(this.plugin, this).parseNote(file.path, this.articleDiv, this);
                        item.innerHTML = body
                    }
                }
            } else {
                item.appendChild(node)
            }

        })
        return this.articleDiv.innerHTML
    }
    async renderDraft() {
        await this.parseActiveMarkdown();
        await ThemeManager.getInstance(this.plugin).applyTheme(this.articleDiv.firstChild as HTMLElement)
    }
    startListen() {
        this.registerEvent(
            this.plugin.app.vault.on('rename', (file: TFile) => {
                this.draftHeader.onNoteRename(file)
            })
        );
        const ec = this.app.workspace.on('editor-change', (editor: Editor, info: MarkdownView) => {

            this.onEditorChange(editor, info);

        });
        this.listeners.push(ec);

        const el = this.app.workspace.on('active-leaf-change', async () => {
            
            this.debouncedUpdate();
           
        })
        this.listeners.push(el);
    }
    stopListen() {
        this.listeners.forEach(e => this.app.workspace.offref(e))
    }

    onEditorChange(editor: Editor, info: MarkdownView) {
        this.debouncedRender();
    }
    updateElementByID(id: string, html: string): void {
        const item = this.articleDiv.querySelector('#' + id) as HTMLElement;
        if (!item) return;
        const doc = sanitizeHTMLToDom(html);

        item.empty();
        if (doc.childElementCount > 0) {
            for (const child of doc.children) {
                item.appendChild(child.cloneNode(true));
            }
        }
        else {
            item.innerText = $t('views.preivewer.article-render-failed');
        }
    }
    addElementByID(id: string, node: HTMLElement | string): void {
        if (typeof node === 'string') {
            this.elementMap.set(id, node);
        } else {
            this.elementMap.set(id, node.cloneNode(true));

        }
    }

}
