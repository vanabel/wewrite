/**
 * wewrite plugin for Obsidian
 * author: Learner Chen.
 */
import { EventRef, Notice, Plugin, TFile, WorkspaceLeaf, Menu, MenuItem, Modal, App, getIcon } from 'obsidian';
import { getPublicIpAddress } from "src/utils/ip-address";
import { AssetsManager } from './assets/assets-manager';
import { ResourceManager } from './assets/resource-manager';
import { WeWriteSettingTab } from './settings/setting-tab';
import { getWeWriteSetting, saveWeWriteSetting, WeWriteSetting } from './settings/wewrite-setting';
import { MessageService } from './utils/message-service';
// import { ImageEditorModal } from './views/draft-modal';
import { AiClient } from './utils/ai-client';
import { MaterialView, VIEW_TYPE_MP_MATERIAL } from './views/material-view';
import { PreviewPanel, VIEW_TYPE_NP_PREVIEW } from './views/previewer';
import { WechatClient } from './wechat-api/wechat-client';
import { getMetadata, isMarkdownFile } from './utils/urls';
import { loadWeWriteIcons } from './assets/icons';
import { showProofSuggestions } from './views/proof-suggestion';


const DEFAULT_SETTINGS: WeWriteSetting = {
	mpAccounts: [],
	ipAddress: '',
	css_styles_folder: 'wewrite-css-styles',
	codeLineNumber: true,
	accountDataPath: 'wewrite-accounts',
	chatLLMBaseUrl: '',
	chatLLMApiKey: '',
	useCenterToken: false,
}

export default class WeWritePlugin extends Plugin {
	private spinnerEl: HTMLElement;
	spinnerText: HTMLDivElement;

	updateArticleTitle(value: string) {

	}

	addIcons() {
		this
	}
	// Add context menu for polish operation
	// async addContextMenu() {
	// 	this.registerEvent(
	// 		this.app.workspace.on('file-menu', (menu, file: TFile) => {
	// 			if (file instanceof TFile && isMarkdownFile(file)) {
	// 				menu.addItem((item) => {
	// 					item
	// 						.setTitle('Polish with DeepSeek')
	// 						.setIcon('sparkles')
	// 						.onClick(async () => {
	// 							const content = await this.app.vault.read(file);
	// 							const polished = await this.polishContent(content);

