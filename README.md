# Tab Groups Manager Chrome Extension

This Chrome extension lets you **export** your current tab groups to a JSON file and **import** them into another browser profile or on another machine. It also includes options to export ungrouped tabs, preserve pinned state, and keeps a local history of your recent exports. A polished popup UI with icons and colour‑coded lists makes managing your tab groups feel native.

## Features

- **Export tab groups** – Select which groups to include and optionally add ungrouped tabs. The export file contains each group’s title, colour, collapsed state and list of URLs.
- **Import tab groups** – Open a JSON file to recreate the groups in a new window. Tabs can be restored as pinned if that state was captured.
- **Session naming** – Enter a custom session name; it’s used as the filename for the exported JSON. Invalid characters are automatically sanitized.
- **Export history** – The last 10 exports are logged locally with the date, filename and number of groups. You can clear this history at any time.
- **Modern UI** – The popup uses a soft gradient background, card‑style group items with subtle shadows, and inline Font Awesome icons for export/import actions. Checkboxes adopt the extension’s accent colour.

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select the `tab_groups_extension` directory.
5. The extension icon will appear in your toolbar. Pin it for quick access if desired.

## Usage

1. Click the extension icon to open the popup.
2. Enter an optional session name (used as the filename) or leave the default timestamp.
3. Choose whether to include ungrouped tabs and/or pinned state.
4. Select the tab groups you want to export.
5. Click **Export Selected**. A save dialog will appear—choose where to store the JSON file.
6. To import, click **Import JSON**, choose a previously exported file, and the extension will recreate the groups in a new window.
7. The **Export history** section lists your recent exports. Use **Clear history** to remove the log.

## Development

This project is written using plain HTML, CSS and JavaScript with Chrome Manifest V3. The only permissions requested are `tabs`, `tabGroups`, `downloads`, and `storage`. No external network requests are made. Feel free to customize the UI or add features—pull requests are welcome!

## License

This project is provided for personal use under the MIT License. See the [LICENSE](LICENSE) file for details.
