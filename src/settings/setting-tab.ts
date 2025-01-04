/**
 * tab for setting
 */

import { App, DropdownComponent, Notice, PluginSettingTab, Setting } from "obsidian";
import WeWritePlugin from "src/main";
import { getPublicIpAddress } from "src/utils/ip-address";
import { ThemeManager } from "src/views/theme-manager";
import { FolderSuggest } from "./folder-suggester";
import { WECHAT_MP_WEB_PAGE } from "./images";
import { WeWriteAccountInfo } from "./wewrite-setting";
import { $t } from "src/lang/i18n";

export class WeWriteSettingTab extends PluginSettingTab {
	private _plugin: WeWritePlugin;
	appIdEl: Setting
	appSecretEl: Setting
	accountEl: HTMLElement
	accountDropdown: DropdownComponent
	constructor(app: App, plugin: WeWritePlugin) {
		super(app, plugin);
		this._plugin = plugin;
	}

	async display(): Promise<void> {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h1', { text: $t('wewrite-settings') })
		containerEl.createEl('hr')
		// external IP
		const ip = new Setting(containerEl)
			.setName($t('public-ip-address') + this._plugin.settings.ipAddress)
			.setHeading()
			.setDesc($t('you-should-add-this-ip-to-ip-whitelist-o'))
		this._plugin.updateIpAddress().then(ipAddress => {
			ip.setName('Public IP Address: ' + ipAddress)
		})
		ip.addExtraButton(button => {
			button.setIcon('clipboard-copy')
				.setTooltip($t('copy-ip-to-clipboard'))
				.onClick(async () => {
					await navigator.clipboard.writeText(this._plugin.settings.ipAddress ?? '');
					new Notice($t('ip-copied-to-clipboard'));
				});
		});

		containerEl.createEl('hr')
		// Account title
		new Setting(containerEl)
			.setName($t('account-info'))
			.setHeading()

		const div = containerEl.createDiv({ cls: 'wechat-mp-web-image elevated-shadow' })
		div.innerHTML = `<a href="https://mp.weixin.qq.com/cgi-bin/frame?t=pages/developsetting/page/developsetting_frame&nav=10141"><img src="${WECHAT_MP_WEB_PAGE}" alt="wechat-mp-web-page"></a> </p>`

		new Setting(containerEl)
			.setName($t('select-wechat-mp-account'))
			.setDesc($t('choose-the-account-you-want-to-edit'))
			.addDropdown(
				(dropdown) => {
					this.accountDropdown = dropdown
					if (this._plugin.settings.mpAccounts.length == 0) {
						this.newAccountInfo()
					}else{
						this._plugin.settings.mpAccounts.forEach(account => {
							dropdown.addOption(account.accountName, account.accountName)
						})
					}
					dropdown
						.setValue(this._plugin.settings.selectedAccount ?? $t('select-wechat-mp-account-0'))
						.onChange(async (value) => {
							this._plugin.settings.selectedAccount = value;
							this.updateAccountSettings(this._plugin.settings.selectedAccount, this.accountEl)
							await this._plugin.saveSettings();
							this._plugin.messageService.sendMessage('wechat-account-changed', value)
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
		const frame = containerEl.createDiv({ cls: 'wechat-mp-account-info-div' })
		const title = frame.createEl('div', { cls: 'wechat-mp-account-info-title', text: $t('account-info') })
		this.accountEl = frame.createDiv({ cls: 'wechat-mp-account-info-content' })
		this.updateAccountSettings(this.accountDropdown.getValue(), this.accountEl)
		new Setting(containerEl)
			.setName($t('import-export-wechat-mp-account'))
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
			containerEl.createEl('hr')
			this.newCSSStyleFolder()

	} //display	()
	exportAccountInfo() {
		//TODO
		// throw new Error("Method not implemented.");
	}
	importAccountInfo() {
		//TODO
		// throw new Error("Method not implemented.");
	}

	newCSSStyleFolder() {
		new Setting(this.containerEl)
		.setName($t('css-styles-folder-location'))
		.setDesc($t('files-in-this-folder-will-be-available-a'))
		.addSearch((cb) => {
			new FolderSuggest(this.app, cb.inputEl);
			cb.setPlaceholder($t('example-folder1-folder2'))
				.setValue(this._plugin.settings.css_styles_folder)
				.onChange((new_folder) => {
					this._plugin.settings.css_styles_folder = new_folder;
					this._plugin.saveSettings(); 
				});
		}).addExtraButton(
			(button) => {
				button.setIcon("download")
					.setTooltip($t('download-css-style-themes-from-server'))
					.onClick(async () => {
						ThemeManager.getInstance(this._plugin).downloadThemes();
						
					});
			}
);
	}
	newAccountInfo() {
		let n = 0
		let newName = $t('new-account')
		while (true) {
			const account = this._plugin.settings.mpAccounts.find((account: WeWriteAccountInfo) => account.accountName === newName)
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
		this._plugin.settings.mpAccounts.push(newAccount)
		this.accountDropdown.addOption(newName, newName)
		this.accountDropdown.setValue(newName)
		this.updateAccountSettings(newName, this.accountEl)

	}
	updateAccountSettings(accountName: string | undefined, cEl: HTMLElement) {
		if (accountName === undefined) {
			return
		}
		const account = this._plugin.getMPAccountByName(accountName)
		if (account === undefined) {
			return
		}
		cEl.empty()

		//account Name
		new Setting(cEl)
			.setName($t('account-name'))
			.setDesc($t('account-name-for-your-wechat-official-ac'))
			.addText(text => text
				.setValue(account.accountName)
				.onChange(async (value) => {
					account.accountName = value;
					await this._plugin.saveSettings();
					this.updateAccountOptions()
				}));
		//addId		
		new Setting(cEl)
			.setName('AppId')
			.setDesc($t('appid-for-your-wechat-official-account'))
			.addText(text => text
				.setValue(account.appId)
				.onChange(async (value) => {
					account.appId = value;
					await this._plugin.saveSettings();
				}));


		//addSecret
		new Setting(cEl)
			.setName('App Secret')
			.setDesc($t('app-secret-for-your-wechat-official-acco'))
			.addText(text => text
				.setValue(account.appSecret)
				.onChange(async (value) => {
					account.appSecret = value;
					await this._plugin.saveSettings();
				}));
		// refresh token
		new Setting(cEl)
			.setName($t('test-connection'))
			.setDesc($t('to-check-whether-the-app-id-and-app-secr'))
			.addExtraButton(async button => {
				button.setTooltip($t('click-to-test-connection')).setIcon('plug-zap');
				button.onClick(async () => {
					const success = await this._plugin.TestAccessToken(account.accountName);
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
			.setClass('danger-button')
			.addExtraButton(async button => {
				button.setTooltip($t('click-to-delete-account')).setIcon('trash-2');
				button.onClick(async () => {
					this._plugin.settings.mpAccounts = this._plugin.settings.mpAccounts.filter(account => account.accountName !== accountName)
					const account = this._plugin.settings.mpAccounts[0]
					if (account !== undefined){
						this._plugin.settings.selectedAccount = account.accountName
						this.updateAccountOptions()
					}else{
						this.newAccountInfo()
					}
				});
			})
	}
	updateAccountOptions(){
		this.accountDropdown.selectEl.options.length = 0
		this._plugin.settings.mpAccounts.forEach(account => {
			this.accountDropdown.addOption(account.accountName, account.accountName)
		})
		this.accountDropdown.setValue(this._plugin.settings.selectedAccount?? '')
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
}