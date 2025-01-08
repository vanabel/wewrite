/** 
 *  WeChat MP Article Header settings 
 */
import { Notice, Setting, TextComponent, TFile, ToggleComponent } from "obsidian";
import { LocalDraftItem, LocalDraftManager } from 'src/assets/draft-manager';
import WeWritePlugin from 'src/main';
import { UrlUtils } from 'src/utils/urls';
import { WechatClient } from "src/wechat-api/wechat-client";
import { MaterialMeidaItem } from "src/wechat-api/wechat-types";

interface Point {
    x: number;
    y: number;
}


export class MPArticleHeader {
    updateDraftDraftId(media_id: any) {
        if (this.activeLocalDraft !== undefined) {
            this.activeLocalDraft.last_draft_id = media_id
        }
    }

    private _plugin: WeWritePlugin;
    private panning: boolean = false
    private origin_x: number
    private origin_y: number
    private current_x: number = 0
    private current_y: number = 0
    private cover_image: string | null
    private coverFrame: HTMLElement;
    // private draft:LocalDraftItem
    private activeLocalDraft: LocalDraftItem | undefined
    private localDraftmanager: LocalDraftManager
    private _title: TextComponent
    private _author: TextComponent
    private _digest: HTMLTextAreaElement
    private _needOpenComment: ToggleComponent
    private _onlyFansCanComment: ToggleComponent
    private _cover_image: string | null
    private _cover_image_url: string | null
    private draggedImage: HTMLCanvasElement | null = null;
    constructor(plugin: WeWritePlugin, containerEl: HTMLElement) {
        this._plugin = plugin;
        this.localDraftmanager = LocalDraftManager.getInstance(plugin)
        this.BuildUI(containerEl)
        this._plugin.messageService.registerListener('wechat-account-changed', (data: string) => {
            this.updateLocalDraft();
        })
        this._plugin.messageService.registerListener('active-file-changed', (data: string) => {
            this.updateLocalDraft();
        })
        this._plugin.messageService.registerListener('set-draft-cover-image', (url: string) => {
            this.cover_image = url;
            this.setCoverImage(url)
            if (this.activeLocalDraft) {
                this.activeLocalDraft.thumb_media_id = undefined;
                this.localDraftmanager.setDraft(this.activeLocalDraft)
            }
        })
        this._plugin.messageService.registerListener('set-image-as-cover', (item: MaterialMeidaItem) => {
            this.cover_image = item.url;
            this.setCoverImage(item.url)
            if (this.activeLocalDraft) {
                this.activeLocalDraft.thumb_media_id = item.media_id;
                this.localDraftmanager.setDraft(this.activeLocalDraft)
            }
        })
        this.updateLocalDraft()

    }

    onNoteRename(file: TFile) {
        //TODO: only if the file is the active file
        const activeFile = this._plugin.app.workspace.getActiveFile()
        if (activeFile === undefined || file !== activeFile) {
            return;
        }

        if (this.activeLocalDraft !== undefined) {
            this.activeLocalDraft.notePath = file.path
            const dm = LocalDraftManager.getInstance(this._plugin)
            dm.setDraft(this.activeLocalDraft)
        }

    }

