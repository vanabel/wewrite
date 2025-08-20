/**
 * Modal for generating banner images from keywords using Pollinations.ai
 */

import { Modal, Setting, Notice } from 'obsidian';
import { $t } from 'src/lang/i18n';
import WeWritePlugin from 'src/main';

export class KeywordBannerModal extends Modal {
    plugin: WeWritePlugin;
    callback: (url: string) => void;
    public keywords: string = '';
    public size: string = '1440*613';
    public useTranslation: boolean = true;

    constructor(plugin: WeWritePlugin, callback: (url: string) => void) {
        super(plugin.app);
        this.plugin = plugin;
        this.callback = callback;
    }

    update(callback: (url: string) => void) {
        this.callback = callback;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('keyword-banner-modal-content');

        contentEl.createEl('h3', { text: $t('modals.keyword-banner.title') || 'Generate Banner from Keywords' });

        // Size input
        new Setting(contentEl)
            .setName($t('modals.image-generation.size') || 'Image Size')
            .addText((text) => {
                text.setPlaceholder('width*height')
                    .setValue(this.size)
                    .onChange((value) => {
                        this.size = value;
                    });
            });

        // Keywords input
        new Setting(contentEl)
            .setName($t('modals.keyword-banner.keywords') || 'Keywords')
            .setDesc($t('modals.keyword-banner.keywords-desc') || 'Enter keywords separated by commas')
            .addTextArea((text) => {
                text.setPlaceholder($t('modals.keyword-banner.keywords-placeholder') || 'e.g., 微分结构论、奇异空间、辛几何')
                    .setValue(this.keywords)
                    .onChange((value) => {
                        this.keywords = value;
                    });
            });

        // Translation toggle
        new Setting(contentEl)
            .setName($t('modals.keyword-banner.translate') || 'Translate to English')
            .setDesc($t('modals.keyword-banner.translate-desc') || 'Translate Chinese keywords to English for better image generation')
            .addToggle((toggle) => {
                toggle.setValue(this.useTranslation)
                    .onChange((value) => {
                        this.useTranslation = value;
                    });
            });

        // Generate button
        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText($t('modals.keyword-banner.generate') || 'Generate Banner')
                    .setCta()
                    .onClick(async () => {
                        await this.generateBanner();
                    });
            });

        // Cancel button
        new Setting(contentEl)
            .addButton((button) => {
                button
                    .setButtonText($t('modals.cancel') || 'Cancel')
                    .onClick(() => {
                        this.close();
                    });
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    async generateBanner() {
        if (!this.keywords.trim()) {
            new Notice($t('modals.keyword-banner.no-keywords') || 'Please enter keywords');
            return;
        }

        try {
            this.plugin.showSpinner($t('modals.keyword-banner.generating') || 'Generating banner image...');
            
            let processedKeywords = this.keywords.trim();
            
            // If translation is enabled, translate keywords to English
            if (this.useTranslation) {
                try {
                    const translated = await this.plugin.aiClient?.translateText(
                        processedKeywords,
                        'Chinese',
                        'English'
                    );
                    if (translated) {
                        processedKeywords = translated;
                    }
                } catch (error) {
                    console.warn('Translation failed, using original keywords:', error);
                }
            }

            const url = await this.plugin.aiClient?.generateBannerImageFromKeywords(
                processedKeywords,
                this.size
            );

            this.plugin.hideSpinner();
            
            if (url && this.callback) {
                this.callback(url);
                this.close();
            } else {
                new Notice($t('modals.keyword-banner.generation-failed') || 'Failed to generate banner image');
            }
        } catch (error) {
            this.plugin.hideSpinner();
            console.error('Error generating banner:', error);
            new Notice($t('modals.keyword-banner.generation-failed') || 'Failed to generate banner image');
        }
    }
}
