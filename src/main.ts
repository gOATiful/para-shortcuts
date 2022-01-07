import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

import { Settings, DEFAULT_SETTINGS } from 'settings/settings.js';
import { ParaShortcutsSettingTab } from 'settings/settings_tab.js';
import { CreateNewEntryModal } from 'modals/new_entry_modal.js';

export default class ParaShortcutsPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'create-new-entry',
			name: 'Create new entry',
			callback: () => {		
				let modal = new CreateNewEntryModal(this.app, this);
				modal.open();
			}
		});
		this.addCommand({
			id: 'init-vault',
			name: 'Init PARA folders',
			callback: () => {
				console.log("init");
			}
		});
		this.addCommand({
			id: 'move-to-archive',
			name: 'Move current file to archive',
			callback: () => {
				console.log("archive");
				console.log(this.app.vault.getAllLoadedFiles());
				console.log(this.app.vault.getRoot());
			}
		});
		this.addSettingTab(new ParaShortcutsSettingTab(this.app, this));
	}

	onunload() {
	}

	public getSettings() : Settings{
		return this.settings;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

