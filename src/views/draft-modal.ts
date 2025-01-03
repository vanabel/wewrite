import { App, Modal } from 'obsidian';
// import { Jimp, intToRGBA, rgbaToInt } from 'jimp';
import WeWritePlugin from 'src/main';

interface Point {
	x: number;
	y: number;
}

export class ImageEditorModal extends Modal {
	private regionA: HTMLElement;
	private regionB: HTMLElement;
	private draggedImage: HTMLCanvasElement | null = null;
	private dragStart: Point | null = null;
	private plugin: WeWritePlugin;

	constructor(app: App, plugin:WeWritePlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl, modalEl, containerEl } = this;
		modalEl.classList.add('image-editor-modal');
		console.log(`containerEl=>`, containerEl);


		contentEl.createDiv({ cls: 'container', attr: { id: 'regionA' } });
		contentEl.createDiv({ cls: 'container', attr: { id: 'regionB' } });

		this.regionA = contentEl.querySelector('#regionA')!;
		this.regionB = contentEl.querySelector('#regionB')!;

		this.regionA.addEventListener('dragover', (e) => e.preventDefault());
		this.regionA.addEventListener('drop', (e) => this.handleDrop(e, this.regionA));

		this.regionB.addEventListener('dragover', (e) => e.preventDefault());
		this.regionB.addEventListener('drop', (e) => this.handleDrop(e, this.regionB));

		contentEl.createEl('button', { text: 'Save Region A' }).addEventListener('click', () => this.saveImage('regionA'));
		contentEl.createEl('button', { text: 'Save Region B' }).addEventListener('click', () => this.saveImage('regionA'));
		contentEl.createEl('button', { text: 'Save Merged Image' }).addEventListener('click', () => this.saveMergedImage());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private async handleDrop(e: DragEvent, region: HTMLElement) {
		e.preventDefault();
		if (!e.dataTransfer?.files.length) return;

		const file = e.dataTransfer.files[0];
		const reader = new FileReader();

		reader.onloadend = async () => {
			const img = new Image();
			img.src = reader.result as string;

			await new Promise((resolve) => img.onload = resolve);

			this.createCanvas(region, img);
		};

		reader.readAsDataURL(file);
	}

	private createCanvas(region: HTMLElement, img: HTMLImageElement) {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;
		const ratio = region.id === 'regionA' ? 2.35 : 1;
		const minSize = region.id === 'regionA' ? { width: 900, height: 383 } : { width: 383, height: 383 };

		canvas.width = minSize.width;
		canvas.height = minSize.height;

		let scale = Math.min(minSize.width / img.width, minSize.height / img.height);
		let offsetX = (canvas.width - img.width * scale) / 2;
		let offsetY = (canvas.height - img.height * scale) / 2;

		ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);

		canvas.style.position = 'absolute';
		canvas.style.cursor = 'move';
		canvas.style.left = `${offsetX}px`;
		canvas.style.top = `${offsetY}px`;

		let lastMousePosition: Point | null = null;

		const mouseDownHandler = (e: MouseEvent) => {
			lastMousePosition = { x: e.clientX, y: e.clientY };
			this.draggedImage = canvas;
		};

		const mouseMoveHandler = (e: MouseEvent) => {
			if (!this.draggedImage || !lastMousePosition) return;

			const deltaX = e.clientX - lastMousePosition.x;
			const deltaY = e.clientY - lastMousePosition.y;

			offsetX += deltaX;
			offsetY += deltaY;

			this.draggedImage.style.left = `${offsetX}px`;
			this.draggedImage.style.top = `${offsetY}px`;

			lastMousePosition = { x: e.clientX, y: e.clientY };
		};

		const mouseUpHandler = () => {
			lastMousePosition = null;
			this.draggedImage = null;
		};

