/**
 * Assets Manager
 * 
 * - manages the assets for WeChat MP platform, including:
 *  - thumbnails from WeChat
 *  - images, videos, audios, etc from WeChat.
 *  - local meida and images
 *  - icons
 *  - svgs
 *  - excalidraw
 *  - mermaid
 *  - admonitions
 *  - LaTeX
 * 
 * 
 * - tracking the mapping between local and remote assets
 * - sync the assets with remote, upload.
 * - for replacing links during markdown rendering 
 */

import { App, Notice, sanitizeHTMLToDom } from "obsidian";
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import WeWritePlugin from "src/main";
import { areObjectsEqual } from "src/utils/utils";
import { getErrorMessage } from "src/wechat-api/error-code";
import { ConfirmDeleteModal } from "src/views/confirm-delete-modal";
import { ConfirmPublishModal } from "src/views/confirm-publish-modal";
import { DraftItem, MaterialItem, MaterialMeidaItem, MaterialNewsItem, MediaType, NewsItem } from "src/wechat-api/wechat-types";
export const MediaTypeLable = new Map([
    ['image', '图片'],
    ['voice', '语音'],
    ['video', '视频'],
    ['news', '图文消息'],
    ['draft', '草稿']
]);

// 扩展 MaterialItem 类型以包含 _deleted 属性
type DeletableMaterialItem = MaterialItem & {
    _deleted?: boolean;
}

PouchDB.plugin(PouchDBFind);

type ASSETS = {
    images: Array<MaterialMeidaItem>,
    videos: Array<MaterialMeidaItem>
    voices: Array<MaterialMeidaItem>
    news: Array<MaterialNewsItem>
    drafts: Array<DraftItem>
}
const MAX_COUNT = 20;
export class AssetsManager {
    app: App;
    assets: Map<string, any[]>
    db: PouchDB.Database;
    used: Map<string, string[]>
    confirmPublishModal: ConfirmPublishModal;
    confirmDeleteModal: ConfirmDeleteModal;


    private static instance: AssetsManager;
    private _plugin: WeWritePlugin;
    constructor(app: App, plugin: WeWritePlugin) {
        this.app = app;
        this._plugin = plugin
        this.assets = new Map()
        this.used = new Map()
        this.db = new PouchDB('wewrite-wechat-assets');

        this._plugin.messageService.registerListener('wechat-account-changed', (data: string) => {
            this.loadMaterial(data)
        })
        this._plugin.messageService.registerListener('delete-media-item', (item: MaterialItem) => {
            //this.deleteMediaItem(item as MaterialMeidaItem)
            this.confirmDelete(item)
        })
        this._plugin.messageService.registerListener('delete-draft-item', (item: MaterialItem) => {
            //this.deleteDraftItem(item)
            this.confirmDelete(item)
        })
        this._plugin.messageService.registerListener('image-item-updated', (item: MaterialItem) => {
            this.addImageItem(item)
        })
        this._plugin.messageService.registerListener('draft-item-updated', (item: MaterialItem) => {
            this.addImageItem(item)
        })
        this._plugin.messageService.registerListener('publish-draft-item', async (item: DraftItem) => {
            this.confirmPublish(item)
        })
        this._plugin.messageService.registerListener('delete-media-item', async (item: MaterialItem) => {
            this.confirmDelete(item)
        })

    }
    addImageItem(item: MaterialItem) {
        this.assets.get('image')?.push(item)
    }
    addDraftItem(item: MaterialItem) {
        this.assets.get('draft')?.push(item)
        this.scanDraftNewsUsedImages()
    }
    public static getInstance(app: App, plugin: WeWritePlugin): AssetsManager {
        if (!AssetsManager.instance) {
            AssetsManager.instance = new AssetsManager(app, plugin);
        }
        return AssetsManager.instance;
    }
    public async deltaSyncMaterial(accountName: string) {
        // load local assets
        await this.loadMaterial(accountName)

        // get total number from remote
        const json = await this._plugin.wechatClient.getMaterialCounts(accountName)
        if (json) {
            const { errcode, voice_count, video_count, image_count, news_count } = json
            if (this.assets.get('news')?.length != news_count) {
                //TODO: parcial get the data.
            }
            if (this.assets.get('image')?.length != image_count) {
                //TODO: parcial get the data.
            }
            if (this.assets.get('video')?.length != video_count) {
                //TODO: parcial get the data.
            }
            if (this.assets.get('voice')?.length != voice_count) {
                //TODO: parcial get the data.
            }

        }

        // the drafts
        const draft_count = await this._plugin.wechatClient.getDraftCount(accountName)
        if (draft_count) {
            if (this.assets.get('draft')?.length != draft_count) {
                //TODO: parcial get the data.
            }
        }

        // this.checkAssets()

    }
    public async loadMaterial(accountName: string) {
        const types: MediaType[] = [
            'draft', 'image', 'video', 'voice', 'news'
        ];
        for (const type of types) {
            this._plugin.messageService.sendMessage(`clear-${type}-list`, null)
            const list = await this.getAllMeterialOfTypeFromDB(accountName, type)
            this.assets.set(type, list)
            list.forEach(item => {
                this._plugin.messageService.sendMessage(`${type}-item-updated`, item)
            });
        }
        this.scanDraftNewsUsedImages()
    }
    public async pullAllMaterial(accountName: string) {
        const json = await this._plugin.wechatClient.getMaterialCounts(accountName)

        const types: MediaType[] = [
            'draft', 'image', 'video', 'voice', 'news'
        ];
        for (const type of types) {
            this._plugin.messageService.sendMessage(`clear-${type}-list`, null)
            this.getAllMaterialOfType(type, (item) => { this._plugin.messageService.sendMessage(`${type}-item-updated`, item) }, accountName)
        }
        this._plugin.assetsUpdated()
    }

