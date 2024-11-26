/**
 * Draft Manager 
 * 
 * - manage the local parameters for WeChat Article rendering parameters
 * - support multi-account switch
 * 
 */

import WeWritePlugin from "src/main";
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
PouchDB.plugin(PouchDBFind);


export type LocalDraftItem = {
    accountName?: string;
    notePath?: string; //obsidan file path for the note. 
    theme?:string; // the theme selected for rendering. missing will use default theme.
    cover_image_url?: string; // the cover image url for the article. could be a obsidian file path or url 
    _id?: string;
    _rev?: string;
    title: string;
    author?: string;
    digest?: string;
    content?: string;
    content_source_url?: string;
    thumb_media_id?: string;
    show_cover_pic?: number;
    need_open_comment?: number;
    only_fans_can_comment?: number;
    pic_crop_235_1?: string; //X1_Y1_X2_Y2, 用分隔符_拼接为X1_Y1_X2_Y2  
    pic_crop_1_1?: string; //X1_Y1_X2_Y2, 用分隔符_拼接为X1_Y1_X2_Y2
    url?: string; //	草稿的临时链接
    
 } 

 export class LocalDraftManager {
    private plugin: WeWritePlugin;
    private db: PouchDB.Database;
    private static instance: LocalDraftManager;
    private constructor(plugin: WeWritePlugin) {
        this.plugin = plugin;
        this.db = new PouchDB('wewrite-local-drafts');
    }
    public static getInstance(plugin: WeWritePlugin): LocalDraftManager {
        if (!LocalDraftManager.instance) {
            LocalDraftManager.instance = new LocalDraftManager(plugin);
        }
        return LocalDraftManager.instance;
    }
    public async getDraft(accountName:string, notePath:string): Promise<LocalDraftItem|undefined> {
        return new Promise((resolve) => {
            // console.log(`this.db=>`, this.db);
            // console.log(`this.db.find=>`, this.db.find);

            // this.db.find({
            //     selector: {
            //         accountName: { $eq: accountName },
            //         notePath: { $eq: notePath }
            //     }
            // }).then((result: PouchDB.Find.FindResponse<LocalDraftItem>) => {
            //     if (result.docs.length > 0){
            //         resolve(result.docs[0])
            //     }
            // }).catch((err) => {
            //     console.error(err);
            // })
            this.db.get(accountName + notePath)
                .then((doc) => {
                    resolve(doc as LocalDraftItem)
                })
                .catch((err) => {
                    // console.error(err);
                    console.log(`no draft found for account: ${accountName}, path: ${notePath}`);
                    resolve(undefined)
                })

        })
    }

    public async setDraft(doc:LocalDraftItem): Promise<void> {
        return new Promise((resolve) => {
            if (doc.accountName === undefined || doc.notePath === undefined){
                console.log(`invalid draft item`, doc);
                return
            }
            if (doc._id === undefined) {
                doc._id = doc.accountName + doc.notePath
            }

            this.db.get(doc._id).then(existedDoc => {
                doc._rev = existedDoc._rev;
                this.db.put(doc)
                    .then(() => {
                        console.log(`db saved local draft.`);
                        resolve();
                    })
                    .catch((error: any) => {
                        console.error('Error saving local draft:', error);
                        resolve()
                    });
            }).catch(error => {
                console.log('save local draft new item ', error);
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
 }