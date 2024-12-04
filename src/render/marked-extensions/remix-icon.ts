

import { MarkedExtension, Tokens } from "marked";
import { WeWriteMarkedExtension } from "./extension";
import { MathRenderer } from "./math";

const remixIconRegex = /`(ris|fas):([a-z0-9-]+)`/i;
const remixIconRegexTokenizer = /^`(ris|fas):([a-z0-9-]+)`/i;
export class RemixIconRenderer extends WeWriteMarkedExtension {
	remixIndex: number = 0;

	async prepare() {
		this.remixIndex = 0;
	}


	render(code: string, lang: string | undefined): string {
		// console.log(`remixIconRenderer, code=>`, code);
		// console.log(`remixIconRenderer, lang=>`, lang);

		// const iconPattern = /^(ris|fas):([a-z0-9-]+)$/i;
		// const match = code.match(iconPattern);
		// console.log(`remixIconRenderer, match=>`, match);

		// if (lang) {
		const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.remixIndex, '.obsidian-icon.react-icon')
		if (!root) {
			return '<span>remix icon not found </span>';
		}
		const containerId = `remix-icon-${this.remixIndex}`;
		this.remixIndex++

		this.previewRender.addElementByID(containerId, root)
		return `<span id="${containerId}" class=" wewrite "></span>`;
		// }
		// return code 

	}



	markedExtension():MarkedExtension {
		return {
			// async: true,
			// walkTokens: async (token: Tokens.Generic) => {
			// 	if (token.type !== 'remixIcon') {
			// 		return;
			// 	}
			// 	token.html = this.render(token.text, token.lang);
			// },
			extensions: [{
				name: 'remixIcon',
				level: 'inline',
				start: (str: string) => {
					const match = str.match(remixIconRegex);
					// console.log(`remixIcon start, str=>`, str, match);
					if (match){
						return match.index
					}
				},
				tokenizer: (src: string) => {
					const match = src.match(remixIconRegexTokenizer);
					// console.log(`remixIcon tokenizer, src=>`, src, match);
					if (match) {
						return {
							type: 'remixIcon',
							raw: match[0],
							text: match[0].trim(),
							lang: match[1],
						};
					}
				},
				renderer: (token: Tokens.Generic) => {
					// console.log(`remixIconRenderer, token=>`, token);
					
					return this.render(token.text, token.lang);
				},
			}]
		}
	}
}

