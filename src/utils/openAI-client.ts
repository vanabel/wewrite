import { Notice } from "obsidian";
import OpenAI from "openai";
import { $t } from "src/lang/i18n";
import WeWritePlugin from "src/main";
import { WeWriteSetting } from "src/settings/wewrite-setting";
import { DeepSeekResult } from "../types/types";

export class OpenAIClient {
	private static instance: OpenAIClient;
	private plugin: WeWritePlugin;
	private settings: WeWriteSetting;

	private constructor(plugin: WeWritePlugin) {
		this.plugin = plugin;
		this.settings = this.plugin.settings;
	}

	public static getInstance(plugin: WeWritePlugin): OpenAIClient {
		if (!OpenAIClient.instance) {
			OpenAIClient.instance = new OpenAIClient(plugin);
		}
		return OpenAIClient.instance;
	}

	public async getModelList(
		name: string | undefined = undefined
	): Promise<string[]> {
		// return ["gpt-4", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"];
		const openai = this.getChatAI(name);
		if (!openai) {
			return [];
		}
		const account = this.plugin.getChatAIAccount();
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return [];
		}
		const models = await openai.models.list();
		return models.data.map((model) => model.id);
	}
	public async generateSummary(content: string): Promise<string | null> {
		const openai = this.getChatAI();
		if (!openai) {
			return "";
		}
		const account = this.plugin.getChatAIAccount();
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return "";
		}
		const completion = await openai.chat.completions.create({
			model: account.model || "qwen-plus", //"deepseek-chat",
			messages: [
				{
					role: "system",
					content: `#角色 你是一个资深的文字工作者
              ##技能1: 擅长于对长的文章进行总结和提炼，但不缺少任何重点。
              ##技能2: 擅长于把复杂的文字用简单、平实的语言表达出来。
              ##技能3：擅长于用最简洁、简短的文字把意思说清楚。
              ##技能4：你的总结，句子完整，行文流畅。`,
				},
				{
					role: "user",
					content: `总结下面的一段话, 输出的字数最多100个字符:\n\n${content}`,
				},
			],
			max_tokens: 100,
			temperature: 0.7,
		});
		return completion.choices[0].message.content;
	}

	public async proofContent(content: string): Promise<DeepSeekResult | null> {
		const openai = this.getChatAI();
		if (!openai) {
			return null;
		}
		const account = this.plugin.getChatAIAccount();
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return null;
		}

		try {
			const completion = await openai.chat.completions.create({
				model: account.model || "qwen-plus",
				messages: [
					{
						role: "system",
						content: `# 你是一个专业的文本校对助手。发现给出文本的拼写错误、语法错误。
					## 对于你所发现的问题，你需要提供以下信息：
1. 问题文本原始文本，提取为original的内容
2. 问题文本第一个字符在提交的校对文本字符串的位置index，提取为start
4. 问题文本的最后一个字符的位置(end)
5. 错误类型（拼写/语法）
6. 错误描述, 提取为description的内容
7. 建议的修正文本，提取为suggestion的内容

## 请以以下JSON格式返回结果：
{
  "corrections": [
    {end
      "type": "拼写|语法",
      "start": 0,
      "end": 5,
	  "original": "原始的内容",
      "description": "错误描述",
      "suggestion": "正确的内容"
    }
  ],

}`,
					},
					{
						role: "user",
						content: `请校对以下文本：\n\n${content}`,
					},
				],
				response_format: { type: "json_object" },
				max_tokens: 8192,
				temperature: 0.7,
			});

			console.log(`OpenAI response:`, completion);

			const responseContent = completion.choices[0].message.content;
			if (!responseContent) {
				return {
					summary: "",
					corrections: [],
					polished: content,
					coverImage: "",
				};
			}

			const result = JSON.parse(responseContent);
			console.log(`content=>`, content);
			let start = 0;
			for (const correction of result.corrections) {
				// correction.start = parseInt(correction.start);
				// correction.end = parseInt(correction.end);
				// const text = content.substring(correction.start, correction.end);
				correction.start = content.indexOf(correction.original, start);
				correction.end = correction.start + correction.original.length;
				start = correction.end;
				console.log(
					`text[${correction.start},${correction.end}]: ${correction.original} -> ${correction.suggestion}`
				);
			}

			return {
				summary: "",
				corrections: result.corrections || [],
				polished: result.polished || content,
				coverImage: "",
			};
		} catch (error) {
			console.error("Error in proofContent:", error);
			return {
				summary: "",
				corrections: [],
				polished: content,
				coverImage: "",
			};
		}
	}

	public async polishContent(
		content: string
	): Promise<DeepSeekResult | null> {
		const openai = this.getChatAI();
		if (!openai) {
			return null;
		}
		const account = this.plugin.getChatAIAccount();
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return null;
		}
		const completion = await openai.chat.completions.create({
			model: account.model || "qwen-plus",
			messages: [
				{
					role: "system",
					content: `你是一个专业的文本润色助手。请遵循以下原则优化文本：
1. 保持原文核心意思不变
2. 改进句子结构和语法
3. 提升表达清晰度和流畅度
4. 优化用词，使其更准确和专业
5. 保持适当的语气和风格
6. 确保逻辑连贯性
7. 消除冗余表达
8. 优化段落结构`,
				},
				{
					role: "user",
					content: `请优化以下文本，保持原意但提升表达质量：\n\n${content}`,
				},
			],
			max_tokens: 8192,
			temperature: 0.7,
		});
		return {
			summary: "",
			corrections: [],
			polished: completion.choices[0].message.content || "",
			coverImage: "",
		};
	}

	private getChatAI(name: string | undefined = undefined): OpenAI | null {
		const account = this.plugin.getChatAIAccount(name);
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return null;
		}
		if (account.baseUrl === undefined || !account.baseUrl) {
			new Notice($t("utils.no-ai-server-url-given"));
			return null;
		}
		if (account.apiKey === undefined || !account.apiKey) {
			new Notice($t("utils.no-ai-server-key-given"));
			return null;
		}
		const openai = new OpenAI({
			dangerouslyAllowBrowser: true,
			baseURL: account.baseUrl, //'https://api.deepseek.com',
			apiKey: account.apiKey, //'<DeepSeek API Key>'
		});
		return openai;
	}

	public async generateMermaid(content: string): Promise<string> {
		const openai = this.getChatAI();
		if (!openai) {
			return "";
		}
		const account = this.plugin.getChatAIAccount();
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return "";
		}
		const completion = await openai.chat.completions.create({
			model: account.model || "qwen-plus",
			messages: [
				{
					role: "system",
					content: `你是一个专业的图表生成助手。请根据提供的文本内容生成相应的Mermaid图表代码。生成的代码应该可以直接插入Markdown文档中使用。`,
				},
				{
					role: "user",
					content: `请为以下内容生成Mermaid图表代码：\n\n${content}`,
				},
			],
			max_tokens: 1000,
			temperature: 0.7,
		});
		return completion.choices[0].message.content || "";
	}

	public async generateLaTeX(content: string): Promise<string> {
		const openai = this.getChatAI();
		if (!openai) {
			return "";
		}
		const account = this.plugin.getChatAIAccount();
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return "";
		}
		const completion = await openai.chat.completions.create({
			model: account.model || "qwen-plus",
			messages: [
				{
					role: "system",
					content: `你是一个专业的LaTeX生成助手。请根据提供的文本内容生成相应的LaTeX代码。生成的代码应该可以直接插入Markdown文档中使用。`,
				},
				{
					role: "user",
					content: `请为以下内容生成LaTeX代码：\n\n${content}`,
				},
			],
			max_tokens: 1000,
			temperature: 0.7,
		});
		return completion.choices[0].message.content || "";
	}

	public async synonym(content: string): Promise<string[]> {
		const openai = this.getChatAI();
		if (!openai) {
			return [];
		}

		const account = this.plugin.getChatAIAccount();
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return [];
		}
		const completion = await openai.chat.completions.create({
			model: account.model || "qwen-plus",
			messages: [
				{
					role: "system",
					content: `你是一个专业的同义词生成助手。请为提供的词语或短语生成最多10个不同的同义表达。每个表达应该简洁明了。原文是英语，返回的也是英语，不要返回中文。如果原文是中文，返回的也是中文。`,
				},
				{
					role: "user",
					content: `请为以下内容生成同义表达：\n\n${content}`,
				},
			],
			max_tokens: 200,
			temperature: 0.7,
		});

		const synonyms =
			completion.choices[0].message.content?.split("\n") || [];
		return synonyms.slice(0, 10);
	}

	public async translateText(
		content: string,
		sourceLang: string = "English",
		targetLang: string = "Chinese"
	): Promise<string> {
		const openai = this.getChatAI();
		if (!openai) {
			return "";
		}
		const account = this.plugin.getChatAIAccount();
		if (!account) {
			new Notice($t("settings.no-chat-account-selected"));
			return "";
		}
		const completion = await openai.chat.completions.create({
			model: account.model || "qwen-plus",
			messages: [
				{
					role: "system",
					content: `你是一个专业的翻译助手。请遵循以下原则进行翻译：
1. 保持原文意思准确
2. 使用自然流畅的目标语言表达
3. 保持专业术语的准确性
4. 保持上下文一致性
5. 保留原文格式和特殊符号`,
				},
				{
					role: "user",
					content: `请将以下内容从${sourceLang}翻译成${targetLang}：\n\n${content}`,
				},
			],
			max_tokens: 4096,
			temperature: 0.7,
		});

		return completion.choices[0].message.content || "";
	}
}
