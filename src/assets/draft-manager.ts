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

export function areObjectsEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key) || !areObjectsEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

export type LocalDraftItem = {
    accountName?: string;
    notePath?: string; //obsidan file path for the note. 
    theme?: string; // the theme selected for rendering. missing will use default theme.
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
    last_draft_url?: string; //	草稿的临时链接
    last_draft_id?: string; //

}

export class LocalDraftManager {
    private _plugin: WeWritePlugin;
    private db: PouchDB.Database;
    private static instance: LocalDraftManager;
    private constructor(plugin: WeWritePlugin) {
        this._plugin = plugin;
        this.db = new PouchDB('wewrite-local-drafts');
    }
    public static getInstance(plugin: WeWritePlugin): LocalDraftManager {
        if (!LocalDraftManager.instance) {
            LocalDraftManager.instance = new LocalDraftManager(plugin);
        }
        return LocalDraftManager.instance;
    }
    public async getDrafOfActiveNote() {
        let draft: LocalDraftItem | undefined

        const accountName = this._plugin.settings.selectedAccount;
        if (accountName !== undefined && accountName) {
            const f = this._plugin.app.workspace.getActiveFile()
            if (f) {
                draft = await this.getDraft(accountName, f.path)
                if (draft === undefined) {
                    draft = {
                        accountName: accountName,
                        notePath: f.path,
                        title: f.basename,
                        _id: accountName + f.path
                    }
                    await this.setDraft(draft)

                }
            }
        }
        return draft
    }
    public isActiveNoteDraft(draft: LocalDraftItem | undefined) {
        const activeFile = this._plugin.app.workspace.getActiveFile()
        if (draft === undefined && activeFile === null) {
            return true
        }
        if (draft !== undefined && activeFile ) {
            return draft.notePath === activeFile.path
        }
        return false
    }
    public async getDraft(accountName: string, notePath: string): Promise<LocalDraftItem | undefined> {
        return new Promise((resolve) => {
            this.db.get(accountName + notePath)
                .then((doc) => {
                    resolve(doc as LocalDraftItem)
                })
                .catch((err) => {
                    resolve(undefined)
                })

        })
    }

    public async setDraft(doc: LocalDraftItem): Promise<void> {
        return new Promise((resolve) => {
            if (doc.accountName === undefined || doc.notePath === undefined) {
                return
            }
            if (doc._id === undefined) {
                doc._id = doc.accountName + doc.notePath
            }
            this.db.get(doc._id).then(existedDoc => {
                if (areObjectsEqual(doc, existedDoc)) {
                    // the draft has not been changed
                    resolve()

                } else {
                    doc._rev = existedDoc._rev;
                    this.db.put(doc)
                        .then(() => {
                            resolve();
                        })
                        .catch((error: any) => {
                            console.error('Error saving local draft:', error);
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
}