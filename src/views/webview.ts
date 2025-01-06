import { App, Modal } from 'obsidian';

export class WebViewModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;

        // 创建一个 iframe 元素
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        // 设置 iframe 的内容（可以是外部 URL 或本地 HTML）
        iframe.src = 'https://mp.weixin.qq.com/'; // 替换为你想要的 URL 或本地 HTML 文件路径

        // 将 iframe 添加到模态窗口的内容区域
        contentEl.appendChild(iframe);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