	// 							if (polished) {
	// 								await this.app.vault.modify(file, polished);
	// 								new Notice('Content polished successfully!');
	// 							}
	// 						});
	// 				});
	// 			}
	// 		})
	// 	);
	// }
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
								.setIcon('sun')
								.onClick(async () => {
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
									const proofed = await this.proofContent(content);
									console.log(`proofed:`, proofed);

									if (proofed) {
										// editor.replaceSelection(proofed, content)
										showProofSuggestions(this.app, proofed, editor)
										new Notice('Selected content proofed successfully!');
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle("Synonyms for Selected Text")
								.setIcon('book-a')
								.onClick(async () => {
									console.log(`synonyms selected ...`);
									const content = editor.getSelection();
									const proofed = await this.getSynonyms(content);
									console.log(`synonyms:`, proofed);

									if (proofed) {
										// editor.replaceSelection(proofed, content)
										new Notice('Selected content synonyms successfully!');
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle("to English")
								.setIcon('languages')
								.onClick(async () => {
									console.log(`to English ...`);
									const content = editor.getSelection();
									const translated = await this.translateToEnglish(content);
									console.log(`translated:`, translated);

									if (translated) {
										editor.replaceSelection(translated, content)
										new Notice('Selected content translated successfully!');
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle("to Chinese")
								.setIcon('languages')
								.onClick(async () => {
									console.log(`to Chinese ...`);
									const content = editor.getSelection();
									const translated = await this.translateToChinese(content);
									console.log(`translated:`, translated);

									if (translated) {
										editor.replaceSelection(translated, content)
										new Notice('Selected content translated successfully!');
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle("to Mermaid")
								.setIcon('git-compare-arrows')
								.onClick(async () => {
									console.log(`to mermaid ...`);
									const content = editor.getSelection();
									const proofed = await this.generateMermaid(content);
									console.log(`mermaid:`, proofed);

									if (proofed) {
										// editor.replaceSelection(proofed, content)
										new Notice('Selected content mermaid successfully!');
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle("to LaTeX")
								.setIcon('square-radical')
								.onClick(async () => {
									console.log(`to LaTeX ...`);
									const content = editor.getSelection();
									const proofed = await this.generateLaTex(content);
									console.log(`LaTeX:`, proofed);

									if (proofed) {
										// editor.replaceSelection(proofed, content)
										new Notice('Selected content LaTeX successfully!');
									}
								});
						});
					} else {
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
									const proofed = await this.proofContent(content);
									console.log(`proofed:`, proofed);

									if (proofed) {
										// await this.app.vault.modify(file, polished);
										showProofSuggestions(this.app, proofed, editor)
										new Notice('Content Proof successfully!');
									}
								});
						});
					}
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
	aiClient: AiClient | null = null;
	private editorChangeListener: EventRef | null = null;
	matierialView: MaterialView;
	messageService: MessageService;
	resourceManager = ResourceManager.getInstance(this);

	createSpinner() {
		this.spinnerEl = this.addStatusBarItem();
		this.spinnerEl.addClass('wewrite-spin-container');
		this.spinnerEl.createDiv({
			cls: 'wewrite-spinner',
		});
		this.spinnerText = this.spinnerEl.createDiv({
			cls: 'wewrite-spinner-text',
		});

		// this.spinnerEl.style.display = 'none';
	}
	async onload() {
		this.messageService = new MessageService();
		loadWeWriteIcons()

		await this.loadSettings();
		this.wechatClient = WechatClient.getInstance(this);
		this.assetsManager = await AssetsManager.getInstance(this.app, this);
		// if (this.settings.selectedAccount !== undefined) {
		// 	await this.assetsManager.loadMaterial(this.settings.selectedAccount)
		// }
		// Initialize DeepSeek client if configured
		// if (this.settings.chatLLMBaseUrl && this.settings.chatLLMApiKey) {
		this.aiClient = AiClient.getInstance(this);
		// }

		this.registerView(
			VIEW_TYPE_NP_PREVIEW,
			(leaf) => new PreviewPanel(leaf, this)
		);

		this.registerView(
			VIEW_TYPE_MP_MATERIAL,
			(leaf) => (this.matierialView = new MaterialView(leaf, this)),
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('pen-tool', 'WeWrite', (evt: MouseEvent) => {
			this.activateView();
		});
		ribbonIconEl.addClass('wewrite-ribbon-icon');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WeWriteSettingTab(this.app, this));

		// Register context menu for DeepSeek polish operation
		// this.addContextMenu();
		this.addEditorMenu();
		this.createSpinner()

	}
	showSpinner(text: string = "") {
		this.spinnerEl.style.display = 'flex';
		this.spinnerText.setText(text);
		// this.spinnerText.setText(text);
	}
	isSpinning(){
		return this.spinnerEl.style.display !== 'none';
	}

	hideSpinner() {
		this.spinnerEl.style.display = 'none';
	}
	onunload() {
		if (this.editorChangeListener) {
			this.app.workspace.offref(this.editorChangeListener);
		}
		// 移除 spinner 元素
		this.spinnerEl.remove();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await getWeWriteSetting());
		// this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
		// await this.saveData(this.settings);
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
		if (this.settings.useCenterToken) {
			return this.wechatClient.requestToken()
		} else {

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
		}
		return false
	}
	async refreshAccessToken(accountName: string | undefined) {
		if (this.settings.useCenterToken) {
			return this.wechatClient.requestToken()
		}
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
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		try {
			this.showSpinner('Generating summary...');
			const result = await this.aiClient.generateSummary(content);
			this.hideSpinner();
			return result;
		} catch (error) {
			console.error('Error showing spinner:', error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async translateToEnglish(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		try {
			this.showSpinner('tranlating to English...');
			const result = await this.aiClient.translateText(content, 'Chinese', 'English');
			this.hideSpinner();
			return result;
		} catch (error) {
			console.error('Error showing spinner:', error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async translateToChinese(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		try {
			this.showSpinner('tranlating to Chinese...');
			const result = await this.aiClient.translateText(content);
			this.hideSpinner();
			return result;
		} catch (error) {
			console.error('Error showing spinner:', error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async getSynonyms(content: string): Promise<string[] | null> {
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		try {
			this.showSpinner('get synonyms ...');
			const result = await this.aiClient.synonym(content);
			this.hideSpinner();
			return result;
		} catch (error) {
			console.error('Error showing spinner:', error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async generateMermaid(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		try {
			this.showSpinner('get mermaid ...');
			const result = await this.aiClient.generateMermaid(content);
			this.hideSpinner();
			return result;
		} catch (error) {
			console.error('Error showing spinner:', error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async generateLaTex(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		try {
			this.showSpinner('get LaTex ...');
			const result = await this.aiClient.generateLaTeX(content);
			return result;
		} catch (error) {
			console.error('Error showing spinner:', error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}

	async proofContent(content: string): Promise<any[] | null> {
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		try {
			this.showSpinner('proofing content...');
			const result = await this.aiClient.proofContent(content);
			if (result) {
				return result.corrections;
			}
		} catch (error) {
			console.error('Error showing spinner:', error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}

	async polishContent(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		const result = await this.aiClient.polishContent(content);
		if (result) {
			return result.polished;
		}
		return null;
	}

	async generateCoverImage(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice('AI API is not configured');
			return null;
		}
		const result = await this.aiClient.generateCoverImage(content);
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
