/**
 * marked extension for summary folder headings
 * 
 * 
 * 
 */

import { MarkedExtension, Tokens } from "marked";
import { WeWriteMarkedExtension } from "./extension";
import { sanitizeHTMLToDom } from "obsidian";

export class Summary extends WeWriteMarkedExtension {


    processHeading(dom: HTMLDivElement, heading: string) {
        const hEls = dom.querySelectorAll(heading.trim())
        for (let i = 0; i < hEls.length; i++) {
            const currentHeading = hEls[i]
            const nextHeading = hEls[i+1]
            if (currentHeading) {
                console.log(`currentHeading:`, currentHeading);
                
                const d = createEl('details')
                d.createEl('summary', { text: currentHeading.textContent as string })
                // d.appendChild(currentHeading.cloneNode(true))

                let current = currentHeading.nextSibling
                
                while (current && current !== nextHeading) {
                    const nextSibling = current.nextSibling
                    d.appendChild(current)
                    current = nextSibling
                    console.log(`current=>`, current);
                }
                currentHeading.replaceWith(d)
            }

        }
        return dom
    }
    async postprocess(html: string) {
        const headingFolder = this.previewRender.articleProperties.get('folded-headings')
        console.log(`folded-headings:`, headingFolder);

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