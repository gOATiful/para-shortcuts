import {Notice, Plugin, TFolder } from 'obsidian';

import { Settings, DEFAULT_SETTINGS } from 'settings/settings.js';
import { ParaShortcutsSettingTab } from 'settings/settings_tab.js';
import { CreateNewEntryModal } from 'modals/new_entry_modal.js';
import { ParaType } from 'para_types';
import { join } from 'path';
import * as path from 'path/posix';
import { existsSync } from 'fs';

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
			callback: this.commandInitPara,
		});
		this.addCommand({
			id: 'move-to-archive',
			name: 'Move current file to archive',
			checkCallback: this.commandMoveToArchive,
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


	private commandInitPara(){
		console.log("init");
	}

	private commandMoveToArchive(checking: boolean): boolean | void {
		let activeFile = this.app.workspace.getActiveFile();
		if (checking){
			return (activeFile === null) ? false : true;
		}
		if (activeFile !== null){
			// do real stuff
			let paraType = this.findParaTypeInPath(activeFile.parent);
			if (paraType != ParaType.archive){
				// move file to archive
				let archiveFolderName = this.settings.folders.get(ParaType.archive);
				let subfolderName = this.settings.folders.get(paraType);
				let pathToFile = join(this.app.vault.getRoot().name, archiveFolderName, subfolderName, activeFile.name);
				new Notice(`Moving file to: ${pathToFile}`);
				this.app.fileManager.renameFile(activeFile, pathToFile).catch((err) => {
					new Notice(`Unable to move file to: ${pathToFile}`);
				});
			}
		}
		return true;
	}


	/**
	 * 
	 * @param file 
	 * @returns the ParaType if found, returns null if not
	 */
	private findParaTypeInPath(folder : TFolder) : ParaType | null {
		var type : ParaType | null = null;
		this.settings.folders.forEach((val, key)=> {
			if (folder.name === val){
				type = key;
			}
		});
		if(!folder.isRoot()){ 
			// always prioritize found type from parent to avoid nested folders
			console.log("searching in parent");
			let foundTypeInParent = this.findParaTypeInPath(folder.parent);
			if (foundTypeInParent != null){
				type = foundTypeInParent;
			}
		}
		return type;
	}
}

