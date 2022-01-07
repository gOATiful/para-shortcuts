import ParaShortcutsPlugin from "main";
import { App, FuzzySuggestModal} from "obsidian";
import { ParaType } from "para_types";
import { join } from "path";


export class CreateNewEntryModal extends FuzzySuggestModal<ParaType> {
	app : App;
	plugin : ParaShortcutsPlugin;

	getItems(): ParaType[] {
		return [ParaType.project, ParaType.area_of_responsibility, ParaType.resources];
	}
	
	getItemText(item: ParaType): string {
		return item;
	}
	
	onChooseItem(item: ParaType, evt: MouseEvent | KeyboardEvent): void {
		let settings = this.plugin.getSettings();
		let folderName = settings.folders.get(item);
		let rootFolderChildren = this.app.vault.getRoot().children;
		let selectedFolder = rootFolderChildren.find(ele => ele.name === folderName)
		if (selectedFolder !== undefined){
			let fileName = 'test.md'
			let filepath = join("/", folderName, fileName);
			this.app.vault.create(filepath, "hallo").then((ret) => {
				this.app.workspace.activeLeaf.openFile(ret); // open the created file
			});
		}
	}

	constructor(app: App, plugin: ParaShortcutsPlugin) {
		super(app);
		this.app = app;
		this.plugin = plugin;
		this.setPlaceholder("Create a new entry for:");
	}

}
