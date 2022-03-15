import { FuzzySuggestModal, FuzzyMatch } from "obsidian";

export class CheckboxSuggest extends FuzzySuggestModal<string> {
    array = ['test', 'lala'];
    getItemText(item: string): string {
        return item;
    }
    getItems() {
        return this.array;
    }
    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
        if (this.selected.has(item)) {
            this.selected.delete(item);
            this.checkboxes.get(item).removeAttribute("checked");
        } else {
            this.selected.add(item);
            this.checkboxes.get(item).setAttr("checked", true);
        }
        return;
    }
    onChooseSuggestion(
        item: FuzzyMatch<string>,
        evt: MouseEvent | KeyboardEvent
    ): void {
        if (this.selected.has(item.item)) {
            this.selected.delete(item.item);
            this.checkboxes.get(item.item).removeAttribute("checked");
        } else {
            this.selected.add(item.item);
            this.checkboxes.get(item.item).setAttr("checked", true);
        }
        return;
    }
    selectSuggestion(
        value: FuzzyMatch<string>,
        evt: MouseEvent | KeyboardEvent
    ) {
        //@ts-ignore
        this.app.keymap.updateModifiers(evt);
        this.onChooseSuggestion(value, evt);
    }
    selected: Set<string> = new Set();
    checkboxes: Map<string, HTMLInputElement> = new Map();
    renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement) {
        if (!this.checkboxes.has(item.item)) {
            this.checkboxes.set(
                item.item,
                createEl("input", {
                    type: "checkbox",

                    attr: {
                        name: item.item,
                        ...(this.selected.has(item.item)
                            ? { checked: true }
                            : {})
                    }
                })
            );
        }
        el.appendChild(this.checkboxes.get(item.item));
        el.createEl("label", { attr: { for: item.item }, text: item.item });
    }
}