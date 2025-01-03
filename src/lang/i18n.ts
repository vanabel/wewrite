/**
 * i18n module for WeWrite plugin
 */
import i18n from 'i18next';
import { moment } from 'obsidian';

import enUsTrans from './locales/en-us.json';
import zhCnTrans from './locales/zh-cn.json';
console.log(`moment.locale`, moment, moment.locale());

i18n
  .init({
    debug: false,
    lng: moment.locale(), //obsidian language
    fallbackLng: 'en', // 默认语言，当用户语言不匹配时回退的语言
    interpolation: {
      escapeValue: false, // React中不需要转义，因为它默认会转义
    },
    resources: {
      en: {
        translation: enUsTrans,
      },
      zh: {
        translation: zhCnTrans,
      },
    },
  });
export function $t(key: string) {
  return i18n.t(key)
}

export default i18n;