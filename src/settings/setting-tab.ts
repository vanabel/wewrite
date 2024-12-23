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

		containerEl.createEl('h1', { text: "WeWrite Settings" })
		containerEl.createEl('hr')
		// external IP
		const ip = new Setting(containerEl)
			.setName('Public IP Address: ' + this._plugin.settings.ipAddress)
			.setHeading()
			.setDesc('You should add this IP to "IP Whitelist" on your WeChat Official Account Platform development configuration.')
		this._plugin.updateIpAddress().then(ipAddress => {
			ip.setName('Public IP Address: ' + ipAddress)
		})
		ip.addExtraButton(button => {
			button.setIcon('clipboard-copy')
				.setTooltip('Copy IP to clipboard')
				.onClick(async () => {
					await navigator.clipboard.writeText(this._plugin.settings.ipAddress ?? '');
					new Notice('IP copied to clipboard');
				});
		});

		containerEl.createEl('hr')
		// Account title
		new Setting(containerEl)
			.setName('Account Info ')
			.setHeading()

		const div = containerEl.createDiv({ cls: 'wechat-mp-web-image elevated-shadow' })
		div.innerHTML = `<a href="https://mp.weixin.qq.com/cgi-bin/frame?t=pages/developsetting/page/developsetting_frame&nav=10141"><img src="${WECHAT_MP_WEB_PAGE}" alt="wechat-mp-web-page"></a> </p>`

		new Setting(containerEl)
			.setName('Select WeChat MP Account')
			.setDesc('Choose the account you want to edit.')
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
						.setValue(this._plugin.settings.selectedAccount ?? 'Select WeChat MP Account')
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
						.setTooltip('Add new account')
						.onClick(async () => {
							this.newAccountInfo();
						})
				}
			)
		const frame = containerEl.createDiv({ cls: 'wechat-mp-account-info-div' })
		const title = frame.createEl('div', { cls: 'wechat-mp-account-info-title', text: 'Account Info' })
		this.accountEl = frame.createDiv({ cls: 'wechat-mp-account-info-content' })
		this.updateAccountSettings(this.accountDropdown.getValue(), this.accountEl)
		new Setting(containerEl)
			.setName('Import/Export WeChat MP Account')
			.setDesc('Import or export your account info.')
			.addButton(
				(button) => {
					button.setIcon('download')
						.setTooltip('Import account info')
						.onClick(async () => {
							//TODO import account info, to be implemented.
							console.log(`import account info`);
						})
				}
			)
			.addButton(
				(button) => {
					button.setIcon('upload')
						.setTooltip('Export account info')
						.onClick(async () => {
							//TODO export account info, to be implemented.
							console.log(`export account info`);

						})
				}
			)
			containerEl.createEl('hr')
			this.newCSSStyleFolder()

	} //display	()

	newCSSStyleFolder() {
		new Setting(this.containerEl)
		.setName("CSS Styles folder location")
		.setDesc("Files in this folder will be available as CSS Styles for rendering in WeChat posts.")
		.addSearch((cb) => {
			new FolderSuggest(this.app, cb.inputEl);
			cb.setPlaceholder("Example: folder1/folder2")
				.setValue(this._plugin.settings.css_styles_folder)
				.onChange((new_folder) => {
					this._plugin.settings.css_styles_folder = new_folder;
					this._plugin.saveSettings(); 
				});
		}).addExtraButton(
			(button) => {
				button.setIcon("download")
					.setTooltip("Download CSS style themes from Server")
					.onClick(async () => {
						console.log(`to download themes`);
						ThemeManager.getInstance(this._plugin).downloadThemes();
						
					});
			}
);
	}
	newAccountInfo() {
		let n = 0
		let newName = 'New Account'
		while (true) {
			const account = this._plugin.settings.mpAccounts.find((account: WeWriteAccountInfo) => account.accountName === newName)
			if (account === undefined || account === null) {
				break
			}
			n += 1
			newName = 'New Account ' + n
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
			.setName('account name')
			.setDesc('Account name for your wechat official account')
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
			.setDesc('AppId for your wechat official account')
			.addText(text => text
				.setValue(account.appId)
				.onChange(async (value) => {
					account.appId = value;
					await this._plugin.saveSettings();
				}));


		//addSecret
		new Setting(cEl)
			.setName('App Secret')
			.setDesc('App Secret for your wechat official account')
			.addText(text => text
				.setValue(account.appSecret)
				.onChange(async (value) => {
					account.appSecret = value;
					await this._plugin.saveSettings();
				}));
		// refresh token
		new Setting(cEl)
			.setName('Test Connection')
			.setDesc('To check whether the [App Id] and [App Secret] and [IP Address Whitelist] setting on are correct. ')
			.addExtraButton(async button => {
				button.setTooltip('click to test connection').setIcon('plug-zap');
				button.onClick(async () => {
					const success = await this._plugin.TestAccessToken(account.accountName);
					if (success) {
						new Notice('Successfully connected to WeChat official account platform.');
					} else {

					}
				});
			})

		// delete this account
		new Setting(cEl)
			.setName('Delete Account')
			.setDesc('Be carefull! This will delete all your settings and data of the account. ')
			.setClass('danger-button')
			.addExtraButton(async button => {
				button.setTooltip('click to delete account').setIcon('trash-2');
				button.onClick(async () => {
					console.log(`to delete the account ${accountName}`);
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
			'No IP Address'
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
				.setTooltip('Copy IP to clipboard')
				.onClick(async () => {
					await navigator.clipboard.writeText(await getPublicIpAddress());
					new Notice('IP copied to clipboard');
				});
		});
	}
}