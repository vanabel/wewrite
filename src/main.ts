/**
 * wewrite plugin for Obsidian
 * author: Learner Chen.
 */
import { EventRef, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { getPublicIpAddress } from "src/utils/ip-address";
import { AssetsManager } from './assets/assets-manager';
import { ResourceManager } from './assets/resource-manager';
import { WeWriteSettingTab } from './settings/setting-tab';
import { getWeChatMPSetting, saveWeWriteSetting, WeWriteSetting } from './settings/wewrite-setting';
import { MessageService } from './utils/message-service';
import { MaterialView, VIEW_TYPE_MP_MATERIAL } from './views/material-view';
import { PreviewPanel, VIEW_TYPE_NP_PREVIEW } from './views/previewer';
import { WechatClient } from './wechat-api/wechat-client';
import { ImageEditorModal } from './views/draft-modal';


const DEFAULT_SETTINGS: WeWriteSetting = {
	mpAccounts: [
		{
			accountName: '',
			appId: '',
			appSecret: '',
		}
	],
	ipAddress: '',
	css_styles_folder: 'wewrite-css-styles',
	codeLineNumber: true,
	useFontAwesome: true,
    rpgDownloadedOnce: false,
	
}

export default class WeWritePlugin extends Plugin {
    updateArticleTitle(value: string) {
    
    }
    showLeftView() {
        this.activateMaterialView()
    }
    pullAllWeChatMPMaterial() {
		if (this.settings.selectedAccount === undefined) {
			new Notice('Please select a WeChat account first');
			return;
		}
		this.assetsManager.pullAllMaterial(this.settings.selectedAccount)
    }
    assetsUpdated() {
		//TODO
		console.log(`assetsUpdated:Method not implemented. `);
		
    }
    onWeChantMPAccountChange(value: string) {
		if (value === undefined || !value){
			// do nothing
			return;
		} 
		this.settings.selectedAccount = value;
		this.assetsManager.loadMaterial(value);
    }
	save_settings() {
		throw new Error("Method not implemented.");
	}
	settings: WeWriteSetting;
	wechatClient: WechatClient;
	assetsManager: AssetsManager;
	private editorChangeListener: EventRef | null = null;
	matierialView: MaterialView;
	messageService: MessageService;
	resourceManager = ResourceManager.getInstance(this);

	async onload() {
		this.messageService = new MessageService();
		await this.loadSettings();
		this.wechatClient = WechatClient.getInstance(this);
		this.assetsManager = await AssetsManager.getInstance(this.app, this);
		if (this.settings.selectedAccount !== undefined) {
            await this.assetsManager.loadMaterial(this.settings.selectedAccount)
        }

		this.registerView(
			VIEW_TYPE_NP_PREVIEW,
			(leaf) => new PreviewPanel(leaf, this)
		);
		
		this.registerView(
			VIEW_TYPE_MP_MATERIAL,
			(leaf) => (this.matierialView = new MaterialView(leaf, this)),
		  );

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('scan-eye', 'WeWrite', (evt: MouseEvent) => {
			this.activateView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WeWriteSettingTab(this.app, this));
		this.addCommand({
			id: 'open-image-editor',
			name: 'Open Image Editor',
			callback: () => {
				new ImageEditorModal(this.app, this).open();
			}
		});
	}

	onunload() {
		if (this.editorChangeListener) {
			this.app.workspace.offref(this.editorChangeListener);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await getWeChatMPSetting());
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async updateIpAddress():Promise<string>{
		return new Promise(resolve => {
			getPublicIpAddress().then(async (ip) => {
				if (ip !== undefined && ip && ip !== this.settings.ipAddress){
					this.settings.ipAddress = ip;
					await this.saveSettings();
					resolve(ip);
				}
			})
		});
	}

	async saveSettings() {
		delete this.settings._id
		delete this.settings._rev
		await this.saveData(this.settings);
		await saveWeWriteSetting(this.settings);
	}
	async activateView() {
		const { workspace } = this.app;
		
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_NP_PREVIEW);
	
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
		  	leaf = workspace.getRightLeaf(false);
		  	await leaf?.setViewState({ type: VIEW_TYPE_NP_PREVIEW, active: false });
		}
	
		if (leaf) workspace.revealLeaf(leaf);
		
		
	}
	async activateMaterialView() {
		const { workspace } = this.app;
		
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_MP_MATERIAL);
	
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
		  	leaf = workspace.getLeftLeaf(false);
		  	await leaf?.setViewState({ type: VIEW_TYPE_MP_MATERIAL, active: false });
		}
	
		if (leaf) workspace.revealLeaf(leaf);
		
		
	}
	async getAccessToken(accountName:string) {
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			new Notice('Please select a WeChat MP Account');
			return false;
		}
		return account.access_token
	}
	async TestAccessToken(accountName:string) {
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			new Notice('Please select a WeChat MP Account');
			return false;
		}
		const token =  await this.wechatClient.getAccessToken(account.appId, account.appSecret)
		if (token){
			this.setAccessToken(accountName, token.access_token, token.expires_in)
			return token.access_token
		}
		return false
	}
	async refreshAccessToken(accountName: string|undefined){
		if (accountName === undefined) {
			return false
		}
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			new Notice('Please select a WeChat MP Account');
			return false;
		}
		const { appId, appSecret } = account;
		if (appId === undefined || appSecret === undefined || !appId || !appSecret) {
			new Notice('Please give check your [appid] and [secret]');
			return false;
		}
		const {access_token: accessToken, expires_in: expiresIn, lastRefreshTime} = account
		// token not exist.
		if (accessToken === undefined || accessToken === ''){
			console.log(`token not exist, try get it first time.`);
			
			const token = await this.wechatClient.getAccessToken(appId, appSecret)
			if (token){
				this.setAccessToken(accountName, token.access_token, token.expires_in)
				return token.access_token
			}
		}else if ((lastRefreshTime! + expiresIn!*1000) <  new Date().getTime()){
			// token exipred.
			console.log(`token exipred, referesh it.`);
			const token = await this.wechatClient.getAccessToken(appId, appSecret)
			if (token){
				this.setAccessToken(accountName, token.access_token, token.expires_in)
				return token.access_token
			}
		}else{
			console.log(`token is still valid: ${accountName}: access token: ${accessToken} `);
			return accessToken
		}
		return false // should not be here, something error. 
	}
	getMPAccountByName(accountName: string|undefined) {
		console.log(`getMPAccountByName`, this.settings);
		
		return this.settings.mpAccounts.find(account => account.accountName === accountName);
	}
	getSelectedMPAccount() {
		return this.getMPAccountByName(this.settings.selectedAccount);
	}
	setAccessToken(accountName:string, accessToken: string, expires_in:number) {
		const account = this.getMPAccountByName(accountName);
		if (account === undefined){
			return
		}
		account.access_token = accessToken;
		account.lastRefreshTime = new Date().getTime();
		account.expires_in = expires_in;
		this.saveSettings();
	}
	findImageMediaId(url:string){
		return this.assetsManager.findMediaIdOfUrl('image', url)
	}
}


