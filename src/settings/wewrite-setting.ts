/*
manage the wechat account settings

*/
import PouchDB from 'pouchdb';
import { areObjectsEqual } from 'src/utils/utils';

export type WeWriteAccountInfo = {
    _id?: string;
    accountName: string;
    appId: string;
    appSecret: string;
    access_token?: string;
    expires_in?: number;
    lastRefreshTime?: number;
    isTokenValid?: boolean;

}
export type WeWriteSetting = {
    previewer_wxname?: string;
    custom_theme?: string;
    codeLineNumber: boolean;
    css_styles_folder: string;
    _id?: string; // = 'wewrite-setting';
    _rev?: string;
    ipAddress?: string;
    selectedAccount?: string;
    mpAccounts: Array<WeWriteAccountInfo>;
    useFontAwesome: boolean;
    rpgDownloadedOnce: boolean;
    accountDataPath: string;
    chatLLMBaseUrl?: string;
    chatLLMApiKey?: string;
    chatLLMModel?: string;
    drawLLMBaseUrl?: string;
    drawLLMTaskUrl?: string;
    drawLLMApiKey?: string;
    drawLLMModel?: string;

}

// Create a new database
const db = new PouchDB('wewrite-settings');

export const getWeWriteSetting = async (): Promise<WeWriteSetting | undefined> => {
    return new Promise((resolve, reject) => {
        db.get('wewrite-settings')
            .then((doc: any) => {
                resolve(doc);
            })
            .catch((error: any) => {
                console.error('Error getting WeWriteSetting:', error);
                resolve(undefined)
            });
    })
}

export const saveWeWriteSetting = async (doc: WeWriteSetting): Promise<void> => {
    return new Promise((resolve, reject) => {
        doc._id = 'wewrite-settings';
        db.get(doc._id).then(existedDoc => {
            if (areObjectsEqual(doc, existedDoc)) {
                // the material has not been changed
                resolve()
            }
            doc._rev = existedDoc._rev;
            db.put(doc)
                .then(() => {
                    resolve();
                })
                .catch((error: any) => {
                    console.error('Error setting WeWriteSetting:', error);
                    resolve()
                });
        }).catch(error => {
            // console.error('save setting error: ',error);
            db.put(doc)
                .then(() => {
                    resolve();
                })
                .catch((error: any) => {
                    console.error('Error setting WeWriteSetting:', error);
                    resolve()
                });
        })
    })
}
