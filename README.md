# Chrome Group Tab Transfer Extension

A Chrome extension that lets you **export your current tab groups** (including titles, colors, collapsed state, and optional pinned info) to a JSON file — and then **import that JSON into another Chrome profile or another machine** to recreate the same workspace.

This is useful if:
- You keep different Chrome profiles for different clients / jobs / moods.
- You want one-click “project workspaces.”
- You’re migrating machines or profiles and don’t want to rebuild 40 tabs by hand.

---

## Features

### Export tab groups
- Exports each tab group’s:
  - Group title
  - Group color
  - Collapsed/expanded state
  - All tab URLs
  - (Optional) whether each tab was pinned
- Can also include ungrouped tabs in an “Ungrouped” bucket if you want a full snapshot of the window, not just grouped tabs.
- Lets you select which groups to include before exporting.

Under the hood:
- Uses `chrome.tabGroups` to enumerate groups and get metadata like `title`, `color`, and `collapsed`. Chrome exposes this to extensions so they can read and modify tab groups in the current browser session. Chrome explicitly supports updating group properties (color, title, collapsed state) through `chrome.tabGroups.update()` in Manifest V3. 
- Uses `chrome.tabs.query({ groupId })` to gather all tabs in each group, even if the group is collapsed or not focused. Chrome documents that `chrome.tabs.query` can filter by `groupId` and return all matching tabs. 

### Import tab groups
- Opens a new Chrome window.
- Recreates each exported group:
  - Opens each URL in background tabs.
  - Regroups them with `chrome.tabs.group()`.
  - Restores the title, color, and collapsed state.
  - Re-pins tabs that were marked pinned in the export (optional).
- Works across profiles: export in Profile A, import in Profile B.

### Session naming
- You can type a “session name” in the popup UI.
- That name becomes the default filename for the export.
- Invalid filename characters are auto-sanitized.

Example:  
`ClientA-InventoryAudit` → `ClientA-InventoryAudit.json`

If you don’t type anything, it auto-generates something like `session-2025-10-24-1530.json`.

### Export history (local)
- The last ~10 exports are tracked in local extension storage.
- The popup shows a mini “Recent Exports” list with timestamp, filename, and number of groups.
- You can clear that history with one click.

Nothing leaves your machine. This is just for convenience.

### Polished UI
- Clean popup with:
  - soft gradient background
  - card-style rows for each tab group
  - color dot matching the group color
  - modern action buttons with icons (inline SVG)
- Checkboxes let you choose exactly what gets exported before you click.

---

## Permissions & Safety

This extension is designed to be auditable and minimal. It currently uses:

- `tabs` – Needed to read tab URLs, pinned state, and create tabs during import.
- `tabGroups` – Needed to read/restore tab group metadata and recreate groups.
- `downloads` – Used to trigger a “Save As…” dialog so you can download the JSON export. Chrome documents that `chrome.downloads.download()` can programmatically download files to disk (and with `saveAs: true` it will show a Save dialog). 
- `storage` – Used only to keep local export history (filenames + timestamps). Nothing is synced to a server.

What it does **not** do:
- No network requests.
- No analytics, telemetry, trackers, ads.
- No remote code execution.
- No host permissions like `https://*/*` or `http://*/*`.
- No reading page content / cookies / form data.

Everything happens locally and is visible in the source.

---

## Installation (developer mode)

Until it’s published in the Chrome Web Store, you load it manually:

1. Clone / download this repo.
2. In Chrome, go to `chrome://extensions`.
3. Toggle **Developer mode** on (top right).
4. Click **Load unpacked**.
5. Select the folder containing:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `icons/`
6. The extension should appear in your toolbar. Click it to open the popup UI.

To export:
- Select which groups to include.
- Optionally include ungrouped and pinned info.
- Click **Export Selected**.
- You’ll be prompted to save the JSON file.

To import:
- Click **Import JSON**.
- Pick a previously exported `.json`.
- A new Chrome window will open and rebuild those groups.

---

## Roadmap / nice-to-haves

These are ideas on deck:

1. **Session library inside the extension**  
   - Save named “workspaces” inside the extension without manually exporting JSON, then relaunch those workspaces on demand.

2. **Auto-grouping rules**  
   - Example rule: “Any new tab from `*.figma.com` automatically joins the ‘Design’ group.”
   - This would use tab creation listeners + `chrome.tabs.group()`.

3. **Scheduled backups**  
   - Optional timer that automatically snapshots your current groups every X hours / days.
   - Would generate timestamped exports like `backup-2025-10-24-1530.json`.

4. **Merge import**  
   - Instead of always opening a brand new Chrome window on import, allow:
     - merge into the current window
     - merge into an existing group with the same name/color
     - skip specific groups

5. **Localization + theming**  
   - Light/dark themes.
   - `/_locales/*` for i18n strings.

6. **Optional profile-aware filenames**  
   - If we someday request the optional `identity.email` permission, we could call `chrome.identity.getProfileUserInfo()` (which returns the email for the signed-in Chrome profile if allowed, per Chrome’s docs as of 2025-08-11). This would let exports default to names like `martin@client.json`. That permission would be off by default and clearly explained. 

If any of those ship, we’ll bump the version in `manifest.json`.

---

## Development notes

- This project targets **Manifest V3**.
- Core logic lives in `popup.js`, which:
  - reads tab groups and tabs
  - builds export data
  - triggers the download
  - performs the import and recreation
  - manages export history in `chrome.storage.local`
- The popup HTML (`popup.html`) handles the UI, icons, options, and status messaging.
- Icons are embedded inline SVG for portability (no CDN, no extra runtime dependencies).
- Styling is done with CSS variables so changing the color theme is easy.

---

## License

MIT License.  
See `LICENSE` for details.

You can use, fork, modify, extend, or ship this — just don’t imply warranty.  
Attribution is appreciated but not required.