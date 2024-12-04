import { renderer } from './heading';
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

import { Tokens, MarkedExtension } from "marked";
import { WeWriteMarkedExtension } from "./extension";

const iconsRegex = /:(.*?):/;
const iconsRegexTokenizer = /^:(.*?):/;

export class IconizeRender extends WeWriteMarkedExtension {
    iconizeIndex: number = 0;

    async prepare() {
        this.iconizeIndex = 0;
    }

    render(text: string) {

        console.log(`iconize render, text=>`, text);
        
        // const items = text.split('|');

        const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.iconizeIndex, '.cm-iconize-icon')
        if (!root) {
            return '<span>iconize渲染失败</span>';
        }
        const containerId = `iconize-${this.iconizeIndex}`;
        this.iconizeIndex++

        this.previewRender.addElementByID(containerId, root)
        return `<span id="${containerId}" class=" wewrite "></span>`;
    }

    markedExtension(): MarkedExtension {
        return {
            // async: true,
            // walkTokens: async (token: Tokens.Generic) => {
            //     if (token.type === 'iconize') {
            //         token.html = await this.render(token.text);
            //     }
            //     return;
            // },
            extensions: [{
                name: 'iconize',
                level: 'inline',
                start:(src: string) => {
                    const match = src.match(iconsRegex);
                    if (match){
                        // console.log(`iconize start =>`, src, match.index);
                        
                        return match.index;
                    } 
                    // console.log(`iconzier start: no match =>`, src);
                    

                },
                tokenizer: (src: string) => {
                    const match = src.match(iconsRegexTokenizer);
                    // console.log(`iconize tokenizer =>`, match);
                    
                    if (match) {
                        return {
                            type: 'iconize',
                            raw: match[0],
                            text: match[1],
                        };
                    } 
                },
                renderer:(token: Tokens.Generic) =>{
                    return this.render(token.text);
                }
            }]
        }
    }
}