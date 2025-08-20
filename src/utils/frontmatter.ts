import { App } from 'obsidian';

export function getFrontmatter(app: App, content: string): Record<string, any> | null {
    const cache = app.metadataCache.getCache(''); 
    return cache?.frontmatter || null;
}

/**
 * Get frontmatter from a specific file
 * @param app - Obsidian app instance
 * @param filePath - Path to the file
 * @returns Record<string, any> | null - Frontmatter data or null
 */
export function getFrontmatterFromFile(app: App, filePath: string): Record<string, any> | null {
    const file = app.vault.getAbstractFileByPath(filePath);
    if (file && file instanceof app.vault.adapter.getResourcePath(file.path)) {
        const cache = app.metadataCache.getCache(filePath);
        return cache?.frontmatter || null;
    }
    return null;
}

export function setFrontmatter(app: App, content: string, properties: Record<string, any>): string {
    const cache = app.metadataCache.getCache('');
    const existingFrontmatter = cache?.frontmatter || {};
    const updatedFrontmatter = { ...existingFrontmatter, ...properties };
    
    const frontmatterString = Object.entries(updatedFrontmatter)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
    
    if (content.startsWith('---')) {
        return content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontmatterString}\n---`);
    }
    return `---\n${frontmatterString}\n---\n${content}`;
}
