import { ParaType } from "para_types";

export interface Settings {
	folders: Map<ParaType, string>;
}

export const DEFAULT_SETTINGS: Settings = {
	folders: new Map<ParaType, string>([
        [ParaType.project, "1-Project"],
        [ParaType.area_of_responsibility, "2-Area"],
        [ParaType.resources, "3-Recource"],
        [ParaType.archive, "4-Archive"],
    ]),
};