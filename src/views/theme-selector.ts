/**
 * Theme Selector
 */
import { DropdownComponent, TFile } from "obsidian";
import WeWritePlugin from "src/main";
import { ThemeManager } from "./theme-manager";

export class ThemeSelector {
    private _plugin: WeWritePlugin;
    private _themeDropdown: DropdownComponent;
    private _themeManager: ThemeManager

    constructor(plugin: WeWritePlugin) {
        this._plugin = plugin;
        this._themeManager = ThemeManager.getInstance(plugin)
    }
    public async dropdown(themDropdown: DropdownComponent) {
        this._themeDropdown = themDropdown;
        await this.updateThemeOptions()

        themDropdown.onChange(async (value) => {
            console.log(value)
            this._plugin.settings.custom_theme = value
            
            this._plugin.messageService.sendMessage('custom-theme-changed', value)
        })
    }
    private async updateThemeOptions() {
        const themes = await this._themeManager.loadThemes()
        console.log(`themes=>`, themes);

        //clear all options
        this._themeDropdown.selectEl.length = 0
        this._themeDropdown.addOption('', 'Default')
        themes.forEach(theme => {
            this._themeDropdown.addOption(theme.path, theme.name)
        })
        if (this._plugin.settings.custom_theme === undefined || !this._plugin.settings.custom_theme) {
            this._themeDropdown.setValue('')
        } else {
            this._themeDropdown.setValue(this._plugin.settings.custom_theme)
        }

    }
    onThemeChange(file: TFile) {
        if (file instanceof TFile && file.extension === 'md' && file.path.startsWith(this._plugin.settings.css_styles_folder)) {
            console.log(`theme file changed: ${file.path}`);
            this.updateThemeOptions()
        } else {
            console.log(`not a theme file`);

        }
    }
    public startWatchThemes() {
        this._plugin.registerEvent(
            this._plugin.app.vault.on('rename', (file: TFile) => {
                console.log(`File renamed: ${file.path}`);
                
                // 在这里处理文件修改的逻辑
                this.onThemeChange(file)

            })
        );
        this._plugin.registerEvent(
            this._plugin.app.vault.on('modify', (file: TFile) => {
                console.log(`File modified: ${file.path}`);
                // 在这里处理文件修改的逻辑
                this.onThemeChange(file)

            })
        );

        this._plugin.registerEvent(
            this._plugin.app.vault.on('create', (file: TFile) => {
                console.log(`File created: ${file.path}`);
                // 在这里处理文件创建的逻辑
                this.onThemeChange(file)
            })
        );

        this._plugin.registerEvent(
            this._plugin.app.vault.on('delete', (file: TFile) => {
                console.log(`File deleted: ${file.path}`);
                // 在这里处理文件删除的逻辑
                this.onThemeChange(file)
            })
        );
    }
    public stopWatchThemes() {
        // throw new Error('Method not implemented.');
        console.log(`stop watch themes`);

    }

}