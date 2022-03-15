export enum ParaType{
	projects = "Projects", 
	areas_of_responsibility = "Areas of Responsibility", 
	resources = "Resources",
	archive = "Archive"
}

export function isParaType(s: String): boolean{
	for (const val in ParaType){
		if (val === s){
			return true;
		}
	}
	return false;
}
