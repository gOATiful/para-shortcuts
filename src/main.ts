import {
	moment,
	normalizePath,
	Notice,
	Plugin,
	TAbstractFile,
	TextFileView,
	TFolder,
} from "obsidian";

import { Settings, DEFAULT_SETTINGS, settingsToMap } from "settings/settings";
import { ParaShortcutsSettingTab } from "settings/settings_tab";
import { CreateNewEntryModal } from "modals/new_entry_modal";
import { ParaType } from "para_types";

const DATE_FORMAT = "YYYY-MM-DD";
const POSTPONE_FOLDER_NAME = "postponed";

export default class ParaShortcutsPlugin extends Plugin {
	settings: Settings;
	private folderMapping: Map<ParaType, string>;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "create-new-entry",
			name: "Create new entry",
			callback: () => this.commandCreateNewEntry(),
		});
		this.addCommand({
			id: "init-vault",
			name: "Init vault with PARA folders",
			callback: () => this.commandInitPara(),
		});
		this.addCommand({
			id: "move-to-archive",
			name: "Move current file to archive",
			checkCallback: (checking: boolean) =>
				this.commandMoveToArchive(checking),
		});
		this.addCommand({
			id: "restore-from-archive",
			name: "Restore entry from archive",
			checkCallback: (checking: boolean) =>
				this.commandRestoreFromArchive(checking),
		});
		this.addCommand({
			id: "postpone-entry",
			name: "Postpone this entry",
			checkCallback: (checking: boolean) =>
				this.commandPostponeEntry(checking),
		});
		this.addCommand({
			id: "reschedule-entry",
			name: "Reschedule this entry",
			checkCallback: (checking: boolean) =>
				this.commandRescheduleEntry(checking),
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (this.canMoveToArchive(file)) {
					menu.addItem((item) => {
						item
							.setTitle("Move to archive")
							.onClick(() => {
								this.moveToArchive(file);
							})
					});
				}
				if (this.canRestoreFromArchive(file)) {
					menu.addItem((item) => {
						item
							.setTitle("Restore from archive")
							.onClick(() => {
								this.restoreFromArchive(file);
							})
					});
				}
			})
		);

		this.addSettingTab(new ParaShortcutsSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		this.folderMapping = settingsToMap(this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.folderMapping = settingsToMap(this.settings);
	}

	/**
	 * Create a new File in the matching folder based on the given `type`
	 * @param type specifies the folder in which the file will be created
	 * @param filename the name of the created file
	 */
	public async createEntryByType(type: ParaType, filename = "untitled.md") {
		const folderName = this.folderMapping.get(type);
		const rootFolderChildren = this.app.vault.getRoot().children;
		const selectedFolder = rootFolderChildren.find(
			(ele) => ele.name === folderName
		);
		if (selectedFolder !== undefined) {
			const filepath = normalizePath([folderName, filename].join("/"));
			const createdFile = await this.app.vault.create(
				filepath,
				this.createMetaHeader()
			);
			await this.app.workspace.activeLeaf.openFile(
				createdFile,
				TextFileView
			); // open the created file
		}
	}

	private commandCreateNewEntry() {
		const modal = new CreateNewEntryModal(this.app, this);
		modal.open();
	}

	private commandInitPara() {
		if (this.isParaVault()) {
			new Notice("PARA already initialized!");
			return;
		}
		this.createParaFolders()
			.then(() => {
				new Notice("Vault successfuly initialized!");
			})
			.catch((_) => {
				new Notice("Error creating PARA folders");
			});
	}

	private canRestoreFromArchive(file: TAbstractFile): boolean {
		return this.isFolderInParaType(file.parent, ParaType.archive);
	}

	private restoreFromArchive(file: TAbstractFile): void {
		const archiveFolderName = this.folderMapping.get(ParaType.archive);
		const newFilePath = normalizePath(file.path.replace(archiveFolderName, ""));
		const folderToDelete = file.parent;
		this.moveFileAndCreateFolder(file, newFilePath)
			.then(() => {
				new Notice(`Restored file to ${newFilePath}`);
				this.deleteFolderIfEmpty(folderToDelete);
			})
			.catch((_) => {
				new Notice(`Unable to resotre file`);
			});
	}

	/**
	 * Restores the open file back to its corresponding para folder
	 * @param checking
	 * @returns
	 */
	private commandRestoreFromArchive(checking: boolean): boolean | void {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile !== null) {
			if (checking) {
				// Command is only active if file is in archive folder
				return this.canRestoreFromArchive(activeFile);
			}
			this.restoreFromArchive(activeFile);
		}
	}

	/**
	 * Moves out of the postponed into its original folder.
	 * @param checking
	 * @returns
	 */
	private commandRescheduleEntry(checking: boolean): boolean | void {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile !== null) {
			if (checking) {
				return (
					!this.isFolderInParaType(
						activeFile.parent,
						ParaType.archive
					) && activeFile.path?.contains(POSTPONE_FOLDER_NAME)
				);
			}
		}
		const newFilePath = normalizePath(
			activeFile.path.replace(`/${POSTPONE_FOLDER_NAME}`, "")
		);
		const folderToDelete = activeFile.parent;
		this.moveFileAndCreateFolder(activeFile, newFilePath)
			.then(() => {
				new Notice(`Rescheduled ${newFilePath}.`);
				this.deleteFolderIfEmpty(folderToDelete);
			})
			.catch((_) => {
				new Notice(`Unable to move file to ${newFilePath}.`);
			});
	}

	private commandPostponeEntry(checking: boolean): boolean | void {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile !== null) {
			if (checking) {
				return (
					!this.isFolderInParaType(
						activeFile.parent,
						ParaType.archive
					) && !activeFile.path?.contains(POSTPONE_FOLDER_NAME)
				);
			}
			const paratype = this.findParaTypeInPath(activeFile.parent);
			if (paratype != null) {
				const foldername = this.folderMapping.get(paratype);
				const newFilePath = normalizePath(
					activeFile.path.replace(
						foldername,
						foldername + `/${POSTPONE_FOLDER_NAME}`
					)
				);
				const folderToDelete = activeFile.parent;
				this.moveFileAndCreateFolder(activeFile, newFilePath)
					.then(() => {
						new Notice(`Postponed ${newFilePath}.`);
						this.deleteFolderIfEmpty(folderToDelete);
					})
					.catch((_) => {
						new Notice(`Unable to move file to ${newFilePath}.`);
					});
			}
		}
	}

	private canMoveToArchive(file: TAbstractFile): boolean {
		return !this.isFolderInParaType(file.parent, ParaType.archive);
	}

	private moveToArchive(file: TAbstractFile): void {
		const archiveFolderName = this.folderMapping.get(ParaType.archive);
		const pathToFile = normalizePath(
			[
				this.app.vault.getRoot().name,
				archiveFolderName,
				file.path,
			].join("/")
		);
		this.moveFileAndCreateFolder(file, pathToFile)
			.then(() => {
				new Notice(`Moved file to ${pathToFile}.`);
			})
			.catch((_) => {
				new Notice(`Unable to move file to ${pathToFile}.`);
			});
	}

	private commandMoveToArchive(checking: boolean): boolean | void {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile !== null) {
			if (checking) {
				return this.canMoveToArchive(activeFile);
			}
			this.moveToArchive(activeFile);
		}
	}

	private async moveFileAndCreateFolder(
		file: TAbstractFile,
		newPath: string
	): Promise<void> {
		try {
			await this.app.fileManager.renameFile(file, newPath);
		} catch (error) {
			// try to create folder and try again
			const pathToFolder = this.getDirName(newPath);
			await this.app.vault.createFolder(pathToFolder);
			await this.app.fileManager.renameFile(file, newPath);
		}
	}

	private isFolderInParaType(folder: TFolder, paraType: ParaType): boolean {
		const paraTypeOfFolder = this.findTopelevelParaTypeInPath(folder);
		return paraTypeOfFolder == paraType;
	}

	private findParaTypeInPath(folder: TFolder): ParaType | null {
		let type = this.getTypeFromName(folder.name);
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
		let type = this.getTypeFromName(folder.name);
		if (!folder.isRoot()) {
			// always prioritize found type from parent to avoid nested folder issue
			const foundTypeInParent = this.findTopelevelParaTypeInPath(
				folder.parent
			);
			if (foundTypeInParent != null) {
				type = foundTypeInParent;
			}
		}
		return type;
	}

	private async createParaFolders(): Promise<void> {
		for (const foldername of this.folderMapping.values()) {
			await this.app.vault.createFolder(foldername);
		}
	}

	private isParaVault(): boolean {
		const neededFolders = this.folderMapping.values();
		const root = this.app.vault.getRoot();
		for (const i of neededFolders) {
			const found = root.children.find((elem) => i === elem.name);
			if (found === undefined) {
				return false;
			}
		}
		return true;
	}

	private createMetaHeader(): string {
		const today = moment().format(DATE_FORMAT);
		return `createdAt: ${today}\n\n---\n`;
	}

	private getDirName(path: string) {
		if (path.endsWith("/")) {
			// is already a path return
			return path;
		}
		const lastSlashIdx = path.lastIndexOf("/");
		if (lastSlashIdx === -1) {
			// no slashes found
			throw new Error("No directory found in path");
		}
		return path.slice(0, lastSlashIdx);
	}

	/**
	 * Deletes given folder recursivly to the next para type if empty.
	 * @param folder
	 */
	private async deleteFolderIfEmpty(folder: TFolder): Promise<void> {
		// stop when meet PARA folder
		if (this.getTypeFromName(folder.name) !== null) {
			return;
		}
		if (folder.children.length === 0) {
			const folderToDelete = folder.parent;
			await this.app.vault.delete(folder);
			return this.deleteFolderIfEmpty(folderToDelete);
		}
	}

	private getTypeFromName(name: string): ParaType | null {
		for (const [key, val] of this.folderMapping.entries()) {
			if (name === val) {
				return key;
			}
		}
		return null;
	}
}
