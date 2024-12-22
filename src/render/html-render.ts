import { App, arrayBufferToBase64, Component, FileSystemAdapter, MarkdownRenderer, TFile } from "obsidian";

// Thank you again Olivier Balfour !
const MERMAID_STYLESHEET = `
:root {
  --default-font: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Microsoft YaHei Light", sans-serif;
  --font-monospace: 'Source Code Pro', monospace;
  --background-primary: #ffffff;
  --background-modifier-border: #ddd;
  --text-accent: #705dcf;
  --text-accent-hover: #7a6ae6;
  --text-normal: #2e3338;
  --background-secondary: #f2f3f5;
  --background-secondary-alt: #fcfcfc;
  --text-muted: #888888;
  --font-mermaid: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Microsoft YaHei Light", sans-serif;
  --text-error: #E4374B;
  --background-primary-alt: '#fafafa';
  --background-accent: '';
  --interactive-accent: hsl( 254,  80%, calc( 68% + 2.5%));
  --background-modifier-error: #E4374B;
  --background-primary-alt: #fafafa;
  --background-modifier-border: #e0e0e0;
}
`;
enum FootnoteHandling {
    /** Remove references and links */
    REMOVE_ALL,

    /** Reference links to footnote using a unique id */
    LEAVE_LINK,

    /** Links are removed from reference and back-link from footnote */
    REMOVE_LINK,

    /** Footnote is moved to title attribute */
    TITLE_ATTRIBUTE
}

enum InternalLinkHandling {
    /**
     * remove link and only display link text
     */
    CONVERT_TO_TEXT,

    /**
     * convert to an obsidian:// link to open the file or tag in Obsidian
     */
    CONVERT_TO_OBSIDIAN_URI,

    /**
     * Keep link, but convert extension to .html
     */
    LINK_TO_HTML,

    /**
     * Keep generated link
     */
    LEAVE_AS_IS
}

/**
 * Do nothing for a while
 */
