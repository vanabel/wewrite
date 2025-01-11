import { Notice, requestUrl } from 'obsidian';
import { DeepSeekResult } from '../types';
import WeWritePlugin from 'src/main';
import OpenAI from "openai"
import { WeWriteSetting } from 'src/settings/wewrite-setting';

export class AiClient {
  private static instance: AiClient;
  private plugin: WeWritePlugin
  private settings: WeWriteSetting

  private constructor(plugin: WeWritePlugin) {
    this.plugin = plugin
    this.settings = this.plugin.settings
  }

  public static getInstance(plugin: WeWritePlugin): AiClient {
    if (!AiClient.instance) {
      AiClient.instance = new AiClient(plugin);
    }
    return AiClient.instance;
  }

  public async generateSummary(content: string): Promise<string | null> {
    const openai = this.getChatAI()
    if (!openai) {
      return ''
    }

    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus', //"deepseek-chat",
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
    const openai = this.getChatAI()
    if (!openai) {
      return null
    }
    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus', //"deepseek-chat",
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
    const openai = this.getChatAI()
    if (!openai) {
      return null
    }
    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus', //"deepseek-chat",
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
    const openai = this.getChatAI()
    if (!openai) {
      return null
    }
    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus',
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
  private prepareImageGenerateRequestHeader() {
    if (this.plugin.settings.drawLLMBaseUrl === undefined || !this.plugin.settings.drawLLMBaseUrl) {
      new Notice('No AI Server URL given')
      return null
    }
    if (this.plugin.settings.drawLLMApiKey === undefined || !this.plugin.settings.drawLLMApiKey) {
      new Notice('No AI Server Key given')
      return null
    }
    const header =
    {
      url: this.plugin.settings.drawLLMBaseUrl,
      method: 'POST',
      headers: {
        'X-DashScope-Async': 'enable',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.plugin.settings.drawLLMApiKey}`
      },
    }
    return header
  }
  private prepareImageTaskCheckingHeader() {
    if (this.plugin.settings.drawLLMTaskUrl === undefined || !this.plugin.settings.drawLLMTaskUrl) {
      new Notice('No AI Server URL given')
      return null
    }
    if (this.plugin.settings.drawLLMApiKey === undefined || !this.plugin.settings.drawLLMApiKey) {
      new Notice('No AI Server Key given')
      return null
    }
    const header =
    {
      url: this.plugin.settings.drawLLMTaskUrl,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.plugin.settings.drawLLMApiKey}`
      },
    }
    return header
  }
  private getChatAI(): OpenAI | null {
    if (this.plugin.settings.chatLLMBaseUrl === undefined || !this.plugin.settings.chatLLMBaseUrl) {
      new Notice('No AI Server URL given')
      return null
    }
    if (this.plugin.settings.chatLLMApiKey === undefined || !this.plugin.settings.chatLLMApiKey) {
      new Notice('No AI Server Key given')
      return null
    }
    const openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      baseURL: this.plugin.settings.chatLLMBaseUrl, //'https://api.deepseek.com',
      apiKey: this.plugin.settings.chatLLMApiKey //'<DeepSeek API Key>'
    });
    return openai
  }
  public async generateCoverImageFromText(prompt: string, negative_prompt:string = '', size:string='1440*613'): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const headers = this.prepareImageGenerateRequestHeader();
      if (!headers) {
        throw new Error('Missing API configuration');
      }

      const response = await requestUrl({
        ...headers,
        body: JSON.stringify({
          model: this.settings.drawLLMModel || 'wanx2.1-t2i-turbo',
          input: {
            prompt: prompt,
            negative_prompt: negative_prompt
          },
          parameters: {
            size: size, //`900*383`,
            n: 1,

          }
        })
      });

      console.log(`generateCoverImageFromText response=>`, response);

      if (response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = response.json;
      // return result.output.task_id; // Return task ID for async image generation


      // 每2秒执行一次
      const intervalId = setInterval(async () => {
        const json = await this.checkImageGenerationStatus(result.output.task_id)
        if (json.output.task_status === 'SUCCEEDED'){
          clearInterval(intervalId);
          resolve(json.output.results[0].url)
        }
        if (json.output.task_status === 'FAILED' || json.output.task_status === 'UNKNOWN'){
          console.log(`task failed.`, json);
          
          clearInterval(intervalId);
          resolve('')
        }

      }, 2000);

      // 10秒后取消定时任务
      setTimeout(() => {
        clearInterval(intervalId);
        console.log('checking task stopped.');
        reject('')
      }, 30000);
    });

  }
  
  checkImageGenerationStatus(taskId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const headers = this.prepareImageTaskCheckingHeader();
      if (!headers) {
        throw new Error('Missing API configuration');
      }
      if (!headers.url.endsWith('/')) {
        headers.url += '/'
      }
      headers.url += taskId;
      const response = await requestUrl({...headers, url: headers.url})
      console.log(`checkImageGenerationStatus response=>`, response);
      resolve(response.json)
    })
  }
}