    public async getAllNews(callback: (newsItems: MaterialNewsItem) => void, accountName: string | undefined) {
        const list = []
        let offset = 0;
        let total = MAX_COUNT;
        while (offset < total) {
            const json = await this._plugin.wechatClient.getBatchMaterial(accountName, 'news', offset, MAX_COUNT);
            const { errcode, item, total_count, item_count } = json;
            if (errcode !== undefined && errcode !== 0) {
                new Notice(getErrorMessage(errcode), 0)
                break;
            }
            list.push(...item);
            total = total_count
            offset += item_count;
        }
        this.assets.set('news', list)
        list.forEach((item: MaterialNewsItem) => {
            item.accountName = accountName
            item.type = 'news'

            this.pushMaterailToDB(item)
            if (callback) {
                callback(item)
            }
        })
        this.scanDraftNewsUsedImages()
    }
    public async getAllDrafts(callback: (newsItem: DraftItem) => void, accountName: string | undefined) {
        const draftList = []
        let offset = 0;
        let total = MAX_COUNT;
        while (offset < total) {
            const json = await this._plugin.wechatClient.getBatchDraftList(accountName, offset, MAX_COUNT);
            const { errcode, item, total_count, item_count } = json;
            if (errcode !== undefined && errcode !== 0) {
                new Notice(getErrorMessage(errcode), 0)
                break;
            }
            draftList.push(...item);
            total = total_count
            offset += item_count;


        }
        draftList.sort((a, b) => {
            return b.update_time - a.update_time
        })
        this.assets.set('draft', draftList)
        await this.removeMediaItemsFromDB('draft')
        draftList.forEach((i: DraftItem) => {
            i.accountName = accountName
            i.type = 'draft'
            if (callback) {
                callback(i)
            }
            this.pushMaterailToDB(i)
        })
        this.scanDraftNewsUsedImages()
    }
    public async getAllMaterialOfType(type: MediaType, callback: (item: MaterialItem) => void, accountName: string | undefined) {
        if (type === 'news') {
            return await this.getAllNews(callback, accountName);
        }
        if (type === 'draft') {
            return await this.getAllDrafts(callback, accountName);
        }
        const list = []
        let offset = 0;
        let total = MAX_COUNT;
        while (offset < total) {
            const json = await this._plugin.wechatClient.getBatchMaterial(accountName, type, offset, MAX_COUNT);
            const { errcode, item, total_count, item_count } = json;
            if (errcode !== undefined && errcode !== 0) {
                new Notice(getErrorMessage(errcode), 0)
                break;
            }
            list.push(...item);
            total = total_count
            offset += item_count;

        }
        list.sort((a, b) => {
            return b.update_time - a.update_time
        })

        this.assets.set(type, list)
        await this.removeMediaItemsFromDB(type)
        list.forEach((item: MaterialItem) => {
            item.accountName = accountName
            item.type = type
            if (callback) {
                callback(item)
            }
            this.pushMaterailToDB(item)
        })
    }
    public getImageUsedUrl(imgItem: any) {

        let urls = null
        if (imgItem.url !== undefined && imgItem.url) {
            const urlUrls = this.used.get(imgItem.url)
            if (urlUrls !== undefined) {
                urls = urlUrls
            }
        }
        if (imgItem.media_id !== undefined && imgItem.media_id) {
            const idUrls = this.used.get(imgItem.media_id)
            if (idUrls !== undefined) {
                if (urls === null) {
                    urls = idUrls
                } else {
                    urls = urls.concat(idUrls)
                }
            }
        }
        return urls
    }
    public scanUsedImage(type: MediaType) {

        // Process news items
        const newsItems = this.assets.get(type) || [];
        newsItems.forEach(news => {
            news.content.news_item.forEach((item: NewsItem) => {
                if (item.thumb_media_id) {
                    this.setUsed(item.thumb_media_id, item.url);
                }
                this.scanUsedImageInContent(item.content, item.url)
            });
        });
    }
    public scanDraftNewsUsedImages() {
        // Clear existing used media map
        this.used.clear();
        this.scanUsedImage('draft')
        this.scanUsedImage('news')
    }
    public setUsed(media_id: string, url: string) {
        let v = this.used.get(media_id)
        if (v === undefined) {
            v = []
        }
        v.push(url)
        this.used.set(media_id, v)
    }
    public unUsed(media_id: string, url: string) {
        let v = this.used.get(media_id)
        if (v === undefined) {
            return
        }
        v = v.filter(i => i !== url)
        this.used.set(media_id, v)
    }
    public updateUsed(url: string) {
        Array.from(this.used.entries()).forEach(([media_id, urls]) => {
            urls = urls.filter(i => i !== url)
            this.used.set(media_id, urls)
        });
    }
    public scanUsedImageInContent(content: string, url: string) {

        const dom = sanitizeHTMLToDom(content)
        const imgs = dom.querySelectorAll('img')
        imgs.forEach(img => {
            const data_src = img.getAttribute('data-src')

            if (data_src !== null) {
                this.setUsed(data_src, url)
            }
        })
    }

