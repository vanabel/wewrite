import matter from "gray-matter";
import { TFile, TFolder } from "obsidian";
import WeWritePlugin from "src/main";
import { DEFAULT_STYLE } from "src/render/default_css";
// import * as STYLE from 'src/render/styles.css'

export type WeChatTheme = {
    name: string;
    path: string;
    content?: string;
}

export class ThemeManager {
    plugin: WeWritePlugin;
    themes: WeChatTheme[] = [];

    private constructor(plugin: WeWritePlugin) {
        this.plugin = plugin;
    }

    static getInstance(plugin: WeWritePlugin): ThemeManager {
        return new ThemeManager(plugin);
    }

    async loadThemes() {
        this.themes = [];
        const folder_path = this.plugin.settings.css_styles_folder;
        const folder = this.plugin.app.vault.getAbstractFileByPath(folder_path);
        if (folder instanceof TFolder) {
            this.themes = await this.getAllThemesInFolder(folder);
        }
        console.log(`themes:`, this.themes);

        return this.themes;
    }

    public async getThemeContent(path: string) {
        console.log(`path:`, path);
    
        const file = this.plugin.app.vault.getFileByPath(path);
        if (!file) {
            return DEFAULT_STYLE;
        }
        const fileContent = await this.plugin.app.vault.cachedRead(file);
        // console.log(`fileContent:`, fileContent);

        const reg = /```[cC][Ss]{2}\s*([\s\S]*?)\s*```/g;
        // console.log(`reg:`, reg);

        // 使用正则表达式提取 CSS 代码块
        const cssBlocks = fileContent.match(reg);
        console.log(`cssBlocks:`, cssBlocks);
        if (cssBlocks) {
            // 提取每个 CSS 代码块的内容
            const cssCode = cssBlocks.map(block => block.replace(/```[cC][Ss]{2}\s*|\s*```/g, '').trim());
            return cssCode.join('\n'); // 将所有 CSS 代码块合并成一个字符串
        }
    
        return '';
    }
    private async getAllThemesInFolder(folder: TFolder): Promise<WeChatTheme[]> {
        const themes: WeChatTheme[] = [];

        const getAllFiles = async (folder: TFolder) => {
            console.log(`getAllfiles in folder: ${folder.path}`);

            const promises = folder.children.map(async (child) => {
                if (child instanceof TFile && child.extension === "md") {
                    console.log(`theme found: ${child.path}`);

                    const theme = await this.getThemeProperties(child);
                    console.log(`theme properties:`, theme);
                    if (theme) {
                        themes.push(theme);
                    }
                } else if (child instanceof TFolder) {
                    await getAllFiles(child);
                }
            });

            await Promise.all(promises);
        };

        await getAllFiles(folder);

        return themes;
    }

    private async getThemeProperties(file: TFile): Promise<WeChatTheme | undefined> {
        const fileContent = await this.plugin.app.vault.cachedRead(file);
        const { data } = matter(fileContent); // 解析前置元数据
        console.log(`data`, data);

        if (data.theme_name === undefined || !data.theme_name.trim()) {
            // it is not a valid theme.
            console.log(`not a valid theme.`);
            return;
        }

        return {
            name: data.theme_name,
            path: file.path,
        };
    }
}