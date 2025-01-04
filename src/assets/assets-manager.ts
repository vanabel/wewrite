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
import WeWritePlugin from "src/main";
import { getErrorMessage } from "src/wechat-api/error-code";
import { DraftItem, MaterialItem, MaterialMeidaItem, MaterialNewsItem, MediaType, NewsItem } from "src/wechat-api/wechat-types";
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import { SrcThumbList } from "src/utils/src-thumb-list";
import { areObjectsEqual } from "./draft-manager";

type ThumbMideaIdSrc = {
    thumb_media_id: string;
    url: string;
}
type ImageSrcSrc = {
    src: string;
    url: string;
}
export type VerifyItem = {
    src: string;
    url: string;
}
// 启用 find 插件
PouchDB.plugin(PouchDBFind);

// import { JSONFilePreset} from 'lowdb/node'
// import { Low } from "lowdb/lib";

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


    private static instance: AssetsManager;
    private _plugin: WeWritePlugin;
    private thumbUrlList: SrcThumbList;
    private imgUrlList: SrcThumbList;
    constructor(app: App, plugin: WeWritePlugin) {
        this.app = app;
        this._plugin = plugin
        this.assets = new Map()
        this.db = new PouchDB('wewrite-wechat-assets');
        this.thumbUrlList = new SrcThumbList();
        this.imgUrlList = new SrcThumbList();
        this._plugin.messageService.registerListener('wechat-account-changed', (data: string) => {
            this.loadMaterial(data)
        })

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

        this.checkAssets()

    }
    public async loadMaterial(accountName: string) {
        
        this._plugin.messageService.sendMessage('clear-news-list', null)
        let list = await this.getAllMeterialOfTypeFromDB(accountName, 'news')

        if (list !== undefined || list !== null) {
            this.assets.set('news', list)
            list.forEach(item => {
                this._plugin.messageService.sendMessage('news-item-updated', item)
            });
        }

        this._plugin.messageService.sendMessage('clear-image-list', null)
        list = await this.getAllMeterialOfTypeFromDB(accountName, 'image')
        if (list !== undefined || list !== null) {
            this.assets.set('image', list)
            list.forEach(item => {
                this._plugin.messageService.sendMessage('image-item-updated', item)
            });
        }

        this._plugin.messageService.sendMessage('clear-voice-list', null)
        list = await this.getAllMeterialOfTypeFromDB(accountName, 'voice')
        if (list !== undefined || list !== null) {
            this.assets.set('voice', list)
            list.forEach(item => {
                this._plugin.messageService.sendMessage('voice-item-updated', item)
            });
        }


        this._plugin.messageService.sendMessage('clear-video-list', null)
        list = await this.getAllMeterialOfTypeFromDB(accountName, 'video')
        if (list !== undefined || list !== null) {
            this.assets.set('video', list)
            list.forEach(item => {
                this._plugin.messageService.sendMessage('video-item-updated', item)
            });
        }

        this._plugin.messageService.sendMessage('clear-draft-list', null)
        list = await this.getAllMeterialOfTypeFromDB(accountName, 'draft')
        if (list !== undefined || list !== null) {
            this.assets.set('draft', list)
            list.forEach(item => {
                this._plugin.messageService.sendMessage('draft-item-updated', item)
            });
        }

        // assets check here.
        this.checkAssets()
        // this._plugin.assetsUpdated()
    }
    public async pullAllMaterial(accountName: string) {
        this._plugin.messageService.sendMessage('clear-draft-list', null)
        this._plugin.messageService.sendMessage('clear-news-list', null)
        this._plugin.messageService.sendMessage('clear-image-list', null)
        this._plugin.messageService.sendMessage('clear-video-list', null)
        this._plugin.messageService.sendMessage('clear-voice-list', null)
        this._plugin.messageService.sendMessage('clear-thumb-list', null)
        this.getAllDrafts((item) => { this._plugin.messageService.sendMessage('draft-item-updated', item) }, accountName)
        this.getAllNews((item) => { this._plugin.messageService.sendMessage('news-item-updated', item) }, accountName)
        this.getAllMaterialOfType('image', (item) => { this._plugin.messageService.sendMessage('image-item-updated', item) }, accountName)
        this.getAllMaterialOfType('video', (item) => { this._plugin.messageService.sendMessage('video-item-updated', item) }, accountName)
        this.getAllMaterialOfType('voice', (item) => { this._plugin.messageService.sendMessage('voice-item-updated', item) }, accountName)
        this.checkAssets()
        this._plugin.assetsUpdated()
    }

    public async getAllNews(callback: (newsItems: DraftItem[]) => void, accountName: string | undefined) {
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
            if (callback) {
                // callback(item)
                item.forEach((i: any) => {
                    callback(i)
                })
            }
        }
        this.assets.set('news', list)
        list.forEach((item: MaterialItem) => {
            item.accountName = accountName
            item.type = 'news'

            this.pushMaterailToDB(item)
        })
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
            if (callback) {
                item.forEach((i: any) => {
                    callback(i)
                })
            }
        }
        this.assets.set('draft', draftList)
        draftList.forEach((i: MaterialItem) => {
            i.accountName = accountName
            i.type = 'draft'
            
            this.pushMaterailToDB(i)
        })
    }
    public async getAllMaterialOfType(type: MediaType, callback: (items: []) => void, accountName: string | undefined) {
        if (type === 'news') {
            return await this.getAllNews(callback, accountName);
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
            if (callback) {
                // callback(item)
                item.forEach((i: any) => {
                    callback(i)
                })
            }
        }
        this.assets.set(type, list)
        list.forEach((item: MaterialItem) => {
            item.accountName = accountName
            item.type = type
            this.pushMaterailToDB(item)
        })
    }
    private getImageSrc(materialItem: MaterialNewsItem[] | DraftItem[]) {
        if (materialItem === undefined || !materialItem) {
        } else {
            materialItem.forEach(news => {
                news.content.news_item.forEach((item: NewsItem) => {
                    if (item.thumb_media_id !== undefined && !item.thumb_media_id) {
                        //not empty
                        const url = this.findUrlOfMediaId('image', item.thumb_media_id)
                        if (url !== undefined) {
                            this.thumbUrlList.add(url, item.url)
                        } else {
                            // we do nothing here, maybe the old one has been deleted
                        }

                    } 
                    const content = item.content

                    const dom = sanitizeHTMLToDom(content)
                    const imgs = dom.querySelectorAll('img')
                    imgs.forEach(img => {
                        const data_src = img.getAttribute('data-src')

                        if (data_src !== null) {
                            this.imgUrlList.add(data_src, item.url)
                        }
                    })
                })
            });
        }
    }
    public async checkAssets() {
        //the function is to findout if a image is used as cover image or embedded in an news or draft article.
        // scope: news, draft.
        // link to the image: data-src
        // media_id in thumb_media_id 
        const images = this.assets.get('image')
        if (images === undefined || !images) {
            return
        }

        //reset the list
        this.thumbUrlList.clear()
        this.imgUrlList.clear()


        const newses = this.assets.get('news')
        this.getImageSrc(newses as MaterialNewsItem[])

        const drafts = this.assets.get('draft')
        this.getImageSrc(drafts as DraftItem[])

        const verifyList = new SrcThumbList()
        this.thumbUrlList.list.forEach((articles, url) => {
            verifyList.add(url, articles)
        })
        this.imgUrlList.list.forEach((articles, url) => {
            verifyList.add(url, articles)
        })

        this._plugin.messageService.sendMessage('src-thumb-list-updated', verifyList)
        images.forEach(image => {
            const used = verifyList.get(image.url) !== undefined
            image.used = used
            this._plugin.messageService.sendMessage('image-used-updated', image)
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
                // this.db.put(doc).then(()=> {
                //     resolve()
                // }).catch((err)=> {
                //     console.error(err);
                //     resolve()
                // })
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
            if (accountName === undefined || !accountName){
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
}