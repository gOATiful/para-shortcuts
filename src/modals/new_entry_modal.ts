import ParaShortcutsPlugin from "main";
import { App, FuzzySuggestModal} from "obsidian";
import { ParaType } from "para_types";


export class CreateNewEntryModal extends FuzzySuggestModal<ParaType> {
	
	plugin: ParaShortcutsPlugin;

	constructor(app: App, plugin: ParaShortcutsPlugin) {
		super(app);
		this.plugin = plugin;
		this.setPlaceholder("Create a new entry for:");
	}
	
	onChooseItem(item: ParaType, evt: MouseEvent | KeyboardEvent): void {
		this.plugin.createEntryByType(item);
	}

	getItems(): ParaType[] {
		return [ParaType.project, ParaType.area_of_responsibility, ParaType.resources];
	}
	
	getItemText(item: ParaType): string {
		return item;
	}

}
