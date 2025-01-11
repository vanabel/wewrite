/**
 * the panel to show wechat materials
 */
import { Menu, Notice, setIcon } from "obsidian";
import { AssetsManager } from "src/assets/assets-manager";
import WeWritePlugin from "src/main";
import { MaterialMeidaItem, MediaType } from "src/wechat-api/wechat-types";

interface REROUCE_ITEM {
  item: MaterialMeidaItem;
  el: HTMLElement;
}

export class MaterialPanel {
  public name: string;
  public containerEl: HTMLElement;
  public timestamp: number;
  private container: HTMLElement;
  private header: HTMLElement;
  private content: HTMLElement;
  private titleSpan: HTMLSpanElement;
  private totalSpan: HTMLSpanElement;
  // private toggleButton: HTMLElement;
  private refreshButton: HTMLElement;
  private plugin: WeWritePlugin;
  public type: MediaType;
  private items: REROUCE_ITEM[] = [];

  constructor(plugin: WeWritePlugin, parent: HTMLElement, title: string, type: MediaType) {
    this.plugin = plugin;
    this.type = type;
    this.name = title;
    this.container = parent.createDiv({ cls: 'wewrite-material-panel-container' });
    this.containerEl = this.container;
    this.header = parent.createDiv({ cls: 'wewrite-material-panel-header' });
    this.refreshButton = this.header.createEl('i', { cls: 'refresh-material-button' });
    this.titleSpan = this.header.createSpan({ cls: 'wewrite-material-panel-title' });
    this.totalSpan = this.header.createSpan({ cls: 'wewrite-material-panel-total' });

    this.content = parent.createDiv({ cls: 'wewrite-material-panel-content' });
    // this.toggleButton = parent.createEl<'i'>('i', { cls: 'toggle-icon chevron-right ' });
    // setIcon(this.toggleButton, 'chevron-right')
    setIcon(this.refreshButton, 'folder-sync')


    this.titleSpan.textContent = title;
    this.totalSpan.textContent = '0';
    this.content.innerHTML = 'content';

    // this.header.appendChild(this.toggleButton);
    this.container.appendChild(this.header);
    this.container.appendChild(this.content);

    // this.toggleButton.addEventListener('click', () => this.toggleContent());
    this.refreshButton.addEventListener('click', () => this.refreshContent());
    this.initContent()

    this.plugin.messageService.registerListener(`clear-${this.type}-list`, () => {
      this.clearContent()
    })
    this.plugin.messageService.registerListener(`${this.type}-item-updated`, (item) => {
      this.addItem(item)
    })
    this.plugin.messageService.registerListener(`${this.type}-item-deleted`, (item) => {
      this.removeItem(item)
    })
    if (this.type === 'image') {
      this.plugin.messageService.registerListener(`image-used-updated`, (item) => {
        this.updateItemUsed(item)
      })
    }
    // this.getLocalItems()
  }
  getLocalItems(){
    const list = this.plugin.assetsManager.assets.get(this.type)
    // console.log(`getLocalItems:${this.type}`, list);
    
    if (list !== undefined) {
      list.forEach((item) => {
        
        this.addItem(item)
      })
    }
  }
  async refreshContent(): Promise<any> {
    this.content.innerHTML = '';
    this.items = []
    this.setTotal(0);

    if (this.type === 'draft') {

      return await this.plugin.assetsManager.getAllDrafts((item) => {
        this.addItem(item)
      }, this.plugin.settings.selectedAccount)
    }
    await this.plugin.assetsManager.getAllMaterialOfType(this.type, (item) => {
      this.addItem(item)
    }, this.plugin.settings.selectedAccount)
    //TODO: enable after all content 

  }
  showContextMenu(mediaItem: MaterialMeidaItem, event: MouseEvent) {
    const menu = new Menu();

    //if the item type is image/voice/video && it has not been used by any news or draft.
    if (mediaItem.type === 'image') {
      const urls = AssetsManager.getInstance(this.plugin.app, this.plugin).getImageUsedUrl(mediaItem)
      if (urls === null || urls === undefined) {
        menu.addItem((item) => {
          item.setTitle('delete image')
            .setIcon('image-minus')
            .setDisabled(mediaItem.used)
            .onClick(() => {
              // new Notice(`删除图片: ${mediaItem.name}`);
              this.plugin.messageService.sendMessage("delete-media-item", mediaItem)
            });
        });
      }else{
        // console.log(`image used by:`, urls);
        
      }

      //set as cover image
      menu.addItem((item) => {
        item.setTitle('set as cover of current draft')
          .setIcon('image-plus')
          .onClick(() => {
            new Notice(`set cover 图片: ${mediaItem.name}`);
            this.plugin.messageService.sendMessage("set-image-as-cover", mediaItem)
          });
      });
    }

    // voice and video
    if (mediaItem.type === 'voice' || mediaItem.type === 'video') {
      if (!mediaItem.used) {

        menu.addItem((item) => {
          item.setTitle('delete')
            .setIcon('eye')
            .setDisabled(mediaItem.used)
            .onClick(() => {
              // new Notice(`删除媒体: ${mediaItem.name}`);
              this.plugin.messageService.sendMessage("delete-media-item", mediaItem)
            });
        });
      }

    }

    if (mediaItem.type === 'draft') {
      //if it is a draft
      menu.addItem((item) => {
        item.setTitle('Delete draft')
          .setIcon('trash-2')
          .onClick(async () => {
            // console.log('to delete draft:', item)
            this.plugin.messageService.sendMessage("delete-draft-item", mediaItem)
          });
      });
      // menu.addItem((item) => {
      //   item.setTitle('publish draft')
      //     .setIcon('send')
      //     .onClick(async () => {
      //       // console.log('to delete draft:', item)
      //       this.plugin.messageService.sendMessage("publish-draft-item", mediaItem)
      //     });
      // });
      menu.addItem((item) => {
        item.setTitle('preview draft')
          .setIcon('eye')
          .onClick(async () => {
            // console.log('to delete draft:', item)
            this.plugin.wechatClient.senfForPreview(mediaItem.media_id, this.plugin.settings.previewer_wxname, this.plugin.settings.selectedAccount)

          });
      });
      menu.addItem((item) => {
        item.setTitle('send mass message')
          .setIcon('send')
          .onClick(async () => {
            // console.log('to delete draft:', item)
            this.plugin.wechatClient.massSendAll(mediaItem.media_id, this.plugin.settings.selectedAccount)
            
          });
      });
    }

    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }

