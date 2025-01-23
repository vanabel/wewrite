import { Notice, requestUrl } from 'obsidian';
import { DeepSeekResult } from '../types/types';
import WeWritePlugin from 'src/main';
import OpenAI from "openai"
import { WeWriteSetting } from 'src/settings/wewrite-setting';
import { $t } from 'src/lang/i18n';

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
          content: `总结下面的一段话, 输出的字数最大100个字符:\n\n${content}`,
        },
      ],
      max_tokens: 100, // 限制生成的摘要长度
      temperature: 0.7, // 控制生成内容的随机性
    });
    console.log('digest ', completion);
    return completion.choices[0].message.content
  }

  public async proofContent(content: string): Promise<DeepSeekResult | null> {
    const openai = this.getChatAI();
    if (!openai) {
      return null;
    }

    try {
      const completion = await openai.chat.completions.create({
        model: this.plugin.settings.chatLLMModel || 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的文本校对助手。请分析以下文本，找出所有拼写错误、语法错误和修辞问题。对于每个问题，请提供：
1. 错误类型（拼写/语法/修辞）
2. 错误位置（开始字符索引，结束字符索引）
3. 错误描述
4. 修改建议

请以以下JSON格式返回结果：
{
  "corrections": [
    {
      "type": "拼写|语法|修辞",
      "start": 0,
      "end": 5,
      "description": "错误描述",
      "suggestion": "修改建议"
    }
  ],
  "polished": "修改后的完整文本"
}`,
          },
          {
            role: 'user',
            content: `请校对以下文本：\n\n${content}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 8192,
        temperature: 0.7,
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        return {
          summary: '',
          corrections: [],
          polished: content,
          coverImage: ''
        };
      }

      const result = JSON.parse(responseContent);
      
      return {
        summary: '',
        corrections: result.corrections || [],
        polished: result.polished || content,
        coverImage: ''
      };
    } catch (error) {
      console.error('Error in proofContent:', error);
      return {
        summary: '',
        corrections: [],
        polished: content,
        coverImage: ''
      };
    }
  }

  public async polishContent(content: string): Promise<DeepSeekResult | null> {
    const openai = this.getChatAI()
    if (!openai) {
      return null
    }
    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus',
      messages: [
        {
          role: 'system',
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
          role: 'user',
          content: `请优化以下文本，保持原意但提升表达质量：\n\n${content}`,
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
      new Notice($t('utils.no-ai-server-url-given'))
      return null
    }
    if (this.plugin.settings.drawLLMApiKey === undefined || !this.plugin.settings.drawLLMApiKey) {
      new Notice($t('utils.no-ai-server-key-given'))
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
      new Notice($t('utils.no-ai-server-url-given'))
      return null
    }
    if (this.plugin.settings.drawLLMApiKey === undefined || !this.plugin.settings.drawLLMApiKey) {
      new Notice($t('utils.no-ai-server-key-given'))
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
      new Notice($t('utils.no-ai-server-url-given'))
      return null
    }
    if (this.plugin.settings.chatLLMApiKey === undefined || !this.plugin.settings.chatLLMApiKey) {
      new Notice($t('utils.no-ai-server-key-given'))
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
        throw new Error($t('utils.missing-api-configuration'));
      }
      this.plugin.showSpinner();

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

      // console.log(`generateCoverImageFromText response=>`, response);

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
          this.plugin.hideSpinner()
          resolve(json.output.results[0].url)
        }
        if (json.output.task_status === 'FAILED' || json.output.task_status === 'UNKNOWN'){
          console.log(`task failed.`, json);
          
          clearInterval(intervalId);
          this.plugin.hideSpinner()
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
        this.plugin.hideSpinner()
        throw new Error($t('utils.missing-api-configuration'));
      }
      if (!headers.url.endsWith('/')) {
        headers.url += '/'
      }
      headers.url += taskId;
      const response = await requestUrl({...headers, url: headers.url})
      // console.log(`checkImageGenerationStatus response=>`, response);
      resolve(response.json)
    })
  }

  public async generateMermaid(content: string): Promise<string> {
    const openai = this.getChatAI();
    if (!openai) {
      return '';
    }

    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的图表生成助手。请根据提供的文本内容生成相应的Mermaid图表代码。生成的代码应该可以直接插入Markdown文档中使用。`,
        },
        {
          role: 'user',
          content: `请为以下内容生成Mermaid图表代码：\n\n${content}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    return completion.choices[0].message.content || '';
  }

  public async generateLaTeX(content: string): Promise<string> {
    const openai = this.getChatAI();
    if (!openai) {
      return '';
    }

    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的LaTeX生成助手。请根据提供的文本内容生成相应的LaTeX代码。生成的代码应该可以直接插入Markdown文档中使用。`,
        },
        {
          role: 'user',
          content: `请为以下内容生成LaTeX代码：\n\n${content}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    return completion.choices[0].message.content || '';
  }

  public async synonym(content: string): Promise<string[]> {
    const openai = this.getChatAI();
    if (!openai) {
      return [];
    }

    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的同义词生成助手。请为提供的词语或短语生成最多10个不同的同义表达。每个表达应该简洁明了。原文是英语，返回的也是英语，不要返回中文。如果原文是中文，返回的也是中文。`,
        },
        {
          role: 'user',
          content: `请为以下内容生成同义表达：\n\n${content}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const synonyms = completion.choices[0].message.content?.split('\n') || [];
    return synonyms.slice(0, 10);
  }

  public async translateText(content: string, sourceLang: string = 'English', targetLang: string='Chinese'): Promise<string> {
    const openai = this.getChatAI();
    if (!openai) {
      return '';
    }

    const completion = await openai.chat.completions.create({
      model: this.plugin.settings.chatLLMModel || 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的翻译助手。请遵循以下原则进行翻译：
1. 保持原文意思准确
2. 使用自然流畅的目标语言表达
3. 保持专业术语的准确性
4. 保持上下文一致性
5. 保留原文格式和特殊符号`,
        },
        {
          role: 'user',
          content: `请将以下内容从${sourceLang}翻译成${targetLang}：\n\n${content}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    return completion.choices[0].message.content || '';
  }
}
