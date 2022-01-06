export interface Settings {
	projects_folder: string;
	area_of_responsibility_folder: string;
	resources_folder: string;
	archive_folder: string;
}


export const DEFAULT_SETTINGS: Settings = {
	projects_folder: '1-Projects',
	area_of_responsibility_folder: '2-Area',
	resources_folder: '3-Resources',
	archive_folder: '4-Archive'
};