/* 
*/

import { App, Notice, requestUrl, RequestUrlParam } from "obsidian";
import WeWritePlugin from "src/main";
import { getErrorMessage } from "./error-code";
import { DraftArticle } from "./wechat-types";

export class WechatClient {
  private static instance: WechatClient;
  private app: App;
  private plugin: WeWritePlugin;
  readonly baseUrl: string = 'https://api.weixin.qq.com/cgi-bin';
  private constructor(plugin: WeWritePlugin) {
    this.plugin = plugin
  }
  public static getInstance(plugin: WeWritePlugin): WechatClient {
    if (!WechatClient.instance) {
      WechatClient.instance = new WechatClient( plugin);
    }
    return WechatClient.instance;
  }
  private getHeaders() {
    return {
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };
  }
  public async getAccessToken(appId: string, appSecret: string) {
    // if ((lastAccessKeyTime + this.expireDuration) <  new Date().getTime()) {
    const url = `${this.baseUrl}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const req: RequestUrlParam = {
      url: url,
      method: 'GET',
      headers: this.getHeaders()
    };
    const resp = await requestUrl(req);

    console.log(`resp=>${JSON.stringify(resp)}`);

    const { access_token, errcode, expires_in } = resp.json;
    const respAccessToken: string = resp.json["access_token"];
    console.log(`token：${access_token}`);

    if (access_token === undefined) {
      console.error('获取AccessToken失败');
      new Notice(getErrorMessage(errcode), 0);
      return false;
    }
    // new Notice((`成功`));

    return { access_token, expires_in };
  }
  public async getBatchMaterial(accountName: string | undefined, type: string, offset: number = 0, count: number = 10) {

    const accessToken = await this.plugin.refreshAccessToken(accountName);
    console.log(`wxBatchGetMaterial: accessToken=>${accessToken}`);
    if (!accessToken) {
      return false;
    }
    const url = 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=' + accessToken;
    const body = {
      type,
      offset,
      count
    };

    const res = await requestUrl({
      method: 'POST',
      url: url,
      throw: false,
      body: JSON.stringify(body)
    });

    return await res.json;
  }
  public async wxAddDraft(token: string, data: DraftArticle) {
    const url = 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=' + token;
    const body = {
      articles: [{
        title: data.title,
        content: data.content,
        digest: data.digest,
        thumb_media_id: data.thumb_media_id,
        ...data.pic_crop_235_1 && { pic_crop_235_1: data.pic_crop_235_1 },
        ...data.pic_crop_1_1 && { pic_crop_1_1: data.pic_crop_1_1 },
        ...data.content_source_url && { content_source_url: data.content_source_url },
        ...data.need_open_comment !== undefined && { need_open_comment: data.need_open_comment },
        ...data.only_fans_can_comment !== undefined && { only_fans_can_comment: data.only_fans_can_comment },
        ...data.author && { author: data.author },
      }]
    };

    const res = await requestUrl({
      method: 'POST',
      url: url,
      throw: false,
      body: JSON.stringify(body)
    });

    return res;
  }
  public async wxUploadImage(data: Blob, filename: string, token: string, type?: string) {
    // let url = '';
    // if (type == null || type === '') {
    //   url = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=' + token;
    // } else {
    //   url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=${type}`
    // }

    // const N = 16 // The length of our random boundry string
    // const randomBoundryString = "djmangoBoundry" + Array(N + 1).join((Math.random().toString(36) + '00000000000000000').slice(2, 18)).slice(0, N)

    // // Construct the form data payload as a string
    // const pre_string = `------${randomBoundryString}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: "application/octet-stream"\r\n\r\n`;
    // const post_string = `\r\n------${randomBoundryString}--`

    // // Convert the form data payload to a blob by concatenating the pre_string, the file data, and the post_string, and then return the blob as an array buffer
    // const pre_string_encoded = new TextEncoder().encode(pre_string);
    // // const data = file;
    // const post_string_encoded = new TextEncoder().encode(post_string);
    // const concatenated = await new Blob([pre_string_encoded, await getBlobArrayBuffer(data), post_string_encoded]).arrayBuffer()

    // // Now that we have the form data payload as an array buffer, we can pass it to requestURL
    // // We also need to set the content type to multipart/form-data and pass in the boundry string
    // const options: RequestUrlParam = {
    //   method: 'POST',
    //   url: url,
    //   contentType: `multipart/form-data; boundary=----${randomBoundryString}`,
    //   body: concatenated
    // };

    // const res = await requestUrl(options);
    // const resData = await res.json;
    // return {
    //   url: resData.url || '',
    //   media_id: resData.media_id || '',
    //   errcode: resData.errcode || 0,
    //   errmsg: resData.errmsg || '',
    // }
  }
  // public async getAllMaterialList(accountName:string) {