    public getActiveLocalDraft() {
        return this.activeLocalDraft
    }
    private BuildUI(containerEl: HTMLElement) {
        const container = containerEl.createEl('div', { cls: 'wechat-mp-article-header' })
        const details = container.createEl('details')
        details.createEl('summary', { text: 'WeChat MP Article Properties' })

        new Setting(details).setName('Title')
            .addText(text => {
                this._title = text;
                text.setPlaceholder('Title')
                    .onChange(async (value) => {
                        if (this.activeLocalDraft !== undefined) {
                            this.activeLocalDraft.title = value
                            this.localDraftmanager.setDraft(this.activeLocalDraft)
                            this._plugin.messageService.sendMessage('draft-title-updated', value)
                        }
                    })
            })
        new Setting(details).setName('Author')
            .addText(text => {
                this._author = text;
                text.setPlaceholder('Author')
                    .onChange(async (value) => {
                        if (this.activeLocalDraft !== undefined) {
                            this.activeLocalDraft.author = value
                            this.localDraftmanager.setDraft(this.activeLocalDraft)
                        }
                    })
            })

        new Setting(details).setName('Digest')
            .addExtraButton(button => {
                button.setIcon("sparkles")
                    .setTooltip("Generate Digest by AI")
                    .onClick(async () => {
                        this.generateDigest();
                    })
            })

        this._digest = details.createEl('textarea', { cls: 'digest', attr: { rows: 3, placeholder: '图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字。' } })
        this._digest.onkeyup = (event: KeyboardEvent) => {
            const target = event.target as HTMLTextAreaElement;
            if (this.activeLocalDraft !== undefined) {
                this.activeLocalDraft.digest = target.value
                this.localDraftmanager.setDraft(this.activeLocalDraft)
            }
        };

        this.coverFrame = this.createCoverFrame(details)

        new Setting(details)
            .setName('Need Open Comments')
            .setDesc('是否打开评论，0不打开(默认)，1打开')
            .addToggle(toggle => {
                this._needOpenComment = toggle; 
                toggle.setValue(false); 
                toggle.onChange(value => {
                    if (this.activeLocalDraft !== undefined) {
                        this.activeLocalDraft.need_open_comment = value ? 1 : 0
                        this.localDraftmanager.setDraft(this.activeLocalDraft)
                    }
                })
            })
        new Setting(details)
            .setName('Only Fans Can Comment')
            .setDesc('是否粉丝才可评论，0所有人可评论(默认)，1粉丝才可评论')
            .addToggle(toggle => {
                this._onlyFansCanComment = toggle;
                toggle.setValue(false);
                toggle.onChange(value => {
                    if (this.activeLocalDraft !== undefined) {
                        this.activeLocalDraft.only_fans_can_comment = value ? 1 : 0
                        this.localDraftmanager.setDraft(this.activeLocalDraft)
                    }
                })
            })

    }
    async generateDigest() {
        if (!this._plugin.deepseekClient) {
            new Notice('Please set DeepSeek API Key in plugin settings first.')
            return
        }
        if (this.activeLocalDraft === undefined) {
            new Notice('No Active Note')
            return
        }
        if (this.activeLocalDraft.notePath === undefined) {
            new Notice('No Active Note')
            return
        }
        this._plugin.showSpinner()
        const md = await this._plugin.app.vault.adapter.read(this.activeLocalDraft.notePath)
        const summary = await this._plugin.deepseekClient?.generateSummary(md)
        if (summary) {
            this._digest.value = summary
            this.activeLocalDraft.digest = summary
            this.localDraftmanager.setDraft(this.activeLocalDraft)
        }
        this._plugin.hideSpinner()
    }
    private createCoverFrame(details: HTMLElement) {
        new Setting(details)
            .setName('Cover')
            .setDesc('Cover image for this article. Its mandatory if you want to publish this article to WeChat Official Account. You may drag and drop an image from vault, or from uploaded images in your WeChat Official Account.')
            .addExtraButton(
                button => button
                    .setIcon('panel-left-close')
                    .setTooltip('pick image in WeChat Official Account from left side view')
                    .onClick(async () => {
                        this._plugin.showLeftView()
                    })
            )
            .addExtraButton(
                button => button
                    .setIcon('rotate-ccw')
                    .setTooltip('reset image')
                    .onClick(async () => {

                        this.resetImage()
                    })
            )
            .addExtraButton(
                button => button
                    .setIcon('square-check-big')
                    .setTooltip('use the change image as cover ')
                    .onClick(async () => {

                        this.updateCoverImage()
                    })
            )
        const container = details.createDiv({ cls: 'cover-container' })
        // const it = new ImageTransformer(container)    
        // return it.container
        const coverframe = container.createDiv({ cls: 'cover-frame', attr: { droppable: true } })

        // const img = coverframe.createEl('img', {attr:{dragable:false}})

        coverframe.ondragenter = (e) => {
            e.preventDefault()
            coverframe.addClass('image-on-dragover')
        }
        coverframe.ondragleave = (e) => {
            e.preventDefault()
            coverframe.removeClass('image-on-dragover')
        }
        coverframe.ondragover = (e) => {
            e.preventDefault()
        }
        coverframe.addEventListener('drop', async (e) => {
            e.preventDefault()

            this.current_x = 0
            this.current_y = 0

            const url = e.dataTransfer?.getData('text/uri-list')
            // console.log(`drop url:${url}`);
            
            if (url) {
                if (url.startsWith('obsidian://')) {
                    //image from vault

                    const urlParser = new UrlUtils(this._plugin.app);

                    const appurl = await urlParser.getInternalLinkDisplayUrl(url)
                    this.cover_image = appurl;

                } else if (url.startsWith('http') || url.startsWith('https')) {
                    this.cover_image = url;
                    const media_id = await this.getCoverImageMediaId(url)
                    coverframe.setAttr('data-media_id', media_id)
                    if (this.activeLocalDraft !== undefined) {
                        this.activeLocalDraft.thumb_media_id = media_id
                        
                    }
                } else if (url.startsWith('file://')) {
                    //image from local file
                    const filePath = url.replace('file://', '');
                    const file = await this._plugin.app.vault.adapter.readBinary(filePath);
                    const base64 = await this.arrayBufferToBase64(file);
                    this.cover_image = `data:image/png;base64,${base64}`;
                }else{
                    // console.log(`unsupport image url:`, url);
                    this.cover_image = ''
                    this.setCoverImageXY();
                }
                if (this.activeLocalDraft !== undefined) {
                    this.activeLocalDraft.cover_image_url = this.cover_image!     
                }
                // coverframe.setAttr('style', `background-image: url('${url}'); background-size:cover; background-position: 0px 0px;`);
                this.localDraftmanager.setDraft(this.activeLocalDraft!)
                this.setCoverImage(this.cover_image!)
            }
            coverframe.removeClass('image-on-dragover')
        })


        return coverframe
    }
    private async arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    setCoverImage(url: string | null) {
        // console.log(`setCoverImage:`, url);
        while (this.coverFrame.firstChild) {
            this.coverFrame.firstChild.remove()
        }
        if (!url) {
            console.log(`null image url for cover image`);
            
            return
        }

        const img = new Image()
        img.src = url

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        canvas.width = 900
        canvas.height = 383
        
        let scale = Math.max(900 / img.width, 383 / img.height);
        let offsetX = 0 //(canvas.width - img.width * scale) / 2;
        let offsetY = 0 // (canvas.height - img.height * scale) / 2;
        
        // console.log(`orignial image size:`, img.width, img.height, scale);
        // console.log(`scaled image size:`, img.width * scale, img.height*scale, scale);

        ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);

