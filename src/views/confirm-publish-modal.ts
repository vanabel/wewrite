/**
 * a dialog modal to confirm the publish action
 * 
*/

import { Modal, Notice } from 'obsidian';
import WeWritePlugin from 'src/main';
import { DraftItem } from './../wechat-api/wechat-types';

export class ConfirmPublishModal extends Modal {
    plugin: WeWritePlugin;
    media_id: string;
    title: string
    draftItem: any;
    constructor(plugin: WeWritePlugin, draftItem: DraftItem) {
        super(plugin.app);
        this.plugin = plugin;
        this.draftItem = draftItem
    }

    update(item: DraftItem) {
        this.draftItem = item
    }
    onOpen() {
        console.log(`onOpen!`);

        const { contentEl, containerEl } = this;
        // containerEl.addClass('confirm-pulbish-dialog');
        contentEl.addClass('confirm-pulbish-dialog-content')

        contentEl.createEl('h3', { text: 'Confirm Publish' });
        const content = contentEl.createDiv({ cls: 'description' })
        content.createEl('p', { text: `Are you sure to publish this article?`})
        content.createEl('p', { text: `publish draft outside of WeChat MP platform, 
            is not as efficient as publish inside WeChat MP platform. 
            some features may not work as expected. for example the tag, pushing to public account, etc.
            `})
        content.createEl('p', { text: `Be careful!`})
        
        const toolbar = contentEl.createDiv({ cls: 'confirm-pulbish-dialog-tool-bar' })
        const confirmButton = toolbar.createEl('button', { text: 'Confirm' ,cls:"danger-button"});
        const cancelButton = toolbar.createEl('button', { text: 'Cancel' });

        confirmButton.addEventListener('click', () => {
            console.log(`confirm publish:`, this.draftItem);
            this.publish();
            this.close();
        });

        cancelButton.addEventListener('click', () => {
            console.log(`cancel`);

            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    publish() {
        const id = this.draftItem.media_id
        if (id !== undefined && id) {
            this.plugin.wechatClient.publishDraft(id)
                .then(() => {
                    new Notice('Publish Successfully')
                })
                .catch((error: any) => {
                    new Notice('Publish Failed')
                })
        }
    }
}