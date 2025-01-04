/*
* Access to active MarkdownView for rendering resource.
  
  
 */

import { MarkdownView } from 'obsidian';
import WeWritePlugin from 'src/main';

export class ResourceManager {
    private static instance: ResourceManager;
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
            this._plugin.app.workspace.trigger('render', view)
        }
    }
    public queryElements(query: string) {
        const view = this.getCurrentMarkdownView();
        if (!view) return [];

        const view_query = view.getMode() === 'preview' ? '.markdown-preview-view' : '.markdown-source-view';
        const preview = view.containerEl.querySelector(view_query)

        if (!preview) {
            return []

        }
        return preview.querySelectorAll<HTMLElement>(query);
    }
    public getMarkdownViewContainer() {
        const view = this.getCurrentMarkdownView();

        if (!view) return null;
        return view.containerEl;
    }
    public getMarkdownRenderedElement(index: number, query: string) {
        const containers = this.queryElements(query);
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

    public async renderMarkdown(path: string) {

    }
}