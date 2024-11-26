import { MarkdownView } from 'obsidian';
import WeWritePlugin from 'src/main';

export class ResourceManager {
    private static instance: ResourceManager;
    private iconMap: Map<string, string>;
    private resourceMap2: Map<string, string>;
    plugin: WeWritePlugin;
    private constructor(plugin: WeWritePlugin) {
        this.plugin = plugin;
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
        const currentFile = this.plugin.app.workspace.getActiveFile();
        const leaves = this.plugin.app.workspace.getLeavesOfType('markdown');
        for (let leaf of leaves) {
            const markdownView = leaf.view as MarkdownView;
            if (markdownView.file?.path === currentFile?.path) {
                return markdownView;
            }
        }
        return null
    }
    public queryElements(query: string) {
        const view = this.getCurrentMarkdownView();
        if (!view) return [];
        return view.containerEl.querySelectorAll<HTMLElement>(query);
    }
    public getMarkdownViewContainer() {
        const view = this.getCurrentMarkdownView();
        console.log(`getMarkdownViewContainer=>view`, view);

        if (!view) return null;
        return view.containerEl;
    }
    public getMarkdownRenderedElement(index: number, query: string){
        const containers = this.plugin.resourceManager.queryElements(query);
        if (containers.length <= index) {
			return null;
		}
		const root = containers[index];
		if (!root){
			return null;
		}
        return root;
    }
}