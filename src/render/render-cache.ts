import { MarkdownView, TFile, WorkspaceLeaf } from "obsidian";
import WeWritePlugin from "src/main";


export const classMap: Record<string, string> = {
    'mermaid': '.mermaid',
    'admonition': '.admonition-parent',
    'excalidraw': '.excalidraw-svg',
    'charts': '.block-language-chart',
    'iconize': '.cm-iconize-icon',
    'remix-icon': '.obsidian-icon.react-icon'
};
/**
 * Do nothing for a while
 */
async function delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


export class RenderCache {
    private static instance: RenderCache;
    private cache: Map<string, HTMLElement[]> = new Map();
    private lastRender: number = 0;
    private lastNotePath: string = '';
    private plugin: WeWritePlugin;
    private constructor(_plugin: WeWritePlugin) {
        this.plugin = _plugin;
    }
    public static getInstance(_plugin: WeWritePlugin): RenderCache {
        if (!RenderCache.instance) {
            RenderCache.instance = new RenderCache(_plugin);
        }
        return RenderCache.instance;
    }
    public registerProcessor() {
        const process = this.plugin.registerMarkdownPostProcessor((el, ctx) => {
            this.lastRender = Date.now();
            if (this.lastNotePath !== ctx.sourcePath) {
                this.lastNotePath = ctx.sourcePath;
                this.clearCacheOfFile(ctx.sourcePath)
                return;
            }
            this.addCache(ctx.sourcePath, el)
            this.untilRendered()
        });
        process.sortOrder = 10000; //get later called, could be not the last one finished. 
        // this.plugin.app.workspace.on('active-leaf-change', async (leaf: WorkspaceLeaf) => {
        //     console.log('render cache, active leaf changed:', leaf.view.getViewType())
        //     const currentFile = this.plugin.app.workspace.getActiveFile();
        //     if (!currentFile) {
        //         return
        //     }
        //     if (leaf.view.getViewType() === 'markdown') {
        //         this.clearCacheOfFile(currentFile.path)
        //     }

        // })
    }
    public seaarchResource(path: string) {
        Object.entries(classMap).forEach(([key, value]) => {
            const elements = this.filterElements(path, value)
            console.log(`${path} has ${key} =>`, elements);

        })
    }
    private async untilRendered() {
        while (Date.now() - this.lastRender < 3000 /* ms */) {
            if (this.lastRender === 0) {
                break;
            }
            await delay(20);
        }
        this.seaarchResource(this.lastNotePath)
    }

    private filterElements(path: string, query: string) {
        const cache = this.cache.get(path)
        // console.log(`cache=>`, this.cache);

        // console.log(`filterElements:${path} ==${query} =>`, cache);

        const nodes: Element[] = []
        if (cache !== undefined) {
            cache.forEach(node => {
                const elements = node.querySelectorAll(query)
                nodes.push(...elements)
            })
        }
        return nodes
    }
    public onFileActivate(file: TFile) {
        //clear the cache queue of this file
        this.clearCacheOfFile(file.path)
    }
    private clearCacheOfFile(path: string) {
        const cache = this.cache.get(path)
        if (cache !== undefined) {
            //remove it
        }
        this.cache.set(path, [])
        console.log(`clear cache of ${path}`);

    }
    private addCache(path: string, el: HTMLElement) {
        console.log(`el=>`, el);
        
        const cache = this.cache.get(path)
        if (cache === undefined) {
            this.cache.set(path, [el])
        } else {
            const found = cache.find(node => node === el)
            if (found === undefined) {
                cache.push(el)
            }
        }
        // console.log(`add cache of ${path}`, cache);

    }

}
//last time the registerMarkdownPostProcessor called;
let lastRender: number = 0;


