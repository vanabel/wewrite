import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { requestUrl } from "obsidian";
import * as cheerio from "cheerio";

// 提取公众号信息函数
interface WeChatAccountInfo {
	nickname?: string;
	title?: string;
	avatarUrl?: string;
	description?: string;
	originalCount?: string;
}

export async function extractWeChatInfoByRequestUrl(articleUrl: string): Promise<WeChatAccountInfo> {
	try {
		const response = await requestUrl({
			url: articleUrl,
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0"
			}
		});

		const html = response.text;
		console.log("html =>", html);
		// 使用正则提取信息（结构可能随时变化）
		const nicknameMatch = html.match(/var nickname = "([^"]+)"/);
		const titleMatch = html.match(/<title>([^<]+)<\/title>/);
		const descMatch = html.match(/<meta name="description" content="([^"]*)"/);

		console.log("nicknameMatch =>", nicknameMatch);
		console.log("titleMatch =>", titleMatch);
		console.log("descMatch =>", descMatch);
		return {
			nickname: nicknameMatch ? nicknameMatch[1] : "Not found",
			title: titleMatch ? titleMatch[1] : "No title",
			description: descMatch ? descMatch[1] : "No description",
			// 其他 meta 信息可类似提取
		};


		// 		const $ = cheerio.load(html);
		// 		// const info: WeChatAccountInfo = {};
		// 		// console.log("html $=>", html);
		// 		// $('meta').each((i, el) => {
		// 		// 	console.log(`第 ${i + 1} 个 meta 标签属性:`);
		// 		// 	const attribs = el.attribs;
		// 		// 	for (const attrName in attribs) {
		// 		// 		console.log(` - ${attrName}: ${attribs[attrName]}`);
		// 		// 	}
		// 		// });


		// 		// info.name = $('meta[property="og:title"]').attr("content") ?? "";
		// 		// info.avatarUrl = $('meta[property="og:image"]').attr("content") ?? "";
		// 		// info.description = $('meta[property="og:description"]').attr("content") ?? "";

		// 		// const bodyText = $("body").text();
		// 		// const match = bodyText.match(/(\d+)\s*篇原创内容/);
		// 		// if (match) info.originalCount = match[1];
		// 		const name = $('.profile_inner .profile_meta .profile_meta_value').first().text().trim();
		// 		const description = $('.profile_inner .profile_meta_desc').text().trim();
		// 		const avatarUrl = $('.profile_avatar img').attr('src')?.trim();
		// 		const originalCountMatch = $('body').text().match(/(\d+)\s*篇原创内容/);
		// 		const originalCount = originalCountMatch ? originalCountMatch[1] : '';

		// 		const info = `公众号名称：${name}
		// 简介：${description}
		// 头像链接：${avatarUrl}
		// 原创内容数量：${originalCount}`;

		// 		new Notice(info, 10000); // 长时间展示通知
		// 		console.log(info);

		// 		return { name, avatarUrl, description, originalCount };
	} catch (error) {
		console.error("微信公众号信息提取失败：", error);
		throw new Error("解析失败，请检查链接是否有效。");
	}
}

// 弹出对话框让用户输入 URL
export class WechatArticleUrlInputModal extends Modal {
	onSubmit: (url: string) => void;

	constructor(app: App, onSubmit: (url: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "输入微信公众号文章链接" });

		const inputEl = contentEl.createEl("input", {
			type: "text",
			placeholder: "https://mp.weixin.qq.com/s/...",
			value: "https://mp.weixin.qq.com/s/XHRGq9y7WKj1HgcGlN_aeA",
		});

		inputEl.style.width = "100%";
		inputEl.focus();

		contentEl.createEl("button", {
			text: "提取信息",
		}).addEventListener("click", () => {
			const url = inputEl.value.trim();
			if (url) {
				this.close();
				this.onSubmit(url);
			} else {
				new Notice("请输入有效链接！");
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
