/**
 * marked extension for blockquote and callout
 * 
 * credits to Sun BooShi, author of note-to-mp plugin
 */

import { MarkedExtension, Tokens } from "marked";
import { WeWriteMarkedExtension } from "./extension";
import { ObsidianMarkdownRenderer } from "../markdown-render";
// import * as htmlToImage from 'html-to-image';


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
  async rendererCallout(_token: Tokens.Blockquote) {
    const renderer = ObsidianMarkdownRenderer.getInstance(this.plugin.app);
    const root = renderer.queryElement(this.calloutIndex, '.callout:not(.admonition)');
    if (!root) {
      return '<span>Callout渲染失败</span>';
    }
    this.calloutIndex++;
    
    // Remove edit button if exists
    const editDiv = root.querySelector('.edit-block-button');
    if (editDiv) {
      root.removeChild(editDiv);
    }
    const foldDiv = root.querySelector('.callout-fold');
		if (foldDiv) {

			try {
				foldDiv.parentNode!.removeChild(foldDiv);
			} catch (e) {
				console.error(e)
			}

		}
    return root.outerHTML;

    // Convert HTML to image
    // try {
    //   const imageData = await renderer.domToImage(root);
    //   // const imageData = await renderer.htmlToImage(root);

    //   const img = document.createElement('img');
    //   img.src = imageData;
    //   img.alt = 'Callout content';
    //   img.addClass('callout-image');
    //   img.style.maxWidth = '100%';
    //   return img.outerHTML;
    // } catch (error) {
    //   console.error('Failed to convert callout to image:', error);
    //   return '<span>Callout转换失败</span>';
    // }
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
          token.html =  await this.rendererCallout(token as Tokens.Blockquote)
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
