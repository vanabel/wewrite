/**
 * a dialog modal to confirm the delete action
 * 
*/

import { Modal, Notice } from 'obsidian';
import WeWritePlugin from 'src/main';
import { MaterialItem } from './../wechat-api/wechat-types';

export class ConfirmDeleteModal extends Modal {
    plugin: WeWritePlugin;
    item: MaterialItem;
    callback: (item: MaterialItem) => void
    constructor(plugin: WeWritePlugin, item: MaterialItem, callback: (item: MaterialItem) => void) {
        super(plugin.app);
        this.plugin = plugin;
        this.item = item
        this.callback = callback
    }

    update(item: MaterialItem, callback: (item: MaterialItem) => void) {
        this.item = item
        this.callback = callback
    }
    onOpen() {
        // console.log(`onOpen!`, this.item);

        const { contentEl } = this;
        // containerEl.addClass('confirm-pulbish-dialog');
        contentEl.addClass('confirm-pulbish-dialog-content')

        contentEl.createEl('h3', { text: 'Confirm Delete' });
        const content = contentEl.createDiv({ cls: 'description' })
        content.createEl('p', { text: `Are you sure to delete this item?`})
        content.createEl('p', { text: `Delete is permernent. This action cannot be undone.`})
        content.createEl('p', { text: `
                If you want to delete this item, please click the button below.
                If you want to cancel, please click the button below.
            `})
        content.createEl('p', { text: `Be careful!`})
        
        const toolbar = contentEl.createDiv({ cls: 'confirm-pulbish-dialog-tool-bar' })
        const confirmButton = toolbar.createEl('button', { text: 'Confirm' ,cls:"danger-button"});
        const cancelButton = toolbar.createEl('button', { text: 'Cancel' });

        confirmButton.addEventListener('click', () => {
            this.delete();
            this.close();
        });

        cancelButton.addEventListener('click', () => {
            // console.log(`cancel`);

            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    delete() {
        if (this.callback) {
            this.callback(this.item)
        }
    }
}