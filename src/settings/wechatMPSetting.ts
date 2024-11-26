/*
manage the wechat account settings

*/
import PouchDB from 'pouchdb';
import { DownloadableIconPack } from 'src/render/admonition';

export type WeChatMPAccountInfo = {
    _id?: string;
    accountName: string;
    appId: string;
    appSecret: string;
    access_token?: string;
    expires_in?: number;
    lastRefreshTime?: number;
    isTokenValid?: boolean;
    
}
export type WeChatMPSetting = {
	codeLineNumber: boolean;
	css_styles_folder: string;
    _id?: string; // = 'wechat-mp-setting';
    _rev?: string; 
    ipAddress?: string;
    selectedAccount?: string;
    mpAccounts: Array<WeChatMPAccountInfo>;
    icons: Array<DownloadableIconPack>;
    useFontAwesome: boolean;
    rpgDownloadedOnce: boolean;
}

// Create a new database
const db = new PouchDB('wewrite-wechat-mp-setting');

export const getWeChatMPSetting = async (): Promise<WeChatMPSetting|undefined> => {
    return new Promise((resolve, reject) => {
        db.get('wechat-mp-setting')
            .then((doc: any) => {
                resolve(doc);
            })
            .catch((error: any) => {
                console.error('Error getting WeChatMPSetting:', error);
                resolve(undefined)
            });
    })
}

export const saveWeChatMPSetting = async (doc:WeChatMPSetting): Promise<void> => {
    return new Promise((resolve, reject) => {
        doc._id = 'wechat-mp-setting';
        db.get(doc._id).then(existedDoc => {
            doc._rev = existedDoc._rev;
            db.put(doc)
                .then(() => {
                    console.log(`db saved settings.`);
                    resolve();
                })
                .catch((error: any) => {
                    console.error('Error setting WeChatMPSetting:', error);
                    resolve()
                });
        }).catch(error => {
            console.error('save setting error: ',error);
            resolve()
        })
    })
}

