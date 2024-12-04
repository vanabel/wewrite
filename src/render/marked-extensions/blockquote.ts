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

import { MarkedExtension, Tokens } from "marked";
import { WeWriteMarkedExtension } from "./extension";

export class BlockquoteRenderer extends WeWriteMarkedExtension {
  private calloutIndex:number = 0;
    async prepare() { 
    if (!this.marked) {
      console.error("marked is not ready");
      return;
    }
    this.calloutIndex = 0;
    return;
  }

  rendererBlockquote(token: Tokens.Blockquote) {
    // console.log(`text:${token.text}`);
    const text = token.text.replace(/\n/gm, '<br>').trim()
    return `<blockquote dir="auto" ><p>${text}</p></blockquote>`
  }
  rendererCallout(token: Tokens.Blockquote) {
    const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.calloutIndex, '.markdown-reading-view  .callout:not(.admonition)')
    console.log(`renderCallout root:`, root);
		if (!root){
			return '<span>Callout渲染失败</span>';
		}
		// const containerId = `calloutIndex-${this.calloutIndex}`;
		this.calloutIndex++
    const editDiv = root.querySelector('.edit-block-button');
		if (editDiv){
			root.removeChild(editDiv);
		}
		return `${root.outerHTML}`;
  }

  markedExtension(): MarkedExtension {
    return {
      async: true,
      walkTokens: async (token: Tokens.Generic) => {
        if (token.type !== 'blockquote') {
          return;
        }
        const regex = /\[\!(.*?)\]/g;
        const matched = token.text.match(regex);
        if (matched){
          console.log(`callout matched:${matched}`);
          
          token.html =  this.rendererCallout(token as Tokens.Blockquote)
        }else{

          token.html =  this.rendererBlockquote(token as Tokens.Blockquote);
        }
      },
      extensions: [{
        name: 'blockquote',
        level: 'block',
        renderer: (token: Tokens.Generic) => {
          return token.html;
        },
      }]
    }
  }
}