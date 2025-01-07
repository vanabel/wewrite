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
              content: 'You are a helpful assistant that summarizes text.',
          },
          {
              role: 'user',
              content: `Please summarize the following text in less than 80 words:\n\n${content}`,
          },
      ],
      max_tokens: 80, // 限制生成的摘要长度
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
              content: 'You are a helpful assistant that proofreads text.',
          },
          {
              role: 'user',
              content: `Please proofread the following text:\n\n${content}`,
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
