import { moment, normalizePath, Notice, Plugin, TAbstractFile, TextFileView, TFolder } from 'obsidian';

import { Settings, DEFAULT_SETTINGS } from 'settings/settings';
import { ParaShortcutsSettingTab } from 'settings/settings_tab';
import { CreateNewEntryModal } from 'modals/new_entry_modal';
import { ParaType } from 'para_types';


const DATE_FORMAT = "YYYY-MM-DD";


export default class ParaShortcutsPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'create-new-entry',
			name: 'Create new entry',
			callback: () => this.commandCreateNewEntry(),
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

	/**
	 * Create a new File in the matching folder based on the given `type`
	 * @param type specifies the folder in which the file will be created
	 * @param filename the name of the created file
	 */
	public async createEntryByType(type: ParaType, filename = 'untitled.md') {
		let folderName = this.settings.folders.get(type);
		let rootFolderChildren = this.app.vault.getRoot().children;
		let selectedFolder = rootFolderChildren.find(ele => ele.name === folderName)
		if (selectedFolder !== undefined) {
			let filepath = normalizePath([folderName, filename].join("/"));
			let createdFile = await this.app.vault.create(filepath, this.createMetaHeader());
			await this.app.workspace.activeLeaf.openFile(createdFile, TextFileView); // open the created file
		}
	}

	private commandCreateNewEntry() {
		let modal = new CreateNewEntryModal(this.app, this);
		modal.open();
	}

	private commandInitPara() {
		if (this.isParaVault()) {
			new Notice("PARA already initialized!");
			return;
		}
		this.createParaFolders().then(() => {
			new Notice("Vaul successful initialized!");
		}).catch(_ => {
			new Notice("Error creating PARA folders");
		});
	}

	private commandRestoreFromArchive(checking: boolean): boolean | void {
		let activeFile = this.app.workspace.getActiveFile();
		if (activeFile !== null) {
			let toplevelParatype = this.findTopelevelParaTypeInPath(activeFile.parent);
			if (checking) {
				return toplevelParatype === ParaType.archive;
			}
			let currentFolder = activeFile.parent;
			let paraType = this.findParaTypeInPath(currentFolder);
			if (paraType != null) {
				let paraFolder = this.settings.folders.get(paraType);
				let newFilePath = normalizePath([paraFolder, activeFile.name].join("/"));
				this.moveFileAndCreateFolder(activeFile, newFilePath).then(() => {
					new Notice(`Restored file to ${newFilePath}`);
				}).catch((_) => {
					new Notice(`Unable to resotre file`);
				});
			}
		}

		return false;
	}

	private commandMoveToArchive(checking: boolean): boolean {
		let activeFile = this.app.workspace.getActiveFile();
		if (activeFile !== null) {
			let paraType = this.findTopelevelParaTypeInPath(activeFile.parent);
			if (checking) {
				// enable command if not in archive
				return paraType != ParaType.archive;
			}
			// move file to archive
			let archiveFolderName = this.settings.folders.get(ParaType.archive);
			let subfolderName = this.settings.folders.get(paraType);
			let pathToFile = normalizePath([this.app.vault.getRoot().name, archiveFolderName, subfolderName, activeFile.name].join("/"))
			this.moveFileAndCreateFolder(activeFile, pathToFile).then(() => {
				new Notice(`Moved file to ${pathToFile}.`);
			}).catch((_) => {
				new Notice(`Unable to move file to ${pathToFile}.`);
			});
		}
		return false;
	}

	private async moveFileAndCreateFolder(file: TAbstractFile, newPath: string): Promise<void> {
		try {
			await this.app.fileManager.renameFile(file, newPath);
		} catch (error) {
			// try to create folder and try again
			let pathToFolder = this.getDirName(newPath);
			await this.app.vault.createFolder(pathToFolder);
			await this.app.fileManager.renameFile(file, newPath);
		}
	}


	private findParaTypeInPath(folder: TFolder): ParaType | null {
		var type: ParaType | null = null;
		this.settings.folders.forEach((val, key) => {
			if (folder.name === val) {
				type = key;
			}
		});
		if (type === null && !folder.isRoot()) {
			type = this.findParaTypeInPath(folder.parent);
		}
		return type;
	}

	/**
	 * 
	 * @param file 
	 * @returns the ParaType if found, returns null if not
	 */
	private findTopelevelParaTypeInPath(folder: TFolder): ParaType | null {
		var type: ParaType | null = null;
		this.settings.folders.forEach((val, key) => {
			if (folder.name === val) {
				type = key;
			}
		});
		if (!folder.isRoot()) {
			// always prioritize found type from parent to avoid nested folder issue
			let foundTypeInParent = this.findTopelevelParaTypeInPath(folder.parent);
			if (foundTypeInParent != null) {
				type = foundTypeInParent;
			}
		}
		return type;
	}

	private async createParaFolders(): Promise<void> {
		for (let foldername of this.settings.folders.values()) {
			await this.app.vault.createFolder(foldername);
		}
	}

	private isParaVault(): boolean {
		let neededFolders = this.settings.folders.values();
		let root = this.app.vault.getRoot();
		for (let i of neededFolders) {
			let found = root.children.find((elem) => i === elem.name);
			if (found === undefined) {
				return false;
			}
		}
		return true;
	}

	private createMetaHeader(): string {
		let today = moment().format(DATE_FORMAT);
		return `createdAt: ${today}\n\n---\n`;
	}

	private getDirName(path: string) {
		if (path.endsWith("/")) {
			// is already a path return
			return path;
		}
		let lastSlashIdx = path.lastIndexOf("/");
		if (lastSlashIdx === -1) {
			// no slashes found
			throw new Error("No directory found in path");
		}
		return path.slice(0, lastSlashIdx);
	}
}
