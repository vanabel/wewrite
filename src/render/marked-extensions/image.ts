/**
 * marked extension for handling images
 * 
 * post processing;
 * 
 * 
 */

import { MarkedExtension } from "marked";
import { sanitizeHTMLToDom } from "obsidian";
import { WeWriteMarkedExtension } from "./extension";


export class Image extends WeWriteMarkedExtension {
	processImage(dom: HTMLDivElement) {

		const imgEls = dom.querySelectorAll('img')
		for (let i = 0; i < imgEls.length; i++) {
			const currentImg = imgEls[i]
			const title = currentImg.getAttribute('title')
			const alt = currentImg.getAttribute('alt')
			const caption = title || alt || ''
			const captionEl = createEl('div', { cls: 'image-with-caption' })
			captionEl.setAttribute('data-caption', caption)
			currentImg.parentNode?.insertBefore(captionEl, currentImg)
			captionEl.appendChild(currentImg)
		}
		return dom
	}
	async postprocess(html: string) {

		const dom = sanitizeHTMLToDom(html)
		const tempDiv = createEl('div');
		tempDiv.appendChild(dom);
		this.processImage(tempDiv)
		return tempDiv.innerHTML;
	}

	markedExtension(): MarkedExtension {
		return {
			extensions: []
		}
	}
}
