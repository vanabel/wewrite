/*
 * Copyright (c) 2024 Sun Booshi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// import { toPng } from 'html-to-image';
import { Tokens } from "marked";
// import { MathRendererQueue } from "./math";
import { WeWriteMarkedExtension } from "./extension";
import { MathRenderer } from "./math";
// import { wxUploadImage } from "../weixin-api";
import * as htmlToImage from 'html-to-image';
import domtoimage from 'dom-to-image'
import { processStyle } from "src/assets/theme-processor";
import { ObsidianMarkdownRenderer } from "../markdown-render";

export class CardDataManager {
	private cardData: Map<string, string>;
	private static instance: CardDataManager;

	private constructor() {
		this.cardData = new Map<string, string>();
	}

	// 静态方法，用于获取实例
	public static getInstance(): CardDataManager {
		if (!CardDataManager.instance) {
			CardDataManager.instance = new CardDataManager();
		}
		return CardDataManager.instance;
	}

	public setCardData(id: string, cardData: string) {
		this.cardData.set(id, cardData);
	}

	public cleanup() {
		this.cardData.clear();
	}

	public restoreCard(html: string) {
		for (const [key, value] of this.cardData.entries()) {
			const exp = `<section[^>]*\\sdata-id="${key}"[^>]*>(.*?)<\\/section>`;
			const regex = new RegExp(exp, 'gs');
			if (!regex.test(html)) {
				console.error('未能正确替换公众号卡片');
			}
			html = html.replace(regex, value);
		}
		return html;
	}
}

const MermaidSectionClassName = 'note-mermaid';
const MermaidImgClassName = 'note-mermaid-img';

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

	static async uploadMermaidImages(root: HTMLElement, token: string) {
		// const imgs = root.querySelectorAll('.' + MermaidImgClassName);
		// for (let img of imgs) {
		// 	const src = img.getAttribute('src');
		// 	if (!src) continue;
		// 	if (src.startsWith('http')) continue;
		// 	const blob = CodeRenderer.srcToBlob(img.getAttribute('src')!);
		// 	const name = img.id + '.png';
		// 	const res = await wxUploadImage(blob, name, token);
		//     if (res.errcode != 0) {
		//         const msg = `上传图片失败: ${res.errcode} ${res.errmsg}`;
		//         new Notice(msg);
		//         console.error(msg);
		// 		continue;
		//     }
		//     const url = res.url;
		// 	img.setAttribute('src', url);
		// }
	}

	codeRenderer(code: string, infostring: string | undefined): string {
		// console.log(`code:`, code);
		// console.log(`infostring:`, infostring);

		const lang = (infostring || '').match(/^\S*/)?.[0];
		code = code.replace(/\n$/, '') + '\n';

		// console.log(`code:`, code);
		// console.log(`lang:`, lang);


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

	parseCard(htmlString: string) {
		const id = /data-id="([^"]+)"/;
		const headimgRegex = /data-headimg="([^"]+)"/;
		const nicknameRegex = /data-nickname="([^"]+)"/;
		const signatureRegex = /data-signature="([^"]+)"/;

		const idMatch = htmlString.match(id);
		const headimgMatch = htmlString.match(headimgRegex);
		const nicknameMatch = htmlString.match(nicknameRegex);
		const signatureMatch = htmlString.match(signatureRegex);

		return {
			id: idMatch ? idMatch[1] : '',
			headimg: headimgMatch ? headimgMatch[1] : '',
			nickname: nicknameMatch ? nicknameMatch[1] : '公众号名称',
			signature: signatureMatch ? signatureMatch[1] : '公众号介绍'
		};
	}

	renderCard(token: Tokens.Generic) {
		const { id, headimg, nickname, signature } = this.parseCard(token.text);
		if (id === '') {
			return '<span>公众号卡片数据错误，没有id</span>';
		}
		CardDataManager.getInstance().setCardData(id, token.text);
		return `<section data-id="${id}" class="note-mpcard-wrapper"><div class="note-mpcard-content"><img class="note-mpcard-headimg" width="54" height="54" src="${headimg}"></img><div class="note-mpcard-info"><div class="note-mpcard-nickname">${nickname}</div><div class="note-mpcard-signature">${signature}</div></div></div><div class="note-mpcard-foot">公众号</div></section>`;
	}
	renderAdmonition(token: Tokens.Generic, type: string) {
		// let root = this.plugin.resourceManager.getMarkdownRenderedElement(this.admonitionIndex, '.admonition-parent')
		let root = ObsidianMarkdownRenderer.getInstance(this.plugin.app).queryElement(this.admonitionIndex, '.callout.admonition')
		if (!root) {
			return '<span>admonition渲染失败</span>';
		}
		const containerId = `admonition-${this.admonitionIndex}`;
		this.admonitionIndex++

		// const dataUrl = await htmlToImage.toPng(root)
		// token.html = `admonition image: <img src="${dataUrl}" >`
		// return

		// const clonedRoot = root.cloneNode(true) as HTMLElement;
		// console.log(`clonedRoot:`, clonedRoot);
		
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
		// const contentDiv = clonedRoot.querySelector('.admonition-content');
		// if (contentDiv) {
		// 	contentDiv.removeAttribute('style')
		// }
		// processStyle(clonedRoot)

		// this.previewRender.addElementByID(containerId, clonedRoot)
		// return `<section id="${containerId}" class="admonition-parent admonition-${type}-parent wewrite "></section>`;
		return root.outerHTML
	}

	renderMermaid(token: Tokens.Generic) {
		// const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.mermaidIndex, '.mermaid')
		const root = ObsidianMarkdownRenderer.getInstance(this.plugin.app).queryElement(this.mermaidIndex, '.mermaid')
		if (!root) {
			return '<span>mermaid渲染失败</span>';
		}
		// const containerId = `meraid-img-${this.mermaidIndex}`;
		this.mermaidIndex++
		// return `<section id="${containerId}" class="admonition-parent admonition-${type}-parent">${root.outerHTML}</section>`;
		console.log(`meraid root:`, root);
		// this.previewRender.addElementByID(containerId, root)
		// return `<section id="${containerId}" class="wewrite mermaid" ></section>`;
		return root.outerHTML;
	}
	async renderMermaidAsync(token: Tokens.Generic) {
        // define default failed
        token.html = '<span>mermaid渲染失败</span>';

        const href = token.href;
        console.log(`renderMermaidAsync: ${href}`);
        const index = this.mermaidIndex;
		const containerId = `mermaid-${this.mermaidIndex}`;
        this.mermaidIndex++;

        // const root = this.plugin.resourceManager.getMarkdownRenderedElement(index, '.mermaid')
        const root = ObsidianMarkdownRenderer.getInstance(this.plugin.app).queryElement(index, '.mermaid')
        if (!root) {
            return
        }
		console.log(`mermaid root:`, root, root.outerHTML);
		
		const svg = root.querySelector('svg')
		svg?.setAttr('width', '100%')
		svg?.setAttr('height', '100%')

        const blob = await domtoimage.toBlob(root)
		// console.log(`blob:`, blob);
		const dataUrl = URL.createObjectURL(blob)
		// console.log(`dataUrl:`, dataUrl)

        const dataUrl2 = await htmlToImage.toPng(root)
		console.log(`dataUrl2:`, dataUrl2);
		
        // const dataUrl3 = await domtoimage.toPng(root.parentElement!)
		// console.log(`dataUrl3:`, dataUrl);
		const style = root.querySelector('style')
		console.log(`style=>`, style);
		if (style) {
			style.parentNode!.removeChild(style)
		}

		
		// this.previewRender.addElementByID(containerId, root)
        // token.html =  `<span id="${containerId}" class="wewrite wewrite-mermaid" >`
		token.html = `<div id="wewrite-mermaid-${index}"> <img src="${dataUrl}" class="wewrite wewrite-mermaid"> </div>` +
		 `<div id="wewrite-mermaid-2-{index}"> <img src="${dataUrl2}" class="wewrite wewrite-mermaid"> </div>`
		
	}

	renderCharts(token: Tokens.Generic) {
		const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.chartsIndex, '.block-language-chart')
		const root2 = ObsidianMarkdownRenderer.getInstance(this.plugin.app).queryElement(this.chartsIndex, '.block-language-chart')
		console.log(`renderCharts this.chartIndex:`, this.chartsIndex);

		if (!root || !root2) {
			return '<span>charts渲染失败</span>';
		}
		const containerId = `charts-img-${this.chartsIndex}`;
		this.chartsIndex++;
		const canvas = root.querySelector('canvas')
		const canvas2 = root2.querySelector('canvas')
		if (canvas && canvas2) {
			// this.chartsIndex++
			// // return `<section id="${containerId}" class="admonition-parent admonition-${type}-parent">${root.outerHTML}</section>`;
			console.log(`chart root:`, root);
			console.log(`chart canvas: {${canvas.width}, ${canvas.height}}` );
			console.log(`chart canvas2: {${canvas2.width}, ${canvas2.height}}` );
			// const svg =  this.canvasToSVG(containerId ,canvas)
			const MIME_TYPE = "image/png";

			const imgURL = canvas.toDataURL(MIME_TYPE);
			const imgURL2 = canvas2.toDataURL(MIME_TYPE);

			return `<section id="${containerId}" class="wewrite charts" >
			<img src="${imgURL}" >
			</section>`;
		}
		return '<span>charts渲染失败</span>';
	}
	// async canvasToSVG(containerId:string, canvas: HTMLCanvasElement) {
	// 	const svg = new Canvg(canvas.getContext('2d')!, canvas.ownerDocument)
	// 	// 将 canvas 转换为 SVG
	// 	// const v = await Canvg.fromString(null, canvas.toDataURL());

	// 	// 创建一个 SVG 元素
	// 	const container = document.createElement('div');

	// 	// const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	// 	// svgElement.setAttribute('width', canvas.width.toString());
	// 	// svgElement.setAttribute('height', canvas.height.toString());

	// 	// // 渲染 SVG
	// 	// v.start(svgElement);

	// 	container.appendChild(svg.);
	// 	this.previewRender.addElementByID(containerId, container)
	// 	// 获取 SVG 字符串
	// 	const serializer = new XMLSerializer();
	// 	const svgString = serializer.serializeToString(svgElement);
	// 	return svgString;
	// }
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
						return this.renderCard(token);
					}
					if (token.lang && token.lang.trim().toLocaleLowerCase().startsWith('ad-')) {
						// return token.html
						//admonition
						let type = token.lang.trim().toLocaleLowerCase().replace('ad-', '');
						if (type === '') type = 'note';

						return this.renderAdmonition(token, type);
					}
					return this.codeRenderer(token.text, token.lang);
					// return token.text
				},
			}
			],
			async: true,
			walkTokens: async (token: Tokens.Generic) => {
				if (token.lang && token.lang.trim().toLocaleLowerCase() == 'mermaid') {
					await this.renderMermaidAsync(token);
				}
				// if (token.lang && token.lang.trim().toLocaleLowerCase().startsWith('ad-')) {
				// 	let type = token.lang.trim().toLocaleLowerCase().replace('ad-', '');
				// 	if (type === '') type = 'note';

				// 	await this.renderAdmonition(token, type);
				// }
			}
		}
	}
	iconsRenderer(text: string, lang: string | undefined) {
		throw new Error("Method not implemented.");
	}
}

