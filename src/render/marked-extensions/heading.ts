/**
 * marked extension for heading
 * 
 * credits to Sun BooShi, author of note-to-mp plugin
 */

import { Tokens, MarkedExtension } from "marked";
import {  WeWriteMarkedExtension } from "./extension";

export class Heading extends WeWriteMarkedExtension {
    async render(text: string, depth: number) {
        return `
            <h${depth}>
              ${text}
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