/** process custom theme content */
import matter from "gray-matter";
import { TFile, TFolder } from "obsidian";
import postcss from "postcss";
import { combinedCss } from "src/assets/css/template-css";
import WeWritePlugin from "src/main";

export type WeChatTheme = {
    name: string;
    path: string;
    content?: string;

}
console.log('combinedCSS=>', combinedCss)
export class ThemeManager {
    downloadThemes() {
        //TODO, implement themes template download.
        throw new Error("Method not implemented.");
    }
    private _plugin: WeWritePlugin;
    defaultCssRoot: postcss.Root;
    themes: WeChatTheme[] = [];
    static template_css: string = combinedCss;

    private constructor(plugin: WeWritePlugin) {
        this._plugin = plugin;
        // const { vars, root } = this.pickoutCssVars(combinedCss)
        // console.log(`vars:`, vars);
        // console.log(`root=>`, root);
        // this.defaultCssRoot = root;


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
        console.log(`path:`, path);

        const file = this._plugin.app.vault.getFileByPath(path);
        if (!file) {
            return ThemeManager.template_css; //DEFAULT_STYLE;
        }
        const fileContent = await this._plugin.app.vault.cachedRead(file);
        // console.log(`fileContent:`, fileContent);

        const reg_css_block = /```[cC][Ss]{2}\s*([\s\S]*?)\s*```/g;
        // console.log(`reg:`, reg);

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
            // console.log(`getAllfiles in folder: ${folder.path}`);

            const promises = folder.children.map(async (child) => {
                if (child instanceof TFile && child.extension === "md") {
                    // console.log(`theme found: ${child.path}`);

                    const theme = await this.getThemeProperties(child);
                    // console.log(`theme properties:`, theme);
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
        // console.log(`data`, data);

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
                console.log(`remove:`, property, value);

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
        root.className = '';
        root.removeAttribute('class')
        let element = root.firstElementChild;
        while (element) {
            this.removeClassName(element as HTMLElement);
            element = element.nextElementSibling;
        }
    }
}

