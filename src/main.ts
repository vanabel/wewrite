/**
 * wewrite plugin for Obsidian
 * author: Learner Chen.
 * latest update: 2025-01-24
 */
import {
	debounce,
	EventRef,
	MenuItem,
	Notice,
	Plugin,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import { getPublicIpAddress } from "src/utils/ip-address";
import { AssetsManager } from "./assets/assets-manager";
import { ResourceManager } from "./assets/resource-manager";
import { WeWriteSettingTab } from "./settings/setting-tab";
import {
	getWeWriteSetting,
	saveWeWriteSetting,
	WeWriteSetting,
} from "./settings/wewrite-setting";
import { MessageService } from "./utils/message-service";
import { $t } from "./lang/i18n";
import { ConfirmModal } from "./modals/confirm-modal";
import { PromptModal } from "./modals/prompt-modal";
import { ProofService, showProofSuggestions } from "./modals/proof-suggestion";
import { SynonymsModal } from "./modals/synonyms-modal";
import { AiClient } from "./utils/ai-client";
import { MaterialView, VIEW_TYPE_MP_MATERIAL } from "./views/material-view";
import { PreviewPanel, VIEW_TYPE_NP_PREVIEW } from "./views/previewer";
import { WechatClient } from "./wechat-api/wechat-client";

const DEFAULT_SETTINGS: WeWriteSetting = {
	mpAccounts: [],
	ipAddress: "",
	css_styles_folder: "wewrite-css-styles",
	codeLineNumber: true,
	accountDataPath: "wewrite-accounts",
	chatLLMBaseUrl: "",
	chatLLMApiKey: "",
	useCenterToken: false,
};

export default class WeWritePlugin extends Plugin {
	settings: WeWriteSetting;
	wechatClient: WechatClient;
	assetsManager: AssetsManager;
	aiClient: AiClient | null = null;
	private editorChangeListener: EventRef | null = null;
	matierialView: MaterialView;
	messageService: MessageService;
	resourceManager = ResourceManager.getInstance(this);

	async saveThemeFolder() {
		const config = {
			custom_theme_folder: this.settings.css_styles_folder,
		};
		await this.saveData(config);
		this.messageService.sendMessage("custom-theme-folder-changed", null);
	}
	async loadThemeFolder() {
		const config = await this.loadData();
		if (config && config.custom_theme_folder) {
			this.settings.css_styles_folder = config.custom_theme_folder;
		}
	}
	private spinnerEl: HTMLElement;
	spinnerText: HTMLDivElement;
	saveSettings: Function = debounce(async () => {
		delete this.settings._id;
		delete this.settings._rev;
		await saveWeWriteSetting(this.settings);
		await this.saveThemeFolder();
	}, 3000);
	saveThemeFolderDebounce: Function = debounce(async () => {
		await this.saveThemeFolder();
	}, 3000);

	proofService: ProofService;

	async addEditorMenu() {
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				// @ts-ignore: Obsidian ts defined incomplete.
				let file = editor.editorComponent.file;
				file = file instanceof TFile ? file : this.app.workspace.getActiveFile();

				
				if (!file) {
					return;
				}

				menu.addItem((item) => {
					item.setTitle($t("main.wewrite-ai")).setIcon("sparkles");

					const subMenu = item.setSubmenu();

					if (editor.somethingSelected()) {
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle($t("main.polish"))
								.setIcon("sun")
								.onClick(async () => {
									const content = editor.getSelection();
									const polished = await this.polishContent(
										content
									);

									if (polished) {
										editor.replaceSelection(
											polished,
											content
										);
									}
								});
						});
						// subMenu.addItem((subItem: MenuItem) => {
						// 	subItem
						// 		.setTitle($t('main.proof'))
						// 		.setIcon('user-pen')
						// 		.onClick(async () => {
						// 			const content = editor.getSelection();
						// 			const proofed = await this.proofContent(content);

						// 			if (proofed) {
						// 				this.proofService = showProofSuggestions(editor, proofed)
						// 			}
						// 		});
						// });
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle("synonyms")
								.setIcon("book-a")
								.onClick(async () => {
									const content = editor.getSelection();
									const synonym = await this.getSynonyms(
										content
									);
									this.hideSpinner();

									if (synonym) {
										editor.replaceSelection(
											synonym,
											content
										);
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle($t("main.to-english"))
								.setIcon("languages")
								.onClick(async () => {
									const content = editor.getSelection();
									const translated =
										await this.translateToEnglish(content);

									if (translated) {
										editor.replaceSelection(
											translated,
											content
										);
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle($t("main.to-chinese"))
								.setIcon("languages")
								.onClick(async () => {
									const content = editor.getSelection();
									const translated =
										await this.translateToChinese(content);

									if (translated) {
										editor.replaceSelection(
											translated,
											content
										);
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle($t("main.generate-mermaid"))
								.setIcon("git-compare-arrows")
								.onClick(async () => {
									const content = editor.getSelection();
									const mermaid = await this.generateMermaid(
										content
									);

									if (mermaid) {
										editor.replaceSelection(
											mermaid,
											content
										);
									}
								});
						});
						subMenu.addItem((subItem: MenuItem) => {
							subItem
								.setTitle($t("main.generate-latex"))
								.setIcon("square-radical")
								.onClick(async () => {
									const content = editor.getSelection();
									let latex = await this.generateLaTex(
										content
									);

									if (latex) {
										latex = latex
											.replace(/\\begin{document}/g, "")
											.replace(/\\end{document}/g, "");
										latex = latex.replace(/\\\\/g, "\\");
										editor.replaceSelection(latex, content);
									}
								});
						});
					} else {
						subMenu.addItem((subItem) => {
							subItem
								.setTitle($t("main.polish"))
								.setIcon("user-pen")
								.onClick(async () => {
									const content = await this.app.vault.read(
										file
									);
									const polished = await this.polishContent(
										content
									);
									if (polished) {
										await this.app.vault.modify(
											file,
											polished
										);
									}
								});
						});
						subMenu.addItem((subItem) => {
							subItem
								.setTitle($t("main.proof"))
								.setIcon("user-round-pen")
								.onClick(async () => {
									const content = await this.app.vault.read(
										file
									);
									const proofed = await this.proofContent(
										content
									);

									if (proofed) {
										this.proofService =
											showProofSuggestions(
												editor,
												proofed
											);
									}
								});
						});
					}
				});
			})
		);
	}
	showLeftView() {
		this.activateMaterialView();
	}
	pullAllWeChatMPMaterial() {
		if (this.settings.selectedAccount === undefined) {
			new Notice($t("main.no-wechat-mp-account-selected"));
			return;
		}
		this.assetsManager.pullAllMaterial(this.settings.selectedAccount);
	}
	assetsUpdated() {
		this.messageService.sendMessage("material-updated", null);
	}
	onWeChantMPAccountChange(value: string) {
		if (value === undefined || !value) {
			return;
		}
		this.settings.selectedAccount = value;
		this.assetsManager.loadMaterial(value);
	}

	createSpinner() {
		this.spinnerEl = this.addStatusBarItem();
		this.spinnerEl.addClass("wewrite-spin-container");
		this.spinnerEl.createDiv({
			cls: "wewrite-spinner",
		});
		this.spinnerText = this.spinnerEl.createDiv({
			cls: "wewrite-spinner-text",
		});
	}
	showSpinner(text: string = "") {
		this.spinnerEl.style.display = "flex";
		this.spinnerText.setText(text);
	}
	isSpinning() {
		return this.spinnerEl.style.display !== "none";
	}

	hideSpinner() {
		this.spinnerEl.style.display = "none";
	}

	async loadSettings() {
		this.settings = await Object.assign(
			{},
			DEFAULT_SETTINGS,
			await getWeWriteSetting()
		);
		await this.loadThemeFolder();
	}
	async updateIpAddress(): Promise<string> {
		return new Promise((resolve) => {
			getPublicIpAddress().then(async (ip) => {
				if (ip !== undefined && ip && ip !== this.settings.ipAddress) {
					this.settings.ipAddress = ip;
					await this.saveSettings();
					resolve(ip);
				}
			});
		});
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_NP_PREVIEW);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({
				type: VIEW_TYPE_NP_PREVIEW,
				active: false,
			});
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
			await leaf?.setViewState({
				type: VIEW_TYPE_MP_MATERIAL,
				active: false,
			});
		}

		if (leaf) workspace.revealLeaf(leaf);
	}
	async getAccessToken(accountName: string) {
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			new Notice($t("main.no-wechat-mp-account-selected"));
			return false;
		}
		return account.access_token;
	}
	async TestAccessToken(accountName: string) {
		if (this.settings.useCenterToken) {
			return this.wechatClient.requestToken();
		} else {
			const account = this.getMPAccountByName(accountName);
			if (account === undefined) {
				new Notice($t("main.no-wechat-mp-account-selected"));
				return false;
			}
			const token = await this.wechatClient.getAccessToken(
				account.appId,
				account.appSecret
			);
			if (token) {
				this.setAccessToken(
					accountName,
					token.access_token,
					token.expires_in
				);
				return token.access_token;
			}
		}
		return false;
	}
	async refreshAccessToken(accountName: string | undefined) {
		if (this.settings.useCenterToken) {
			return this.wechatClient.requestToken();
		}
		if (accountName === undefined) {
			return false;
		}
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			new Notice($t("main.no-wechat-mp-account-selected"));
			return false;
		}
		const { appId, appSecret } = account;
		if (
			appId === undefined ||
			appSecret === undefined ||
			!appId ||
			!appSecret
		) {
			new Notice($t("main.please-check-you-appid-and-appsecret"));
			return false;
		}
		const {
			access_token: accessToken,
			expires_in: expiresIn,
			lastRefreshTime,
		} = account;
		if (accessToken === undefined || accessToken === "") {
			const token = await this.wechatClient.getAccessToken(
				appId,
				appSecret
			);
			if (token) {
				this.setAccessToken(
					accountName,
					token.access_token,
					token.expires_in
				);
				return token.access_token;
			}
		} else if (
			lastRefreshTime! + expiresIn! * 1000 <
			new Date().getTime()
		) {
			const token = await this.wechatClient.getAccessToken(
				appId,
				appSecret
			);
			if (token) {
				this.setAccessToken(
					accountName,
					token.access_token,
					token.expires_in
				);
				return token.access_token;
			}
		} else {
			return accessToken;
		}
		return false;
	}
	getMPAccountByName(accountName: string | undefined) {
		return this.settings.mpAccounts.find(
			(account) => account.accountName === accountName
		);
	}
	getSelectedMPAccount() {
		return this.getMPAccountByName(this.settings.selectedAccount);
	}
	setAccessToken(
		accountName: string,
		accessToken: string,
		expires_in: number
	) {
		const account = this.getMPAccountByName(accountName);
		if (account === undefined) {
			return;
		}
		account.access_token = accessToken;
		account.lastRefreshTime = new Date().getTime();
		account.expires_in = expires_in;
		this.saveSettings();
	}
	findImageMediaId(url: string) {
		return this.assetsManager.findMediaIdOfUrl("image", url);
	}

	async generateSummary(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice($t("main.chat-llm-has-not-been-configured"));
			return null;
		}
		try {
			this.showSpinner("summarizing...");
			const result = await this.aiClient.generateSummary(content);
			this.hideSpinner();
			return result;
		} catch (error) {
			console.error("Error showing spinner:", error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async translateToEnglish(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice($t("main.chat-llm-has-not-been-configured"));
			return null;
		}
		try {
			this.showSpinner($t("main.translating-to-english"));
			const result = await this.aiClient.translateText(
				content,
				"Chinese",
				"English"
			);
			this.hideSpinner();
			return result;
		} catch (error) {
			console.error("Error showing spinner:", error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async translateToChinese(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice($t("main.chat-llm-has-not-been-configured"));
			return null;
		}
		try {
			this.showSpinner($t("main.translating-to-chinese"));
			const result = await this.aiClient.translateText(content);
			this.hideSpinner();
			return result;
		} catch (error) {
			console.error("Error showing spinner:", error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async getSynonyms(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice($t("main.chat-llm-has-not-been-configured"));
			return null;
		}
		try {
			this.showSpinner($t("main.get-synonyms"));
			const result = await this.aiClient.synonym(content);
			if (result) {
				const synonyms = result.map((s) => s.replace(/^\d+\.\s*/, ""));
				const selectedWord = await new Promise<string | null>(
					(resolve) => {
						new SynonymsModal(this.app, synonyms, resolve).open();
					}
				);
				return selectedWord ? selectedWord : null;
			}
			return null;
		} catch (error) {
			console.error("Error showing spinner:", error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async generateMermaid(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice($t("main.chat-llm-has-not-been-configured"));
			return null;
		}
		try {
			this.showSpinner($t("main.generating-mermaid"));
			const result = await this.aiClient.generateMermaid(content);
			if (result) {
				const mermaidMatch = result.match(
					/```mermaid\n([\s\S]*?)\n```/
				);
				if (mermaidMatch && mermaidMatch[1]) {
					return `\n\`\`\`mermaid\n${mermaidMatch[1].trim()}\n\`\`\`\n`;
				}
				return result;
			}
			return null;
		} catch (error) {
			console.error("Error generating mermaid:", error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}
	async generateLaTex(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice($t("main.chat-llm-has-not-been-configured"));
			return null;
		}
		try {
			this.showSpinner($t("main.generating-latex"));
			const result = await this.aiClient.generateLaTeX(content);
			if (result) {
				const latexMatch = result.match(/\$\$([\s\S]*?)\$\$/);
				if (latexMatch && latexMatch[0]) {
					return latexMatch[0].trim();
				}
				const codeBlockMatch = result.match(
					/```latex\n([\s\S]*?)\n```/
				);
				if (codeBlockMatch && codeBlockMatch[1]) {
					const innerLatexMatch =
						codeBlockMatch[1].match(/\$\$([\s\S]*?)\$\$/);
					if (innerLatexMatch && innerLatexMatch[0]) {
						return innerLatexMatch[0].trim();
					}
					return `$$${codeBlockMatch[1].trim()}$$`;
				}
				return result;
			}
			return null;
		} catch (error) {
			console.error("Error generating LaTeX:", error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}

	async proofContent(content: string): Promise<any[] | null> {
		if (!this.aiClient) {
			new Notice($t("main.chat-llm-has-not-been-configured"));
			return null;
		}
		try {
			this.showSpinner("Proofing...");
			const result = await this.aiClient.proofContent(content);
			if (result) {
				return result.corrections;
			}
		} catch (error) {
			console.error("Error showing spinner:", error);
		} finally {
			this.hideSpinner();
		}
		return null;
	}

	async polishContent(content: string): Promise<string | null> {
		if (!this.aiClient) {
			new Notice($t("main.chat-llm-has-not-been-configured"));
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
			new Notice($t("main.chat-llm-has-not-been-configured"));
			return null;
		}
		const result = await this.aiClient.generateCoverImage(content);
		if (result) {
			return result.coverImage;
		}
		return null;
	}

	async prompt(
		message: string,
		defaultValue?: string
	): Promise<string | null> {
		return new Promise((resolve) => {
			const modal = new PromptModal(
				this.app,
				message,
				defaultValue,
				resolve
			);
			modal.open();
		});
	}

	async confirm(message: string): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new ConfirmModal(this.app, message, resolve);
			modal.open();
		});
	}
	async onload() {
		this.messageService = new MessageService();
		await this.loadSettings();
		this.wechatClient = WechatClient.getInstance(this);
		this.assetsManager = await AssetsManager.getInstance(this.app, this);
		this.aiClient = AiClient.getInstance(this);

		this.registerView(
			VIEW_TYPE_NP_PREVIEW,
			(leaf) => new PreviewPanel(leaf, this)
		);

		this.registerView(
			VIEW_TYPE_MP_MATERIAL,
			(leaf) => (this.matierialView = new MaterialView(leaf, this))
		);

		this.addCommand({
			id: "wewrite-open-previewer",
			name: $t('main.wewrite-open-previewer'),
			callback: () => this.activateView(),
		});
		this.addCommand({
			id: "wewrite-open-material-view",
			name: $t('main.wewrite-open-material-view'),
			callback: () => this.activateMaterialView(),
		});

		this.addRibbonIcon("pen-tool", "WeWrite", () => {
			this.activateView();
		});

		this.addSettingTab(new WeWriteSettingTab(this.app, this));

		this.addEditorMenu();
		this.createSpinner();
	}

	onunload() {
		if (this.editorChangeListener) {
			this.app.workspace.offref(this.editorChangeListener);
		}
		this.spinnerEl.remove();
		if (this.proofService) {
			this.proofService.destroy();
		}
	}
}
