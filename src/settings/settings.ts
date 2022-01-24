import { ParaType } from "para_types";

export interface Settings {
    folders: {
        project: string,
        area: string,
        resource: string,
        archive: string
    },
}

export const DEFAULT_SETTINGS: Settings = {
    folders: {
        project: "1-Project",
        area: "2-Area",
        resource: "3-Resource",
        archive: "4-Archive",
    }
};

/**
 * Convert a settings-object to a map with ParaType keys.
 */
export function settingsToMap(settings: Settings) {
    return new Map([
        [ParaType.project, settings.folders.project],
        [ParaType.area_of_responsibility, settings.folders.area],
        [ParaType.resources, settings.folders.resource],
        [ParaType.archive, settings.folders.archive]
    ]);
}