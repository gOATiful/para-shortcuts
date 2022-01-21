# para-shortcuts

This plugin serves usefull commands to setup and manage your knowledge using the PARA method.

## The PARA Method
A full article on the PARA method and it's benefits can be found on this [blog post](https://fortelabs.co/blog/para/) by Tiago Forte.

Brief summery of the PARA folder structure:
- **Projects**: A project is "a series of tasks linked to a goal, with a deadline".
- **Area**: An area of responsibility is "a sphere of activity with a standard to be maintained over time".
- **Resource**: A resource is "a topic or theme of ongoing interest". 
- **Archive**: Archives include "inactive items from the other three categories".

Additional: Put personally relevant information in Areas, and generally useful information in Resources. 
## Commands

All commands can be accessed in the command palette.  
default: `ctrl+p`

Overview:
- [Init Vault](init-vault)
- [Create new entry](create-new-entry)
- [Move to archive](move-to-archive)
- [Restore entry from archive](restore-entry-from-archive)

### Init Vault
Para follows a simple folder structure to organize your knowlage.  
This command creates the folders accordingly in the root of the vault.

### Create new entry
Create a new entry in the markdownfile with a basic template in the selected folder.

### Move to archive
Moves the currently opened file in its respective folder in the archive.  
This commands create the matching para folder if not present.  
Note that this command is only present in not 'archive'-folders.

### Restore entry from archive
This command is only present for files in the 'archive'-folder.  
It restores the selected file back to its original PARA-folder.  
