/** 
 *  WeChat MP Article Header settings 
 */
import { Setting, TextComponent, TFile, ToggleComponent } from "obsidian";
import { LocalDraftItem, LocalDraftManager } from 'src/assets/draft-manager';
import WeWritePlugin from 'src/main';
import { UrlUtils } from 'src/utils/urls';

export class MPArticleHeader {
    
    private _plugin: WeWritePlugin;
    private panning: boolean = false
    private origin_x: number
    private origin_y: number
    private current_x: number = 0
    private current_y: number = 0
    private cover_image: string | null
    private coverframe: HTMLElement;
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
        this.updateLocalDraft()

    }

    onNoteRename(file: TFile) {
        //TODO: only if the file is the active file
        const activeFile = this._plugin.app.workspace.getActiveFile()
        if (activeFile === undefined || file !== activeFile) {
            console.log(`not the active file. return`);
            return;
        }
        console.log(`on note rename, update local draft`);
        
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
        const details = containerEl.createEl('details', { cls: 'wechat-mp-article-preview', attr: {  } })
        const summary = details.createEl('summary', { cls: 'wechat-mp-article-preview-summary', text: 'WeChat MP Article Properties' })
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

        this._digest = details.createEl('textarea', { cls: 'wechat-mp-article-preview-digest', attr: { rows: 3, placeholder: '图文消息的摘要，仅有单图文消息才有摘要，多图文此处为空。如果本字段为没有填写，则默认抓取正文前54个字。' } })
        this._digest.onkeyup = (event: KeyboardEvent) => {
            const target = event.target as HTMLTextAreaElement;
            console.log(target.value);
            if (this.activeLocalDraft !== undefined) {
                this.activeLocalDraft.digest = target.value
                this.localDraftmanager.setDraft(this.activeLocalDraft)
            }
        };

        this.coverframe = this.createCoverFrame(details)

        new Setting(details)
            .setName('Need Open Comments')
            .setDesc('是否打开评论，0不打开(默认)，1打开')
            .addToggle(toggle => {
                this._needOpenComment = toggle; toggle.setValue(false); toggle.onChange(value => {
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
    private createCoverFrame(details: HTMLElement) {
        new Setting(details)
            .setName('Cover')
            .setDesc('Cover image for this article. Its mandatory if you want to publish this article to WeChat Official Account. You may drag and drop an image from vault, or from uploaded images in your WeChat Official Account.')
            .addExtraButton(
                button => button
                    .setIcon('panel-left-close')
                    .setTooltip('pick image in WeChat Official Account from left side view')
                    .onClick(async () => {
                        console.log('show left view')
                        this._plugin.showLeftView()
                    })
            )
        const container = details.createDiv({ cls: 'wechat-mp-article-preview-cover-container' })
        const coverframe = container.createDiv({ cls: 'wechat-mp-article-preview-cover', attr: { droppable: true } })

        // const img = coverframe.createEl('img', {attr:{dragable:false}})

        coverframe.ondragenter = (e) => {
            e.preventDefault()
            // console.log('drag over',e)
            coverframe.addClass('image-on-dragover')
        }
        coverframe.ondragleave = (e) => {
            e.preventDefault()
            // console.log('drag leave', e)
            coverframe.removeClass('image-on-dragover')
        }
        coverframe.ondragover = (e) => {
            e.preventDefault()
            // console.log('ondragover', e)
            // const files = e.dataTransfer?.files
        }
        coverframe.addEventListener('drop', async (e) => {
            e.preventDefault()
            // console.log('heard drop dataTransfer', e.dataTransfer?.types)
            // console.log('heard drop text', e.dataTransfer?.getData('text/plain'))
            console.log('heard drop url', e.dataTransfer?.getData('text/uri-list'))
            // console.log('heard drop media_id', e.dataTransfer?.getData('media_id'))
            this.current_x = 0
            this.current_y = 0

            const url = e.dataTransfer?.getData('text/uri-list')
            if (url) {
                if (url.startsWith('obsidian://')) {

                    const urlParser = new UrlUtils(this._plugin.app);

                    const appurl = await urlParser.getInternalLinkDisplayUrl(url)
                    console.log(`appUrl: ${appurl}`);
                    // coverframe.setAttr('style', `background-image: url('${appurl}'); background-size:cover; background-position: 0px 0px;`);
                    this.cover_image = appurl;
                    // coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; backgroup-repeat:none; background-position:  ${this.current_x}px ${this.current_y}px;`);
                    this.setCoverImage()


                } else {

                    this.cover_image = url;
                    // coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; backgroup-repeat:none; background-position:  ${this.current_x}px ${this.current_y}px;`);
                    this.setCoverImage()

                    // coverframe.setAttr('style', `background-image: url('${url}'); background-size:cover; background-position: 0px 0px;`);
                    const media_id = this._plugin.findImageMediaId(url)
                    coverframe.setAttr('data-media_id', media_id)
                    if (this.activeLocalDraft !== undefined) {
                        this.activeLocalDraft.thumb_media_id = media_id
                    }
                    console.log(`media_id: ${media_id}`);
                    
                }
                this.localDraftmanager.setDraft(this.activeLocalDraft!)
            }
            coverframe.removeClass('image-on-dragover')
        })

        //TODO panning for find right position of cover
        coverframe.onmousedown = (e: MouseEvent) => {
            console.log('mousedown:', e.clientX, e.clientY)
            this.panning = true
            this.origin_x = e.clientX
            this.origin_y = e.clientY

        }
        coverframe.onmouseup = (e: MouseEvent) => {
            console.log('mousedown:', e.clientX, e.clientY)
            this.panning = false
            const x = e.clientX - this.origin_x
            const y = e.clientY - this.origin_y
            this.current_x += x
            this.current_y += y

        }
        coverframe.onmousemove = (e: MouseEvent) => {
            if (this.panning && this.cover_image) {
                const x = e.clientX - this.origin_x
                const y = e.clientY - this.origin_y
                this.current_x += x
                this.current_y += y

                const coverframeRect = coverframe.getBoundingClientRect();
                const img = new Image();
                img.src = this.cover_image;
                img.onload = () => {
                    const imgWidth = img.width;
                    const imgHeight = img.height;

                    // 计算缩放比例
                    const ratioX = coverframeRect.width / imgWidth;
                    const ratioY = coverframeRect.height / imgHeight;
                    const ratio = Math.max(ratioX, ratioY);

                    // 计算缩放后的图像尺寸
                    const scaledImgWidth = imgWidth * ratio;
                    const scaledImgHeight = imgHeight * ratio;

                    // 计算最大和最小的背景位置
                    const max_x = Math.max(0, scaledImgWidth - coverframeRect.width);
                    const min_x = Math.min(0, -scaledImgWidth + coverframeRect.width);
                    const max_y = Math.max(0, scaledImgHeight - coverframeRect.height / 2.35);
                    const min_y = Math.min(0, -scaledImgHeight + coverframeRect.height / 2.35);

                    // 限制背景位置
                    this.current_x = Math.max(min_x, Math.min(max_x, this.current_x));
                    this.current_y = Math.max(min_y, Math.min(max_y, this.current_y));

                    // coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size: cover; background-position: ${this.current_x}px ${this.current_y}px; background-repeat: no-repeat;`);
                    this.setCoverImageXY(this.current_x, this.current_y)
                };

                this.origin_x = e.clientX
                this.origin_y = e.clientY
            }

        }
        return coverframe
    }
    private setCoverImage() {

        this.coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; background-repeat: no-repeat; background-position:  ${this.current_x}px ${this.current_y}px;`);
        if (this.activeLocalDraft !== undefined) {
            this.activeLocalDraft.cover_image_url = this.cover_image!
        }
    }
    private setCoverImageXY(x: number, y: number) {

        this.coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; background-repeat: no-repeat; background-position:  ${x}px ${y}px;`);
        if (this.activeLocalDraft !== undefined) {
            this.activeLocalDraft.cover_image_url = this.cover_image!
            this.activeLocalDraft.pic_crop_235_1 = '' + x + ' ' + y
        }
    }
    async updateLocalDraft() {

        if (this.localDraftmanager.isActiveNoteDraft(this.activeLocalDraft)){
            console.log(`no real change on the active note. `);
            
            return;
        }
        //could be called when switch account name

        this.activeLocalDraft = await this.localDraftmanager.getDrafOfActiveNote()
        this.updateHeaderProporties()
        return true;
    }
    updateHeaderProporties() {
        if (this.activeLocalDraft !== undefined) {
            this._title.setValue(this.activeLocalDraft.title)
            this._author.setValue(this.activeLocalDraft.author || "")
            this._digest.value = this.activeLocalDraft.digest || ""
            this._needOpenComment.setValue((this.activeLocalDraft.need_open_comment || 0) > 0)
            this._onlyFansCanComment.setValue((this.activeLocalDraft.only_fans_can_comment || 0) > 0)
            this.cover_image = this.activeLocalDraft.cover_image_url || ""
            const x = this.activeLocalDraft.pic_crop_235_1?.split(' ')[0] || 0
            const y = this.activeLocalDraft.pic_crop_235_1?.split(' ')[1] || 0
            this.coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; background-repeat: no-repeat; background-position:  ${x}px ${y}px;`);
        } else {
            this._title.setValue('')
            this._author.setValue("")
            this._digest.value = ""
            this._needOpenComment.setValue(false)
            this._onlyFansCanComment.setValue(false)
            this.cover_image = ""
            const x = 0
            const y = 0
            this.coverframe.setAttr('style', `background-image: url('${this.cover_image}'); background-size:cover; background-repeat: no-repeat; background-position:  ${x}px ${y}px;`);
        }
        this._plugin.messageService.sendMessage('draft-title-updated', this._title.getValue())
    }
}