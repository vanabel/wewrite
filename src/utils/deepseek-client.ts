import { Notice, requestUrl } from 'obsidian';
import { DeepSeekResult } from '../types';
import WeWritePlugin from 'src/main';
import OpenAI from "openai"

export class DeepSeekClient {
  private static instance: DeepSeekClient;
  private plugin: WeWritePlugin

  private constructor(plugin: WeWritePlugin) {
    this.plugin = plugin
  }

  public static getInstance(plugin: WeWritePlugin): DeepSeekClient {
    if (!DeepSeekClient.instance) {
      DeepSeekClient.instance = new DeepSeekClient(plugin);
    }
    return DeepSeekClient.instance;
  }

  public async generateSummary(content: string): Promise<string | null> {
    const openai = this.getOpenAI()
    if (!openai) {
      return ''
    }

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
          {
              role: 'system',
              content: `#角色 你是一个资深的文字工作者
              ##技能1: 擅长于对长的文章进行总结和提炼，但不缺少任何重点。
              ##技能2: 擅长于把复杂的文字用简单、平实的语言表达出来。
              ##技能3：擅长于用最简洁、简短的文字把意思说清楚。
              ##技能4：你的总结，句子完整，行文流畅。`,
          },
          {
              role: 'user',
              content: `用最多100个字总结下面的一段话:\n\n${content}`,
          },
      ],
      max_tokens: 100, // 限制生成的摘要长度
      temperature: 0.7, // 控制生成内容的随机性
  });
    console.log('digest ', completion);
    return completion.choices[0].message.content
  }

  public async proofreadContent(content: string): Promise<DeepSeekResult | null> {
    const openai = this.getOpenAI()
    if (!openai) {
      return null
    }
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
          {
              role: 'system',
              content: `#角色 你是一个资深的文字工作者
              ##技能1: 擅长于发现文本中的中文的错别字、英文的拼写错误
              ##技能2: 擅长于发现文本存在的语法错误。
              ##技能3：擅长于发现文本存在的修辞错误。
              ##技能4：双发现的各种问题，以及修改建议整理成为数组对象，以json格式返回。`,
          },
          {
              role: 'user',
              content: `请校对一下的文字:\n\n${content}`,
          },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    });
    return {
      summary: '',
      corrections: [],
      polished: completion.choices[0].message.content || '',
      coverImage: ''
    };
  }

  public async polishContent(content: string): Promise<DeepSeekResult | null> {
    const openai = this.getOpenAI()
    if (!openai) {
      return null
    }
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
          {
              role: 'system',
              content: 'You are a helpful assistant that polishes text.',
          },
          {
              role: 'user',
              content: `Please polish the following text:\n\n${content}`,
          },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    });
    return {
      summary: '',
      corrections: [],
      polished: completion.choices[0].message.content || '',
      coverImage: ''
    };
  }

  public async generateCoverImage(content: string): Promise<DeepSeekResult | null> {
    const openai = this.getOpenAI()
    if (!openai) {
      return null
    }
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
          {
              role: 'system',
              content: 'You are a helpful assistant that generates cover images.',
          },
          {
              role: 'user',
              content: `Please generate a cover image description for the following text:\n\n${content}`,
          },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });
    return {
      summary: '',
      corrections: [],
      polished: '',
      coverImage: completion.choices[0].message.content || ''
    };
  }
  private prepareRequestHeader() {
    if (this.plugin.settings.deepseekApiUrl === undefined || !this.plugin.settings.deepseekApiUrl) {
      new Notice('No AI Server URL given')
      return null
    }
    if (this.plugin.settings.deepseekApiKey === undefined || !this.plugin.settings.deepseekApiKey) {
      new Notice('No AI Server Key given')
      return null
    }
    const header =
    {
      url: this.plugin.settings.deepseekApiUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.plugin.settings.deepseekApiKey}`
      },
    }
    return header
  }
  private getOpenAI(): OpenAI | null {
    if (this.plugin.settings.deepseekApiUrl === undefined || !this.plugin.settings.deepseekApiUrl) {
      new Notice('No AI Server URL given')
      return null
    }
    if (this.plugin.settings.deepseekApiKey === undefined || !this.plugin.settings.deepseekApiKey) {
      new Notice('No AI Server Key given')
      return null
    }
    const openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      baseURL: this.plugin.settings.deepseekApiUrl, //'https://api.deepseek.com',
      apiKey: this.plugin.settings.deepseekApiKey //'<DeepSeek API Key>'
    });
    return openai
  }

}
