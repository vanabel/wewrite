import { TFile, App, arrayBufferToBase64 } from 'obsidian';


//<img alt="peony.jpg" src="app://835773f27df6823216a5d0be4a3ee5865ffb/D:/devobs/attachments/peony.jpg?1730297341089">

export class UrlUtils {
    private app:App;
    constructor(app: App) {
        this.app = app;
    }
    public parseObsidianUrl(url: string): string | null {
        //obsidian://open?vault=devobs&file=attachments%2Fpeony.jpg,devobs,attachments%2Fpeony.jpg
        console.log(`url: ${url}`);
        
        const regex = /obsidian:\/\/open\?vault=(.*?)&file=([^,]*),?(.*)$/;
        const match = url.match(regex);
        console.log(`match: ${match}`);
        
        if (match && match[2]) {
            return decodeURIComponent(match[2]);
        }
        return null;
    }
    public getFileFromPath(filePath: string): TFile | null {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file instanceof TFile) {
            return file;
        }
        return null;
    }
    public async getDisplayUrl(file: TFile): Promise<string | null> {
        if (file) {
            try {
                // const fileContent = await this.app.vault.cachedRead(file);
                const fileContent = await this.app.vault.readBinary(file);
                // console.log(`fileContent: ${fileContent}`);
                
                // const blob = new Blob([fileContent], { type: 'application/octet-stream' }); // 假设文件类型未知
                // return URL.createObjectURL(blob);
                const base64String = arrayBufferToBase64(fileContent);
                const mimeType = file.extension === 'png' ? 'image/png' : 'application/octet-stream'; // 根据文件扩展名确定 MIME 类型
                return `data:${mimeType};base64,${base64String}`;
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
        return null;
    }
    public async getInternalLinkDisplayUrl(internalLink: string): Promise<string | null> {
        const filePath = this.parseObsidianUrl(internalLink);
        console.log(`filePath: ${filePath}`);
        
        if (filePath) {
            const file = this.getFileFromPath(filePath);
            console.log(`file: ${file}`);
            
            if (file) {
                return this.getDisplayUrl(file);
            }
        }
        return null;
    }
    
    
}
