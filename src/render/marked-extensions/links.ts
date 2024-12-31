/**
 * marked extension for footnote
 * 
 * 
 * 
 */

import { MarkedExtension, Tokens } from "marked";
import { WeWriteMarkedExtension } from "./extension";

export class Links extends WeWriteMarkedExtension {

    allLinks: string[] = [];
    async prepare() {
        this.allLinks = [];
    }

    async postprocess(html: string) {
        // console.log(`links postprocess:`, this.allLinks);
        if (!this.allLinks.length) {
            return html;
        }
        const links = this.allLinks.map((href, i) => {
            return `<li>${href}&nbsp;↩</li>`;
        });
        return `${html}<seciton class="foot-links"><hr><ol>${links.join('')}</ol></section>`;
    }

    markedExtension(): MarkedExtension {
        return {
            extensions: [{
                name: 'link',
                level: 'inline',
                renderer: (token: Tokens.Link) => {
                    if (token.text.indexOf(token.href) === 0
                        || (token.href.indexOf('https://mp.weixin.qq.com/mp') === 0)
                        || (token.href.indexOf('https://mp.weixin.qq.com/s') === 0) 
                        ) {
                        return `<a href="${token.href}">${token.text}</a>`;
                    }
                    this.allLinks.push(token.href);
                    return `<a>${token.text}<sup>[${this.allLinks.length}]</sup></a>`;
                    // else {
                    //     return `<a>${token.text}[${token.href}]</a>`;
                    // }
                }
            }]
        }
    }
}