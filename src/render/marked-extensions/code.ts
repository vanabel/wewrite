/*
* marked extension for code
 - source code 
 - charts
 - mermaid
 - admonition

 credits to Sun BooShi, author of note-to-mp plugin
 */

 

import { Tokens } from "marked";
import { ObsidianMarkdownRenderer } from "../markdown-render";
import { WeWriteMarkedExtension } from "./extension";
import { MathRenderer } from "./math";
import { replaceDivWithSection } from "src/utils/utils";
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

		let codeSection = '<section class="code-container"><section class="code-section-banner"></section><section class="code-section">';
		
		const codeLineNumber = this.previewRender.articleProperties.get('show-code-line-number')
		console.log(`codeLineNumber:${codeLineNumber}`);
		
		if (codeLineNumber === 'true' || codeLineNumber === 'yes' || codeLineNumber === '1') {
			const lines = code.split('\n');

			let liItems = '';
			let count = 1;
			while (count < lines.length) {
				liItems = liItems + `<li>${count}</li>`;
				count = count + 1;
			}
			codeSection += `<ul>${liItems}</ul>`;
		}
		

		if (!lang) {
			codeSection += `<pre><code>${code}</code></pre>`;
		}else{

			codeSection +=`<pre><code class="hljs language-${lang}" >${code}</code></pre>`
		}

		return codeSection + '</section></section>';
		
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
			return '<section>admonition渲染失败</section>';
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
			return '<section>admonition渲染失败</section>';
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
		return replaceDivWithSection(root)//root.outerHTML
	}

	async renderMermaidAsync(token: Tokens.Generic) {
        // define default failed
        token.html = '<section>mermaid渲染失败</section>';

        // const href = token.href;
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
		token.html = `<section id="wewrite-mermaid-${index}" class="mermaid"> <img src="${dataUrl}" class="mermaid-image"> </section>` 
	}

	renderCharts(_token: Tokens.Generic) {
		//the MarkdownRender doen't work well with it. use the preview instead.
		const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.chartsIndex, '.block-language-chart')

		if (!root ) {
			return '<section>charts渲染失败</section>';
		}
		const containerId = `charts-img-${this.chartsIndex}`;
		this.chartsIndex++;
		const canvas = root.querySelector('canvas')
		if (canvas) {
			const MIME_TYPE = "image/png";
			const imgURL = canvas.toDataURL(MIME_TYPE);
			return `<section id="${containerId}" class="charts" >
			<img src="${imgURL}" class="charts-image" />
			</section>`;
		}
		return '<section>charts渲染失败</section>';
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

						// return this.renderAdmonition(token, type);admno
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

