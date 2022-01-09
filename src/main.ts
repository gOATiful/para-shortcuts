import {EditableFileView, Notice, Plugin, TAbstractFile, TextFileView, TFolder } from 'obsidian';

import { Settings, DEFAULT_SETTINGS } from 'settings/settings.js';
import { ParaShortcutsSettingTab } from 'settings/settings_tab.js';
import { CreateNewEntryModal } from 'modals/new_entry_modal.js';
import { ParaType } from 'para_types';
import { dirname, join } from 'path';

export default class ParaShortcutsPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'create-new-entry',
			name: 'Create new entry',
			callback:() => this.commandCreateNewEntry(),
		});
		this.addCommand({
			id: 'init-vault',
			name: 'Init vault with PARA folders',
			callback: () => this.commandInitPara(),
		});
		this.addCommand({
			id: 'move-to-archive',
			name: 'Move current file to archive',
			checkCallback: (checking: boolean) => this.commandMoveToArchive(checking),
		});
		this.addCommand({
			id: 'restore-from-archive',
			name: 'Restore entry from archive',
			checkCallback: (checking: boolean) => this.commandRestoreFromArchive(checking),
		});
		this.addSettingTab(new ParaShortcutsSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	public createEntryByType(type: ParaType, filename = 'untitled.md'){
		let folderName = this.settings.folders.get(type);
		let rootFolderChildren = this.app.vault.getRoot().children;
		let selectedFolder = rootFolderChildren.find(ele => ele.name === folderName)
		if (selectedFolder !== undefined){
			let filepath = join("/", folderName, filename);
			this.app.vault.create(filepath, this.createMetaHeader()).then((ret) => {
				this.app.workspace.activeLeaf.openFile(ret, TextFileView); // open the created file
			});
		}
	}

	private commandCreateNewEntry(){	
		let modal = new CreateNewEntryModal(this.app, this);
		modal.open();
	}

	private commandInitPara(){
		if(this.isParaVault()){
			new Notice("PARA already initialized!");
			return;
		}
		this.createParaFolders().then(() => {
			new Notice("Vaul successful initialized!");
		}).catch(_ => {
			new Notice("Error creating PARA folders");
		});
	}

	private commandRestoreFromArchive(checking: boolean) : boolean | void {
		let activeFile = this.app.workspace.getActiveFile();
		if(activeFile !== null){
			let toplevelParatype = this.findTopelevelParaTypeInPath(activeFile.parent);
			if(checking){
				return toplevelParatype === ParaType.archive;
			}
			let currentFolder = activeFile.parent;
			let paraType = this.findParaTypeInPath(currentFolder);
			if(paraType != null){
				let paraFolder = this.settings.folders.get(paraType);
				let newFilePath = join(paraFolder, activeFile.name);
				this.moveFileAndCreateFolder(activeFile, newFilePath).then(() => {
					new Notice(`Restored file to ${newFilePath}`);
				}).catch((_)=>{
					new Notice(`Unable to resotre file`);
				});
			}
		}

		return false;
	}

	private commandMoveToArchive(checking: boolean): boolean | void {
		let activeFile = this.app.workspace.getActiveFile();
		if (activeFile !== null){
			let paraType = this.findTopelevelParaTypeInPath(activeFile.parent);
			if (checking) {
				// enable command if not in archive
				return paraType != ParaType.archive;
			}
			// move file to archive
			let archiveFolderName = this.settings.folders.get(ParaType.archive);
			let subfolderName = this.settings.folders.get(paraType);
			let pathToFile = join(this.app.vault.getRoot().name, archiveFolderName, subfolderName, activeFile.name);
			this.moveFileAndCreateFolder(activeFile, pathToFile).then(()=>{
				new Notice(`Moved file to ${pathToFile}.`);
			}).catch((_) => {
				new Notice(`Unable to move file to ${pathToFile}.`);
			});
		}
		return false;
	}

	private async moveFileAndCreateFolder(file: TAbstractFile, newPath: string): Promise<void>{
		return new Promise(async (resolve, reject) => {
			var shouldRetry = true;
			var err = null;
			while(shouldRetry){
				try{
					await this.app.fileManager.renameFile(file, newPath);
					shouldRetry = false;
				}catch(error){ //TODO: eval error
					let pathToFolder = dirname(newPath);
					try {
						await this.app.vault.createFolder(pathToFolder)
					} catch (error) {
						err = error;
						shouldRetry = false;
					}
				}
			}
			if(err != null){
				reject(err);
			}else{
				resolve();
			}
		});
	}


	private findParaTypeInPath(folder: TFolder): ParaType | null{
		var type: ParaType | null = null;
		this.settings.folders.forEach((val, key)=> {
			if (folder.name === val){
				type = key;
			}
		});
		if(type === null && !folder.isRoot()){
			type = this.findParaTypeInPath(folder.parent);
		}
		return type;
	}

	/**
	 * 
	 * @param file 
	 * @returns the ParaType if found, returns null if not
	 */
	private findTopelevelParaTypeInPath(folder : TFolder) : ParaType | null {
		var type : ParaType | null = null;
		this.settings.folders.forEach((val, key)=> {
			if (folder.name === val){
				type = key;
			}
		});
		if(!folder.isRoot()){ 
			// always prioritize found type from parent to avoid nested folder issue
			let foundTypeInParent = this.findTopelevelParaTypeInPath(folder.parent);
			if (foundTypeInParent != null){
				type = foundTypeInParent;
			}
		}
		return type;
	}

	private async createParaFolders(): Promise<void>{
		return new Promise<void>(async (resolve, reject) => {
			for(let foldername of this.settings.folders.values()){
				try {
					await this.app.vault.createFolder(foldername);
				} catch (error) {
					reject(error);
				}
			}
			resolve();
		});
	}

	private isParaVault(): boolean{
		let neededFolders = this.settings.folders.values();
		let root = this.app.vault.getRoot();
		for(let i of neededFolders){
			let found = root.children.find((elem) => i === elem.name);
			if(found === undefined){
				return false;
			}
		}
		return true;
	}

	private createMetaHeader(): string{
		let now = new Date();
		return `createdAt: ${now.toISOString().split('T')[0]}\n\n---`;
	}
}
