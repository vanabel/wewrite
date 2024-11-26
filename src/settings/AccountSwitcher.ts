import { DropdownComponent, Setting } from "obsidian";
import WeWritePlugin from "src/main";

export class WeChatMPAccountSwitcher extends Setting {
    private plugin: WeWritePlugin;
    private accountDropdown: DropdownComponent;
    constructor(plugin: WeWritePlugin, containerEl: HTMLElement) {
        super(containerEl);
        this.plugin = plugin;
        this.setName('Select WeChat MP Account')
        .addDropdown((dropdown) => {
            this.accountDropdown = dropdown
            this.plugin.settings.mpAccounts.forEach(account => {
                dropdown.addOption(account.accountName, account.accountName)
            })
            dropdown.setValue(this.plugin.settings.selectedAccount ?? 'Select WeChat MP Account')
						.onChange(async (value) => {
							this.plugin.onWeChantMPAccountChange(value)
						});
        }).addExtraButton((button) => {
            button.setIcon('cloud-download')
            .setTooltip('Force to refresh all material from remote.')
            .onClick(async () => {
                this.plugin.pullAllWeChatMPMaterial();
            })
        }
        )
    }
}