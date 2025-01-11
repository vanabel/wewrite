/**
 * marked extension for List, remove empty cotent
 * 
 * credits to Sun BooShi, author of note-to-mp plugin
 */

import { Tokens, MarkedExtension } from "marked";
import { WeWriteMarkedExtension } from "./extension";

export class ListItem extends WeWriteMarkedExtension {
    async postprocess(html: string) {
        // console.log(`listItem postprocess:`,html);
        
        return html
    }
    renderItem(item: Tokens.ListItem) {
        console.log(`listitem:`, item);
        return item.raw;
    }
    renderList(list: Tokens.List) {
        if (list.items.length === 0) {
            return '';
        }else{
            const frame = createDiv({cls:'wewrite-list-frame'})
            const l = list.ordered? 'ol' : 'ul'
            const list_el = frame.createEl(l)
            for (let item of list.items){
                if (item.text){
                    list_el.createEl('li').setText(item.text)
                }else{
                    list_el.createEl('p').setText('')
                }
            }
            return frame.outerHTML
        }
    }

    markedExtension(): MarkedExtension {
        return {

            extensions: [
                // {
                //     name: 'listitem',
                //     level: 'block',

                //     renderer: (token: Tokens.ListItem) => {
                //         return this.renderItem(token);
                //     }
                // },

                {
                    name: 'list',
                    level: 'block',

                    renderer: (token: Tokens.List) => {
                        return this.renderList(token);
                    }
                }
            ]
        }
    }
}