    async fetchAllMeterialOfTypeFromDB(accountName: string, type: MediaType): Promise<MaterialItem[]> {
        return new Promise((resolve) => {

            this.db.find({
                selector: {
                    accountName: { $eq: accountName },
                    type: { $eq: type }
                }
            }).then((result: PouchDB.Find.FindResponse<MaterialItem>) => {
                resolve(result.docs as Array<MaterialItem>)
            }).catch((err) => {
                console.error(err);
                resolve([])
            })

        })
    }
    async pushMaterailToDB(doc: MaterialItem): Promise<void> {
        return new Promise((resolve) => {
            if (doc._id === undefined) {
                doc._id = doc.media_id
            }

            this.db.get(doc._id).then(existedDoc => {
                if (areObjectsEqual(doc, existedDoc)) {
                    // the material has not been changed
                    resolve()
                } else {
                    doc._rev = existedDoc._rev;
                    this.db.put(doc)
                        .then(() => {
                            resolve();
                        })
                        .catch((error: any) => {
                            console.error('Error saving material:', error);
                            resolve()
                        });
                }
            }).catch(error => {
                this.db.put(doc).then(() => {
                    resolve()
                }).catch((err) => {
                    console.error(err);
                    resolve()
                })
                resolve()
            })
        })
    }
    async AllMeterialOfTypeFromDB(media_id: string): Promise<MaterialItem[]> {
        return new Promise((resolve) => {
            this.db.find({
                selector: {
                    mediea_id: { $eq: media_id }
                }
            }).then((result: PouchDB.Find.FindResponse<MaterialItem>) => {
                resolve(result.docs as Array<MaterialItem>)
            }).catch((err) => {
                console.error(err);
                resolve([])
            })
        })
    }
    async getAllMeterialOfTypeFromDB(accountName: string, type: string): Promise<MaterialItem[]> {
        return new Promise(async (resolve) => {

            const pageSize = 10; // 每页记录数
            let offset = 0; // 当前偏移量
            let total = 10; // 总记录数
            const items: Array<MaterialItem> = []
            if (accountName === undefined || !accountName) {
                resolve(items)
                return
            }
            while (true) {
                const result = await this.db.find({
                    selector: {
                        accountName: { $eq: accountName },
                        type: { $eq: type }
                    },
                    limit: pageSize,
                    skip: offset
                });

                const docs = result.docs as Array<MaterialItem>;
                if (docs.length === 0) {
                    break; // 没有更多记录
                }

                items.push(...docs)

                offset += docs.length;
            }
            items.sort((a, b) => {
                return b.update_time - a.update_time
            })
            resolve(items)
        })
    }
    findUrlOfMediaId(type: MediaType, media_id: string) {
        const list = this.assets.get(type)
        if (list !== undefined) {
            const m = list.find(item => item.media_id === media_id)

            if (m !== undefined) {
                return m.url
            }
        }
    }
    findMediaIdOfUrl(type: MediaType, url: string) {
        const list = this.assets.get(type)
        if (list !== undefined) {
            const m = list.find(item => item.url === url)

            if (m !== undefined) {
                return m.media_id
            }
        }
    }

