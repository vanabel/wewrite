/**
 * Define the right-side leaf of view as Previewer view
*/

import { DropdownComponent, Editor, EventRef, ItemView, MarkdownView, sanitizeHTMLToDom, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import { EditorView } from "@codemirror/view";
import { ResourceManager } from './../assets/ResourceManager';
import WeWritePlugin from 'src/main';
import { WechatRender } from 'src/render/WeChatRender';
import { PreviewRender } from 'src/render/marked-extensions/extension';
import { SrcThumbList } from 'src/utils/SrcThumbList';
import { WechatClient } from '../wechat-api/wechatClient';
import { MPArticleHeader } from './MPArticleHeader';
import { ThemeManager } from './ThemeManager';

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
    private themeDropdown: DropdownComponent;
    private tm: ThemeManager

    private draftHeader: MPArticleHeader
    editorView: EditorView | null = null;
    lastLeaf: WorkspaceLeaf | undefined;
    renderDiv: any;
    styleEl: any;
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
        this.plugin = plugin
        this.wechatClient = WechatClient.getInstance(this.plugin)
        this.tm = ThemeManager.getInstance(this.plugin)

    }

    async onOpen() {
        this.buildUI();
        this.startListen()
        this.plugin.messageService.registerListener(
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
        this.plugin.messageService.registerListener('draft-title-updated', (title: string) => {
            console.log(`on messageService, title=>`, title);
            
            this.articleTitle.setName(title)
        })
        this.startWatchThemes()
        this.startWatchActiveNoteChange()
        
    }
    // reisterRenderCompleteEvent(){
    //     this.plugin.registerEvent(
    //         this.plugin.app.workspace.on('file-content-rendered', (leaf: WorkspaceLeaf) => {
    //             if (leaf.view instanceof MarkdownView) {
    //                 console.log(`File content rendered: ${leaf.view.file.path}`);
    //                 // 在这里执行你需要的操作
    //                 this.onFileContentRendered(leaf.view);
    //             }
    //         })
    //     );
    // }
    
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
            .addDropdown(async (dropdown) => {
                this.themeDropdown = dropdown
                await this.updateThemeOptions()

                dropdown.onChange(async (value) => {
                    console.log(value)
                    this.plugin.settings.custom_theme = value
                    this.setStyle(await this.getCSS())
                })

            })

            .addExtraButton(
                (button) => {
                    button.setIcon('image-up')
                        .setTooltip('')
                        .onClick(async () => {
                            console.log(`upload materials.`);
                            // ResourceManager.getInstance(this.plugin).forceRenderActiveMarkdownView()
                            ResourceManager.getInstance(this.plugin).scrollActiveMarkdownView()

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
                            this.parseActiveMarkdown();
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('notepad-text-dashed')
                        .setTooltip('send to draft box.')
                        .onClick(async () => {
                            console.log(`send to draft box.`);
                            this.wechatClient.sendArticleToDraftBox(this.draftHeader.getActiveLocalDraft()!, this.getArticleContent())
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('newspaper')
                        .setTooltip('publish to MP directly.')
                    button.onClick(async () => {
                        console.log(`publish to MP directly.`);
                    })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('panel-left')
                        .setTooltip('show materials and drafts')
                    button.onClick(async () => {
                        this.plugin.showLeftView()
                    })
                }
            )

        this.draftHeader = new MPArticleHeader(this.plugin, mainDiv)

        this.renderDiv = mainDiv.createDiv({ cls: 'render-div' });
        this.renderDiv.id = 'render-div';
        this.renderDiv.setAttribute('style', '-webkit-user-select: text; user-select: text;');
        let shadowDom = this.renderDiv.shawdowRoot;
        if (shadowDom === undefined || shadowDom === null) {

            shadowDom = this.renderDiv.attachShadow({ mode: 'open' });
        }

        this. containerDiv = shadowDom.createDiv({ cls: 'wewrite-article' });
        this.styleEl = this.containerDiv.createEl('style');
        this.styleEl.setAttr('title', 'wewrite-style');
        this.setStyle(await this.getCSS());
        this.articleDiv = this.containerDiv.createDiv({ cls: 'article-div' });

    }
    public getArticleContent() {
        return this.containerDiv.innerHTML
    }
    async getCSS() {
        return await ThemeManager.getInstance(this.plugin).getCSS()
    }
    setStyle(css: string) {
        this.styleEl.empty();
        this.styleEl.appendChild(document.createTextNode(css));
    }
    async updateThemeOptions() {
        const themes = await this.tm.loadThemes()
        console.log(`themes=>`, themes);

        //clear all options
        this.themeDropdown.selectEl.length = 0
        this.themeDropdown.addOption('', 'Default')
        themes.forEach(theme => {
            this.themeDropdown.addOption(theme.path, theme.name)
        })
        if (this.plugin.settings.custom_theme === undefined || !this.plugin.settings.custom_theme) {
            this.themeDropdown.setValue('')
        } else {
            this.themeDropdown.setValue(this.plugin.settings.custom_theme)
        }

    }
    async onClose() {
        // Clean up our view
        this.stopListen()
        this.stopWatchThemes()

    }
    onThemeChange(file: TFile) {
        if (file instanceof TFile && file.extension === 'md' && file.path.startsWith(this.plugin.settings.css_styles_folder)) {
            console.log(`theme file changed: ${file.path}`);
            this.updateThemeOptions()
        } else {
            console.log(`not a theme file`);

        }
    }
    startWatchThemes() {
        this.registerEvent(
            this.app.vault.on('rename', (file: TFile) => {
                console.log(`File renamed: ${file.path}`);
                //TODO: localdraft is not valid any more
                this.draftHeader.onNoteRename(file)
                // 在这里处理文件修改的逻辑
                this.onThemeChange(file)

            })
        );
        this.registerEvent(
            this.app.vault.on('modify', (file: TFile) => {
                console.log(`File modified: ${file.path}`);
                // 在这里处理文件修改的逻辑
                this.onThemeChange(file)

            })
        );

        this.registerEvent(
            this.app.vault.on('create', (file: TFile) => {
                console.log(`File created: ${file.path}`);
                // 在这里处理文件创建的逻辑
                this.onThemeChange(file)
            })
        );

        this.registerEvent(
            this.app.vault.on('delete', (file: TFile) => {
                console.log(`File deleted: ${file.path}`);
                // 在这里处理文件删除的逻辑
                this.onThemeChange(file)
            })
        );
    }
    stopWatchThemes() {
        // throw new Error('Method not implemented.');
        console.log(`stop watch themes`);

    }

    async parseActiveMarkdown() {
        const mview = ResourceManager.getInstance(this.plugin).getCurrentMarkdownView()
        if (!mview){
            console.log(`not a markdown view`);
            return 'not a markdown view';
        }
        const mode = (mview.currentMode as any).type
        console.log('markdown view mode:', mode)
        this.articleDiv.empty();
        if (mode !== 'preview') {
            this.articleDiv.innerHTML = `<h1>Please switch MarkdownView to preview mode</h1>`
            return 
        }
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
        const md = await this.app.vault.adapter.read(activeFile!.path)

        this.setStyle(await this.getCSS())
        let html = await WechatRender.getInstance(this.plugin, this).parse(md)


        html = `<section class="wewrite-article-content" id="article-section">${html}</section>`;

        const doc = sanitizeHTMLToDom(html);
        if (doc.firstChild) {
            this.articleDiv.appendChild(doc.firstChild);
        }

        console.log(`this.elementMap=>`, this.elementMap);

        this.elementMap.forEach(async (node: HTMLElement | string, id: string) => {
            const item = this.articleDiv.querySelector('#' + id) as HTMLElement;
            console.log(`id=${id}, item=>`, item);
            console.log(`node`);

            if (!item) return;
            if (typeof node === 'string') {
                const tf = ResourceManager.getInstance(this.plugin).getFileOfLink(node)
                if (tf) {
                    const file = this.plugin.app.vault.getFileByPath(tf.path)
                    console.log(`file=>`, file);
                    if (file) {
                        const content = await this.plugin.app.vault.adapter.read(file.path);
                        const body = await WechatRender.getInstance(this.plugin, this).parse(content);
                        console.log(`body=>`, body);
                        console.log(`item=>`, item);

                        item.innerHTML = body

                    }
                }
            } else {
                item.appendChild(node)
            }

        })
        return this.articleDiv.innerHTML
    }
    async update() {
        
        await this.parseActiveMarkdown();

    }
    startListen() {
        const ec = this.app.workspace.on('editor-change', (editor: Editor, info: MarkdownView) => {
            
            this.onEditorChange(editor, info);

        });
        this.listeners.push(ec);

        // const el = this.app.workspace.on('active-leaf-change', () => this.update())
        const el = this.app.workspace.on('active-leaf-change', async () => {
            if (await this.draftHeader.updateLocalDraft()) {
                this.update()
            }
        })
        this.listeners.push(el);
    }
    stopListen() {
        this.listeners.forEach(e => this.app.workspace.offref(e))
    }
    startObserver() {
        // const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        // // @ts-expect-error, not typed
        // const editorView = view?.editor?.cm as EditorView;
        // if (!editorView) return;

        // if (this.editorView === editorView) {
        //     return;
        // }

        // this.stopObserver();
        // this.editorView = editorView;
        // const targetElement = editorView.dom;

        // const filterElement = (target: HTMLElement) => {
        //     if (target.getAttribute('src')?.includes('.excalidraw')) {
        //         const name = target.getAttribute('src') || '';
        //         // if (LocalFile.fileCache.has(name)) {
        //         //     return;
        //         // }
        //         // this.debouncedRenderMarkdown();
        //     }
        // };
        // this.observer = new MutationObserver((mutationsList) => {
        //     mutationsList.forEach((mutation) => {
        //         // 遍历每个变化的节点，子节点
        //         try {
        //             const target = mutation.target as HTMLElement;
        //             if (target.classList.contains('internal-embed')) {
        //                 filterElement(target);
        //             }
        //             else {
        //                 const items = target.getElementsByClassName('internal-embed');
        //                 for (let i = 0; i < items.length; i++) {
        //                     filterElement(items[i] as HTMLElement);
        //                 };
        //             }
        //         } catch (error) {
        //             console.error(error);
        //         }
        //     });
        // });

        // // 开始监听目标元素的 DOM 变化
        // this.observer.observe(targetElement, {
        //     attributes: true,       // 监听属性变化
        //     childList: true,        // 监听子节点的变化
        //     subtree: true,          // 监听子树中的节点变化
        // });
    }
    stopObserver() {
        // this.observer?.disconnect();
        // this.observer = null;
        // this.editorView = null;
    }

    onEditorChange(editor: Editor, info: MarkdownView) {
        console.log(`onEditorChange:`, editor);
        this.update()
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

        console.log(`id=${id}, before add this.elementMap=>`, this.elementMap)
        if (typeof node === 'string') {
            this.elementMap.set(id, node);
        } else {
            this.elementMap.set(id, node.cloneNode(true));

        }
        console.log(`after add this.elementMap=>`, this.elementMap)
    }



}
