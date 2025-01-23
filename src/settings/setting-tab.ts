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
		showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
	}
}

interface SaveFilePickerOptions {
	suggestedName?: string;
	types?: FilePickerAcceptType[];
}

interface FilePickerAcceptType {
	description: string;
	accept: Record<string, string[]>;
}
import { getPublicIpAddress } from "src/utils/ip-address";
import { ThemeManager } from "src/views/theme-manager";
import { FolderSuggest } from "./folder-suggester";
import { WECHAT_MP_WEB_PAGE } from "./images";
import { WeWriteAccountInfo, WeWriteSetting } from "./wewrite-setting";
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
	// async exportAccountInfo() {
	// 	try {
	// 		if (this.plugin.settings.mpAccounts.length === 0) {
	// 			new Notice($t('no-accounts-to-export'));
	// 			return;
	// 		}

	// 		// Create and download file with all accounts
	// 		const accountsData = JSON.stringify(this.plugin.settings.mpAccounts, null, 2);
	// 		const blob = new Blob([accountsData], { type: 'application/json' });
	// 		const url = URL.createObjectURL(blob);

	// 		const a = document.createElement('a');
	// 		a.href = url;
	// 		a.download = `wechat-accounts-${new Date().toISOString().slice(0, 10)}.json`;
	// 		document.body.appendChild(a);
	// 		a.click();

	// 		document.body.removeChild(a);
	// 		URL.revokeObjectURL(url);

	// 		new Notice($t('accounts-exported-successfully') + ` (${this.plugin.settings.mpAccounts.length} accounts)`);
	// 	} catch (error) {
	// 		new Notice($t('failed-to-export-account') + error);
	// 		console.error(error);
	// 	}
	// }
	async exportSettings() {
		try {
			const settingData = JSON.stringify(this.plugin.settings, null, 2);
			const blob = new Blob([settingData], { type: 'application/json' });
			
			// Use File System Access API for better control
			const fileHandle = await window.showSaveFilePicker({
				suggestedName: `wewrite-settings-${new Date().toISOString().slice(0, 10)}.json`,
				types: [{
					description: 'JSON Files',
					accept: { 'application/json': ['.json'] }
				}]
			});
			
			// User selected a file location
			const writable = await fileHandle.createWritable();
			await writable.write(blob);
			await writable.close();
			
			new Notice('Settings exported successfully!');
			return true;
		} catch (error) {
			if (error.name === 'AbortError') {
				// User canceled the save dialog
				return false;
			}
			new Notice('Settings export failed: ' + error);
			console.error(error);
			return false;
		}
	}

	// async importAccountInfo() {
	// 	try {
	// 		// Create file input
	// 		const input = document.createElement('input');
	// 		input.type = 'file';
	// 		input.accept = '.json';

	// 		input.onchange = async (e) => {
	// 			const file = (e.target as HTMLInputElement).files?.[0];
	// 			if (!file) return;

	// 			const reader = new FileReader();
	// 			reader.onload = async (e) => {
	// 				try {
	// 					const content = e.target?.result as string;
	// 					let importedData: WeWriteAccountInfo | WeWriteAccountInfo[];

	// 					// Validate JSON structure
	// 					try {
	// 						importedData = JSON.parse(content);
	// 					} catch (error) {
	// 						new Notice($t('invalid-json-file'));
	// 						return;
	// 					}

	// 					// Validate account data structure
	// 					const validateAccount = (account: any): account is WeWriteAccountInfo => {
	// 						return typeof account === 'object' &&
	// 							typeof account.accountName === 'string' &&
	// 							typeof account.appId === 'string' &&
	// 							typeof account.appSecret === 'string';
	// 					};

	// 					let accountsToImport: WeWriteAccountInfo[] = [];

	// 					if (Array.isArray(importedData)) {
	// 						// Multiple accounts
	// 						if (!importedData.every(validateAccount)) {
	// 							new Notice($t('invalid-account-data-format'));
	// 							return;
	// 						}
	// 						accountsToImport = importedData;
	// 					} else if (validateAccount(importedData)) {
	// 						// Single account
	// 						accountsToImport = [importedData];
	// 					} else {
	// 						new Notice($t('invalid-account-data-format'));
	// 						return;
	// 					}

	// 					// Filter out duplicates and invalid accounts
	// 					const existingAccounts = this.plugin.settings.mpAccounts;
	// 					const newAccounts = accountsToImport.filter(newAccount =>
	// 						!existingAccounts.some(existingAccount =>
	// 							existingAccount.accountName === newAccount.accountName &&
	// 							existingAccount.appId === newAccount.appId &&
	// 							existingAccount.appSecret === newAccount.appSecret
	// 						)
	// 					);

	// 					if (newAccounts.length === 0) {
	// 						new Notice($t('no-new-accounts-to-import'));
	// 						return;
	// 					}

	// 					// Add new accounts
	// 					this.plugin.settings.mpAccounts.push(...newAccounts);
	// 					await this.plugin.saveSettings();
	// 					this.updateAccountOptions();
	// 					new Notice($t('accounts-imported-successfully') + ` (${newAccounts.length} accounts)`);
	// 				} catch (error) {
	// 					new Notice($t('failed-to-import-accounts') + error);
	// 					console.error(error);
	// 				}
	// 			};

	// 			reader.readAsText(file);
	// 		};

	// 		input.click();
	// 	} catch (error) {
	// 		new Notice($t('failed-to-import-account') + error);
	// 		console.error(error);
	// 	}
	// }
	async importSettings() {
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
						let importedData: WeWriteSetting;

						// Validate JSON structure
						try {
							importedData = JSON.parse(content);
						} catch (error) {
							new Notice($t('settings.import.invalid_json'));
							return;
						}


						// Validate account data structure
						const {mpAccounts, css_styles_folder} = importedData;
						if (mpAccounts === undefined || css_styles_folder === undefined){
							new Notice($t('settings.import.invalid_file'));
							return 
						}
						console.log(`settings:`, importedData);

						this.plugin.settings = importedData;
						// save it
						await this.plugin.saveSettings();
						this.updateAccountOptions();
						this.display();
						new Notice($t('settings.import.success'));
					} catch (error) {
						new Notice($t('settings.import.failed') + error);
						console.error(error);
					}
				};

				reader.readAsText(file);
			};

			input.click();
		} catch (error) {
			new Notice($t('settings.import.error') + error);
			console.error(error);
		}
	}

	creatCSSStyleSetting(container: HTMLElement) {
		const frame = container.createDiv({ cls: 'wewrite-setting-frame' })
		frame.createEl('h4', { text: $t('settings.title.css_styles'), cls: 'wechat-setting-title' })

		new Setting(frame)
			.setName($t('settings.css.folder_location'))
			.setDesc($t('settings.css.folder_desc'))
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setPlaceholder($t('settings.css.folder_placeholder'))
					.setValue(this.plugin.settings.css_styles_folder)
					.onChange((new_folder) => {
						this.plugin.settings.css_styles_folder = new_folder;
						this.plugin.saveSettings();
					});
			}).addExtraButton(
				(button) => {
					button.setIcon("download")
						.setTooltip($t('settings.css.download_tooltip'))
						.onClick(async () => {
							ThemeManager.getInstance(this.plugin).downloadThemes();
						});
				}
			);
	}
	newAccountInfo() {
		let n = 0
		let newName = $t('settings.account.new')
		while (true) {
			const account = this.plugin.settings.mpAccounts.find((account: WeWriteAccountInfo) => account.accountName === newName)
			if (account === undefined || account === null) {
				break
			}
			n += 1
			newName = $t('settings.account.new') + n
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
			.setName($t('settings.account.name'))
			.setDesc($t('settings.account.name_desc'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(account.accountName)
				.onChange(async (value) => {
					account.accountName = value;
					this.plugin.settings.selectedAccount = value;
					await this.plugin.saveSettings();
					this.updateAccountOptions()
				}));
		//addId		
		new Setting(cEl)
			.setName($t('settings.account.appid_desc'))
			.setDesc($t('settings.account.appid_desc'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(account.appId)
				.onChange(async (value) => {
					account.appId = value;
					await this.plugin.saveSettings();
				}));


		//addSecret
		new Setting(cEl)
			.setName($t('settings.account.secret_desc'))
			.setDesc($t('settings.account.secret_desc'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(account.appSecret)
				.onChange(async (value) => {
					account.appSecret = value;
					await this.plugin.saveSettings();
				}));
		// refresh token
		new Setting(cEl)
			.setName($t('settings.account.test_connection'))
			.setDesc($t('settings.account.test_desc'))
			.addExtraButton(async button => {
				button.setTooltip($t('settings.account.test_tooltip')).setIcon('plug-zap');
				button.onClick(async () => {
					const success = await this.plugin.TestAccessToken(account.accountName);
					if (success) {
						new Notice($t('settings.account.connected'));
					} else {

					}
				});
			})

		// delete this account
		new Setting(cEl)
			.setName($t('settings.account.delete'))
			.setDesc($t('settings.account.delete_desc'))
			.setClass('danger-extra-button')
			.addExtraButton(async button => {
				button.setTooltip($t('settings.account.delete_tooltip')).setIcon('trash-2');
				button.onClick(async () => {
					const accountToDelete = this.plugin.settings.selectedAccount
					this.plugin.settings.mpAccounts = this.plugin.settings.mpAccounts.filter(account => account.accountName !== accountToDelete)
					const account = this.plugin.settings.mpAccounts[0]
					if (account !== undefined) {
						this.plugin.settings.selectedAccount = account.accountName
						this.updateAccountOptions()
						this.updateAccountSettings(account.accountName, this.accountEl)
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
			address = $t('settings.ip.no_address')
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
		frame.createEl('h4', { text: $t('settings.title.chat_llm'), cls: 'wechat-setting-title' })

		new Setting(frame)
			.setName($t('settings.llm.base_url'))
			.setDesc($t('settings.llm.base_url_desc'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.chatLLMBaseUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.chatLLMBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName($t('settings.llm.api_key'))
			.setDesc($t('settings.llm.api_key_desc'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.chatLLMApiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.chatLLMApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName($t('settings.llm.model'))
			.setDesc($t('settings.llm.model_desc'))
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
		frame.createEl('h4', { text: $t('settings.title.draw_llm'), cls: 'wechat-setting-title' })

		new Setting(frame)
			.setName($t('settings.llm.base_url'))
			.setDesc($t('settings.llm.base_url_desc'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMBaseUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName($t('settings.llm.draw_task_url'))
			.setDesc($t('settings.llm.draw_task_desc'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMTaskUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMTaskUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName($t('settings.llm.api_key'))
			.setDesc($t('settings.llm.api_key_desc'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMApiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName($t('settings.llm.model'))
			.setDesc($t('settings.llm.model_desc'))
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
		mpFrame.createEl('h4', { text: $t('settings.title.wechat_mp'), cls: 'wechat-setting-title' })
		mpFrame.createEl('hr')

		const ip = new Setting(mpFrame)
			.setName($t('settings.ip.public_address') + ': ' + this.plugin.settings.ipAddress)
			.setHeading()
			.setDesc($t('settings.ip.whitelist_tip'))

		this.plugin.updateIpAddress().then(ipAddress => {
			ip.setName($t('settings.ip.public_address') + ': ' + ipAddress)
		})

		ip.addExtraButton(button => {
			button.setIcon('clipboard-copy')
				.setTooltip($t('settings.ip.copy_tooltip'))
				.onClick(async () => {
					await navigator.clipboard.writeText(this.plugin.settings.ipAddress ?? '');
					new Notice($t('settings.ip.copied'));
				});
		});

		new Setting(mpFrame)
			.setName($t('settings.center_token.title'))
			.setDesc($t('settings.center_token.desc'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.useCenterToken)
					.onChange(async (value) => {
						this.plugin.settings.useCenterToken = value;
						await this.plugin.saveSettings();
					});
			});

		mpFrame.createEl('hr')

		new Setting(mpFrame)
			.setName($t('settings.account.info'))
			.setHeading()

		const div = mpFrame.createDiv({ cls: 'wewrite-web-image elevated-shadow' })
		div.innerHTML = `<a href="https://mp.weixin.qq.com/cgi-bin/frame?t=pages/developsetting/page/developsetting_frame&nav=10141"><img src="${WECHAT_MP_WEB_PAGE}" alt="wewrite-web-page"></a> </p>`

		new Setting(mpFrame)
			.setName($t('settings.account.select'))
			.setDesc($t('settings.account.select_desc'))
			.addDropdown(
				(dropdown) => {
					dropdown.selectEl.empty();
					this.accountDropdown = dropdown
					if (this.plugin.settings.mpAccounts.length == 0) {
						this.newAccountInfo()
					} else {
						this.plugin.settings.mpAccounts.forEach(account => {
							dropdown.addOption(account.accountName, account.accountName)
						})
					}
					dropdown
						.setValue(this.plugin.settings.selectedAccount ?? $t('settings.account.select'))
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
						.setTooltip($t('settings.account.add_new'))
						.onClick(async () => {
							this.newAccountInfo();
						})
				}
			)

		const frame = mpFrame.createDiv({ cls: 'wewrite-account-info-div' })
		const title = frame.createEl('div', { cls: 'wewrite-account-info-title', text: $t('settings.account.info') })

		new Setting(mpFrame)
			.setName($t('settings.account.previewer'))
			.setDesc($t('settings.account.previewer_desc'))
			.addText(text => text
				.setValue(this.plugin.settings.previewer_wxname || '')
				.onChange(async (value) => {
					this.plugin.settings.previewer_wxname = value;
					await this.plugin.saveSettings();
				}));

		this.accountEl = frame.createDiv({ cls: 'wewrite-account-info-content' })
		this.updateAccountSettings(this.accountDropdown.getValue(), this.accountEl)

		new Setting(mpFrame)
			.setName($t('settings.account.import_export'))
			.setDesc($t('settings.account.import_export_desc'))
			.setClass('wewrite-import-export-config')
			.addExtraButton(
				(button) => {
					button.setIcon('upload')
						.setTooltip($t('settings.account.import_tooltip'))
						.onClick(async () => {
							this.importSettings();
						})
				}
			)
			.addExtraButton(
				(button) => {
					button.setIcon('download')
						.setTooltip($t('settings.account.export_tooltip'))
						.onClick(async () => {
							this.exportSettings();
						})
				}
			)
	}
}