        canvas.style.position = 'absolute';
        canvas.style.cursor = 'move';
        canvas.style.left = `${offsetX}px`;
        canvas.style.top = `${offsetY}px`;

        // let lastMousePosition: Point | null = null;
        // this.draggedImage = canvas;

        // const mouseDownHandler = (e: MouseEvent) => {
        //     lastMousePosition = { x: e.clientX, y: e.clientY };
        //     this.draggedImage = canvas;
        // };

        // const mouseMoveHandler = (e: MouseEvent) => {
        //     if (!this.draggedImage || !lastMousePosition) return;

        //     const deltaX = e.clientX - lastMousePosition.x;
        //     const deltaY = e.clientY - lastMousePosition.y;

        //     offsetX += deltaX;
        //     offsetY += deltaY;
        //     let x = e.clientX
        //     let y = e.clientY

        //     if (offsetX > 0) {
        //         offsetX = 0;
        //         x = lastMousePosition.x
        //     } else if (offsetX + img.width * scale < canvas.width) {
        //         offsetX = canvas.width - img.width * scale;
        //         x = lastMousePosition.x
        //     }

        //     if (offsetY > 0) {
        //         offsetY = 0;
        //         y = lastMousePosition.y
        //     } else if (offsetY + img.height * scale < canvas.height) {
        //         offsetY = canvas.height - img.height * scale;
        //         y = lastMousePosition.y
        //     }
        //     this.draggedImage.style.left = `${offsetX}px`;
        //     this.draggedImage.style.top = `${offsetY}px`;

        //     lastMousePosition = { x: x, y: y };
        // };

        // const mouseUpHandler = () => {
        //     lastMousePosition = null;
        //     // this.draggedImage = null;
        // };

        // const wheelHandler = (e: WheelEvent) => {
        //     e.preventDefault();

        //     const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        //     scale *= zoomFactor;

        //     if (scale > 1 || (img.width * scale <= 900 && img.height * scale <= 383)) {
        //         offsetX = (canvas.width - img.width * scale) / 2;
        //         offsetY = (canvas.height - img.height * scale) / 2;

