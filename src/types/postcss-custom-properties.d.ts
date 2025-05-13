declare module 'postcss-custom-properties' {
  import { Plugin } from 'postcss';

  interface Options {
    preserve?: boolean | 'computed';
    importFrom?: string | string[] | { [key: string]: any };
    exportTo?: string | string[] | ((customProperties: any) => void);
  }

  const plugin: (options?: Options) => Plugin;

  export default plugin;
}
