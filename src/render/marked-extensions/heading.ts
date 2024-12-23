/**
 * marked extension for heading
 * 
 * credits to Sun BooShi, author of note-to-mp plugin
 */

import { Tokens, MarkedExtension } from "marked";
import {  WeWriteMarkedExtension } from "./extension";

export class Heading extends WeWriteMarkedExtension {
    isNumeric(str: string): boolean {
        return !isNaN(Number(str)) && str.trim() !== '';
    }
      
    getSize(size: string) {
        const items = size.split('x');
        let width, height;
        if (items.length == 2) {
            width = items[0];
            height = items[1];
        }
        else {
            width = items[0];
            height = items[0];
        }
        width = this.isNumeric(width) ? width+'px' : width;
        height = this.isNumeric(height) ? height+'px' : height;
        return {width, height};
    }

    renderStyle(items: string[]) {
        let size = '';
        let color = '';
        if (items.length == 3) {
            size = items[1];
            color = items[2];
        }
        else if (items.length == 2) {
            if (items[1].startsWith('#')) {
                color = items[1];
            }
            else {
                size = items[1];
            }
        }
        let style = '';
        if (size.length > 0) {
            const {width, height} = this.getSize(size);
            style += `width:${width};height:${height};`;
        }
        if (color.length > 0) {
            style += `color:${color};`;
        }
        return style.length > 0 ? `style="${style}"` : '';
    }

    async render(text: string, depth: number) {
        const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

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