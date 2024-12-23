/* 
*/

import { App, getBlobArrayBuffer, Notice, requestUrl, RequestUrlParam } from "obsidian";
import WeWritePlugin from "src/main";
import { getErrorMessage } from "./error-code";
import { DraftArticle } from "./wechat-types";
import { LocalDraftItem } from "src/assets/draft-manager";

export class WechatClient {
  private static instance: WechatClient;
  private app: App;
  private _plugin: WeWritePlugin;
  readonly baseUrl: string = 'https://api.weixin.qq.com/cgi-bin';
  private constructor(plugin: WeWritePlugin) {
    this._plugin = plugin
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
      console.error('获取AccessToken失败:', errcode);
      new Notice(getErrorMessage(errcode), 0);
      return false;
    }
    // new Notice((`成功`));

    return { access_token, expires_in };
  }
  public async getBatchMaterial(accountName: string | undefined, type: string, offset: number = 0, count: number = 10) {

    const accessToken = await this._plugin.refreshAccessToken(accountName);
    console.log(`getBatchMaterial: accessToken=>${accessToken}`);
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
  public async sendArticleToDraftBox(localDraft: LocalDraftItem, data: string){
    const accessToken = await this._plugin.refreshAccessToken(this._plugin.settings.selectedAccount);
    console.log(`sendArticleToDraftBox: accessToken=>${accessToken}`);
    if (!accessToken) {
      return false;
    }
    const url = 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=' + accessToken;
    const body = {
      articles: [{
        title: localDraft.title,
        content: data,
        digest: localDraft.digest,
        thumb_media_id: localDraft.thumb_media_id,
        // ...localDraft.pic_crop_235_1 && { pic_crop_235_1: localDraft.pic_crop_235_1 },
        // ...localDraft.pic_crop_1_1 && { pic_crop_1_1: localDraft.pic_crop_1_1 },
        ...localDraft.content_source_url && { content_source_url: localDraft.content_source_url },
        ...localDraft.need_open_comment !== undefined && { need_open_comment: localDraft.need_open_comment },
        ...localDraft.only_fans_can_comment !== undefined && { only_fans_can_comment: localDraft.only_fans_can_comment },
        ...localDraft.author && { author: localDraft.author },
      }]
    };

    const res = await requestUrl({
      method: 'POST',
      url: url,
      throw: false,
      body: JSON.stringify(body)
    });

    console.log(`send draft:`, res.json);
    const {errcode, media_id} = res.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0)
      return false;
    }else{
      new Notice(`草稿发送成功${media_id}`);
    }
    
    return media_id;
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
  public async uploadImage(data: Blob, filename: string, type?: string) {
    console.log(`uploadImage: filename=`, filename);
    console.log(`uploadImage: data=`, data);
    
    const accessToken = await this._plugin.refreshAccessToken(this._plugin.settings.selectedAccount);
    console.log(`uploadImage: accessToken=>${accessToken}`);
    if (!accessToken) {
      return false;
    }

    let url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`
    //上传图文消息内的图片获取URL,"上传图文消息内的图片获取URL"接口所上传的图片，不占用公众号的素材库中图片数量的100000个的限制，图片仅支持jpg/png格式，大小必须在1MB以下
    //http请求方式: POST，https协议 https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN 调用示例（使用curl命令，用FORM表单方式上传一个图片）
    if (type === undefined && data.size >= 1024 * 1024 ){
      type = 'image'
    }
    if (type !== undefined ) {
      url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=${type}`
    }


    //新增其他类型永久素材 image 10M 
    // http请求方式: POST，需使用https https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=ACCESS_TOKEN&type=TYPE 调用示例（使用curl命令，用FORM表单方式新增一个其他类型的永久素材，

    const N = 16 // The length of our random boundry string
    const randomBoundryString = "djmangoBoundry" + Array(N + 1).join((Math.random().toString(36) + '00000000000000000').slice(2, 18)).slice(0, N)

    // Construct the form data payload as a string
    const pre_string = `------${randomBoundryString}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: "application/octet-stream"\r\n\r\n`;
    const post_string = `\r\n------${randomBoundryString}--`

    // Convert the form data payload to a blob by concatenating the pre_string, the file data, and the post_string, and then return the blob as an array buffer
    const pre_string_encoded = new TextEncoder().encode(pre_string);
    // const data = file;
    const post_string_encoded = new TextEncoder().encode(post_string);
    const concatenated = await new Blob([pre_string_encoded, await getBlobArrayBuffer(data), post_string_encoded]).arrayBuffer()

    // Now that we have the form data payload as an array buffer, we can pass it to requestURL
    // We also need to set the content type to multipart/form-data and pass in the boundry string
    const options: RequestUrlParam = {
      method: 'POST',
      url: url,
      contentType: `multipart/form-data; boundary=----${randomBoundryString}`,
      body: concatenated
    };

    const res = await requestUrl(options);
    console.log(`uploadImage:`, res.json);
    
    const resData = await res.json;
    return {
      url: resData.url || '',
      media_id: resData.media_id || '',
      errcode: resData.errcode || 0,
      errmsg: resData.errmsg || '',
    }
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

  //   const accessToken = this._plugin.getAccessToken(accountName);
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
    const accessToken = await this._plugin.refreshAccessToken(accountName);
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
    const accessToken = await this._plugin.refreshAccessToken(accountName);
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
    const accessToken = await this._plugin.refreshAccessToken(accountName);
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

    const accessToken = this._plugin.getAccessToken(accountName);
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

    const accessToken = this._plugin.getAccessToken(accountName);
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
  public async getDraftById(accountName:string, meida_id: string) {

    const accessToken = await this._plugin.refreshAccessToken(accountName);
    if (!accessToken) {
      return false;
    }
    // get all images by loop
    const url = `${this.baseUrl}/draft/get?access_token=${accessToken}`
    const body = {
      media_id: meida_id,
    };

    const req: RequestUrlParam = {
      url: url,
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    };
    const resp = await requestUrl(req);

    console.log(`resp=>`, resp);
    const { errcode, news_item } = resp.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    } else {
      return news_item
    }
  }
}