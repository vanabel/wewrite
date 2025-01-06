/*
* marked extension for code
 - source code 
 - charts
 - mermaid
 - admonition

 credits to Sun BooShi, author of note-to-mp plugin
 */

 

import domtoimage from 'dom-to-image';
import { Tokens } from "marked";
import { ObsidianMarkdownRenderer } from "../markdown-render";
import { WeWriteMarkedExtension } from "./extension";
import { MathRenderer } from "./math";
import * as htmlToImage from 'html-to-image';

export class CodeRenderer extends WeWriteMarkedExtension {
	showLineNumber: boolean;
	mermaidIndex: number = 0;
	admonitionIndex: number = 0;
	chartsIndex: number = 0;

	async prepare() {
		this.mermaidIndex = 0;
		this.admonitionIndex = 0;
		this.chartsIndex = 0;
	}

	static srcToBlob(src: string) {
		const base64 = src.split(',')[1];
		const byteCharacters = atob(base64);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		return new Blob([byteArray], { type: 'image/png' });
	}

	codeRenderer(code: string, infostring: string | undefined): string {
		const lang = (infostring || '').match(/^\S*/)?.[0];
		code = code.replace(/\n$/, '') + '\n';

		let codeSection = '';
		if (this.plugin.settings.codeLineNumber) {
			const lines = code.split('\n');

			let liItems = '';
			let count = 1;
			while (count < lines.length) {
				liItems = liItems + `<li>${count}</li>`;
				count = count + 1;
			}
			codeSection = '<section class="code-section"><ul>'
				+ liItems
				+ '</ul>';
		}
		else {
			codeSection = '<section class="code-section">';
		}

		if (!lang) {
			return codeSection + '<pre><code>'
				+ code
				+ '</code></pre></section>\n';
		}

		return codeSection + '<pre><code class="hljs language-'
			+ lang
			+ '">'
			+ code
			+ '</code></pre></section>\n';
	}

	static getMathType(lang: string | null) {
		if (!lang) return null;
		let l = lang.toLowerCase();
		l = l.trim();
		if (l === 'am' || l === 'asciimath') return 'asciimath';
		if (l === 'latex' || l === 'tex') return 'latex';
		return null;
	}

	renderAdmonition(_token: Tokens.Generic, _type: string) {
		let root = ObsidianMarkdownRenderer.getInstance(this.plugin.app).queryElement(this.admonitionIndex, '.callout.admonition')
		if (!root) {
			return '<span>admonition渲染失败</span>';
		}
		this.admonitionIndex++
		
		const editDiv = root.querySelector('.edit-block-button');
		if (editDiv) {
			editDiv.parentNode!.removeChild(editDiv);
		}
		const foldDiv = root.querySelector('.callout-fold');
		if (foldDiv) {

			try {
				foldDiv.parentNode!.removeChild(foldDiv);
			} catch (e) {
				console.error(e)
			}

		}
		return root.outerHTML
	}
	async renderAdmonitionAsync(_token: Tokens.Generic, _type: string) {
		const renderer = ObsidianMarkdownRenderer.getInstance(this.plugin.app);
		let root = renderer.queryElement(this.admonitionIndex, '.callout.admonition')
		if (!root) {
			return '<span>admonition渲染失败</span>';
		}
		this.admonitionIndex++
		
		const editDiv = root.querySelector('.edit-block-button');
		if (editDiv) {
			editDiv.parentNode!.removeChild(editDiv);
		}
		const foldDiv = root.querySelector('.callout-fold');
		if (foldDiv) {

			try {
				foldDiv.parentNode!.removeChild(foldDiv);
			} catch (e) {
				console.error(e)
			}

		}
		// Convert HTML to image
		// try {
		// 	const imageData = await renderer.domToImage(root);
		// 	const img = document.createElement('img');
		// 	img.src = imageData;
		// 	img.alt = 'admonition content';
		// 	img.addClass('admonition-image');
		// 	img.style.maxWidth = '100%';
		// 	return img.outerHTML;
		//   } catch (error) {
		// 	console.error('Failed to convert callout to image:', error);
		// 	return '<span>Callout转换失败</span>';
		//   }
		return root.outerHTML
	}

	async renderMermaidAsync(token: Tokens.Generic) {
        // define default failed
        token.html = '<span>mermaid渲染失败</span>';

        const href = token.href;
        const index = this.mermaidIndex;
        this.mermaidIndex++;

		const renderer = ObsidianMarkdownRenderer.getInstance(this.plugin.app);
        const root = renderer.queryElement(index, '.mermaid')
        if (!root) {
            return
        }
		
		const svg = root.querySelector('svg')
		svg?.setAttr('width', '100%')
		svg?.setAttr('height', '100%')

		const dataUrl = await renderer.domToImage(root)
		const style = root.querySelector('style')
		if (style) {
			style.parentNode!.removeChild(style)
		}
		token.html = `<div id="wewrite-mermaid-${index}"> <img src="${dataUrl}" class="wewrite wewrite-mermaid"> </div>` 
	}

	renderCharts(_token: Tokens.Generic) {
		//the MarkdownRender doen't work well with it. use the preview instead.
		const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.chartsIndex, '.block-language-chart')

		if (!root ) {
			return '<span>charts渲染失败</span>';
		}
		const containerId = `charts-img-${this.chartsIndex}`;
		this.chartsIndex++;
		const canvas = root.querySelector('canvas')
		if (canvas) {
			const MIME_TYPE = "image/png";
			const imgURL = canvas.toDataURL(MIME_TYPE);
			return `<section id="${containerId}" class="wewrite charts" >
			<img src="${imgURL}" >
			</section>`;
		}
		return '<span>charts渲染失败</span>';
	}
	markedExtension() {
		return {
			extensions: [{
				name: 'code',
				level: 'block',
				renderer: (token: Tokens.Generic) => {
					const type = CodeRenderer.getMathType(token.lang ?? '');
					if (type) {
						return new MathRenderer(this.plugin, this.previewRender, this.marked).renderer(token, false, type); //MathRendererQueue.getInstance().render(token, false, type, this.callback);
					}
					if (token.lang && token.lang.trim().toLocaleLowerCase() == 'mermaid') {
						// return this.renderMermaid(token);
						return token.html
					}
					if (token.lang && token.lang.trim().toLocaleLowerCase() == 'chart') {
						return this.renderCharts(token);
					}
					if (token.lang && token.lang.trim().toLocaleLowerCase() == 'mpcard') {
						// return this.renderCard(token);
					}
					if (token.lang && token.lang.trim().toLocaleLowerCase().startsWith('ad-')) {
						return token.html
						//admonition
						// let type = token.lang.trim().toLocaleLowerCase().replace('ad-', '');
						// if (type === '') type = 'note';

						// return this.renderAdmonition(token, type);
					}
					return this.codeRenderer(token.text, token.lang);
				},
			}
			],
			async: true,
			walkTokens: async (token: Tokens.Generic) => {
				if (token.lang && token.lang.trim().toLocaleLowerCase() == 'mermaid') {
					await this.renderMermaidAsync(token);
				}
				if (token.lang && token.lang.trim().toLocaleLowerCase().startsWith('ad-')) {
					//admonition
					let type = token.lang.trim().toLocaleLowerCase().replace('ad-', '');
					if (type === '') type = 'note';

					token.html = await this.renderAdmonitionAsync(token, type);
				}
			}
		}
	}
}

