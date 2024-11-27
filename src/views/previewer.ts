/**
 * Define the right-side leaf of view as Previewer view
 */

import { DropdownComponent, Editor, EventRef, ItemView, MarkdownFileInfo, MarkdownView, sanitizeHTMLToDom, Setting, TFile, WorkspaceLeaf } from 'obsidian';
import { marked } from 'marked';
import { EditorView } from "@codemirror/view";
import { WechatClient } from '../wechat-api/wechatClient';
import WeWritePlugin from 'src/main';
import { openImageSelectionModal } from './coverImageModal';
import { getWeChatMPSetting } from 'src/settings/wechatMPSetting';
import { VerifyItem } from 'src/assets/assetsManager';
import { SrcThumbList } from 'src/utils/SrcThumbList';
import { WeChatMPAccountSwitcher } from 'src/settings/AccountSwitcher';
import { MPArticleHeader } from './MPArticleHeader';
import { UrlUtils } from 'src/utils/urls';
import { ThemeSuggest } from './ThemeSuggester';
import { ThemeManager } from './ThemeManager';
import { LocalDraftItem, LocalDraftManager } from 'src/assets/DraftManager';
import { timeStamp } from 'console';
import { defaultMaxListeners } from 'events';
import { WechatRender } from 'src/render/WeChatRender';
import { PreviewRender } from 'src/render/marked-extensions/extension';

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
    elementMap: Map<string, Node>;
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
            (data: SrcThumbList) => {
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
        this.startWatchThemes()
        this.startWatchActiveNoteChange()
    }
    startWatchActiveNoteChange() {
        // throw new Error('Method not implemented.');
    }

    getActiveMarkdownView() {
        return this.app.workspace.getActiveViewOfType(MarkdownView)
    }

    async buildUI() {
        const container = this.containerEl.children[1];
        container.empty();

        const mainDiv = container.createDiv({ cls: 'previewer-container' });
        const accountEl = new WeChatMPAccountSwitcher(this.plugin, mainDiv)
        accountEl.setName('MP Account: ')
            .addExtraButton(
                (button) => {
                    button.setIcon('image-up')
                        .setTooltip('')
                        .onClick(async () => {
                            console.log(`upload materials.`);
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('notepad-text-dashed')
                        .setTooltip('send to draft box.')
                        .onClick(async () => {
                            console.log(`send to draft box.`);
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

        this.draftHeader = new MPArticleHeader(this.plugin, mainDiv)


        new Setting(mainDiv)
            .setName('Article Title')
            .addDropdown(async (dropdown) => {
                this.themeDropdown = dropdown
                this.updateThemeOptions()
                dropdown.onChange(async (value) => {
                    console.log(value)
                    this.tm.getThemeContent(value).then(content => {
                        console.log(`css content=>`, content);

                    })

                })

            })
            // .addSearch( (search) => {
            //     new ThemeSuggest(this.plugin, search.inputEl)
            //     search.setPlaceholder('Select Theme')
            //     search.onChange(async (value) => {
            //         // console.log(value)
            //         this.article.theme = 
            //     })
            // })
            .addExtraButton(
                (button) => {
                    button.setIcon('refresh-cw')
                        .setTooltip('Rerender the article content.')
                        .onClick(async () => {
                            console.log(`rerender article content.`);
                            this.articleDiv.innerHTML = await this.parseActiveMarkdown();
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('flask-conical')
                        .setTooltip('Test button')
                        .onClick(async () => {
                            console.log(`test button clicked.`);
                            this.getItemViewDOM()
                        })
                }
            )
            .addExtraButton(
                (button) => {
                    button.setIcon('flask-conical')
                        .setTooltip('Test button2')
                        .onClick(async () => {
                            const view1 = this.plugin.resourceManager.getCurrentMarkdownView()
                            const app1 = this.plugin.app
                            const app2 = this.plugin.resourceManager.plugin.app
                            const view2 = app2.workspace.getActiveViewOfType(MarkdownView);
                            const view3 = this.app.workspace.getActiveViewOfType(ItemView);

                            console.log(`this.plugin.app == this.plugin.resourceManager.plugin.app?`, app1 === app2);
                            console.log(`preview.app == this.plugin.resourceManager.plugin.app?`, this.app === app2);
                            console.log(`previww.app == this.plugin.app?`, this.app === app1);
                            console.log(`view1==view2?`, view1 === view2);
                            console.log(`view1=>`, view1);
                            console.log(`view2=>`, view2);



                        })
                }
            )

        this.renderDiv = mainDiv.createDiv({ cls: 'render-div' });
        this.renderDiv.id = 'render-div';
        this.renderDiv.setAttribute('style', '-webkit-user-select: text; user-select: text;');
        let shadowDom = this.renderDiv //.shawdowRoot;
        if (shadowDom === undefined || shadowDom === null) {

            shadowDom = this.renderDiv.attachShadow({ mode: 'open' });
        }


        this.styleEl = shadowDom.createEl('style');
        this.styleEl.setAttr('title', 'wewrite-mp-style');
        this.setStyle(await this.getCSS());
        this.articleDiv = shadowDom.createEl('div');


    }
    async getCSS(): Promise<string> {
        let css = await ThemeManager.getInstance(this.plugin).getThemeContent(this.themeDropdown.getValue())
        css = css.replace(" ", '')
        return css
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
        this.articleDiv.empty();
        this.elementMap = new Map<string, HTMLElement>()
        const activeFile = this.app.workspace.getActiveFile();
        const md = await this.app.vault.adapter.read(activeFile!.path)
        
        this.setStyle(await this.getCSS())
        let html = await WechatRender.getInstance(this.plugin, this).parse(md)


        html = `<section class="wewrite-mp" id="article-section">${html}</section>`;

        const doc = sanitizeHTMLToDom(html);
        if (doc.firstChild) {
            this.articleDiv.appendChild(doc.firstChild);
        }


        console.log(`this.elementMap=>`, this.elementMap);
        
        this.elementMap.forEach((node: HTMLElement,id:string) => {
            const item = this.articleDiv.querySelector('#' + id) as HTMLElement;
            console.log(`id=${id}, item=>`, item);
            console.log(`node`);
            
            if (!item) return;
            // const newNode = node.cloneNode(true)
            // item.replaceWith(node)
            item.appendChild(node)

        })
        // console.log('-----------------------------------\n', this.articleDiv.innerHTML);

        return this.articleDiv.innerHTML
    }
    getMarkdownViewDOM() {
        const view = this.app.workspace.activeEditor?.editor?.getDoc()
        console.log(view)
        // 获取当前活动的 MarkdownView
        // const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        // console.log(activeView)
        // if (activeView) {
        //     // 获取 MarkdownView 的内容 DOM 元素
        //     const contentEl = activeView.contentEl;

        //     // 打印 DOM 元素
        //     console.log('Content DOM Element:', contentEl);

        //     // 你可以在这里对 contentEl 进行进一步的操作
        // } else {
        //     console.log('No active MarkdownView found.');
        // }
    }
    getItemViewDOM() {
        // 获取当前活动的 MarkdownView
        const activeView = this.app.workspace.getActiveViewOfType(ItemView);
        console.log(activeView)
        if (activeView) {
            // 获取 MarkdownView 的内容 DOM 元素
            const contentEl = activeView.contentEl;

            // 打印 DOM 元素
            console.log('Content DOM Element:', contentEl);

            // 你可以在这里对 contentEl 进行进一步的操作
        } else {
            console.log('No active MarkdownView found.');
        }
    }
    async update() {
        console.log(`onUpdate`);
        const activeFile = this.app.workspace.getActiveFile();
        console.log(`activeFile=>`, activeFile?.path);

        await this.parseActiveMarkdown();

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);

        // @ts-expect-error, not typed
        const editorView = view?.editor?.cm as EditorView;
        if (editorView === undefined || editorView === null) {
            return
        }
        if (this.currentView !== editorView) {

            this.currentView = editorView
        }
        if (this.articleDiv) {
            this.articleDiv.innerHTML = ""
        } else {
            return
        }
        console.log('dom=>', editorView.dom)
        // this.articleDiv.appendChild(editorView.dom.cloneNode(true))

    }
    startListen() {
        const ec = this.app.workspace.on('editor-change', (editor: Editor, info: MarkdownView) => {
            // console.log(`editor-changed:`, editor);
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
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        // @ts-expect-error, not typed
        const editorView = view?.editor?.cm as EditorView;
        if (!editorView) return;

        if (this.editorView === editorView) {
            return;
        }

        this.stopObserver();
        this.editorView = editorView;
        const targetElement = editorView.dom;

        const filterElement = (target: HTMLElement) => {
            if (target.getAttribute('src')?.includes('.excalidraw')) {
                const name = target.getAttribute('src') || '';
                // if (LocalFile.fileCache.has(name)) {
                //     return;
                // }
                // this.debouncedRenderMarkdown();
            }
        };
        this.observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                // 遍历每个变化的节点，子节点
                try {
                    const target = mutation.target as HTMLElement;
                    if (target.classList.contains('internal-embed')) {
                        filterElement(target);
                    }
                    else {
                        const items = target.getElementsByClassName('internal-embed');
                        for (let i = 0; i < items.length; i++) {
                            filterElement(items[i] as HTMLElement);
                        };
                    }
                } catch (error) {
                    console.error(error);
                }
            });
        });

        // 开始监听目标元素的 DOM 变化
        this.observer.observe(targetElement, {
            attributes: true,       // 监听属性变化
            childList: true,        // 监听子节点的变化
            subtree: true,          // 监听子树中的节点变化
        });
    }
    stopObserver() {
        this.observer?.disconnect();
        this.observer = null;
        this.editorView = null;
    }

    onEditorChange(editor: Editor, info: MarkdownView) {

        // console.log(`onEditorChange:`, editor);
        // const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        // const view       = this.app.workspace.getActiveViewOfType(MarkdownView);
        // if (activeView === info){
        //     console.log(`editor changed, view is same.`);

        // }
        // // @ts-expect-error, not typed
        // const v = activeView?.editor.cm as EditorView
        // console.log(`v:${v}`);

    }
    updateElementByID(id: string, html: string): void {
        const item = this.articleDiv.querySelector('#' + id) as HTMLElement;
        if (!item) return;
        const doc = sanitizeHTMLToDom(html);
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
    addElementByID(id: string, node: HTMLElement): void {
        
        console.log(`id=${id}, before add this.elementMap=>`, this.elementMap)
        this.elementMap.set(id, node.cloneNode(true));
        console.log(`after add this.elementMap=>`, this.elementMap)
    }



}
