import ParaShortcutsPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { ParaType } from "para_types";

export class ParaShortcutsSettingTab extends PluginSettingTab {
	plugin: ParaShortcutsPlugin;

	constructor(app: App, plugin: ParaShortcutsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for PARA-Shortcuts.' });

		new Setting(containerEl)
			.setName('Project folder')
			.setDesc('the folder name for your "Projects"')
			.addText(text => text
				.setPlaceholder('eg. Projects')
				.setValue(this.plugin.settings.folderProject)
				.onChange(async (value) => {
					this.plugin.settings.folderProject = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Area of Resposibility folder')
			.setDesc('the folder name for your "Area of Resposibility"')
			.addText(text => text
				.setPlaceholder('eg. Area')
				.setValue(this.plugin.settings.folderArea)
				.onChange(async (value) => {
					this.plugin.settings.folderArea = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Resources folder')
			.setDesc('the folder name for your "Resources"')
			.addText(text => text
				.setPlaceholder('eg. Resources')
				.setValue(this.plugin.settings.folderResource)
				.onChange(async (value) => {
					this.plugin.settings.folderResource = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Archive folder')
			.setDesc('the folder name for your "Archive"')
			.addText(text => text
				.setPlaceholder('eg. Archive')
				.setValue(this.plugin.settings.folderArchive)
				.onChange(async (value) => {
					this.plugin.settings.folderArchive = value;
					await this.plugin.saveSettings();
				}));
	}
}
