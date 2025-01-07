/**
 * wewrite plugin for Obsidian
 * author: Learner Chen.
 */
import { EventRef, Notice, Plugin, TFile, WorkspaceLeaf, Menu, MenuItem, Modal, App } from 'obsidian';
import { getPublicIpAddress } from "src/utils/ip-address";
import { AssetsManager } from './assets/assets-manager';
import { ResourceManager } from './assets/resource-manager';
import { WeWriteSettingTab } from './settings/setting-tab';
import { getWeChatMPSetting, saveWeWriteSetting, WeWriteSetting } from './settings/wewrite-setting';
import { MessageService } from './utils/message-service';
// import { ImageEditorModal } from './views/draft-modal';
import { DeepSeekClient } from './utils/deepseek-client';
import { MaterialView, VIEW_TYPE_MP_MATERIAL } from './views/material-view';
import { PreviewPanel, VIEW_TYPE_NP_PREVIEW } from './views/previewer';
import { WechatClient } from './wechat-api/wechat-client';
import { getMetadata, isMarkdownFile } from './utils/urls';


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
	accountDataPath: 'wewrite-accounts',
	deepseekApiUrl: '',
	deepseekApiKey: ''
}

export default class WeWritePlugin extends Plugin {
	updateArticleTitle(value: string) {

	}

	// Add context menu for polish operation
	async addContextMenu() {
		console.log(`addContextMenu of polish`);

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file: TFile) => {
				console.log(`on File-menu:`, file);

				if (file instanceof TFile && isMarkdownFile(file)) {
					menu.addItem((item) => {
						item
							.setTitle('Polish with DeepSeek')
							.setIcon('sparkles')
							.onClick(async () => {
								const content = await this.app.vault.read(file);
								const polished = await this.polishContent(content);
								console.log(`polished:`, polished);

								if (polished) {
									await this.app.vault.modify(file, polished);
									new Notice('Content polished successfully!');
								}
							});
					});
				}
			})
		);
	}
	async addEditorMenu() {
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				const file: TFile
					// @ts-ignore: Obsidian ts defined incomplete.
					= editor.editorComponent.file as (TFile | undefined) ?? this.app.workspace.getActiveFile()!;
				const frontmatter = getMetadata(file, this.app);
				if (!file) {
					return;
				}

				menu.addItem((item) => {
					item
						.setTitle("WeWrite AI")
						.setIcon('sparkles')

					const subMenu = item.setSubmenu()


					if (editor.somethingSelected()) {
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle("Polish Selected Text")
								.setIcon('text-select')
								.onClick(async () => {
									console.log(`polish selected ...`);
									const content = editor.getSelection();
									const polished = await this.polishContent(content);
									console.log(`polished:`, polished);

									if (polished) {
										editor.replaceSelection(polished, content)
										new Notice('Selected content polished successfully!');
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle("Proof Selected Text")
								.setIcon('user-pen')
								.onClick(async () => {
									console.log(`proof selected ...`);
									const content = editor.getSelection();
									const proofed = await this.proofreadContent(content);
									console.log(`proofed:`, proofed);

									if (proofed) {
										// editor.replaceSelection(proofed, content)
										new Notice('Selected content proofed successfully!');
									}
								});
						});
					}

					subMenu.addItem(subItem => {
						subItem
							.setTitle("Polish Whole Note")
							.setIcon('user-pen')
							.onClick(async () => {
								console.log(`polish whole note`);
								const content = await this.app.vault.read(file);
								const polished = await this.polishContent(content);
								console.log(`polished:`, polished);

								if (polished) {
									await this.app.vault.modify(file, polished);
									new Notice('Content polished successfully!');
								}
							});
					});
					subMenu.addItem(subItem => {
						subItem
							.setTitle("Proof Whole Note")
							.setIcon('user-round-pen')
							.onClick(async () => {
								console.log(`Proof whole note`);
								const content = await this.app.vault.read(file);
								const proofed = await this.proofreadContent(content);
								console.log(`proofed:`, proofed);

								if (proofed) {
									// await this.app.vault.modify(file, polished);
									new Notice('Content Proof successfully!');
								}
							});
					});
				});


			}),
		);
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
		this.messageService.sendMessage('material-updated', null)

	}
	onWeChantMPAccountChange(value: string) {
		if (value === undefined || !value) {
			// do nothing
			return;
		}
		this.settings.selectedAccount = value;
		this.assetsManager.loadMaterial(value);
	}
	settings: WeWriteSetting;
	wechatClient: WechatClient;
	assetsManager: AssetsManager;
	deepseekClient: DeepSeekClient | null = null;
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

		// Initialize DeepSeek client if configured
		if (this.settings.deepseekApiUrl && this.settings.deepseekApiKey) {
			this.deepseekClient = DeepSeekClient.getInstance(this);
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
		ribbonIconEl.addClass('wewrite-ribbon-icon');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WeWriteSettingTab(this.app, this));

		// Register context menu for DeepSeek polish operation
		// this.addContextMenu();
		this.addEditorMenu();
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
	async updateIpAddress(): Promise<string> {
		return new Promise(resolve => {
			getPublicIpAddress().then(async (ip) => {
				if (ip !== undefined && ip && ip !== this.settings.ipAddress) {
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
	async getAccessToken(accountName: string) {
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			new Notice('Please select a WeChat MP Account');
			return false;
		}
		return account.access_token
	}
	async TestAccessToken(accountName: string) {
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			new Notice('Please select a WeChat MP Account');
			return false;
		}
		const token = await this.wechatClient.getAccessToken(account.appId, account.appSecret)
		if (token) {
			this.setAccessToken(accountName, token.access_token, token.expires_in)
			return token.access_token
		}
		return false
	}
	async refreshAccessToken(accountName: string | undefined) {
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
		const { access_token: accessToken, expires_in: expiresIn, lastRefreshTime } = account
		// token not exist.
		if (accessToken === undefined || accessToken === '') {
			const token = await this.wechatClient.getAccessToken(appId, appSecret)
			if (token) {
				this.setAccessToken(accountName, token.access_token, token.expires_in)
				return token.access_token
			}
		} else if ((lastRefreshTime! + expiresIn! * 1000) < new Date().getTime()) {
			// token exipred.
			const token = await this.wechatClient.getAccessToken(appId, appSecret)
			if (token) {
				this.setAccessToken(accountName, token.access_token, token.expires_in)
				return token.access_token
			}
		} else {
			return accessToken
		}
		return false // should not be here, something error. 
	}
	getMPAccountByName(accountName: string | undefined) {
		return this.settings.mpAccounts.find(account => account.accountName === accountName);
	}
	getSelectedMPAccount() {
		return this.getMPAccountByName(this.settings.selectedAccount);
	}
	setAccessToken(accountName: string, accessToken: string, expires_in: number) {
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			return
		}
		account.access_token = accessToken;
		account.lastRefreshTime = new Date().getTime();
		account.expires_in = expires_in;
		this.saveSettings();
	}
	findImageMediaId(url: string) {
		return this.assetsManager.findMediaIdOfUrl('image', url)
	}

	async generateSummary(content: string): Promise<string | null> {
		if (!this.deepseekClient) {
			new Notice('DeepSeek API is not configured');
			return null;
		}
		const result = await this.deepseekClient.generateSummary(content);
		return result;
	}

	async proofreadContent(content: string): Promise<{ original: string, corrected: string }[] | null> {
		if (!this.deepseekClient) {
			new Notice('DeepSeek API is not configured');
			return null;
		}
		const result = await this.deepseekClient.proofreadContent(content);
		if (result) {
			return result.corrections;
		}
		return null;
	}

	async polishContent(content: string): Promise<string | null> {
		if (!this.deepseekClient) {
			new Notice('DeepSeek API is not configured');
			return null;
		}
		const result = await this.deepseekClient.polishContent(content);
		if (result) {
			return result.polished;
		}
		return null;
	}

	async generateCoverImage(content: string): Promise<string | null> {
		if (!this.deepseekClient) {
			new Notice('DeepSeek API is not configured');
			return null;
		}
		const result = await this.deepseekClient.generateCoverImage(content);
		if (result) {
			return result.coverImage;
		}
		return null;
	}

	async prompt(message: string, defaultValue?: string): Promise<string | null> {
		return new Promise((resolve) => {
			const modal = new PromptModal(this.app, message, defaultValue, resolve);
			// this.app.workspace.openModal(modal);
			modal.open()
		});
	}

	async confirm(message: string): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new ConfirmModal(this.app, message, resolve);
			// this.app.workspace.openModal(modal);
			modal.open()
		});
	}
}

