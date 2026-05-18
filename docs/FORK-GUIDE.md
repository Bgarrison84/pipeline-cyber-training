# Fork Guide — Deploy Your Branded Training Site

## Overview

This guide walks you through deploying a branded copy of the pipeline cybersecurity training platform to GitHub Pages by editing one JSON file in the GitHub web UI. You can set your organization name, upload your logo, and choose which training modules to show — all without installing any software, writing any code, or using a command line. The only tools you need are a web browser and a free GitHub account.

## Prerequisites

1. A GitHub account (free tier works)
2. Access to the source repository on GitHub

## Step 1 — Fork the Repository

1. Go to the source repository page on GitHub.
2. Click the **Fork** button (top-right of the page).
3. Under "Owner", select your GitHub account or organization.
4. Click **Create fork**.
5. Wait for the fork to complete — GitHub redirects you to your new copy of the repository.

## Step 2 — Enable GitHub Pages

1. In your forked repository, click **Settings** (top navigation tab).
2. In the left sidebar, click **Pages**.
3. Under "Build and deployment" → Source, select **Deploy from a branch**.
4. Under Branch, select **main** and folder **/ (root)**. Click **Save**.
5. GitHub Pages begins building your site. After 1–3 minutes, a URL appears at the top of the Pages settings page (format: `https://YOUR-USERNAME.github.io/pipeline-cyber-training/`). This is your site URL.

## Step 3 — Customize Your Organization's Config

The file `public/fork.config.json` controls your organization name, logo, and which training modules are visible. You edit this file directly in the GitHub web UI — no tools required.

### Edit the config file via GitHub web UI

1. In your forked repository, navigate to `public/fork.config.json`.
2. Click the pencil (Edit) icon.
3. Replace the values for `orgName` and `activeModules` as needed (see Config Field Reference below).
4. Click **Commit changes**. In the dialog, enter a short commit message (e.g., "Set org name and active modules"). Click **Commit changes**.
5. GitHub Pages automatically rebuilds your site within 1–3 minutes. Refresh your site URL to see the changes.

## Step 4 — Add Your Organization Logo (Optional)

The `logoPath` field in `public/fork.config.json` points to an image file stored in the `public/` folder of your repository. To display your logo in the site header, upload the image first and then update the config.

1. Prepare a PNG or SVG logo file. Recommended size: at least 64px tall.
2. In your forked repository, navigate to the `public/` folder.
3. Click **Add file** → **Upload files**.
4. Drag your logo file into the upload area (example file name: `MyOrg.png`).
5. Click **Commit changes**.
6. Edit `public/fork.config.json` (see Step 3) and set `logoPath` to your filename, e.g., `"logoPath": "MyOrg.png"`.
7. Commit the config change and wait 1–3 minutes for the site to rebuild.

## Step 5 — Verify Your Deployment

1. Visit your GitHub Pages URL (found in **Settings** → **Pages**).
2. Confirm your org name appears in the top-left header.
3. If you added a logo, confirm the logo appears beside the org name.
4. Confirm only the modules you listed in `activeModules` are visible in the sidebar and home page.
5. Complete one lesson to confirm the training content is functional.

## Config Field Reference

| Field | Type | Example | Effect |
|---|---|---|---|
| `orgName` | string | `"OkieOps"` | Appears in the top-left header and browser tab title |
| `logoPath` | string or null | `"OkieOps.png"` | Path to an image file in `public/`. Set to `null` for text-only header. Image is displayed at 32px height beside the org name. |
| `activeModules` | array of strings | `["logging-auditing", "network-hardening"]` | Which modules are visible in the sidebar and home page. Omitted modules are completely hidden. Available IDs: `logging-auditing`, `network-hardening`, `account-access`, `incident-response`, `patch-management` |

## Troubleshooting

- **Site shows 404 after enabling Pages**: Wait up to 5 minutes for the initial build to complete. Check **Settings** → **Pages** for build status and any error messages.
- **Logo not appearing**: Confirm the image file is in the `public/` folder (not the repository root). Confirm `logoPath` in `fork.config.json` matches the filename exactly — the value is case-sensitive.
- **Module not appearing in sidebar**: Confirm the module ID in `activeModules` exactly matches one of the five valid IDs listed in the Config Field Reference above.
- **Changes not reflected after committing**: GitHub Pages rebuild takes 1–3 minutes. Hard-refresh your browser (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac) to bypass the browser cache.
