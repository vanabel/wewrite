import { App, TFile } from 'obsidian';
import { getFrontmatter, setFrontmatter } from './frontmatter';

export class NoteManager {
    private app: App;

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Get the path of the currently active markdown file
     * @returns {string | null} Path of active file or null if none
     */
    public getActiveNotePath(): string | null {
        const file = this.app.workspace.getActiveFile();
        return file?.path || null;
    }

    /**
     * Get a frontmatter property from a markdown file
     * @param {string} path - Path to markdown file
     * @param {string} property - Property name to get
     * @returns {any} Value of the property or null if not found
     */
    public async getFrontmatterProperty(path: string, property: string): Promise<any> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) {
            return null;
        }

        const content = await this.app.vault.read(file);
        const frontmatter = getFrontmatter(this.app, content);
        return frontmatter?.[property] || null;
    }

    /**
     * Set or add a frontmatter property to a markdown file
     * @param {string} path - Path to markdown file
     * @param {string} property - Property name to set
     * @param {any} value - Value to set
     * @returns {Promise<void>}
     */
    public async setFrontmatterProperty(path: string, property: string, value: any): Promise<void> {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) {
            throw new Error(`File not found: ${path}`);
        }

        const content = await this.app.vault.read(file);
        const updatedContent = setFrontmatter(this.app, content, { [property]: value });
        await this.app.vault.modify(file, updatedContent);
    }
}
