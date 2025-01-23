/**
 * tab for setting
 */

import { App, DropdownComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import WeWritePlugin from "src/main";
import { getPublicIpAddress } from "src/utils/ip-address";
import { ThemeManager } from "src/views/theme-manager";
import { FolderSuggest } from "./folder-suggester";
import { WECHAT_MP_WEB_PAGE } from "./mp-web-images";
import { WeWriteAccountInfo, WeWriteSetting } from "./wewrite-setting";
import { $t } from "src/lang/i18n";

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
		this.createWeChatSettings(containerEl)
		this.creatCSSStyleSetting(containerEl)
		this.createAiChatSettings(containerEl)
		this.createAiDrawSettings(containerEl)

	} 
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
			
			new Notice($t('settings.settings-exported'));
			return true;
		} catch (error) {
			if (error.name === 'AbortError') {
				// User canceled the save dialog
				return false;
			}
			new Notice($t('settings.settings-exporting-failed')+ error);
			console.error(error);
			return false;
		}
	}

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
							new Notice($t('settings.invalid-json-file'));
							return;
						}


						// Validate account data structure
						const {mpAccounts, css_styles_folder} = importedData;
						if (mpAccounts === undefined || css_styles_folder === undefined){
							new Notice($t('settings.invalid-wewerite-settings-file'));
							return 
						}
						console.log(`settings:`, importedData);

						this.plugin.settings = importedData;
						// save it
						await this.plugin.saveSettings();
						this.updateAccountOptions();
						this.display();
						new Notice($t('settings.settings-imported-successfully'));
					} catch (error) {
						new Notice($t('settings.settings-imported-failed') + error);
						console.error(error);
					}
				};

				reader.readAsText(file);
			};

			input.click();
		} catch (error) {
			new Notice($t('settings.settings-imported-error') + error);
			console.error(error);
		}
	}

	creatCSSStyleSetting(container: HTMLElement) {
		const frame = container.createDiv({ cls: 'wewrite-setting-frame' })
		frame.createEl('h4', { text: $t('settings.custom-themes'), cls: 'wechat-setting-title' })

		new Setting(frame)
			.setName($t('settings.custom-themes-folder'))
			.setDesc($t('settings.the-folder-where-your-custom-themes'))
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setPlaceholder($t('settings.themes-folder-path'))
					.setValue(this.plugin.settings.css_styles_folder)
					.onChange((new_folder) => {
						this.plugin.settings.css_styles_folder = new_folder;
						this.plugin.saveThemeFolderDebounce();
					});
			}).addExtraButton(
				(button) => {
					button.setIcon("download")
						.setTooltip($t('settings.download-predefined-custom-themes-from'))
						.onClick(async () => {
							ThemeManager.getInstance(this.plugin).downloadThemes();
						});
				}
			);
	}
	newAccountInfo() {
		let n = 0
		let newName = $t('settings.new-account')
		while (true) {
			const account = this.plugin.settings.mpAccounts.find((account: WeWriteAccountInfo) => account.accountName === newName)
			if (account === undefined || account === null) {
				break
			}
			n += 1
			newName = $t('settings.new-account') + '-'+ n
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
			.setName($t('settings.account-name'))
			.setDesc($t('settings.account-name-for-your-wechat-official'))
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
			.setName('AppId')
			.setDesc($t('settings.appid-for-your-wechat-official-account'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(account.appId)
				.onChange(async (value) => {
					account.appId = value;
					await this.plugin.saveSettings();
				}));


		//addSecret
		new Setting(cEl)
			.setName($t('settings.app-secret'))
			.setDesc($t('settings.app-secret-for-your-wechat-official'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(account.appSecret)
				.onChange(async (value) => {
					account.appSecret = value;
					await this.plugin.saveSettings();
				}));
		// refresh token
		new Setting(cEl)
			.setName($t('settings.test-connection'))
			.setDesc($t('settings.check-if-your-account-setting-is-correct'))
			.addExtraButton(async button => {
				button.setTooltip($t('settings.click-to-connect-wechat-server')).setIcon('plug-zap');
				button.onClick(async () => {
					const success = await this.plugin.TestAccessToken(account.accountName);
					if (success) {
						new Notice($t('settings.successfully-connected-to-wechat-officia'));
					} else {

					}
				});
			})

		// delete this account
		new Setting(cEl)
			.setName($t('settings.delete-account'))
			.setDesc($t('settings.be-carefull-delete-account'))
			.setClass('danger-extra-button')
			.addExtraButton(async button => {
				button.setTooltip($t('settings.delete-account')).setIcon('trash-2');
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
			address = $t('settings.no-ip-address')
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
				.setTooltip($t('settings.copy-ip-address-to-clipboard'))
				.onClick(async () => {
					await navigator.clipboard.writeText(await getPublicIpAddress());
					new Notice($t('settings.ip-copied-to-clipboard'));
				});
		});
	}
	createAiChatSettings(container: HTMLElement) {
		const frame = container.createDiv({ cls: 'wewrite-setting-frame' })
		frame.createEl('h4', { text: $t('settings.text-llm-settings'), cls: 'wechat-setting-title' })

		new Setting(frame)
			.setName('base_url')
			.setDesc($t('settings.llm-access-base-url'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.chatLLMBaseUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.chatLLMBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName('api_key')
			.setDesc($t('settings.llm-access-api-key'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.chatLLMApiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.chatLLMApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName('model')
			.setDesc($t('settings.llm-model-to-be-used'))
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
		frame.createEl('h4', { text: $t('settings.image-llm-settings'), cls: 'wechat-setting-title' })

		new Setting(frame)
			.setName('base_url')
			.setDesc($t('settings.llm-access-base-url'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMBaseUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName('task_url')
			.setDesc($t('settings.image-llm-checking-task-progress-url'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMTaskUrl || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMTaskUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName('api_key')
			.setDesc($t('settings.llm-access-api-key'))
			.setClass('wewrite-setting-input')
			.addText(text => text
				.setValue(this.plugin.settings.drawLLMApiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.drawLLMApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(frame)
			.setName('model')
			.setDesc($t('settings.llm-model-to-be-used'))
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
		mpFrame.createEl('h4', { text: $t('settings.wechat-account-settings'), cls: 'wechat-setting-title' })
		mpFrame.createEl('hr')

		const ip = new Setting(mpFrame)
			.setName($t('settings.public-ip-address') + ': ' + this.plugin.settings.ipAddress)
			.setHeading()
			.setDesc($t('settings.you-should-add-this-ip-to-ip-whitelist-o'))

		this.plugin.updateIpAddress().then(ipAddress => {
			ip.setName($t('settings.public-ip-address') + ': ' + ipAddress)
		})

		ip.addExtraButton(button => {
			button.setIcon('clipboard-copy')
				.setTooltip($t('settings.copy-ip-to-clipboard'))
				.onClick(async () => {
					await navigator.clipboard.writeText(this.plugin.settings.ipAddress ?? '');
					new Notice($t('settings.ip-copied-to-clipboard'));
				});
		});

		new Setting(mpFrame)
			.setName($t('settings.use-center-token-server'))
			.setDesc($t('settings.if-your-device-cannot-get-static-pubic-i'))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.useCenterToken)
					.onChange(async (value) => {
						this.plugin.settings.useCenterToken = value;
						await this.plugin.saveSettings();
					});
			});

		mpFrame.createEl('hr')

		new Setting(mpFrame)
			.setName($t('settings.account-info'))
			.setHeading()

		const div = mpFrame.createDiv({ cls: 'wewrite-web-image elevated-shadow' })
		div.innerHTML = `<a href="https://mp.weixin.qq.com/cgi-bin/frame?t=pages/developsetting/page/developsetting_frame&nav=10141"><img src="${WECHAT_MP_WEB_PAGE}" alt="wewrite-web-page"></a> </p>`

		new Setting(mpFrame)
			.setName($t('settings.select-account'))
			.setDesc($t('settings.choose-the-account-to-modify'))
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
						.setValue(this.plugin.settings.selectedAccount ?? $t('settings.select-account'))
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
						.setTooltip($t('settings.create-new-account'))
						.onClick(async () => {
							this.newAccountInfo();
						})
				}
			)

		const frame = mpFrame.createDiv({ cls: 'wewrite-account-info-div' })
		const title = frame.createEl('div', { cls: 'wewrite-account-info-title', text: $t('settings.account.info') })

		new Setting(mpFrame)
			.setName($t('settings.draft-previewer-wechat-id'))
			.setDesc($t('settings.draft-only-visible-for-the-wechat-user-o'))
			.addText(text => text
				.setValue(this.plugin.settings.previewer_wxname || '')
				.onChange(async (value) => {
					this.plugin.settings.previewer_wxname = value;
					await this.plugin.saveSettings();
				}));

		this.accountEl = frame.createDiv({ cls: 'wewrite-account-info-content' })
		this.updateAccountSettings(this.accountDropdown.getValue(), this.accountEl)

		new Setting(mpFrame)
			.setName($t('settings.import-export-wewrite-account'))
			.setDesc($t('settings.import-or-export-your-account-info-for-b'))
			.setClass('wewrite-import-export-config')
			.addExtraButton(
				(button) => {
					button.setIcon('upload')
						.setTooltip($t('settings.import-account-info'))
						.onClick(async () => {
							this.importSettings();
						})
				}
			)
			.addExtraButton(
				(button) => {
					button.setIcon('download')
						.setTooltip($t('settings.export-account-info'))
						.onClick(async () => {
							this.exportSettings();
						})
				}
			)
	}
}
