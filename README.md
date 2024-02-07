# BibTeX Processor Plugin

The BibTeX Processor Plugin for Obsidian allows you to easily process BibTeX data directly within your Obsidian vault. With this plugin, you can paste your BibTeX data into a modal, and it will automatically create reference pages for each entry in your specified folder structure.

## Features

- Take in BibTeX citations and create reference and author pages based on that citation
- Creates a Sources folder with both a References and an Authors folder underneath
- Automatically create author pages for each author in the BibTeX citation
- Automatically create reference pages for each reaference in the BibTeX citation

## Usage

- Open the BibTeX Processor modal by clicking on the ribbon icon or using the Process BibTeX command in the command palette.
- Paste your BibTeX data into the input field.
- Click the Process button to create reference and author pages based on the provided data.
- The plugin will automatically create folders for references and authors if they don't exist already.
- The plugin will update existing reference and author pages if they already exist

## Installation

Until this plugin is available in Community Plugins, you will need to clone the repository and build it yourself.

1. You need to have the following installed:

- npm
- git

1. Open the .obsidian/plugins/ folder of your vault in a system shell or terminal. You can get here directly in the terminal or otherwise have Obsidian help you:

- You will need to enable "Community Plugins" for this to work.
- Open the settings panel in Obsidian, and navigate to the Plugins section
- Enable community plugins and then click "open plugins folder".
- Open a terminal window in this folder.

1. Run: git clone <git@github.com>:rolemartyr-x/BibTeXProcessor.git
1. Run: npm i
1. Run: npm run build
1. Enable the plugin from the "Community Plugins" settings page

This will produce a main.js file inside the repository folder, which Obsidian can open and make use of directly. Be sure to enable the plugin from your Community Plugins screen

Instruction to install once this included in Community Plugins:

1. Navigate to the Community Plugins section in the Obsidian settings.
2. Search for "BibTeX Processor" and click "Install" to enable the plugin.
3. Ensure that the plugin is activated in your settings.

## Contributing

If you encounter any issues or have suggestions for improvements, feel free to open an issue or submit a pull request on the GitHub repository.

## License

This plugin is distributed under the MIT License. See the LICENSE file for more information.

## Obsidian API Documentation

See <https://github.com/obsidianmd/obsidian-api>
