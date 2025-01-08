/**
 * MarkdownRender of obsidian. 
 * credits to author of export as image plugin
*/

import { App, Component, MarkdownRenderChild, MarkdownRenderer, MarkdownView } from "obsidian";
import { DeepSeekResult } from "../types";
import domtoimage from 'dom-to-image';
async function delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
export class ObsidianMarkdownRenderer {
    private static instance: ObsidianMarkdownRenderer;
    private path: string
    private el: HTMLElement
    private rendering: boolean = false
    private container: HTMLElement
    private view: Component
    mdv: MarkdownRenderChild;
    el1: HTMLDivElement;
    private deepseekControls: HTMLElement;
    private deepseekResult: HTMLElement;
    private constructor(private app: App) {
        this.app = app;
    }

    private createDeepSeekControls(): HTMLElement {
        const controls = createDiv('deepseek-controls');

        const summaryBtn = createEl('button', { text: '生成摘要' });
        summaryBtn.onclick = () => this.handleDeepSeekAction('summary');

        const proofreadBtn = createEl('button', { text: '校对文本' });
        proofreadBtn.onclick = () => this.handleDeepSeekAction('proofread');

        const polishBtn = createEl('button', { text: '润色文本' });
        polishBtn.onclick = () => this.handleDeepSeekAction('polish');

        const coverBtn = createEl('button', { text: '生成封面' });
        coverBtn.onclick = () => this.handleDeepSeekAction('cover');

        controls.append(summaryBtn, proofreadBtn, polishBtn, coverBtn);
        return controls;
    }

    private async handleDeepSeekAction(action: string) {
        const markdown = await this.app.vault.adapter.read(this.path);

        try {
            const result = await this.callDeepSeekAPI(markdown, action);
            this.showDeepSeekResult(result, action);
        } catch (error) {
            console.error('DeepSeek API error:', error);
            this.showError('DeepSeek API调用失败');
        }
    }

    private async callDeepSeekAPI(content: string, action: string): Promise<DeepSeekResult> {
        // API调用逻辑将在deepseek-client.ts中实现
        return {
            summary: '示例摘要',
            corrections: [],
            polished: '润色后的文本',
            coverImage: 'data:image/png;base64,...'
        };
    }

    private showDeepSeekResult(result: DeepSeekResult, action: string) {
        this.deepseekResult.empty();

        switch (action) {
            case 'summary':
                this.deepseekResult.createEl('div', {
                    text: result.summary,
                    cls: 'deepseek-summary'
                });
                break;

            case 'proofread':
                if (result.corrections?.length) {
                    const list = this.deepseekResult.createEl('ul');
                    result.corrections.forEach(correction => {
                        list.createEl('li', {
                            text: `${correction.original} → ${correction.corrected}`
                        });
                    });
                } else {
                    this.deepseekResult.createEl('div', {
                        text: '未发现需要修改的内容',
                        cls: 'deepseek-no-corrections'
                    });
                }
                break;

            case 'polish':
                this.deepseekResult.createEl('div', {
                    text: result.polished,
                    cls: 'deepseek-polished'
                });
                break;

            case 'cover':
                if (result.coverImage) {
                    const img = this.deepseekResult.createEl('img', {
                        attr: {
                            src: result.coverImage,
                            style: 'width: 100%; max-width: 800px;'
                        }
                    });
                }
                break;
        }
    }

    private showError(message: string) {
        this.deepseekResult.empty();
        this.deepseekResult.createEl('div', {
            text: message,
            cls: 'deepseek-error'
        });
    }

    public static getInstance(app: App,) {
        if (!ObsidianMarkdownRenderer.instance) {
            ObsidianMarkdownRenderer.instance = new ObsidianMarkdownRenderer(app);
        }
        return ObsidianMarkdownRenderer.instance;
    }
    public async render(path: string, container: HTMLElement, view: Component) {
        if (path === undefined || !path || !path.toLowerCase().endsWith('.md')) {
            return;
        }
        this.container = container
        this.view = view
        this.path = path

        if (this.el !== undefined && this.el) {
            this.el.remove()
        }
        this.rendering = true
        await this.loadComponents(view)
        this.el = createDiv()
        this.el1 = this.el.createDiv()
        this.mdv = new MarkdownRenderChild(this.el)
        this.path = path
        const markdown = await this.app.vault.adapter.read(path)
        await MarkdownRenderer.render(this.app, markdown, this.el1, path, this.app.workspace.getActiveViewOfType(MarkdownView)!
            || this.app.workspace.activeLeaf?.view
            || new MarkdownRenderChild(this.el)
        )

        this.container.appendChild(this.el)
        await delay(100);
        this.rendering = false
        // this.container.removeChild(this.el)
    }
    public queryElement(index: number, query: string) {
        if (this.el === undefined || !this.el) {
            return null
        }
        if (this.rendering) {
            return null
        }
        const nodes = this.el.querySelectorAll<HTMLElement>(query)
        if (nodes.length < index) {
            return null
        }
        return nodes[index]
    }
    public async htmlToImage(element: HTMLElement): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Could not get canvas context');
                }

                // Set canvas dimensions
                canvas.width = element.offsetWidth;
                canvas.height = element.offsetHeight;

                // Create image from HTML
                const data = new XMLSerializer().serializeToString(element);
                const img = new Image();
                img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                        <foreignObject width="100%" height="100%">
                            ${data}
                        </foreignObject>
                    </svg>
                `);

                img.onload = () => {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };

                img.onerror = (error) => {
                    reject(new Error('Failed to load image: ' + error));
                };
            } catch (error) {
                console.error('Failed to convert HTML to image:', error);
                reject(error);
            }
        });
    }
    public async domToImage(element: HTMLElement): Promise<string> {
        const blob = await domtoimage.toBlob(element)
        const dataUrl = URL.createObjectURL(blob)
        return dataUrl
    }

    private async loadComponents(view: Component) {
        type InternalComponent = Component & {
            _children: Component[];
            onload: () => void | Promise<void>;
        }

        const internalView = view as InternalComponent;

        // recursively call onload() on all children, depth-first
        const loadChildren = async (
            component: Component,
            visited: Set<Component> = new Set()
        ): Promise<void> => {
            if (visited.has(component)) {
                return;  // Skip if already visited
            }

            visited.add(component);

            const internalComponent = component as InternalComponent;

            if (internalComponent._children?.length) {
                for (const child of internalComponent._children) {
                    await loadChildren(child, visited);
                }
            }
            try {
                // relies on the Sheet plugin (advanced-table-xt) not to be minified
                if (component?.constructor?.name === 'SheetElement') {
                    await component.onload();
                }
            } catch (error) {
                console.error(`Error calling onload()`, error);
            }
        };
        await loadChildren(internalView);
    }
}
