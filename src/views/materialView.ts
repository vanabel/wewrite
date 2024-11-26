import { ItemView, WorkspaceLeaf } from "obsidian";
import WeWritePlugin from "src/main";
import { WeChatMPAccountSwitcher } from "src/settings/AccountSwitcher";
import { CollapsibleContainer } from "./CollapsibleContainer";
export const VIEW_TYPE_MP_MATERIAL = "mp-material";


export class MaterialView extends ItemView {
  private readonly plugin: WeWritePlugin;
  constructor(leaf: WorkspaceLeaf, plugin: WeWritePlugin) {
    super(leaf);
    this.plugin = plugin;
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
    // const openFile = this.app.workspace.getActiveFile();
    console.log(`redraw material view`);
    

    const rootEl = createDiv({ cls: 'nav-folder mod-root' });
    const accountEl = new WeChatMPAccountSwitcher(this.plugin, rootEl)
    accountEl.setName('MP Account: ')
    // const checkEl = rootEl.createEl('button', { cls: 'nav-folder-header', text:'check assets' })
    //  .onClickEvent(()=>{
    //   console.log(`check assets`);
      
    //    this.plugin.assetsManager.checkAssets();
    //   // testdb()

    //  })
      // this.plugin.assetsManager.checkAssets(this.plugin.getSelectedMPAccount()?.accountName); 
      // checkEl.onclick = ()=>{
        // this.plugin.assetsManager.checkAssets(this.plugin.getSelectedMPAccount()?.accountName);
      // };
    const childrenEl = rootEl.createDiv({ cls: 'nav-folder-children' });

    const a = new CollapsibleContainer(this.plugin, childrenEl, 'News', 'news');
    const b = new CollapsibleContainer(this.plugin, childrenEl, 'Draft', 'draft');
    const c = new CollapsibleContainer(this.plugin, childrenEl, 'Image', 'image');
    const d = new CollapsibleContainer(this.plugin, childrenEl, 'Video', 'video');
    const e = new CollapsibleContainer(this.plugin, childrenEl, 'Voice', 'voice');

    // this.data.recentFiles.forEach((currentFile) => {
    //   const navFile = childrenEl.createDiv({
    //     cls: 'tree-item nav-file recent-files-file',
    //   });
    //   const navFileTitle = navFile.createDiv({
    //     cls: 'tree-item-self is-clickable nav-file-title recent-files-title',
    //   });
    //   const navFileTitleContent = navFileTitle.createDiv({
    //     cls: 'tree-item-inner nav-file-title-content recent-files-title-content',
    //   });

    //   // If the Front Matter Title plugin is enabled, get the file's title from the plugin.
    //   const title = frontMatterResolver
    //     ? frontMatterResolver.resolve(currentFile.path) ?? currentFile.basename
    //     : currentFile.basename;

    //   navFileTitleContent.setText(title);

    //   setTooltip(navFile, currentFile.path);

    //   if (openFile && currentFile.path === openFile.path) {
    //     navFileTitle.addClass('is-active');
    //   }

    //   navFileTitle.setAttr('draggable', 'true');
    //   navFileTitle.addEventListener('dragstart', (event: DragEvent) => {
    //     if (!currentFile?.path) return;

    //     const file = this.app.metadataCache.getFirstLinkpathDest(
    //       currentFile.path,
    //       '',
    //     );

    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     const dragManager = (this.app as any).dragManager;
    //     const dragData = dragManager.dragFile(event, file);
    //     dragManager.onDragStart(event, dragData);
    //   });

    //   navFileTitle.addEventListener('mouseover', (event: MouseEvent) => {
    //     if (!currentFile?.path) return;

    //     this.app.workspace.trigger('hover-link', {
    //       event,
    //       source: RecentFilesListViewType,
    //       hoverParent: rootEl,
    //       targetEl: navFile,
    //       linktext: currentFile.path,
    //     });
    //   });

    //   navFileTitle.addEventListener('contextmenu', (event: MouseEvent) => {
    //     if (!currentFile?.path) return;

    //     const menu = new Menu();
    //     menu.addItem((item) =>
    //       item
    //         .setSection('action')
    //         .setTitle('Open in new tab')
    //         .setIcon('file-plus')
    //         .onClick(() => {
    //           this.focusFile(currentFile, 'tab');
    //         })
    //     );
    //     const file = this.app.vault.getAbstractFileByPath(currentFile?.path);
    //     this.app.workspace.trigger(
    //       'file-menu',
    //       menu,
    //       file,
    //       'link-context-menu',
    //     );
    //     menu.showAtPosition({ x: event.clientX, y: event.clientY });
    //   });

    //   navFileTitle.addEventListener('click', (event: MouseEvent) => {
    //     if (!currentFile) return;

    //     const newLeaf = Keymap.isModEvent(event)
    //     this.focusFile(currentFile, newLeaf);
    //   });

    //   navFileTitleContent.addEventListener('mousedown', (event: MouseEvent) => {
    //     if (!currentFile) return;

    //     if (event.button === 1) {
    //       event.preventDefault();
    //       this.focusFile(currentFile, 'tab');
    //     }
    //   });

    //   const navFileDelete = navFileTitle.createDiv({
    //     cls: 'recent-files-file-delete menu-item-icon',
    //   });
    //   setIcon(navFileDelete, 'lucide-x');
    //   navFileDelete.addEventListener('click', async (event) => {
    //     event.stopPropagation();

    //     await this.removeFile(currentFile);
    //     this.redraw();
    //   });
    // });

    this.contentEl.setChildrenInPlace([rootEl]);
  };
}   