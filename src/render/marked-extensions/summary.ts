/**
 * marked extension for summary folder headings
 * 
 * 
 * 
 */

import { MarkedExtension } from "marked";
import { sanitizeHTMLToDom } from "obsidian";
import { WeWriteMarkedExtension } from "./extension";

export class Summary extends WeWriteMarkedExtension {


    processHeading(dom: HTMLDivElement, heading: string) {
        const hEls = dom.querySelectorAll(heading.trim())
        for (let i = 0; i < hEls.length; i++) {
            const currentHeading = hEls[i]
            const nextHeading = hEls[i+1]
            if (currentHeading) {
                const d = createEl('details')
                d.createEl('summary', { text: currentHeading.textContent as string })
                let current = currentHeading.nextSibling
                
                while (current && current !== nextHeading) {
                    const nextSibling = current.nextSibling
                    d.appendChild(current)
                    current = nextSibling
                }
                currentHeading.replaceWith(d)
            }

        }
        return dom
    }
    async postprocess(html: string) {
        const headingFolder = this.previewRender.articleProperties.get('folded-headings')

        if (headingFolder === undefined || !headingFolder) {
            return html
        }
        const dom = sanitizeHTMLToDom(html)
        const tempDiv = createEl('div');
        tempDiv.appendChild(dom);
        const headings = headingFolder.split(',')
        for (const heading of headings) {
            this.processHeading(tempDiv, heading)
        }
        
        return tempDiv.innerHTML;
    }

    markedExtension(): MarkedExtension {
        return {
            extensions: []
        }
    }
}
