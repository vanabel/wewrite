import { MarkdownView } from 'obsidian';
import WeWritePlugin from 'src/main';
import { scrollToBottomOfElement } from 'src/utils/scroll';

export class ResourceManager {
    private static instance: ResourceManager;
    private iconMap: Map<string, string>;
    private resourceMap2: Map<string, string>;
    private _plugin: WeWritePlugin;
    private constructor(plugin: WeWritePlugin) {
        this._plugin = plugin;
        this.init();
    }
    static getInstance(plugin: WeWritePlugin) {
        if (!this.instance) {
            this.instance = new ResourceManager(plugin);
        }
        return this.instance;
    }
    private init() {
        this.iconMap = new Map();
        this.resourceMap2 = new Map();
    }
    public getCurrentMarkdownView() {
        const currentFile = this._plugin.app.workspace.getActiveFile();
        const leaves = this._plugin.app.workspace.getLeavesOfType('markdown');
        for (let leaf of leaves) {
            const markdownView = leaf.view as MarkdownView;
            if (markdownView.file?.path === currentFile?.path) {
                return markdownView;
            }
        }
        return null
    }
    public forceRenderActiveMarkdownView() {
        const view = this.getCurrentMarkdownView();
        if (view) {
            console.log(`trigger render for ${view.file?.path}`);
            this._plugin.app.workspace.trigger('render', view)
        }
    }
    public scrollActiveMarkdownView() {
        const view = this.getCurrentMarkdownView();
        if (view) {
            console.log(`scroll ${view.file?.path}`);
            const scroller = view.containerEl.querySelector('.cm-scroller');
            if (!scroller) {
                console.log('scroller element not found.');
                return;
            }

            scrollToBottomOfElement(scroller as HTMLElement, 5000)
        }
    }
    public queryElements(query: string) {
        const view = this.getCurrentMarkdownView();
        // console.log(`queryElements=>view`, view);
        if (!view) return [];
        const preview = view.containerEl.querySelector('.markdown-reading-view')//('.markdown-preview-view')
        // console.log(`queryElements=>preview`, preview);
        // console.log(`queryElements=>preview.outer`, preview?.outerHTML);

        if (!preview) {
            console.log(`no preview found`);
            return []

        }
        return preview.querySelectorAll<HTMLElement>(query);
    }
    public getMarkdownViewContainer() {
        const view = this.getCurrentMarkdownView();
        // console.log(`getMarkdownViewContainer=>view`, view);

        if (!view) return null;
        return view.containerEl;
    }
    public getMarkdownRenderedElement(index: number, query: string) {
        const containers = this.queryElements(query);
        // console.log(`containers`, containers, 'query=>', query);
        if (containers.length <= index) {
            return null;
        }
        const root = containers[index];
        if (!root) {
            return null;
        }
        return root;
    }
    public getFileOfLink(link: string) {
        const file = this._plugin.app.metadataCache.getFirstLinkpathDest(link, '');
        return file;
    }
    public async getLinkFileContent(link: string) {
        const tf = this.getFileOfLink(link);
        if (tf) {
            const content = await this._plugin.app.vault.adapter.read(tf.path);
            return content
        }
        return null
    }

    public async renderMarkdown(path:string){
        
    }
}