    getMaterialPanels(): MaterialPanelItem[] {
        const panels: MaterialPanelItem[] = [];

        // Get all material types and map to panel items
        const types: MediaType[] = [
            'draft', 'image', 'video', 'voice', 'news'
        ];
        types.forEach(type => {
            panels.push({
                name: MediaTypeLable.get(type)!,
                type: type,
                timestamp: Date.now(),
                url: ''
            });
        });

        return panels;
    }
    async removeMediaItemsFromDB(type: MediaType) {
        const accountName = this._plugin.settings.selectedAccount;
        await this.db.find({
            selector: {
                accountName: { $eq: accountName },
                type: { $eq: type }
            }
        }).then((result: PouchDB.Find.FindResponse<DeletableMaterialItem>) => {
            const docsToDelete = result.docs.map((doc) => {
                doc._deleted = true; // Mark the document for deletion
                return doc;
            });

            // Perform bulk deletion
            return this.db.bulkDocs(docsToDelete);
        }).then((result) => {
            // console.log('Documents deleted successfully:', result);
        }).catch((err) => {
            console.error('Error deleting documents:', err);
        });
    }
    public async deleteMediaItem(item: MaterialMeidaItem) {
        const type = item.type
        if (type === undefined) {
            console.error('deleteMediaItem type is undefined', item)
            return;
        }
        //1. delete from remote
        if (!await this._plugin.wechatClient.deleteMedia(item.media_id)) {
            console.error('delete media failed', item)
            return false;
        }
        //2. delete from local
        await this.removeDocFromDB(item._id!)
        //3. 
        this._plugin.messageService.sendMessage(`${type}-item-deleted`, item)
        //4. 
        this.updateUsed(item.url)
        return true
    }
    public async deleteDraftItem(item: any) {
        //1. delete from remote
        if (!await this._plugin.wechatClient.deleteDraft(item.media_id)) {
            console.error('delete draft failed', item)
            return false;
        }
        //2. delete from local
        this.removeDocFromDB(item._id)
        //3. 
        this._plugin.messageService.sendMessage('draft-item-deleted', item)
        //4. 
        this.updateUsed(item.url)
        return true;
    }
    public async removeDocFromDB(_id: string) {
        await this.db.get(_id).then((doc) => {
            return this.db.remove(doc);
        })
            .then((result) => {
                // console.log('Document deleted successfully:', result);
            })
            .catch((err) => {
                console.error('Error deleting document:', err);
            });

    }
    confirmPublish(item: DraftItem) {
        // console.log(`confirm publish`);
        if (this.confirmPublishModal === undefined) {
            this.confirmPublishModal = new ConfirmPublishModal(this._plugin, item)
        } else {
            this.confirmPublishModal.update(item)
        }
        this.confirmPublishModal.open()
    }
    confirmDelete(item: MaterialItem) {
        // console.log(`confirm delete`);
        let callback = this.deleteMediaItem.bind(this)
        if (item.type === 'draft') {
            callback = this.deleteDraftItem.bind(this)
        }

        if (this.confirmDeleteModal === undefined) {
            this.confirmDeleteModal = new ConfirmDeleteModal(this._plugin, item, callback)

        } else {
            this.confirmDeleteModal.update(item, callback)
        }

        this.confirmDeleteModal.open()
    }
}

export interface MaterialPanelItem {
    name: string;
    type: MediaType;
    timestamp: number;
    url: string;
}
