/** process custom theme content */
import matter from "gray-matter";
import { Notice, TFile, TFolder, requestUrl } from "obsidian";
import postcss from "postcss";
import { combinedCss } from "src/assets/css/template-css";
import { $t } from "src/lang/i18n";
import WeWritePlugin from "src/main";

export type WeChatTheme = {
	name: string;
	path: string;
	content?: string;

}
export class ThemeManager {
	async downloadThemes() {
		const baseUrlAlter = "https://gitee.com/northern_bank/wewrite/raw/master/themes/";
		// const baseUrl = "https://github.com/learnerchen-forever/wewrite/blob/master/themes/";
		const baseUrl = "https://raw.githubusercontent.com/learnerchen-forever/wewrite/refs/heads/master/themes/";
		const saveDir = this.plugin.settings.css_styles_folder || "/wewrite-custom-css";

		// Create save directory if it doesn't exist
		if (!this.plugin.app.vault.getAbstractFileByPath(saveDir)) {
			console.log(`To Created directory: ${saveDir}`);
			await this.plugin.app.vault.createFolder(saveDir);
			
		}else {
			console.log(`Directory already exists: ${saveDir}`);
		}

		// Check if github is reachable, if not, use gitee
		let url = baseUrl;
		requestUrl(`${baseUrl}themes.json`).then((response) => {
			if (response.status === 200) {
				// The URL is valid, use it
				url = baseUrl;
				console.log(`Using GitHub URL: ${url}`);
			} else {
				// The URL is not valid, use the alternative URL
				console.log(`status error, Using Gitee URL: ${baseUrlAlter}`);
				url = baseUrlAlter;
			}
		}).catch((error) => {
			// The URL is not valid, use the alternative URL
			console.log(`exception, Using Gitee URL: ${baseUrlAlter}`);
			url = baseUrlAlter;
		});


		try {
			// Download themes.json
			const themesResponse = await requestUrl(`${url}themes.json`);
			if (themesResponse.status !== 200) {
				throw new Error($t('views.theme-manager.failed-to-fetch-themes-json-themesrespon', [themesResponse.text]));
			}

			console.log(`Downloaded themes.json:`, themesResponse, `${url}themes.json`);
			
			const themesData = themesResponse.json;
			const themes = themesData.themes;

			// Download each theme file
			for (const theme of themes) {
				try {


					const fileResponse = await requestUrl(`${url}${theme.file}`);
					if (fileResponse.status !== 200) {
						console.warn(`Failed to download ${theme.file}: ${fileResponse.text}`);
						continue;
					}

					const fileContent = fileResponse.text;
					// Generate unique file name
					let filePath = `${saveDir}/${theme.file}`;
					let counter = 1;

					while (this.plugin.app.vault.getAbstractFileByPath(filePath)) {
						const extIndex = theme.file.lastIndexOf('.');
						const baseName = extIndex > 0 ? theme.file.slice(0, extIndex) : theme.file;
						const ext = extIndex > 0 ? theme.file.slice(extIndex) : '';
						filePath = `${saveDir}/${baseName}(${counter})${ext}`;
						counter++;
					}

					await this.plugin.app.vault.create(filePath, fileContent);
				} catch (error) {
					console.error(error);
					new Notice($t('views.theme-manager.error-downloading-theme') + error.message);
					continue;
				}
			}
			new Notice($t('views.theme-manager.total-themes-length-themes-downloaded', [themes.length]))
		} catch (error) {
			console.error("Error downloading themes:", error);
			new Notice($t('views.theme-manager.error-downloading-themes'));
		}
	}
	private plugin: WeWritePlugin;
	defaultCssRoot: postcss.Root;
	themes: WeChatTheme[] = [];
	static template_css: string = combinedCss;

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
		return this.themes;
	}
	public cleanCSS(css: string): string {

		css = css.replace(/```[cC][Ss]{2}\s*|\s*```/g, '').trim()
		const reg_multiple_line_comments = /\/\*[\s\S]*?\*\//g;
		const reg_single_line_comments = /\/\/.*/g;
		const reg_whitespace = /\s+/g;
		const reg_invisible_chars = /[\u200B\u00AD\uFEFF\u00A0]/g;

		let cleanedCSS = css
			.replace(reg_multiple_line_comments, '')
			.replace(reg_single_line_comments, '')
			.replace(reg_whitespace, ' ')
			.replace(reg_invisible_chars, '');

		return cleanedCSS.trim();
	}
	public async getThemeContent(path: string) {
		const file = this.plugin.app.vault.getFileByPath(path);
		if (!file) {
			return ThemeManager.template_css; //DEFAULT_STYLE;
		}
		const fileContent = await this.plugin.app.vault.cachedRead(file);

		const reg_css_block = /```[cC][Ss]{2}\s*([\s\S]*?)\s*```/g;

		const cssBlocks: string[] = [];
		let match
		while ((match = reg_css_block.exec(fileContent)) !== null) {
			cssBlocks.push(this.cleanCSS(match[1].trim()));
		}

		return cssBlocks.join('\n');

	}
	public async getCSS() {
		let custom_css = '' //this.defaultCssRoot.toString() //''
		if (this.plugin.settings.custom_theme === undefined || !this.plugin.settings.custom_theme) {

		} else {
			custom_css = await this.getThemeContent(this.plugin.settings.custom_theme)
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
		const fileContent = await this.plugin.app.vault.cachedRead(file);
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
		root.removeAttribute('class')
		let element = root.firstElementChild;
		while (element) {
			this.removeClassName(element as HTMLElement);
			element = element.nextElementSibling;
		}
	}
}
