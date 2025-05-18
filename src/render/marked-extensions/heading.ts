/**
 * marked extension for heading
 * 
 * credits to Sun BooShi, author of note-to-mp plugin
 */

import { Tokens, MarkedExtension } from "marked";
import { WeWriteMarkedExtension } from "./extension";

export class Heading extends WeWriteMarkedExtension {
	async render(text: string, depth: number) {
		return `
            <h${depth}>
			<span class="wewrite-heading-prefix">
			${depth}
			  </span>
			<span class="wewrite-heading-outbox">
			<span class="wewrite-heading-leaf">
              ${text}
			  </span>
			  </span>
			  <span class="wewrite-heading-tail">
			  </span>
            </h${depth}>`;

	}

	markedExtension(): MarkedExtension {
		return {
			async: true,
			walkTokens: async (token: Tokens.Generic) => {
				if (token.type !== 'heading') {
					return;
				}
				token.html = await this.render(token.text, token.depth);
			},
			extensions: [{
				name: 'heading',
				level: 'inline',

				renderer(token: Tokens.Generic) {
					return token.html;
				}
			}]
		}
	}
}
