// src/ui/settings-tab.ts
import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { KnowledgeSynthesisSettings } from '../utils/types';
import KnowledgeSynthesisPlugin from '../../main'; 

/**
 * Settings tab implementation
 */
export class KnowledgeSynthesisSettingTab extends PluginSettingTab {
    private plugin: KnowledgeSynthesisPlugin; // Use the specific plugin class type

    constructor(app: App, plugin: KnowledgeSynthesisPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Knowledge Synthesis Settings' });

        new Setting(containerEl)
            .setName('Concept Extraction Sensitivity')
            .setDesc('Higher values extract more concepts (1-10)')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.extractionSensitivity)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.extractionSensitivity = value;
                    await this.plugin.saveSettings();
                }));

        // Other settings...

        // Add a button to reprocess all notes
        new Setting(containerEl)
            .setName('Reprocess All Notes')
            .setDesc('Update the concept graph with all notes in the vault')
            .addButton(button => button
                .setButtonText('Reprocess')
                .onClick(async () => {
                    await this.plugin.processAllNotes();
                }));
                
        // Add a button to clear all data
        new Setting(containerEl)
            .setName('Clear All Data')
            .setDesc('Reset all concept and relationship data')
            .addButton(button => button
                .setButtonText('Clear Data')
                .setWarning()
                .onClick(async () => {
                    const confirmed = confirm('Are you sure you want to clear all Knowledge Synthesis data? This cannot be undone.');
                    if (confirmed) {
                        await this.plugin.dataManager.clearData();
                        new Notice('Knowledge Synthesis data cleared');
                    }
                }));
    }
}