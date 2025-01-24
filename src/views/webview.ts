import { App, Modal } from 'obsidian';

export class WebViewModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        iframe.src = 'https://mp.weixin.qq.com/'; 
        contentEl.appendChild(iframe);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
