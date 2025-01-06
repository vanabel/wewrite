import { Notice, TFile } from 'obsidian';
import WeWritePlugin from 'src/main';

export function exportAccountInfo(plugin: WeWritePlugin, accountInfo: any) {
    try {
        const jsonStr = JSON.stringify(accountInfo, null, 2);
        const fileName = `account-info-${Date.now()}.json`;
        const filePath = `${plugin.settings.accountDataPath}/${fileName}`;
        
        // Check if file exists and increment number if needed
        let counter = 1;
        let finalPath = filePath;
        while (plugin.app.vault.getAbstractFileByPath(finalPath)) {
            finalPath = `${plugin.settings.accountDataPath}/account-info-${Date.now()}_${counter}.json`;
            counter++;
        }

        plugin.app.vault.create(finalPath, jsonStr).then(() => {
            new Notice(`Account info exported to ${finalPath}`);
        });
    } catch (error) {
        new Notice('Failed to export account info');
        console.error('Export error:', error);
    }
}

export function importAccountInfo(plugin: WeWritePlugin, file: TFile) {
    try {
        plugin.app.vault.read(file).then(content => {
            const importedInfo = JSON.parse(content);
            
            // Check for duplicates
            const isDuplicate = plugin.settings.mpAccounts.some((account: any) => 
                JSON.stringify(account) === JSON.stringify(importedInfo)
            );
            
            if (isDuplicate) {
                new Notice('Account info already exists - not imported');
                return;
            }

            // Add new account
            plugin.settings.mpAccounts.push(importedInfo);
            plugin.saveSettings();
            new Notice('Account info imported successfully');
        });
    } catch (error) {
        new Notice('Failed to import account info');
        console.error('Import error:', error);
    }
}