		const wheelHandler = (e: WheelEvent) => {
			e.preventDefault();

			const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
			scale *= zoomFactor;

			if (scale > 1 || (img.width * scale <= minSize.width && img.height * scale <= minSize.height)) {
				offsetX = (canvas.width - img.width * scale) / 2;
				offsetY = (canvas.height - img.height * scale) / 2;

				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);

				this.draggedImage!.style.left = `${offsetX}px`;
				this.draggedImage!.style.top = `${offsetY}px`;

				// 更新 lastMousePosition 为当前鼠标位置
				lastMousePosition = { x: e.clientX, y: e.clientY };
			}
		};

		canvas.addEventListener('mousedown', mouseDownHandler);
		document.addEventListener('mousemove', mouseMoveHandler);
		document.addEventListener('mouseup', mouseUpHandler);
		canvas.addEventListener('wheel', wheelHandler, { passive: false });

		region.appendChild(canvas);
	}

	private saveImage(regionId: string) {
		const canvas = document.querySelector<HTMLCanvasElement>(`#${regionId} canvas`);
		if (!canvas) {
			console.log(`canvas not found: [#${regionId} canvas]`);

			return;
		}

		const dataURL = canvas.toDataURL('image/png');
		this.setDraftCoverImage(dataURL);
		// const blob = this.dataURIToBlob(dataURL);

		// void this.saveFile(blob, `region_${regionId}.png`).then(filePath => {
		// 	console.log(`Saved ${regionId} image to:`, filePath);
		// });
	}
	private setDraftCoverImage(dataURL: string){
		this.plugin.messageService.sendMessage('set-draft-cover-image', dataURL);
	}

	private saveMergedImage() {
		const canvasA = document.querySelector<HTMLCanvasElement>('#regionA canvas');
		const canvasB = document.querySelector<HTMLCanvasElement>('#regionB canvas');

		if (!canvasA || !canvasB) return;

		const mergedCanvas = document.createElement('canvas');
		const ctx = mergedCanvas.getContext('2d')!;

		mergedCanvas.width = 1283; // 900 + 383
		mergedCanvas.height = 383;

		ctx.drawImage(canvasA, 0, 0);
		ctx.drawImage(canvasB, 900, 0);

		const dataURL = mergedCanvas.toDataURL('image/png');
		this.setDraftCoverImage(dataURL);
		// const blob = this.dataURIToBlob(dataURL);

		// void this.saveFile(blob, 'merged_image.png').then(filePath => {
		// 	console.log('Saved merged image to:', filePath);
		// });
	}

	private dataURIToBlob(dataURI: string): Blob {
		const byteString = atob(dataURI.split(',')[1]);
		const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
		const ab = new ArrayBuffer(byteString.length);
		const ia = new Uint8Array(ab);
		for (let i = 0; i < byteString.length; i++) {
			ia[i] = byteString.charCodeAt(i);
		}
		return new Blob([ab], { type: mimeString });
	}

	private async saveFile(blob: Blob, fileName: string): Promise<string> {

		let filePaths: string[] = window.electron.remote.dialog.showOpenDialogSync({
			title: 'Pick folders to import',
			properties: ['openDirectory', 'dontAddToRecent'],
		})
		if (filePaths && filePaths.length > 0) {


			filePaths[0]
			const folderHandle = await (window as any).showDirectoryPicker();
			const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
			const writable = await fileHandle.createWritable();
			await writable.write(blob);
			await writable.close();
			return fileHandle.name;
		}
		return ""
	}

	// private async removeBackground(imagePath: string) {
	// 	try {
	// 		const image = await Jimp.read(imagePath);

	// 		// Assuming white background
	// 		const colorToRemove = '#FFFFFF';

	// 		for (let y = 0; y < image.bitmap.height; y++) {
	// 			for (let x = 0; x < image.bitmap.width; x++) {
	// 				const pixelColor = intToRGBA(image.getPixelColor(x, y));
	// 				if (pixelColor.r === parseInt(colorToRemove.slice(1, 3), 16) &&
	// 					pixelColor.g === parseInt(colorToRemove.slice(3, 5), 16) &&
	// 					pixelColor.b === parseInt(colorToRemove.slice(5, 7), 16)) {
	// 					image.setPixelColor(rgbaToInt(0, 0, 0, 0), x, y); // Set alpha to 0
	// 				}
	// 			}
	// 		}

	// 		const outputPath = imagePath.replace(/\.png$/, '_transparent');
	// 		await image.write(`${outputPath}.png`);
	// 		console.log('Background removed and saved as:', outputPath);
	// 		return outputPath;
	// 	} catch (err) {
	// 		console.error(err);
	// 		throw err;
	// 	}
	// }
}