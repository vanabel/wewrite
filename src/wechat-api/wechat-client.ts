/**
 * Manipulate WeChat API
 * credits to Sun Booshi, and another author of wechat public platform. 
*/

import { App, getBlobArrayBuffer, Notice, requestUrl, RequestUrlParam } from "obsidian";
import WeWritePlugin from "src/main";
import { getErrorMessage } from "./error-code";
import { DraftArticle, DraftItem } from "./wechat-types";
import { LocalDraftItem } from "src/assets/draft-manager";
import { ConfirmPublishModal as ConfirmPublishDialog } from "src/views/confirm-publish-modal";

export class WechatClient {
  private static instance: WechatClient;
  private _plugin: WeWritePlugin;
  readonly baseUrl: string = 'https://api.weixin.qq.com/cgi-bin';
  confirmPublishModal: ConfirmPublishDialog;
  private constructor(plugin: WeWritePlugin) {
    this._plugin = plugin
    this._plugin.messageService.registerListener('publish-draft-item', async (item: DraftItem) => {
      this.confirmPublish(item)
    })
  }
  public static getInstance(plugin: WeWritePlugin): WechatClient {
    if (!WechatClient.instance) {
      WechatClient.instance = new WechatClient(plugin);
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
    const url = `${this.baseUrl}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const req: RequestUrlParam = {
      url: url,
      method: 'GET',
      headers: this.getHeaders()
    };
    const resp = await requestUrl(req);

    const { access_token, errcode, expires_in } = resp.json;
    const respAccessToken: string = resp.json["access_token"];

    if (access_token === undefined) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    }
    return { access_token, expires_in };
  }
  public async getBatchMaterial(accountName: string | undefined, type: string, offset: number = 0, count: number = 10) {

    const accessToken = await this._plugin.refreshAccessToken(accountName);
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
  public async sendArticleToDraftBox(localDraft: LocalDraftItem, data: string) {
    const accessToken = await this._plugin.refreshAccessToken(this._plugin.settings.selectedAccount);
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

    const { errcode, media_id } = res.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0)
      return false;
    } else {
      new Notice(`草稿发送成功${media_id}`);
    }

    return media_id;
  }

  public async uploadImage(data: Blob, filename: string, type?: string) {
    const accessToken = await this._plugin.refreshAccessToken(this._plugin.settings.selectedAccount);
    if (!accessToken) {
      return false;
    }

    let url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`
    if (type === undefined && data.size >= 1024 * 1024) {
      type = 'image'
    }
    if (type !== undefined) {
      url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=${type}`
    }


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

    const resData = await res.json;
    if (resData.errcode === undefined || resData.errcode == 0) {
      this._plugin.messageService.sendMessage("image-item-updated", resData)
    }
    return {
      url: resData.url || '',
      media_id: resData.media_id || '',
      errcode: resData.errcode || 0,
      errmsg: resData.errmsg || '',
    }
  }

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
    return resp.json;

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

    return resp.json;
  }

  public async getMaterialCounts(accountName: string) {

    const accessToken = await this._plugin.refreshAccessToken(accountName);
    if (!accessToken) {
      return false;
    }

    const url = `${this.baseUrl}/material/get_materialcount?access_token=${accessToken}`
    const req: RequestUrlParam = {
      url: url,
      method: 'GET',
      headers: this.getHeaders()
    };
    const resp = await requestUrl(req);

    const { errcode, voice_count, video_count, image_count, news_count } = resp.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    } else {
      return resp.json
    }
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
  public async getDraftById(accountName: string, meida_id: string) {

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

    const { errcode, news_item } = resp.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    } else {
      return news_item
    }
  }
  public async publishDraft(meida_id: string, accountName: string = "") {
    if (!accountName) {
      accountName = this._plugin.settings.selectedAccount!;
    }
    const accessToken = await this._plugin.refreshAccessToken(accountName);
    if (!accessToken) {
      return false;
    }
    // get all images by loop
    const url = `${this.baseUrl}/freepublish/submit?access_token=${accessToken}`
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

    const { errcode, errmsg, publish_id } = resp.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    } else {
      return publish_id
    }
  }
  public async deleteMedia(meida_id: string, accountName: string = "") {
    if (!accountName) {
      accountName = this._plugin.settings.selectedAccount!;
    }
    const accessToken = await this._plugin.refreshAccessToken(accountName);
    if (!accessToken) {
      return false;
    }
    // get all images by loop
    const url = `${this.baseUrl}/material/del_material?access_token=${accessToken}`
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

    const { errcode, errmsg } = resp.json;
    console.log(`delete media ${meida_id}`, errmsg, errcode);
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    } else {
      return true
    }
  }
  public async deleteDraft(meida_id: string, accountName: string = "") {
    if (!accountName) {
      accountName = this._plugin.settings.selectedAccount!;
    }
    const accessToken = await this._plugin.refreshAccessToken(accountName);
    if (!accessToken) {
      return false;
    }
    // get all images by loop
    const url = `${this.baseUrl}/draft/delete?access_token=${accessToken}`
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

    const { errcode, errmsg } = resp.json;
    if (errcode !== undefined && errcode !== 0) {
      new Notice(getErrorMessage(errcode), 0);
      return false;
    } else {
      return true
    }
  }
  confirmPublish(item: DraftItem) {
    console.log(`confirm publish`);
    if (this.confirmPublishModal === undefined) {
      this.confirmPublishModal = new ConfirmPublishDialog(this._plugin, item)
    } else {
      this.confirmPublishModal.update(item)
    }
    const modal = new ConfirmPublishDialog(this._plugin, item)
    modal.open()
  }
}