class PromptModal extends Modal {
	private resolve: (value: string | null) => void;
	private inputEl: HTMLInputElement;

	constructor(
		app: App,
		private message: string,
		private defaultValue: string = '',
		resolve: (value: string | null) => void
	) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('p', { text: this.message });

		this.inputEl = contentEl.createEl('input', {
			type: 'text',
			value: this.defaultValue
		});

		const buttonContainer = contentEl.createDiv('modal-button-container');
		buttonContainer.createEl('button', { text: 'OK' })
			.addEventListener('click', () => {
				this.resolve(this.inputEl.value);
				this.close();
			});

		buttonContainer.createEl('button', { text: 'Cancel' })
			.addEventListener('click', () => {
				this.resolve(null);
				this.close();
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class ConfirmModal extends Modal {
	private resolve: (value: boolean) => void;

	constructor(
		app: App,
		private message: string,
		resolve: (value: boolean) => void
	) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('p', { text: this.message });

		const buttonContainer = contentEl.createDiv('modal-button-container');
		buttonContainer.createEl('button', { text: 'Confirm' })
			.addEventListener('click', () => {
				this.resolve(true);
				this.close();
			});

		buttonContainer.createEl('button', { text: 'Cancel' })
			.addEventListener('click', () => {
				this.resolve(false);
				this.close();
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
