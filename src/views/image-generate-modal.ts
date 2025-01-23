/**
 * a dialog modal to input prompts for image generation
 * 
*/

import { Modal, Notice } from 'obsidian';
import { $t } from 'src/lang/i18n';
import WeWritePlugin from 'src/main';

export class ImageGenerateModal extends Modal {
    plugin: WeWritePlugin;
    callback: CallableFunction;
    constructor(plugin: WeWritePlugin, callback: (url: string) => void) {
        super(plugin.app);
        this.plugin = plugin;
        this.callback = callback
    }

    update(callback: CallableFunction) {
        this.callback = callback
    }
    onOpen() {
        // console.log(`onOpen!`);

        const { contentEl } = this;
        contentEl.addClass('image-generate-dialog-content')

        contentEl.createEl('h3', { text: $t('imageGenerateModal.title') });
        const sizebar = contentEl.createDiv({ cls: 'image-generate-dialog-size-bar' })
        sizebar.createEl('span', { text: $t('imageGenerateModal.sizeLabel'), cls: "image-generate-dialog-size-label" })
        const size = sizebar.createEl('input', {
            placeholder: $t('imageGenerateModal.sizePlaceholder'),
            value: '1440*613',
            cls: 'image-generate-dialog-size'
        });

        contentEl.createEl('h5', { text: $t('imageGenerateModal.promptLabel'), cls: "image-generate-dialog-size-label" })
        const prompt = contentEl.createEl('textarea', {
            placeholder: $t('imageGenerateModal.promptPlaceholder'),
            value: '画面上有条河，小马在水边准备过河，河边有小马的妈妈一匹老马，还有老牛，河边还有一棵树，树上有松鼠，它们仿佛在对话中，小马很疑惑的表情',
            cls: 'rename-textarea'
        });
        prompt.value = '画面上有条河，小马在水边准备过河，河边有小马的妈妈一匹老马，还有老牛，河边还有一棵树，树上有松鼠，它们仿佛在对话中，小马很疑惑的表情'

        contentEl.createEl('h5', { text: $t('imageGenerateModal.negativePromptLabel'), cls: "image-generate-dialog-size-label" })
        const negativePrompt = contentEl.createEl('textarea', {
            placeholder: $t('imageGenerateModal.negativePromptPlaceholder'),
            value: '没有人，和其它动物',
            cls: 'rename-textarea'
        });
        negativePrompt.value = '没有人，和其它动物'
        const toolbar = contentEl.createDiv({ cls: 'image-generate-dialog-tool-bar' })
        const confirmButton = toolbar.createEl('button', { text: $t('imageGenerateModal.generateButton') });
        const cancelButton = toolbar.createEl('button', { text: $t('imageGenerateModal.cancelButton') });

        confirmButton.addEventListener('click', () => {
            console.log(`start generating:`, this.callback);
            this.generate(size.value, prompt.value, negativePrompt.value);
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
    async generate(size: string, prompt: string, negative_prompt: string) {
        const url = await this.plugin.aiClient?.generateCoverImageFromText(prompt, negative_prompt, size);
        if (this.callback) {
            this.callback(url)
        }
    }
}
