/** process custom theme content */
import matter from "gray-matter";
import { TFile, TFolder, requestUrl } from "obsidian";
import postcss from "postcss";
import { combinedCss } from "src/assets/css/template-css";
import WeWritePlugin from "src/main";

export type WeChatTheme = {
    name: string;
    path: string;
    content?: string;

}
export class ThemeManager {
    async downloadThemes() {
        const baseUrl = "https://gitee.com/northern_bank/wewrite/raw/master/themes/";
        const saveDir = this._plugin.settings.css_styles_folder || "/wewrite-custom-css";

        try {
            // Create save directory if it doesn't exist
            if (!this._plugin.app.vault.getAbstractFileByPath(saveDir)) {
                await this._plugin.app.vault.createFolder(saveDir);
            }

            // Download themes.json
            const themesResponse = await requestUrl(`${baseUrl}themes.json`);
            if (themesResponse.status !== 200) {
                throw new Error(`Failed to fetch themes.json: ${themesResponse.text}`);
            }

            const themesData = themesResponse.json;
            const themes = themesData.themes;

            // Download each theme file
            for (const theme of themes) {
                console.log(`Downloading ${theme.file}`);
                console.log(`url => ${baseUrl}${theme.file}`);
                try {


                    const fileResponse = await requestUrl(`${baseUrl}${theme.file}`);
                    if (fileResponse.status !== 200) {
                        console.warn(`Failed to download ${theme.file}: ${fileResponse.text}`);
                        continue;
                    }

                    const fileContent = fileResponse.text;
                    // Generate unique file name
                    let filePath = `${saveDir}/${theme.file}`;
                    let counter = 1;

                    while (this._plugin.app.vault.getAbstractFileByPath(filePath)) {
                        const extIndex = theme.file.lastIndexOf('.');
                        const baseName = extIndex > 0 ? theme.file.slice(0, extIndex) : theme.file;
                        const ext = extIndex > 0 ? theme.file.slice(extIndex) : '';
                        filePath = `${saveDir}/${baseName}(${counter})${ext}`;
                        counter++;
                    }

                    await this._plugin.app.vault.create(filePath, fileContent);
                } catch (error) {
                    console.error(error);
                    continue;
                }
            }
        } catch (error) {
            console.error("Error downloading themes:", error);
            // throw error;
        }
    }
    private _plugin: WeWritePlugin;
    defaultCssRoot: postcss.Root;
    themes: WeChatTheme[] = [];
    static template_css: string = combinedCss;

    private constructor(plugin: WeWritePlugin) {
        this._plugin = plugin;

    }
    static getInstance(plugin: WeWritePlugin): ThemeManager {
        return new ThemeManager(plugin);

    }

