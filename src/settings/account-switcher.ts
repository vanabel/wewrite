import { DropdownComponent, Setting } from "obsidian";
import WeWritePlugin from "src/main";

export class WeChatMPAccountSwitcher extends Setting {
    private _plugin: WeWritePlugin;
    private accountDropdown: DropdownComponent;
    constructor(plugin: WeWritePlugin, containerEl: HTMLElement) {
        super(containerEl);
        this._plugin = plugin;
        this.setName('Select WeChat MP Account')
        .addDropdown((dropdown) => {
            this.accountDropdown = dropdown
            this._plugin.settings.mpAccounts.forEach(account => {
                dropdown.addOption(account.accountName, account.accountName)
            })
            dropdown.setValue(this._plugin.settings.selectedAccount ?? 'Select WeChat MP Account')
						.onChange(async (value) => {
							// this._plugin.onWeChantMPAccountChange(value)
                            this._plugin.messageService.sendMessage('wechat-account-changed', value)
                            this._plugin.saveSettings()
						});
        }).addExtraButton((button) => {
            button.setIcon('cloud-download')
            .setTooltip('Force to refresh all material from remote.')
            .onClick(async () => {
                this._plugin.pullAllWeChatMPMaterial();
            })
        }
        )
    }
}