  //   const accessToken = this.plugin.getAccessToken(accountName);
  //   const url = `${this.baseUrl}/material/get_materialcount?access_token=${accessToken}`
  //   const req: RequestUrlParam = {
  //     url: url,
  //     method: 'GET',
  //     headers: this.getHeaders()
  //   };
  //   const resp = await requestUrl(req);

  //   console.log(`resp=>${JSON.stringify(resp)}`);

  //   const { errcode, voice_count, video_count, image_count, news_count } = resp.json;
  //   console.log(`errcode=>${errcode}, voice_count=>${voice_count}, video_count=>${video_count}, image_count=>${image_count}, news_count=>${news_count}`);

  //   if (errcode !== undefined && errcode !== 0) {
  //     new Notice(getErrorMessage(errcode), 0);
  //     return false;
  //   }

  //   const imageList = []

  //   let offset = 0
  //   while (offset < image_count) {
  //     const json = await this.wxBatchGetMaterial(accountName,'image', offset, 20);
  //     const { errcode, item, total_count, item_count } = json;
  //     if (errcode !== undefined && errcode !== 0) {
  //       new Notice(getErrorMessage(errcode))
  //       break;
  //     }
  //     console.log(`image_count=>${image_count}, offset=>${offset}, total_count=>${total_count}, item_count=>${item_count}`);
  //     imageList.push(...item);
  //     offset += item_count;
  //   }
  //   console.log(`total image count=>${imageList.length}`);
  //   console.log(imageList);
  //   return imageList;
  // }
  public async getMaterialList(accountName: string, type: string, offset: number = 0, count: number = 20) {
    const accessToken = await this.plugin.refreshAccessToken(accountName);
    if (!accessToken) {
      return false;
    }
    // get all images by loop
    const url = `${this.baseUrl}/material/batchget_material?access_token=${accessToken}`
    const body = {
      type: type, // image, video, voice, news
      offset: offset,
      count: count
    };

    const req: RequestUrlParam = {
      url: url,
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    };
    const resp = await requestUrl(req);

    console.log(`resp=>${JSON.stringify(resp)}`);
    return resp.json;
  }
  public async getMaterialById(accountName: string, media_id: string) {
    const accessToken = await this.plugin.refreshAccessToken(accountName);
    if (!accessToken) {
      return false;
    }
    // get all images by loop
    const url = `${this.baseUrl}/material/get_material?access_token=${accessToken}`
    const body = {
      media_id: media_id
    };

    const req: RequestUrlParam = {
      url: url,
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    };
    const resp = await requestUrl(req);

    // console.log(`resp=>${JSON.stringify(resp)}`);
    // return resp.json;
    console.log(`resp`, resp);

  }
  public async getBatchDraftList(accountName: string | undefined, offset: number = 0, count: number = 20) {
    const accessToken = await this.plugin.refreshAccessToken(accountName);
    if (!accessToken) {
      return false;
    }
    // get all images by loop
    const url = `${this.baseUrl}/draft/batchget?access_token=${accessToken}`
    const body = {
      offset: offset,
      count: count,
      no_content: false
    };

    const req: RequestUrlParam = {
      url: url,
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    };
    const resp = await requestUrl(req);

    console.log(`resp=>${JSON.stringify(resp)}`);
    return resp.json;
  }

  public async getMaterialCounts(accountName: string) {

    const accessToken = this.plugin.getAccessToken(accountName);
    const url = `${this.baseUrl}/material/get_materialcount?access_token=${accessToken}`
    const req: RequestUrlParam = {
      url: url,
      method: 'GET',
      headers: this.getHeaders()
    };
    const resp = await requestUrl(req);

    // console.log(`resp=>${JSON.stringify(resp)}`);

    const { errcode, voice_count, video_count, image_count, news_count } = resp.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    } else {
      return resp.json
    }
    // console.log(`errcode=>${errcode}, voice_count=>${voice_count}, video_count=>${video_count}, image_count=>${image_count}, news_count=>${news_count}`);
  }
  public async getDraftCount(accountName: string) {

    const accessToken = this.plugin.getAccessToken(accountName);
    const url = `${this.baseUrl}/draft/count?access_token=${accessToken}`
    const req: RequestUrlParam = {
      url: url,
      method: 'GET',
      headers: this.getHeaders()
    };
    const resp = await requestUrl(req);

    const { errcode, total_count } = resp.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    } else {
      return total_count
    }
  }
}