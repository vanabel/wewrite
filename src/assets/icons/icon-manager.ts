/**
 * Manage icons
 * 
 * Credits to Jeremy Valentine, https://plugins.javalent.com/about/javalent
 * code modified from:  https://github.com/javalent/admonitions
 * 
 */

import { faCopy, far, IconPrefix } from "@fortawesome/free-regular-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { faCamera } from '@fortawesome/free-solid-svg-icons'

import {
    IconDefinition,
    findIconDefinition,
    icon as getFAIcon,
    library
} from "@fortawesome/fontawesome-svg-core";

import type { IconName } from "@fortawesome/fontawesome-svg-core";
import { AdmonitionIconDefinition, DownloadableIconPack, DownloadableIcons, IconType } from "src/render/admonition";
import { getIcon, getIconIds, Notice, requestUrl, setIcon } from "obsidian";
import WeWritePlugin from "src/main";

library.add(fas, far, fab, faCopy, faCamera);

export class IconManager {
    private _plugin: WeWritePlugin;
    getIconSVG(name: string) {
        
        const icon = getIcon(name);
        console.log(`getIconSVG:`, name, icon);
        if (icon){
            return icon
        }
        return ''
    }
    DOWNLOADED: {
        [key in DownloadableIconPack]?: Record<string, string>;
    } = {};
    FONT_AWESOME_MAP = new Map(
        [Object.values(fas), Object.values(far), Object.values(fab)]
            .flat()
            .map((i: IconDefinition) => {
                return [
                    i.iconName,
                    {
                        name: i.iconName,
                        type: "font-awesome" as "font-awesome"
                    }
                ];
            })
    );
    constructor(public plugin: WeWritePlugin) {
        this._plugin = plugin;
    }
    async load() {
        for (const icon of this._plugin.settings.icons) {
            console.log('load icon pack:', icon)
            const exists = await this._plugin.app.vault.adapter.exists(
                this.localIconPath(icon)
            );
            if (!exists) {
                await this.downloadIcon(icon);
            } else {
                this.DOWNLOADED[icon] = JSON.parse(
                    await this._plugin.app.vault.adapter.read(
                        `${this._plugin.manifest.dir}/${icon}.json`
                    )
                );
            }
        }
        this.setIconDefinitions();
    }
    iconDefinitions: AdmonitionIconDefinition[] = [];
    setIconDefinitions() {
        const downloaded: AdmonitionIconDefinition[] = [];
        for (const pack of this._plugin.settings.icons) {
            if (!(pack in this.DOWNLOADED)) continue;
            const icons = this.DOWNLOADED[pack];
            if (icons === undefined){
                return;
            }
            downloaded.push(
                ...Object.keys(icons).map((name) => {
                    return { type: pack, name };
                })
            );
        }
        this.iconDefinitions = [
            ...(this._plugin.settings.useFontAwesome
                ? this.FONT_AWESOME_MAP.values()
                : []),
            ...getIconIds().map((name) => {
                return { type: "obsidian" as IconType, name };
            }),
            ...downloaded
        ];
    }
    iconPath(pack: DownloadableIconPack) {
        // return `https://raw.githubusercontent.com/valentine195/obsidian-admonition/master/icons/${pack}/icons.json`;
        return `https://gitee.com/northern_bank/wewrite/raw/master/icons/${pack}/icons.json`
        
    }
    localIconPath(pack: DownloadableIconPack) {
        return `${this._plugin.manifest.dir}/${pack}.json`;
    }
    async downloadIcon(pack: DownloadableIconPack) {
        console.log(`to download icon pack:`, pack)
        
        try {
            const icons: Record<string, string> = await (
                // await fetch(this.iconPath(pack))
                await requestUrl(this.iconPath(pack))
            ).json();
            this._plugin.settings.icons.push(pack);
            this._plugin.settings.icons = [...new Set(this._plugin.settings.icons)];
            await this._plugin.app.vault.adapter.write(
                this.localIconPath(pack),
                JSON.stringify(icons)
            );
            this.DOWNLOADED[pack] = icons;
            await this._plugin.saveSettings();
            this.setIconDefinitions();

            new Notice(`${DownloadableIcons[pack]} successfully downloaded.`);
        } catch (e) {
            console.error(e);
            new Notice("Could not download icon pack");
        }
    }
    async removeIcon(pack: DownloadableIconPack) {
        await this._plugin.app.vault.adapter.remove(this.localIconPath(pack));
        delete this.DOWNLOADED[pack];
        this._plugin.settings.icons.remove(pack);
        this._plugin.settings.icons = [...new Set(this._plugin.settings.icons)];
        await this._plugin.saveSettings();
        this.setIconDefinitions();
    }
    getIconType(str: string): IconType | undefined {
        if (findIconDefinition({ iconName: str as IconName, prefix: "fas" }))
            return "font-awesome";
        if (findIconDefinition({ iconName: str as IconName, prefix: "far" }))
            return "font-awesome";
        if (findIconDefinition({ iconName: str as IconName, prefix: "fab" }))
            return "font-awesome";
        if (getIconIds().includes(str)) {
            return "obsidian";
        }
        for (const [pack, icons] of Object.entries(this.DOWNLOADED)) {
            if (str in icons) return pack as DownloadableIconPack;
        }
    }
    getIconModuleName(icon: AdmonitionIconDefinition) {
        if (icon.type === undefined) return;
        if (icon.type === "font-awesome") return "Font Awesome";
        if (icon.type === "obsidian") return "Obsidian Icon";
        if (icon.type === "image") return;
        if (icon.type in DownloadableIcons) return DownloadableIcons[icon.type];
    }
    getIconNode(icon: AdmonitionIconDefinition): Element | undefined {
        if (icon.type === undefined || icon.name === undefined) return;
        if (icon.type === "image") {
            const img = new Image();
            img.src = icon.name;
            return img;
        }
        if (icon.type == "obsidian") {
            const el = createDiv();
            setIcon(el, icon.name);
            return el;
        }
        if (this.DOWNLOADED[icon.type as DownloadableIconPack]?.[icon.name]) {
            const el = createDiv();
            el.innerHTML =
                this.DOWNLOADED[icon.type as DownloadableIconPack]?.[icon.name]!;
            return el.children[0];
        }
        for (const prefix of ["fas", "far", "fab"] as IconPrefix[]) {
            const definition = findIconDefinition({
                iconName: icon.name as IconName,
                prefix
            });
            if (definition) return getFAIcon(definition).node[0];
        }
    }
}