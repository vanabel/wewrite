// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, Notice, TAbstractFile, TFile, TFolder } from "obsidian";
import { TextInputSuggest } from "../utils/suggest"
import WeWritePlugin from "src/main";

import { ThemeManager, WeChatTheme } from "./theme-manager";

export class ThemeSuggest extends TextInputSuggest<WeChatTheme> {
    private plugin: WeWritePlugin;
    constructor(plugin: WeWritePlugin, inputEl: HTMLInputElement | HTMLTextAreaElement) {
        super(plugin.app, inputEl);
        this.plugin = plugin;
    }

    async getSuggestions(inputStr: string): Promise<WeChatTheme[]> {
        const manager = ThemeManager.getInstance(this.plugin);
        const themes = await manager.loadThemes()
        return themes.filter(theme => theme.name.toLowerCase().contains(inputStr.toLowerCase()))
    }
    

    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFolder): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}

