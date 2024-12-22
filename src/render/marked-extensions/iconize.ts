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
import { ThemeSelector } from 'src/views/theme-selector';
import { Plugin, getIcon } from 'obsidian';

const iconsRegex = /:(.*?):/;
const iconsRegexTokenizer = /^:(.*?):/;
const extract = (svgString: string): string => {
    // Removes unnecessary spaces and newlines.
    svgString = svgString.replace(/(\r\n|\n|\r)/gm, '');
    svgString = svgString.replace(/>\s+</gm, '><');
  
    // Create a parser for better parsing of HTML.
    const parser = new DOMParser();
    const svg = parser
      .parseFromString(svgString, 'text/html')
      .querySelector('svg');
    if (!svg){
        return ''
    }
    // Removes `width` and `height` from the `style` attribute.
    if (svg.hasAttribute('style')) {
      svg.style.width = '';
      svg.style.height = '';
    }
  
    // Add `viewbox`, if it is not already a attribute.
    if (svg.viewBox.baseVal.width === 0 && svg.viewBox.baseVal.height === 0) {
      const width = svg.width.baseVal.value ?? 16;
      const height = svg.height.baseVal.value ?? 16;
      svg.viewBox.baseVal.width = width;
      svg.viewBox.baseVal.height = height;
    }
  
    if (!svg.hasAttribute('fill')) {
      svg.setAttribute('fill', 'currentColor');
    }
  
    const possibleTitle = svg.querySelector('title');
    if (possibleTitle) {
      possibleTitle.remove();
    }
  
    svg.setAttribute('width', '16px');
    svg.setAttribute('height', '16px');
  
    return svg.outerHTML;
  };
export class IconizeRender extends WeWriteMarkedExtension {
    iconizeIndex: number = 0;
    icon: Plugin;

    async prepare() {
        this.iconizeIndex = 0;
        this.icon = this.plugin.app.plugins.plugins["obsidian-icon-folder"] as Plugin
    }

    getIconByname(iconName: string) {

        //@ts-ignore
        return this.icon.api.getIconByName(iconName)
    }
    render(iconName: string) {

        console.log(`iconize render, text=>`, iconName);
        const iconObject = this.getIconByname(iconName)
        console.log(`icon${iconName}=>`, iconObject);
        

        // const items = text.split('|');

        // const root = this.plugin.resourceManager.getMarkdownRenderedElement(this.iconizeIndex, '.cm-iconize-icon')
        // if (!root) {
        //     return '<span>iconize渲染失败</span>';
        // }
        // const containerId = `iconize-${this.iconizeIndex}`;
        // this.iconizeIndex++

        // this.previewRender.addElementByID(containerId, root)
        // return `<span id="${containerId}" class=" wewrite "></span>`;


        // const iconObject = icon.getIconByName(iconName);
        if (iconObject) {
            // const toReplace = text.splitText(code.index);
            const rootSpan = createSpan({
                cls: 'cm-iconize-icon',
                attr: {
                    'aria-label': iconName,
                    'data-icon': iconName,
                    'aria-hidden': 'true',
                },
            });
            rootSpan.style.display = 'inline-flex';
            rootSpan.style.transform = 'translateY(13%)';
            rootSpan.innerHTML = iconObject.svgElement; //extract(iconObject.svgElement);
            return rootSpan.outerHTML;
        
            // const parentElement = toReplace.parentElement;
            // const tagName = parentElement?.tagName?.toLowerCase() ?? '';
            // let fontSize = calculateFontTextSize();

            // if (isHeader(tagName)) {
            //     fontSize = calculateHeaderSize(tagName as HTMLHeader);
            //     const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
            //     rootSpan.innerHTML = svgElement;
            // } else {
            //     const svgElement = svg.setFontSize(iconObject.svgElement, fontSize);
            //     rootSpan.innerHTML = svgElement;
            // }

            // parentElement?.insertBefore(rootSpan, toReplace);
            // toReplace.textContent = toReplace.wholeText.substring(code.text.length);

            // Set the font size to its parent font size if defined.
            // We do this after that to not freeze the insertion while iterating over the tree.
            // We are also updating the size after the animation because the styling won't be set
            // in the first place.
            // requestAnimationFrame(() => {
            //     const parentFontSize = parseFloat(
            //         getComputedStyle(parentElement).fontSize,
            //     );
            //     if (!isNaN(parentFontSize)) {
            //         rootSpan.innerHTML = svg.setFontSize(
            //             rootSpan.innerHTML,
            //             parentFontSize,
            //         );
            //     }
            // });
        }
        return `<span>${iconName}渲染失败</span>`
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
                start: (src: string) => {
                    const match = src.match(iconsRegex);
                    if (match) {
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
                renderer: (token: Tokens.Generic) => {
                    return this.render(token.text);
                }
            }]
        }
    }
}

