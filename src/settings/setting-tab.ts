/**
 * tab for setting
 */

import { App, DropdownComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import WeWritePlugin from "src/main";

// FileSystem API type definitions
interface FileSystemFileHandle {
	createWritable(): Promise<FileSystemWritableFileStream>;
	getFile(): Promise<File>;
	queryPermission(options: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
}

interface FileSystemDirectoryHandle {
	getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
	queryPermission(options: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
}

declare global {
	interface Window {
		showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
	}
}
import { getPublicIpAddress } from "src/utils/ip-address";
import { ThemeManager } from "src/views/theme-manager";
import { FolderSuggest } from "./folder-suggester";
import { WECHAT_MP_WEB_PAGE } from "./images";
import { WeWriteAccountInfo } from "./wewrite-setting";
import { $t } from "src/lang/i18n";

export class WeWriteSettingTab extends PluginSettingTab {
	private plugin: WeWritePlugin;
	appIdEl: Setting
	appSecretEl: Setting
	accountEl: HTMLElement
	accountDropdown: DropdownComponent
	constructor(app: App, plugin: WeWritePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const { containerEl } = this;

		containerEl.empty();

		// containerEl.createEl('h2', { text: $t('wewrite-settings') })
	
		// containerEl.createEl('hr')
		this.createWeChatSettings(containerEl)
		this.creatCSSStyleSetting(containerEl)
		this.createAiChatSettings(containerEl)
		this.createAiDrawSettings(containerEl)

	} //display	()
	async exportAccountInfo() {
		try {
			if (this.plugin.settings.mpAccounts.length === 0) {
				new Notice($t('no-accounts-to-export'));
				return;
			}

			// Create and download file with all accounts
			const accountsData = JSON.stringify(this.plugin.settings.mpAccounts, null, 2);
			const blob = new Blob([accountsData], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `wechat-accounts-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();

			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			new Notice($t('accounts-exported-successfully') + ` (${this.plugin.settings.mpAccounts.length} accounts)`);
		} catch (error) {
			new Notice($t('failed-to-export-account') + error);
			console.error(error);
		}
	}

	async importAccountInfo() {
		try {
			// Create file input
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.json';

			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;

				const reader = new FileReader();
				reader.onload = async (e) => {
					try {
						const content = e.target?.result as string;
						let importedData: WeWriteAccountInfo | WeWriteAccountInfo[];

						// Validate JSON structure
						try {
							importedData = JSON.parse(content);
						} catch (error) {
							new Notice($t('invalid-json-file'));
							return;
						}

						// Validate account data structure
						const validateAccount = (account: any): account is WeWriteAccountInfo => {
							return typeof account === 'object' &&
								typeof account.accountName === 'string' &&
								typeof account.appId === 'string' &&
								typeof account.appSecret === 'string';
						};

						let accountsToImport: WeWriteAccountInfo[] = [];

						if (Array.isArray(importedData)) {
							// Multiple accounts
							if (!importedData.every(validateAccount)) {
								new Notice($t('invalid-account-data-format'));
								return;
							}
							accountsToImport = importedData;
						} else if (validateAccount(importedData)) {
							// Single account
							accountsToImport = [importedData];
						} else {
							new Notice($t('invalid-account-data-format'));
							return;
						}

						// Filter out duplicates and invalid accounts
						const existingAccounts = this.plugin.settings.mpAccounts;
						const newAccounts = accountsToImport.filter(newAccount =>
							!existingAccounts.some(existingAccount =>
								existingAccount.accountName === newAccount.accountName &&
								existingAccount.appId === newAccount.appId &&
								existingAccount.appSecret === newAccount.appSecret
							)
						);

						if (newAccounts.length === 0) {
							new Notice($t('no-new-accounts-to-import'));
							return;
						}

						// Add new accounts
						this.plugin.settings.mpAccounts.push(...newAccounts);
						await this.plugin.saveSettings();
						this.updateAccountOptions();
						new Notice($t('accounts-imported-successfully') + ` (${newAccounts.length} accounts)`);
					} catch (error) {
						new Notice($t('failed-to-import-accounts') + error);
						console.error(error);
					}
				};

				reader.readAsText(file);
			};

			input.click();
		} catch (error) {
			new Notice($t('failed-to-import-account') + error);
			console.error(error);
		}
	}

	creatCSSStyleSetting(container: HTMLElement) {
		const frame = container.createDiv({ cls: 'wewrite-setting-frame' })
		frame.createEl('h4', { text: 'Custom CSS styles Setting', cls: 'wechat-setting-title' })

		new Setting(frame)
			.setName($t('css-styles-folder-location'))
			.setDesc($t('files-in-this-folder-will-be-available-a'))
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setPlaceholder($t('example-folder1-folder2'))
					.setValue(this.plugin.settings.css_styles_folder)
					.onChange((new_folder) => {
						this.plugin.settings.css_styles_folder = new_folder;
						this.plugin.saveSettings();
					});
			}).addExtraButton(
				(button) => {
					button.setIcon("download")
						.setTooltip($t('download-css-style-themes-from-server'))
						.onClick(async () => {
							ThemeManager.getInstance(this.plugin).downloadThemes();
						});
				}
			);
	}
	newAccountInfo() {
		let n = 0
		let newName = $t('new-account')
		while (true) {
			const account = this.plugin.settings.mpAccounts.find((account: WeWriteAccountInfo) => account.accountName === newName)
			if (account === undefined || account === null) {
				break
			}
			n += 1
			newName = $t('new-account') + n
		}

		const newAccount = {
			accountName: newName,
			appId: '',
			appSecret: ''
		}
		this.plugin.settings.mpAccounts.push(newAccount)
		this.accountDropdown.addOption(newName, newName)
		this.accountDropdown.setValue(newName)
		this.updateAccountSettings(newName, this.accountEl)

	}
	updateAccountSettings(accountName: string | undefined, cEl: HTMLElement) {
		if (accountName === undefined) {
			return
		}
		const account = this.plugin.getMPAccountByName(accountName)
		if (account === undefined) {
			return
		}
		cEl.empty()

		//account Name
		new Setting(cEl)
			.setName($t('account-name'))
			.setDesc($t('account-name-for-your-wechat-official-ac'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(account.accountName)
				.onChange(async (value) => {
					account.accountName = value;
					await this.plugin.saveSettings();
					this.updateAccountOptions()
				}));
		//addId		
		new Setting(cEl)
			.setName('AppId')
			.setDesc($t('appid-for-your-wechat-official-account'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(account.appId)
				.onChange(async (value) => {
					account.appId = value;
					await this.plugin.saveSettings();
				}));


		//addSecret
		new Setting(cEl)
			.setName('App Secret')
			.setDesc($t('app-secret-for-your-wechat-official-acco'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(account.appSecret)
				.onChange(async (value) => {
					account.appSecret = value;
					await this.plugin.saveSettings();
				}));
		// refresh token
		new Setting(cEl)
			.setName($t('test-connection'))
			.setDesc($t('to-check-whether-the-app-id-and-app-secr'))
			.addExtraButton(async button => {
				button.setTooltip($t('click-to-test-connection')).setIcon('plug-zap');
				button.onClick(async () => {
					const success = await this.plugin.TestAccessToken(account.accountName);
					if (success) {
						new Notice($t('successfully-connected-to-wechat-officia'));
					} else {

					}
				});
			})

		// delete this account
		new Setting(cEl)
			.setName($t('delete-account'))
			.setDesc($t('be-carefull-this-will-delete-all-your-se'))
			.setClass('danger-extra-button')
			.addExtraButton(async button => {
				button.setTooltip($t('click-to-delete-account')).setIcon('trash-2');
				button.onClick(async () => {
					this.plugin.settings.mpAccounts = this.plugin.settings.mpAccounts.filter(account => account.accountName !== accountName)
					const account = this.plugin.settings.mpAccounts[0]
					if (account !== undefined) {
						this.plugin.settings.selectedAccount = account.accountName
						this.updateAccountOptions()
					} else {
						this.newAccountInfo()
					}
				});
			})
	}
	updateAccountOptions() {
		this.accountDropdown.selectEl.options.length = 0
		this.plugin.settings.mpAccounts.forEach(account => {
			this.accountDropdown.addOption(account.accountName, account.accountName)
		})
		this.accountDropdown.setValue(this.plugin.settings.selectedAccount ?? '')
	}
	async detectIP(ip: Setting) {
		let address = await getPublicIpAddress();
		if (address === undefined) {
			address = $t('no-ip-address')
		}
		ip.addButton(button => {
			button.setButtonText(address)
			button.onClick(async () => {
				getPublicIpAddress().then(address => {
					button.setButtonText(address)
				})
			});

		})
		ip.addExtraButton(button => {
			button.setIcon('clipboard-copy')
				.setTooltip($t('copy-ip-to-clipboard-0'))
				.onClick(async () => {
					await navigator.clipboard.writeText(await getPublicIpAddress());
					new Notice($t('ip-copied-to-clipboard-0'));
				});
		});
	}
	createAiChatSettings(container: HTMLElement) {

		const frame = container.createDiv({ cls: 'wewrite-setting-frame' })
		frame.createEl('h4', { text: 'chat LLM settings, for text handling', cls: 'wechat-setting-title' })
		//base url
		new Setting(frame)
			.setName('base_url')
			.setDesc('chat LLM API base url')
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.chatLLMBaseUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.chatLLMBaseUrl = value;
					await this.plugin.saveSettings();
				}));
		new Setting(frame)
			.setName('api_key')
			.setDesc('chat LLM API key')
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.chatLLMApiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.chatLLMApiKey = value;
					await this.plugin.saveSettings();
				}));
		new Setting(frame)
			.setName('model')
			.setDesc('chat LLM model')
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.chatLLMModel || '')
				.onChange(async (value) => {
					this.plugin.settings.chatLLMModel = value;
					await this.plugin.saveSettings();
				}));

	}
	createAiDrawSettings(container: HTMLElement) {

		const frame = container.createDiv({ cls: 'wewrite-setting-frame' })
		frame.createEl('h4', { text: 'Draw picture LLM settings, for text handling', cls: 'wechat-setting-title' })
		//base url
		new Setting(frame)
			.setName('base_url')
			.setDesc('draw LLM API base url')
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMBaseUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMBaseUrl = value;
					await this.plugin.saveSettings();
				}));
		new Setting(frame)
			.setName('task_url')
			.setDesc('draw LLM API query task progress url')
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMTaskUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMTaskUrl = value;
					await this.plugin.saveSettings();
				}));
		new Setting(frame)
			.setName('api_key')
			.setDesc('draw LLM API key')
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMApiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMApiKey = value;
					await this.plugin.saveSettings();
				}));
		new Setting(frame)
			.setName('model')
			.setDesc('draw LLM model')
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMModel || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMModel = value;
					await this.plugin.saveSettings();
				}));

	}
	createWeChatSettings(container: HTMLElement) {
		const mpFrame = container.createDiv({ cls: 'wewrite-setting-frame' })
		mpFrame.createEl('h4', { text: 'WeChat MP platform settings', cls: 'wechat-setting-title' })
		mpFrame.createEl('hr')
			// external IP
			const ip = new Setting(mpFrame)
			.setName($t('public-ip-address') + this.plugin.settings.ipAddress)
			.setHeading()
			.setDesc($t('you-should-add-this-ip-to-ip-whitelist-o'))
		this.plugin.updateIpAddress().then(ipAddress => {
			ip.setName('Public IP Address: ' + ipAddress)
		})
		ip.addExtraButton(button => {
			button.setIcon('clipboard-copy')
				.setTooltip($t('copy-ip-to-clipboard'))
				.onClick(async () => {
					await navigator.clipboard.writeText(this.plugin.settings.ipAddress ?? '');
					new Notice($t('ip-copied-to-clipboard'));
				});
		});

		new Setting(mpFrame)
		.setName('Use Center Token Refresh?')
		.setDesc('If you don\'t have a static pubic IP, then use center token refresh.')
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.useCenterToken)
			.onChange(async (value) => {
				this.plugin.settings.useCenterToken = value;
				await this.plugin.saveSettings();
			});
		});
		mpFrame.createEl('hr')
		// Account title
		new Setting(mpFrame)
			.setName($t('account-info'))
			.setHeading()

		const div = mpFrame.createDiv({ cls: 'wewrite-web-image elevated-shadow' })
		div.innerHTML = `<a href="https://mp.weixin.qq.com/cgi-bin/frame?t=pages/developsetting/page/developsetting_frame&nav=10141"><img src="${WECHAT_MP_WEB_PAGE}" alt="wewrite-web-page"></a> </p>`

		new Setting(mpFrame)
			.setName($t('select-wewrite-account'))
			.setDesc($t('choose-the-account-you-want-to-edit'))
			.addDropdown(
				(dropdown) => {
					this.accountDropdown = dropdown
					if (this.plugin.settings.mpAccounts.length == 0) {
						this.newAccountInfo()
					} else {
						this.plugin.settings.mpAccounts.forEach(account => {
							dropdown.addOption(account.accountName, account.accountName)
						})
					}
					dropdown
						.setValue(this.plugin.settings.selectedAccount ?? $t('select-wewrite-account-0'))
						.onChange(async (value) => {
							this.plugin.settings.selectedAccount = value;
							this.updateAccountSettings(this.plugin.settings.selectedAccount, this.accountEl)
							await this.plugin.saveSettings();
							this.plugin.messageService.sendMessage('wechat-account-changed', value)
						});
				}
			)
			.addExtraButton(
				(button) => {
					button.setIcon('plus')
						.setTooltip($t('add-new-account'))
						.onClick(async () => {
							this.newAccountInfo();
						})
				}
			)
		const frame = mpFrame.createDiv({ cls: 'wewrite-account-info-div' })
		const title = frame.createEl('div', { cls: 'wewrite-account-info-title', text: $t('account-info') })
		new Setting(mpFrame)
			.setName('Previewer WX Name')
			.setDesc('send this user for preview of the article')
			.addText(text => text
				.setValue(this.plugin.settings.previewer_wxname || '')
				.onChange(async (value) => {
					this.plugin.settings.previewer_wxname = value;
					await this.plugin.saveSettings();
				}));
		this.accountEl = frame.createDiv({ cls: 'wewrite-account-info-content' })
		this.updateAccountSettings(this.accountDropdown.getValue(), this.accountEl)
		new Setting(mpFrame)
			.setName($t('import-export-wewrite-account'))
			.setDesc($t('import-or-export-your-account-info'))
			.addButton(
				(button) => {
					button.setIcon('download')
						.setTooltip($t('import-account-info'))
						.onClick(async () => {
							this.importAccountInfo();
						})
				}
			)
			.addButton(
				(button) => {
					button.setIcon('upload')
						.setTooltip($t('export-account-info'))
						.onClick(async () => {
							this.exportAccountInfo();

						})
				}
			)

	}
}
