/** 
 * This is the customized render for WeChat 
 * 
 * it is based on marked and its extension mechanism
 * 
 * this file the framework and entry point for the renderer
 * 
 * each functionality will be implemented in different extensions of marked.
 * 
 */

import matter from 'gray-matter'
import { Marked, Tokens } from 'marked'
import { Component } from 'obsidian'
import WeWritePlugin from 'src/main'
import { WechatClient } from '../wechat-api/wechat-client'
import { ObsidianMarkdownRenderer } from './markdown-render'
import { BlockquoteRenderer } from './marked-extensions/blockquote'
import { CodeRenderer } from './marked-extensions/code'
import { CodeHighlight } from './marked-extensions/code-highlight'
import { Embed } from './marked-extensions/embed'
import { PreviewRender, WeWriteMarkedExtension } from './marked-extensions/extension'
import { Heading } from './marked-extensions/heading'
import { IconizeRender } from './marked-extensions/iconize'
import { MathRenderer } from './marked-extensions/math'
import { RemixIconRenderer } from './marked-extensions/remix-icon'
import { Table } from './marked-extensions/table'
import { Footnote } from './marked-extensions/footnote'
import { Links } from './marked-extensions/links'
import { ListItem } from './marked-extensions/list-item'


const markedOptiones = {
    gfm: true,
    breaks: true,
};

// const customRenderer = {
// 	heading(token:Tokens.Heading): string {
// 		return `<h${token.depth}><span class="h-content">${token.text}++</span></h${token.depth}>`;
// 	},
// 	hr(): string {
// 		return '<hr>';
// 	},
// };

export class WechatRender {
    plugin: WeWritePlugin;
    client: WechatClient;
    extensions: WeWriteMarkedExtension[] = []
    private static instance: WechatRender;
    marked: Marked
    previewRender: PreviewRender
    private constructor(plugin: WeWritePlugin, previewRender: PreviewRender) {
        this.plugin = plugin;
        this.previewRender = previewRender
        this.client = WechatClient.getInstance(plugin);
        this.marked = new Marked()
        this.marked.use(markedOptiones)
        // this.marked.use(extendedTables())
        this.useExtensions()
    
        // this.marked.use({renderer: customRenderer});
    }
    static getInstance(plugin: WeWritePlugin, previewRender: PreviewRender) {
        if (!WechatRender.instance) {
            WechatRender.instance = new WechatRender(plugin, previewRender);
        }
        return this.instance;
    }
    addExtension(extension: WeWriteMarkedExtension) {
        this.extensions.push(extension);
        this.marked.use(extension.markedExtension())
    }
    useExtensions() {
        this.addExtension(new Footnote(this.plugin, this.previewRender, this.marked))
        this.addExtension(new IconizeRender(this.plugin, this.previewRender, this.marked))
        this.addExtension(new Heading(this.plugin, this.previewRender, this.marked))
        this.addExtension(new Embed(this.plugin, this.previewRender, this.marked))
        this.addExtension(new CodeRenderer(this.plugin, this.previewRender, this.marked))
        this.addExtension(new CodeHighlight(this.plugin, this.previewRender, this.marked))
        this.addExtension(new MathRenderer(this.plugin, this.previewRender, this.marked))
        this.addExtension(new RemixIconRenderer(this.plugin, this.previewRender, this.marked))
        this.addExtension(new BlockquoteRenderer(this.plugin, this.previewRender, this.marked))
        this.addExtension(new Table(this.plugin, this.previewRender, this.marked))
        this.addExtension(new Links(this.plugin, this.previewRender, this.marked))
        this.addExtension(new ListItem(this.plugin, this.previewRender, this.marked))

    }
    async parse(md:string){

        const { data, content } = matter(md)
        for (const extension of this.extensions){
            await extension.prepare()
        }
        return await this.marked.parse(content)
    }
    async postprocess(html: string) {
		let result = html;
		for (let ext of this.extensions) {
			result = await ext.postprocess(result);
		}
		return result;
	}

    public async parseNote(path:string, container:HTMLElement, view:Component){
        await ObsidianMarkdownRenderer.getInstance(this.plugin.app).render(path, container, view)
        const md = await this.plugin.app.vault.adapter.read(path)
        let html = await this.parse(md)
        html = await this.postprocess(html)
        return html
    }
}