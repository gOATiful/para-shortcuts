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
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for PARA-Shortcuts.'});

		new Setting(containerEl)
			.setName('Project folder')
			.setDesc('the folder name for your "Projects"')
			.addText(text => text
				.setPlaceholder('eg. Projects')
				.setValue(this.plugin.settings.folders.get(ParaType.project))
				.onChange(async (value) => {
					this.plugin.settings.folders.set(ParaType.project, value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Area of Resposibility folder')
			.setDesc('the folder name for your "Area of Resposibility"')
			.addText(text => text
				.setPlaceholder('eg. Area')
				.setValue(this.plugin.settings.folders.get(ParaType.area_of_responsibility))
				.onChange(async (value) => {
					this.plugin.settings.folders.set(ParaType.area_of_responsibility, value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Resources folder')
			.setDesc('the folder name for your "Resources"')
			.addText(text => text
				.setPlaceholder('eg. Resources')
				.setValue(this.plugin.settings.folders.get(ParaType.resources))
				.onChange(async (value) => {
					this.plugin.settings.folders.set(ParaType.resources, value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Archive folder')
			.setDesc('the folder name for your "Archive"')
			.addText(text => text
				.setPlaceholder('eg. Archive')
				.setValue(this.plugin.settings.folders.get(ParaType.archive))
				.onChange(async (value) => {
					this.plugin.settings.folders.set(ParaType.archive, value);
					await this.plugin.saveSettings();
				}));
	}
}
