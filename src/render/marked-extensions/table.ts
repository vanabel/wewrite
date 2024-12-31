/**
 * marked extension for table
 * add container for table
 * 
 * 
 */

import { Tokens, MarkedExtension } from "marked";
import { WeWriteMarkedExtension } from "./extension";
import { ObsidianMarkdownRenderer } from "../markdown-render";


export class Table extends WeWriteMarkedExtension {

    tableIndex = 0;
    async prepare(){
        this.tableIndex = 0;
    }
    markedExtension(): MarkedExtension {
        return {
            extensions: [
                {
                    name: 'table',
                    level: 'block', // Is this a block-level or inline-level tokenizer?
                    renderer : (token:Tokens.Table)=> {
                        let html = '<div class="table-container">table 渲染失败</div>'
                        const root =  ObsidianMarkdownRenderer.getInstance(this.plugin.app).queryElement(this.tableIndex, 'table')
                        if (root){
                            html = `<div class="table-container">${root.outerHTML}</div>`
                            this.tableIndex++
                        }
                        return html
                    }
                }
            ]
        }
    }
}