  // private toggleContent() {
  //   if (this.content.style.display === 'none') {
  //     this.content.style.display = 'block';
  //     setIcon(this.toggleButton, 'chevron-up')
  //   } else {
  //     this.content.style.display = 'none';
  //     setIcon(this.toggleButton, 'chevron-right')
  //   }
  // }

  public getElement(): HTMLElement {
    return this.container;
  }
  setTotal(total: number) {
    this.totalSpan.textContent = `[${total.toString()}]`;
  }
  setTitle(title: string) {
    this.titleSpan.textContent = title;
  }
  updateItems(items: []) {

  }
  clearContent() {
    this.items = [];
    this.content.innerHTML = '';
    this.setTotal(0);

  }

  isItemExist(item:any){
    return this.items.some((i)=>{
      return i.item.media_id === item.media_id
    })
  }
  addItem(item: any) {
    if (this.isItemExist(item)){
      // console.log(`item exist, do nothing.`);
      return
    }
    const itemDiv = this.content.createDiv({ cls: 'wewrite-material-panel-item' });
    itemDiv.style.cursor = 'pointer';
    
    this.items.push({ item: item, el: itemDiv });
    this.content.appendChild(itemDiv);
    

    if (this.type === 'draft' || this.type === 'news') {
      // console.log(`draft/news item=>`, item);
      let title = item.content.news_item[0].title
      if (title === undefined || !title){
        title = 'No title article.'
      }
      itemDiv.innerHTML = `<a href=${item.content.news_item[0].url}> ${title}</a>`
      itemDiv.addEventListener('click', () => { })
      itemDiv.addClass("draft-news-item")
    } else if (this.type === 'image') {
      itemDiv.innerHTML = '<img src="' + item.url + '" alt="' + item.name + '" />'
      itemDiv.addEventListener('click', () => {
        //TODO 
      })
    } else {
      console.error(`other type has not been implemented.`);

    }
    this.setTotal(this.items.length)

    itemDiv.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.showContextMenu(item, event)
    })
  }
  updateItemUsed(item: any) {
    const old_item = this.items.find((i) => {
      return i.item.media_id === item.media_id
    })
    if (old_item !== undefined && old_item !== null) {
      old_item.item.used = item.used
    } else {
      this.addItem(item)
    }
  }
  removeItem(item: any) {
    const index = this.items.findIndex((i)=>{
      return i.item.media_id === item.media_id
      
    })
    
    if (index !== -1) {
      this.items[index].el.remove(); //parentElement?.removeChild(this.items[index].el) 
      this.items.splice(index, 1)
    }
    this.setTotal(this.items.length)
  }

  removeItemsByAttributes(attributes: Partial<MaterialMeidaItem>) {
    const itemsToRemove = this.items.filter(i => {
      return Object.entries(attributes).every(([key, value]) => {
        const itemKey = key as keyof MaterialMeidaItem;
        return i.item[itemKey] === value;
      });
    });

    itemsToRemove.forEach(item => {
      item.el.parentElement?.removeChild(item.el);
      const index = this.items.indexOf(item);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    });

    this.setTotal(this.items.length);
    return itemsToRemove.length;
  }
  async initContent(): Promise<any> {
    this.content.innerHTML = '';
    this.setTotal(0);
    let total = 0;
    this.content.style.display = 'block';
    // setIcon(this.toggleButton, 'chevron-up')

    const items = this.plugin.assetsManager.assets.get(this.type)
    if (items === undefined || items === null) {
      return;
    }
    items.forEach((item: any) => {
      this.addItem(item)
    })
  }
}
