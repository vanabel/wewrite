declare module 'marked-extended-tables' {
    import { Tokenizer, Renderer } from 'marked';

    export interface TableExtension {
      name: string;
      level: 'block' | 'inline';
      start(src: string): number | undefined;
      tokenizer(src: string, tokens: any[]): any;
      renderer(token: any): string;
    }

    export default function(endRegex?: string[]): {
      extensions: TableExtension[];
    };
  }
