import { App, Modal } from "obsidian";

export class TextInputModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		let headline = document.createElement("h2");
		headline.innerText = "test";
		this.titleEl.appendChild(headline);
		let input = document.createElement("input");
		input.setAttribute("autofocus", "true");
		input.setAttribute("placeholder", "filename");
		contentEl.appendChild(input);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}