/**
 * dialog to pick picture for article cover
 */
import { Modal, App } from "obsidian";

export interface ICoverImageModalData {
    name: string;
    update_time: number;
    url: string;
    media_id: string;
}

class ImageSelectionModal extends Modal {
    selectedImage: ICoverImageModalData | null = null;
    images : ICoverImageModalData[] = [];
    constructor(app: App, images:ICoverImageModalData[]) {
        super(app);
        this.images = images
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h1", { text: "选择图片" });

        // const images = [
        //     "https://example.com/image1.jpg",
        //     "https://example.com/image2.jpg",
        //     "https://example.com/image3.jpg"
        // ];

        const container = contentEl.createEl("div");
        container.style.display = "flex";
        container.style.flexWrap = "wrap";

        this.images.forEach((image, index) => {
            const imageContainer = container.createEl("div");
            imageContainer.style.position = "relative";
            imageContainer.style.margin = "10px";
            imageContainer.style.cursor = "pointer";

            const img = imageContainer.createEl("img");
            img.src = image.url;
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.objectFit = "cover";

            const checkbox = imageContainer.createEl("input", { attr: { type: "radio", name: "image-radio" } });
            checkbox.style.position = "absolute";
            checkbox.style.top = "0";
            checkbox.style.left = "0";
            checkbox.style.width = "100%";
            checkbox.style.height = "100%";
            checkbox.style.opacity = "0";
            checkbox.style.cursor = "pointer";

            checkbox.addEventListener("change", (event) => {
                if (event.target instanceof HTMLInputElement && event.target.checked) {
                    this.selectedImage = image;
                    console.log(`Selected image: ${this.selectedImage}`);
                    this.close();
                }
            });
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}



export function openImageSelectionModal(app: App, images:ICoverImageModalData[]) {
    const modal = new ImageSelectionModal(app, images);
    modal.open();
    if (modal.selectedImage) {
        return modal.selectedImage
    }
}