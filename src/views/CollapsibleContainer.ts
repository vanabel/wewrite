import { Menu, Notice, setIcon } from "obsidian";
import WeWritePlugin from "src/main";
import { MaterialMeidaItem, MediaType } from "src/wechat-api/wechat-types";

export class CollapsibleContainer {
  private container: HTMLElement;
  private header: HTMLElement;
  private content: HTMLElement;
  private titleSpan: HTMLSpanElement;
  private totalSpan: HTMLSpanElement;
  private toggleButton: HTMLElement;
  private refreshButton: HTMLElement;
  private plugin: WeWritePlugin;
  private type: MediaType;

  constructor(plugin: WeWritePlugin, parent: HTMLElement, title: string, type: MediaType) {
    this.plugin = plugin;
    this.type = type;
    this.container = parent.createDiv({ cls: 'collapsible-container' });
    this.header = parent.createDiv({ cls: 'collapsible-header' });
    this.refreshButton = this.header.createEl('i', { cls: 'refresh-material-button' });
    this.titleSpan = this.header.createSpan({ cls: 'collapsible-title' });
    this.totalSpan = this.header.createSpan({ cls: 'collapsible-total' });

    this.content = parent.createDiv({ cls: 'collapsible-content' });
    this.toggleButton = parent.createEl<'i'>('i', { cls: 'toggle-icon chevron-right ' });
    setIcon(this.toggleButton, 'chevron-right')
    setIcon(this.refreshButton, 'folder-sync')

    // this.container.classList.add('collapsible-container');
    // this.header.classList.add('collapsible-header');
    // this.content.classList.add('collapsible-content');
    // this.toggleButton.classList.add('toggle-button');

    this.titleSpan.textContent = title;
    this.totalSpan.textContent = '0';
    this.content.innerHTML = 'content';
    // this.toggleButton.textContent = '展开';

    this.header.appendChild(this.toggleButton);
    this.container.appendChild(this.header);
    this.container.appendChild(this.content);

    this.toggleButton.addEventListener('click', () => this.toggleContent());
    this.refreshButton.addEventListener('click', () => this.refreshContent());
    this.initContent()
  }
  async refreshContent(): Promise<any> {
    // throw new Error("Method not implemented.");
    //TODO: disable click avoid multiple refresh
    console.log(`refresh `);
    this.content.innerHTML = '';
    this.setTotal(0);
    let total = 0;
    this.content.style.display = 'block';
    setIcon(this.toggleButton, 'chevron-up')

    if (this.type === 'draft') {

      return await this.plugin.assetsManager.getAllDrafts((items) => {
        items.forEach((item: any) => {
          total += 1;
          const itemDiv = this.content.createDiv({ cls: 'collapsible-item' });
          itemDiv.style.cursor = 'pointer';
          itemDiv.innerHTML = `<a href=${item.content.news_item[0].url}> ${item.content.news_item[0].title}</a>`
          itemDiv.addEventListener('click', () => {
            console.log(`click ${item.media_id}`)
          })
        })
      }, this.plugin.settings.selectedAccount)
    }
    await this.plugin.assetsManager.getAllMaterialOfType(this.type, (items) => {
      items.forEach((item: any) => {
        total += 1;
        const itemDiv = this.content.createDiv({ cls: 'collapsible-item' });
        itemDiv.style.cursor = 'pointer';
        if (this.type === 'image') {

          // itemDiv.innerHTML = '<img src="' + item.url + '" alt="' + item.name + '" />'
          const img = itemDiv.createEl('img', {attr:{ src: item.url, alt: item.name }})
          img.addEventListener('dragstart', (e) => {
            console.log(`set dataTransfer ${item.media_id}`);
            
            e.dataTransfer?.setData('media_id', item.media_id)
          })
          // img.ondragstart = (e) => {
          //   console.log(`set dataTransfer ${item.media_id}`);
            
          //   e.dataTransfer?.setData('media_id', item.media_id)
          // }
          
          itemDiv.addEventListener('dragstart', (e) => {
            console.log(`set dataTransfer ${item.media_id}`);
            
            e.dataTransfer?.setData('media_id', item.media_id)
          })
          itemDiv.addEventListener('click', () => {
            console.log(`click ${item.used}`)
          })
          itemDiv.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.showContextMenu(item, event)
          })
        } else if (this.type === 'news') {
          itemDiv.innerHTML = `<a href=${item.content.news_item[0].url}> ${item.content.news_item[0].title}</a>`
          itemDiv.addEventListener('click', () => {
            console.log(`click ${item.media_id}`)
          })
        }
        this.setTotal(total)
      });
    }, this.plugin.settings.selectedAccount)
    //TODO: enable after all content 

  }
  showContextMenu(img: MaterialMeidaItem, event: MouseEvent) {
    const menu = new Menu();
    
    menu.addItem((item) => {
        item.setTitle('delete image')
            .setIcon('eye')
            .setDisabled(img.used)
            .onClick(() => {
                new Notice(`删除图片: ${img.name}`);
            });
    });
    menu.addItem((item) => {
        item.setTitle('set as cover of current draft')
            .setIcon('image-plus')
            .onClick(() => {
                console.log(`set as cover of current draft`);
                
            });
    });
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }

  private toggleContent() {
    if (this.content.style.display === 'none') {
      this.content.style.display = 'block';
      // this.toggleButton.textContent = '收起';
      // this.toggleButton.className = 'toggle-icon chevron-up';
      setIcon(this.toggleButton, 'chevron-up')
    } else {
      this.content.style.display = 'none';
      // this.toggleButton.textContent = '展开';
      // this.toggleButton.className = 'toggle-icon chevron-right';
      setIcon(this.toggleButton, 'chevron-right')
    }
  }

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
  async initContent(): Promise<any> {
    // throw new Error("Method not implemented.");
    //TODO: disable click avoid multiple refresh
    console.log(`load content from local db `);
    this.content.innerHTML = '';
    this.setTotal(0);
    let total = 0;
    this.content.style.display = 'block';
    setIcon(this.toggleButton, 'chevron-up')

    const items = this.plugin.assetsManager.assets.get(this.type)
    if (items === undefined || items === null) {
      return;
    }
    if (this.type === 'draft' || this.type === 'news') {
      items.forEach((item: any) => {
        total += 1;
        const itemDiv = this.content.createDiv({ cls: 'collapsible-item' });
        itemDiv.style.cursor = 'pointer';
        itemDiv.innerHTML = `<a href=${item.content.news_item[0].url}> ${item.content.news_item[0].title}</a>`
        itemDiv.addEventListener('click', () => { })
      })
    } else {
      items.forEach((item: any) => {
        total += 1;
        const itemDiv = this.content.createDiv({ cls: 'collapsible-item' });
        itemDiv.style.cursor = 'pointer';
        if (this.type === 'image') {

          itemDiv.innerHTML = '<img src="' + item.url + '" alt="' + item.name + '" />'
          itemDiv.addEventListener('click', () => {
            console.log(`click ${item.used}`)
          })
          itemDiv.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.showContextMenu(item, event)
          })
        } else if (this.type === 'news') {
          itemDiv.innerHTML = `<a href=${item.content.news_item[0].url}> ${item.content.news_item[0].title}</a>`
          itemDiv.addEventListener('click', () => {
            console.log(`click ${item.media_id}`)
          })
        }
      })

    }
    console.log(`type: ${this.type}, total: ${total}`);

    this.setTotal(total)
  }
}