        //         ctx.clearRect(0, 0, canvas.width, canvas.height);
        //         ctx.drawImage(img, offsetX, offsetY, img.width * scale, img.height * scale);
        //         // if (this.draggedImage){
        //         //     this.draggedImage.style.left = `${offsetX}px`;
        //         //     this.draggedImage.style.top = `${offsetY}px`;
        //         // }

        //         // 更新 lastMousePosition 为当前鼠标位置
        //         lastMousePosition = { x: e.clientX, y: e.clientY };
        //     }
        // };

        // canvas.addEventListener('mousedown', mouseDownHandler);
        // document.addEventListener('mousemove', mouseMoveHandler);
        // document.addEventListener('mouseup', mouseUpHandler);
        // canvas.addEventListener('wheel', wheelHandler, { passive: false });
        // this.coverFrame.innerHTML = ''
        this.coverFrame.appendChild(canvas)
    }
    updateCoverImage() {
        //TODO
        //clear media_id
        // use the canvas to URLdata and update url 
    }
    resetImage() {
        this.current_x = 0;
        this.current_y = 0;
        this.setCoverImageXY(0, 0)
    }

    async checkCoverImage() {
        if (this.activeLocalDraft !== undefined) {
            if (this.activeLocalDraft.thumb_media_id === undefined || !this.activeLocalDraft.thumb_media_id) {
                if (this.cover_image) {
                    const media_id = await this.getCoverImageMediaId(this.cover_image)
                    this.activeLocalDraft.thumb_media_id = media_id
                    return true;
                }
            } else {
                return true;
            }
        }
        return false
    }
    async getCoverImageMediaId(url: string, upload: boolean = false) {
        let _media_id = this._plugin.findImageMediaId(url)
        if (_media_id === undefined && upload) {
            const blob = await fetch(url).then(res => res.blob());
            const res = await WechatClient.getInstance(this._plugin).uploadImage(blob, 'banner-cover.png', 'image')

            if (res) {
                const { errcode, media_id } = res

                if (errcode !== 0) {
                    new Notice('upload cover image error')
                    return
                } else {
                    _media_id = media_id
                }
            }
        }
        return _media_id

    }
    private setCoverImageXY(x: number = 0, y: number = 0) {

        // this.coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; background-repeat: no-repeat; background-position:  ${x}px ${y}px;`);
        // if (this.activeLocalDraft !== undefined) {
        //     this.activeLocalDraft.cover_image_url = this.cover_image!
        //     this.activeLocalDraft.pic_crop_235_1 = '' + x + ' ' + y
        // }
        this.setCoverImage(this.cover_image)
    }
    async updateLocalDraft() {

        if (this.localDraftmanager.isActiveNoteDraft(this.activeLocalDraft)) {
            return;
        }
        //could be called when switch account name

        this.activeLocalDraft = await this.localDraftmanager.getDrafOfActiveNote()
        this.updateHeaderProporties()
        return true;
    }
    updateHeaderProporties() {
        // console.log(`updateHeaderProporties:`, this.activeLocalDraft);
        if (this.activeLocalDraft !== undefined) {
            this._title.setValue(this.activeLocalDraft.title)
            this._author.setValue(this.activeLocalDraft.author || "")
            this._digest.value = this.activeLocalDraft.digest || ""
            this._needOpenComment.setValue((this.activeLocalDraft.need_open_comment || 0) > 0)
            this._onlyFansCanComment.setValue((this.activeLocalDraft.only_fans_can_comment || 0) > 0)
            this.cover_image = this.activeLocalDraft.cover_image_url || ""
            this.setCoverImageXY()
            const x = this.activeLocalDraft.pic_crop_235_1?.split(' ')[0] || 0
            const y = this.activeLocalDraft.pic_crop_235_1?.split(' ')[1] || 0
            // this.coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; background-repeat: no-repeat; background-position:  ${x}px ${y}px;`);
        } else {
            this._title.setValue('')
            this._author.setValue("")
            this._digest.value = ""
            this._needOpenComment.setValue(false)
            this._onlyFansCanComment.setValue(false)
            this.cover_image = ""
            const x = 0
            const y = 0
            // this.coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; background-repeat: no-repeat; background-position:  ${x}px ${y}px;`);
        }
        if (this.cover_image) {
            // this.setCoverImage(this.cover_image)
            this.setCoverImageXY()
        }
        this._plugin.messageService.sendMessage('draft-title-updated', this._title.getValue())
    }
}