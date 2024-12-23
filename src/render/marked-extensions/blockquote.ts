/**
 * marked extension for blockquote and callout
 * 
 * credits to Sun BooShi, author of note-to-mp plugin
 */

import { MarkedExtension, Tokens } from "marked";
import { WeWriteMarkedExtension } from "./extension";
import { ObsidianMarkdownRenderer } from "../markdown-render";

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
    const text = token.text.replace(/\n/gm, '<br>').trim()
    return `<blockquote dir="auto" ><p>${text}</p></blockquote>`
  }
  rendererCallout(token: Tokens.Blockquote) {
    const root = ObsidianMarkdownRenderer.getInstance(this.plugin.app).queryElement(this.calloutIndex, '.callout:not(.admonition)')
		if (!root){
			return '<span>Callout渲染失败</span>';
		}
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