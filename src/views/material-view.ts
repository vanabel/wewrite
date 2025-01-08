/** view template for different types of material */
import { ItemView, WorkspaceLeaf, Menu, ButtonComponent } from "obsidian";
import WeWritePlugin from "src/main";
import { WeChatMPAccountSwitcher } from "src/settings/account-switcher";
import { MaterialPanel } from "./material-panel";
export const VIEW_TYPE_MP_MATERIAL = "mp-material";

export const MediaTypeIcon = new Map([
  ['image', 'image'],
  ['voice', 'file-audio'],
  ['video', 'film'],
  ['news', 'newspaper'],
  ['draft', 'text-select']
]);


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
    return "package";
  }

  async onOpen() {
    this.redraw();
    if (this._plugin.settings.selectedAccount !== undefined) {
			this._plugin.assetsManager.loadMaterial(this._plugin.settings.selectedAccount)
		}
  }

  async onClose() { }

  public readonly redraw = (): void => {
    const rootEl = createDiv({ cls: 'nav-folder mod-root' });
    const accountEl = new WeChatMPAccountSwitcher(this._plugin, rootEl)
    accountEl.setName('MP Account: ')

    // Create tab container
    const tabContainer = rootEl.createDiv({ cls: 'wewrite-material-view-tabs' });
    const tabHeader = tabContainer.createDiv({ cls: 'wewrite-material-view-tab-header' });
    const tabContent = tabContainer.createDiv({ cls: 'wewrite-material-view-tab-content' });

    // Get material panels from plugin and sort newest first
    const panels = this._plugin.assetsManager.getMaterialPanels()
      .map(material => new MaterialPanel(
        this._plugin,
        tabContent,
        material.name,
        material.type
      ))


    // Create tabs
    panels.forEach(panel => {
      new ButtonComponent(tabHeader)
        .setIcon(MediaTypeIcon.get(panel.type) ?? 'package')
        .setTooltip(panel.name).onClick(() => {
          panels.forEach(p => p.containerEl.toggle(p === panel));
        }).setClass("wewrite-material-view-tab");

    });
    panels.forEach(panel => {
      panel.containerEl.hide();
    });
    // Show first panel by default
    panels[0].containerEl.show();

    this.contentEl.setChildrenInPlace([rootEl]);
    this.contentEl.setCssProps({
      'padding': '0',
      'margin': '0',
    });

    new ButtonComponent(tabHeader)
      .setIcon('school')
      .setTooltip('WeChat MP Web')
      .setClass("wewrite-material-view-tab")
      .onClick(() => {
        window.open('https://mp.weixin.qq.com/', '_blank');
      })
  };
}
