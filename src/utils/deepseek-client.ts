import type { DeepSeekClient } from '../types';
import { DeepSeekResult } from '../types';

class DeepSeekClientImpl implements DeepSeekClient {
  private static instance: DeepSeekClientImpl;

  private constructor() {}

  getInstance(): DeepSeekClient {
    return DeepSeekClientImpl.getInstance();
  }

  public static getInstance(): DeepSeekClient {
    if (!DeepSeekClientImpl.instance) {
      DeepSeekClientImpl.instance = new DeepSeekClientImpl();
    }
    return DeepSeekClientImpl.instance;
  }

  public async generateSummary(content: string): Promise<DeepSeekResult> {
    try {
      const response = await fetch('https://api.deepseek.com/v1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          content,
          operation: 'summary'
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        summary: result.summary || '',
        corrections: result.corrections || [],
        polished: result.polished || '',
        coverImage: result.coverImage || ''
      };
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw error;
    }
  }

  public async proofreadContent(content: string): Promise<DeepSeekResult> {
    try {
      const response = await fetch('https://api.deepseek.com/v1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          content,
          operation: 'proofread'
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        summary: result.summary || '',
        corrections: result.corrections || [],
        polished: result.polished || '',
        coverImage: result.coverImage || ''
      };
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw error;
    }
  }

  public async polishContent(content: string): Promise<DeepSeekResult> {
    try {
      const response = await fetch('https://api.deepseek.com/v1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          content,
          operation: 'polish'
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        summary: result.summary || '',
        corrections: result.corrections || [],
        polished: result.polished || '',
        coverImage: result.coverImage || ''
      };
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw error;
    }
  }

  public async generateCoverImage(content: string): Promise<DeepSeekResult> {
    try {
      const response = await fetch('https://api.deepseek.com/v1/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          content,
          operation: 'cover'
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        summary: result.summary || '',
        corrections: result.corrections || [],
        polished: result.polished || '',
        coverImage: result.coverImage || ''
      };
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw error;
    }
  }
}

const DeepSeekClient: DeepSeekClient = DeepSeekClientImpl.getInstance();
export { DeepSeekClient };
