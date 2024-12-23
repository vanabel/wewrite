/** view template for different types of material */
import { ItemView, WorkspaceLeaf } from "obsidian";
import WeWritePlugin from "src/main";
import { WeChatMPAccountSwitcher } from "src/settings/account-switcher";
import { MaterialPanel } from "./material-panel";
export const VIEW_TYPE_MP_MATERIAL = "mp-material";


export class MaterialView extends ItemView {
  private readonly _plugin: WeWritePlugin;
  constructor(leaf: WorkspaceLeaf, plugin: WeWritePlugin) {
    super(leaf);
    this._plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_MP_MATERIAL;
  }

  getDisplayText() {
    return "WeChat MP Material";
  }

  getIcon() {
    return "book-image";
  }

  async onOpen() {
    console.log(`onOpen material view`);
    
    this.redraw();
  }

  async onClose() { }

  public readonly redraw = (): void => {
    console.log(`redraw material view`);

    const rootEl = createDiv({ cls: 'nav-folder mod-root' });
    const accountEl = new WeChatMPAccountSwitcher(this._plugin, rootEl)
    accountEl.setName('MP Account: ')
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    const a = new MaterialPanel(this._plugin, childrenEl, 'News', 'news');
    const b = new MaterialPanel(this._plugin, childrenEl, 'Draft', 'draft');
    const c = new MaterialPanel(this._plugin, childrenEl, 'Image', 'image');
    const d = new MaterialPanel(this._plugin, childrenEl, 'Video', 'video');
    const e = new MaterialPanel(this._plugin, childrenEl, 'Voice', 'voice');


    this.contentEl.setChildrenInPlace([rootEl]);
  };
}   