async function delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export class HtmlRender {
    private isRendering: boolean = false;

    private readonly externalSchemes = ['http', 'https'];

    private readonly vaultPath: string;
    private readonly vaultLocalUriPrefix: string;
    private readonly vaultOpenUri: string;
    private readonly vaultSearchUri: string;
    private view: Component;
    // only those which are different from image/${extension}
    private readonly mimeMap = new Map([
        ['svg', 'image/svg+xml'],
        ['jpg', 'image/jpeg'],
    ]);
    constructor(private app: App) {
        this.vaultPath = (this.app.vault.getRoot().vault.adapter as unknown as FileSystemAdapter).getBasePath()
            .replace(/\\/g, '/');

        this.vaultLocalUriPrefix = `app://local/${this.vaultPath}`;

        this.vaultOpenUri = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}`;
        this.vaultSearchUri = `obsidian://search?vault=${encodeURIComponent(this.app.vault.getName())}`;

        this.view = new Component();
    }
    public async renderDocument(markdown: string, path: string): Promise<HTMLElement> {
		
		try {
			const topNode = await this.renderMarkdown(markdown, path);
			return await this.transformHTML(topNode!);
		} finally {
			
		}
	}
    /**
     * Render current view into HTMLElement, expanding embedded links
     */
    async renderMarkdown(markdown: string, path: string): Promise<HTMLElement | null> {
        if (this.isRendering) {
            return null;
        }
        this.isRendering = true;
        const processedMarkdown = this.preprocessMarkdown(markdown);

        const wrapper = document.createElement('div');
        wrapper.style.display = 'hidden';
        document.body.appendChild(wrapper);
        await MarkdownRenderer.render(this.app, processedMarkdown, wrapper, path, this.view);
        await this.untilRendered();

        await this.loadComponents(this.view);

        const result = wrapper.cloneNode(true) as HTMLElement;
        document.body.removeChild(wrapper);

        this.view.unload();
        this.isRendering = false;
        return result;
    }
    private async cleanUpHTML(element: HTMLElement): Promise<void> {
        //remove button copy-code
        element.querySelectorAll('button.copy-code').forEach(btn => {
            btn.remove();
        })
        //remove callout-fold
        element.querySelectorAll('div.callout-fold').forEach(div => {
            div.remove();
        });



    }
    /**
     * Transform rendered markdown to clean it up and embed images
     */
    private async transformHTML(element: HTMLElement): Promise<HTMLElement> {
        // Remove styling which forces the preview to fill the window vertically
        // @ts-ignore
        const node: HTMLElement = element.cloneNode(true);
        node.removeAttribute('style');

        this.removeFrontMatter(node);

        this.replaceLinksOfClass(node, 'internal-link');
        this.replaceLinksOfClass(node, 'tag');
        this.makeCheckboxesReadOnly(node);
        this.removeCollapseIndicators(node);
        this.removeButtons(node);
        this.removeStrangeNewWorldsLinks(node);

        this.transformCodeToTables(node);

        // this.transformCalloutsToTables(node);

        this.removeAllFootnotes(node);
        this.removeFootnoteLinks(node);

        await this.embedImages(node);
        await this.renderSvg(node);

        return node;
    }


    private preprocessMarkdown(markdown: string): string {
        let processed = markdown;

        // if (this.options.removeDataviewMetadataLines) {
        // 	processed = processed.replace(/^[^ \t:#`<>][^:#`<>]+::.*$/gm, '');
        // }

        return processed;
    }

    /**
     * Some plugins may expose components that rely on onload() to be called which isn't the case due to the
     * way we render the markdown. We need to call onload() on all components to ensure they are properly loaded.
     * Since this is a bit of a hack (we need to access Obsidian internals), we limit this to components of which
     * we know that they don't get rendered correctly otherwise.
     * We attempt to make sure that if the Obsidian internals change, this will fail gracefully.
     */
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
    /**
     * Wait until the view has finished rendering
     *
     * Beware, this is a dirty hack...
     *
     * We have no reliable way to know if the document finished rendering. For instance dataviews or task blocks
     * may not have been post processed.
     * MarkdownPostProcessors are called on all the "blocks" in the HTML view. So we register one post-processor
     * with high-priority (low-number to mark the block as being processed), and another one with low-priority that
     * runs after all other post-processors.
     * Now if we see that no blocks are being post-processed, it can mean 2 things :
     *  - either we are between blocks
     *  - or we finished rendering the view
     * On the premise that the time that elapses between the post-processing of consecutive blocks is always very
     * short (just iteration, no work is done), we conclude that the render is finished if no block has been
     * rendered for enough time.
     */
    private async untilRendered() {
        // while (this.isRendering || Date.now() - this.ppLastBlockDate < 1000) {
        // 	if (this.ppLastBlockDate === 0) {
        // 		break;
        // 	}
        // 	await delay(20);
        // }
        await delay(1000);
    }
    /** Remove front-matter */
    private removeFrontMatter(node: HTMLElement) {
        node.querySelectorAll('.frontmatter, .frontmatter-container')
            .forEach(node => node.remove());
    }

    private replaceLinksOfClass(node: HTMLElement, className: string) {

        node.querySelectorAll(`a.${className}`)
            .forEach(node => {
                // switch (this.options.internalLinkHandling) {
                //     case InternalLinkHandling.CONVERT_TO_OBSIDIAN_URI: {
                //         const linkNode = node.parentNode!.createEl('a');
                //         linkNode.innerText = node.getText();

                //         if (className === 'tag') {
                //             linkNode.href = this.vaultSearchUri + "&query=tag:" + encodeURIComponent(node.getAttribute('href')!);
                //         } else {
                //             if (node.getAttribute('href')!.startsWith('#')) {
                //                 linkNode.href = node.getAttribute('href')!;
                //             } else {
                //                 linkNode.href = this.vaultOpenUri + "&file=" + encodeURIComponent(node.getAttribute('href')!);
                //             }
                //         }
                //         linkNode.className = className;
                //         node.parentNode!.replaceChild(linkNode, node);
                //     }
                //         break;

                //     case InternalLinkHandling.LINK_TO_HTML: {
                //         const linkNode = node.parentNode!.createEl('a');
                //         linkNode.innerText = node.getAttribute('href')!; //node.getText();
                //         linkNode.className = className;
                //         if (node.getAttribute('href')!.startsWith('#')) {
                //             linkNode.href = node.getAttribute('href')!;
                //         } else {
                //             linkNode.href = node.getAttribute('href')!.replace(/^(.*?)(?:\.md)?(#.*?)?$/, '$1.html$2');
                //         }
                //         node.parentNode!.replaceChild(linkNode, node);
                //     }
                //         break;

                //     case InternalLinkHandling.CONVERT_TO_TEXT:
                    // default: {
                        const textNode = node.parentNode!.createEl('span');
                        textNode.innerText = node.getText();
                        textNode.className = className;
                        node.parentNode!.replaceChild(textNode, node);
                    // }
                        // break;
                // }
            });
    }

    private makeCheckboxesReadOnly(node: HTMLElement) {
        node.querySelectorAll('input[type="checkbox"]')
            .forEach(node => node.setAttribute('disabled', 'disabled'));
    }

    /** Remove the collapse indicators from HTML, not needed (and not working) in copy */
    private removeCollapseIndicators(node: HTMLElement) {
        node.querySelectorAll('.collapse-indicator')
            .forEach(node => node.remove());
    }

    /** Remove button elements (which appear after code blocks) */
    private removeButtons(node: HTMLElement) {
        node.querySelectorAll('button')
            .forEach(node => node.remove());
    }

    /** Remove counters added by Strange New Worlds plugin (https://github.com/TfTHacker/obsidian42-strange-new-worlds) */
    private removeStrangeNewWorldsLinks(node: HTMLElement) {
        node.querySelectorAll('.snw-reference')
            .forEach(node => node.remove());
    }

    /** Transform code blocks to tables */
    private transformCodeToTables(node: HTMLElement) {
        node.querySelectorAll('pre')
            .forEach(node => {
                const codeEl = node.querySelector('code');
                if (codeEl) {
                    const code = codeEl.innerHTML.replace(/\n*$/, '');
                    const table = node.parentElement!.createEl('table');
                    table.className = 'source-table';
                    table.innerHTML = `<tr><td><pre>${code}</pre></td></tr>`;
                    node.parentElement!.replaceChild(table, node);
                }
            });
    }

    /** Transform callouts to tables */
    private transformCalloutsToTables(node: HTMLElement) {
        node.querySelectorAll('.callout')
            .forEach(node => {
                const callout = node.parentElement!.createEl('table');
                callout.addClass('callout-table', 'callout');
                callout.setAttribute('data-callout', node.getAttribute('data-callout') ?? 'quote');
                const headRow = callout.createEl('tr');
                const headColumn = headRow.createEl('td');
                headColumn.addClass('callout-title');
                // const img = node.querySelector('svg');
                const title = node.querySelector('.callout-title-inner');

                // if (img) {
                // 	headColumn.appendChild(img);
                // }

                if (title) {
                    const span = headColumn.createEl('span');
                    span.innerHTML = title.innerHTML;
                }

                const originalContent = node.querySelector('.callout-content');
                if (originalContent) {
                    const row = callout.createEl('tr');
                    const column = row.createEl('td');
                    column.innerHTML = originalContent.innerHTML;
                }

                node.replaceWith(callout);
            });
    }

    /** Remove references to footnotes and the footnotes section */
    private removeAllFootnotes(node: HTMLElement) {
        node.querySelectorAll('section.footnotes')
            .forEach(section => section.parentNode!.removeChild(section));

        node.querySelectorAll('.footnote-link')
            .forEach(link => {
                link.parentNode!.parentNode!.removeChild(link.parentNode!);
            });
    }

    /** Keep footnotes and references, but remove links */
    private removeFootnoteLinks(node: HTMLElement) {
        node.querySelectorAll('.footnote-link')
            .forEach(link => {
                const text = link.getText();
                if (text === '↩︎') {
                    // remove back-link
                    link.parentNode!.removeChild(link);
                } else {
                    // remove from reference
                    const span = link.parentNode!.createEl('span', { text: link.getText(), cls: 'footnote-link' })
                    link.parentNode!.replaceChild(span, link);
                }
            });
    }

    /** Replace all images sources with a data-uri */
    private async embedImages(node: HTMLElement): Promise<HTMLElement> {
        const promises: Promise<void>[] = [];

        // Replace all image sources
        node.querySelectorAll('img')
            .forEach(img => {
                if (img.src) {
                    if (img.src.startsWith('data:image/svg+xml')) {
                        // image is an SVG, encoded as a data uri. This is the case with Excalidraw for instance.
                        // Convert it to bitmap
                        promises.push(this.replaceImageSource(img));
                        return;
                    }

                        const [scheme] = img.src.split(':', 1);
                        if (this.externalSchemes.includes(scheme.toLowerCase())) {
                            // don't touch external images
                            return;
                        } else {
                            // not an external image, continue processing below
                        }

                    if (!img.src.startsWith('data:')) {
                        // render bitmaps, except if already as data-uri
                        promises.push(this.replaceImageSource(img));
                        return;
                    }
                }
            });

        // @ts-ignore
        // this.modal.progress.max = 100;

        // @ts-ignore
        // await allWithProgress(promises, percentCompleted => this.modal.progress.value = percentCompleted);
        return node;
    }

    private async renderSvg(node: HTMLElement): Promise<Element> {
        const xmlSerializer = new XMLSerializer();

        // if (!this.options.convertSvgToBitmap) {
        //     return node;
        // }

        const promises: Promise<void>[] = [];

        const replaceSvg = async (svg: SVGSVGElement) => {
            const style: HTMLStyleElement = svg.querySelector('style') || svg.appendChild(document.createElement('style'));
            style.innerHTML += MERMAID_STYLESHEET;

            const svgAsString = xmlSerializer.serializeToString(svg);

            const svgData = `data:image/svg+xml;base64,` + Buffer.from(svgAsString).toString('base64');
            const dataUri = await this.imageToDataUri(svgData);

            const img = svg.createEl('img');
            img.style.cssText = svg.style.cssText;
            img.src = dataUri;

            svg.parentElement!.replaceChild(img, svg);
        };

        node.querySelectorAll('svg')
            .forEach(svg => {
                promises.push(replaceSvg(svg));
            });

        // @ts-ignore
        // this.modal.progress.max = 0;

        // @ts-ignore
        // await allWithProgress(promises, percentCompleted => this.modal.progress.value = percentCompleted);
        return node;
    }

    /** replace image src attribute with data uri */
    private async replaceImageSource(image: HTMLImageElement): Promise<void> {
        const imageSourcePath = decodeURI(image.src);

        if (imageSourcePath.startsWith(this.vaultLocalUriPrefix)) {
            // Transform uri to Obsidian relative path
            let path = imageSourcePath.substring(this.vaultLocalUriPrefix.length + 1)
                .replace(/[?#].*/, '');
            path = decodeURI(path);

            const mimeType = this.guessMimeType(path);
            const data = await this.readFromVault(path, mimeType);

            if (this.isSvg(mimeType) ) {
                // render svg to bitmap for compatibility w/ for instance gmail
                image.src = await this.imageToDataUri(data);
            } else {
                // file content as base64 data uri (including svg)
                image.src = data;
            }
        } else {
            // Attempt to render uri to canvas. This is not an uri that points to the vault. Not needed for public
            // urls, but we may have un uri that points to our local machine or network, that will not be accessible
            // wherever we intend to paste the document.
            image.src = await this.imageToDataUri(image.src);
        }
    }

    /**
     * Draw image url to canvas and return as data uri containing image pixel data
     */
    private async imageToDataUri(url: string): Promise<string> {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        const dataUriPromise = new Promise<string>((resolve, reject) => {
            image.onload = () => {
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;

                ctx!.drawImage(image, 0, 0);

                try {
                    const uri = canvas.toDataURL('image/png');
                    resolve(uri);
                } catch (err) {
                    // leave error at `log` level (not `error`), since we leave an url that may be workable
                    console.log(`failed ${url}`, err);
                    // if we fail, leave the original url.
                    // This way images that we may not load from external sources (tainted) may still be accessed
                    // (eg. plantuml)
                    // TODO: should we attempt to fallback with fetch ?
                    resolve(url);
                }

                canvas.remove();
            }

            image.onerror = (err) => {
                console.log('could not load data uri');
                // if we fail, leave the original url
                resolve(url);
            }
        })

        image.src = url;

        return dataUriPromise;
    }

    /**
     * Get binary data as b64 from a file in the vault
     */
    private async readFromVault(path: string, mimeType: string): Promise<string> {
        const tfile = this.app.vault.getAbstractFileByPath(path) as TFile;
        const data = await this.app.vault.readBinary(tfile);
        return `data:${mimeType};base64,` + arrayBufferToBase64(data);
    }

    /** Guess an image's mime-type based on its extension */
    private guessMimeType(filePath: string): string {
        const extension = this.getExtension(filePath) || 'png';
        return this.mimeMap.get(extension) || `image/${extension}`;
    }

    /** Get lower-case extension for a path */
    private getExtension(filePath: string): string {
        // avoid using the "path" library
        const fileName = filePath.slice(filePath.lastIndexOf('/') + 1);
        return fileName.slice(fileName.lastIndexOf('.') + 1 || fileName.length)
            .toLowerCase();
    }

    private isSvg(mimeType: string): boolean {
        return mimeType === 'image/svg+xml';
    }

}