    async loadThemes() {
        this.themes = [];
        const folder_path = this._plugin.settings.css_styles_folder;
        const folder = this._plugin.app.vault.getAbstractFileByPath(folder_path);
        if (folder instanceof TFolder) {
            this.themes = await this.getAllThemesInFolder(folder);
        }
        return this.themes;
    }
    public cleanCSS(css: string): string {

        css = css.replace(/```[cC][Ss]{2}\s*|\s*```/g, '').trim()
        // 删除
        // 删除多行注释
        const reg_multiple_line_comments = /\/\*[\s\S]*?\*\//g;
        // 删除单行注释
        const reg_single_line_comments = /\/\/.*/g;
        // 删除多余的空格和换行符
        const reg_whitespace = /\s+/g;
        // 删除非法不可见字符
        const reg_invisible_chars = /[\u200B\u00AD\uFEFF\u00A0]/g;

        let cleanedCSS = css
            .replace(reg_multiple_line_comments, '') // 删除多行注释
            .replace(reg_single_line_comments, '') // 删除单行注释
            .replace(reg_whitespace, ' ') // 删除多余的空格和换行符
            .replace(reg_invisible_chars, ''); // 删除非法不可见字符

        return cleanedCSS.trim();
    }
    public async getThemeContent(path: string) {
        const file = this._plugin.app.vault.getFileByPath(path);
        if (!file) {
            return ThemeManager.template_css; //DEFAULT_STYLE;
        }
        const fileContent = await this._plugin.app.vault.cachedRead(file);

        const reg_css_block = /```[cC][Ss]{2}\s*([\s\S]*?)\s*```/g;

        // 使用正则表达式提取 CSS 代码块
        // const cssBlocks = fileContent.match(reg);
        const cssBlocks: string[] = []; //fileContent.match(reg);
        let match
        while ((match = reg_css_block.exec(fileContent)) !== null) {
            // 提取匹配的内容并清理
            cssBlocks.push(this.cleanCSS(match[1].trim()));
        }

        return cssBlocks.join('\n'); // 将所有 CSS 代码块合并成一个字符串

    }
    public async getCSS() {
        let custom_css = '' //this.defaultCssRoot.toString() //''
        if (this._plugin.settings.custom_theme === undefined || !this._plugin.settings.custom_theme) {

        } else {
            custom_css = await this.getThemeContent(this._plugin.settings.custom_theme)
        }

        return custom_css

    }
    private async getAllThemesInFolder(folder: TFolder): Promise<WeChatTheme[]> {
        const themes: WeChatTheme[] = [];

        const getAllFiles = async (folder: TFolder) => {
            const promises = folder.children.map(async (child) => {
                if (child instanceof TFile && child.extension === "md") {
                    const theme = await this.getThemeProperties(child);
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
        const fileContent = await this._plugin.app.vault.cachedRead(file);
        const { data } = matter(fileContent); // 解析前置元数据
        if (data.theme_name === undefined || !data.theme_name.trim()) {
            // it is not a valid theme.
            return;
        }

        return {
            name: data.theme_name,
            path: file.path,
        };
    }
    public async applyTheme(htmlRoot: HTMLElement) {
        const customCss = await this.getCSS()
        const customCssRoot = postcss.parse(customCss)
        const defaultCssRooot = postcss.parse(combinedCss)
        const mergedRoot = this.mergeRoot(defaultCssRooot, customCssRoot)

        this.applyStyle(htmlRoot, mergedRoot)
        this.removeClassName(htmlRoot as HTMLElement);
    }
    private removeVarablesInStyleText(root: HTMLElement) {
        for (let i = 0; i < root.style.length; i++) {
            const property = root.style[i];
            if (property.startsWith('--')) {
                const value = root.style.getPropertyValue(property);
                root.style.removeProperty(property);

            }
        }
    }
    private applyStyle(root: HTMLElement, cssRoot: postcss.Root) {
        const cssText = root.style.cssText;
        cssRoot.walkRules(rule => {
            if (root.matches(rule.selector)) {
                this.removeVarablesInStyleText(root)
                rule.walkDecls(decl => {
                    // always replace the property
                    root.style.setProperty(decl.prop, decl.value);
                    // const setted = cssText.includes(decl.prop);
                    // if (!setted || decl.important) {
                    //     root.style.setProperty(decl.prop, decl.value);
                    // }
                })
            }
        });

        let element = root.firstElementChild;
        while (element) {
            this.applyStyle(element as HTMLElement, cssRoot);
            element = element.nextElementSibling;
        }
    }
    mergeRoot(root1: postcss.Root, root2: postcss.Root) {
        const mergedRoot = postcss.root()
        root1.walkAtRules(rule => {
            rule.remove()
        })
        root2.walkAtRules(rule => {
            rule.remove()
        })
        root1.walkRules(rule => {
            mergedRoot.append(rule)
        })

        root2.walkRules(rule => {

            mergedRoot.append(rule)
        })
        mergedRoot.walkAtRules(rule => {
            rule.remove()
        })

        return mergedRoot
    }
    removeClassName(root: HTMLElement) {
        // if (root instanceof SVGElement){
        //     return
        // }
        // root.className = '';
        root.removeAttribute('class')
        let element = root.firstElementChild;
        while (element) {
            this.removeClassName(element as HTMLElement);
            element = element.nextElementSibling;
        }
    }
}
