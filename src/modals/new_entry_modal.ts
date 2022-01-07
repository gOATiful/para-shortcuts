import ParaShortcutsPlugin from "main";
import { App, FuzzySuggestModal} from "obsidian";
import { ParaType } from "para_types";


export class CreateNewEntryModal extends FuzzySuggestModal<ParaType> {
	
	plugin: ParaShortcutsPlugin;

	constructor(app: App, plugin: ParaShortcutsPlugin) {
		super(app);
		this.plugin = plugin;
		this.setPlaceholder("Create a new entry for:");
		this.modalEl.appendChild(this.createAdditionalInformationEl());
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

	private createFileNameInformationEl(): HTMLElement {
		let surroundingDiv = document.createElement('div');
		let label = document.createElement('div');
		label.innerText = 'File name:'
		let textInput = document.createElement('input');
		surroundingDiv.appendChild(label);
		surroundingDiv.appendChild(textInput);
		return surroundingDiv;
	}

	private createAdditionalInformationEl(): HTMLElement{
		let additionalInfo = document.createElement('div');
		additionalInfo.appendChild(this.createFileNameInformationEl());
		return additionalInfo;
	}

}
