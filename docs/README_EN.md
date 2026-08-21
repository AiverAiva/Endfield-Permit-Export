[中文](../README.md) | English

<div align="center">
  <h1>Endfield Permit Export</h1>

  <p>
    A pull history analyzing tool for《Arknights：Endfield》
  </p>

  <p>
    <a href="https://github.com/AiverAiva/Endfield-Permit-Export/releases">
      <img src="https://img.shields.io/github/v/release/AiverAiva/Endfield-Permit-Export?style=flat-square" />
    </a>
    <img src="https://img.shields.io/github/license/AiverAiva/Endfield-Permit-Export?style=flat-square" />
    <a href="https://github.com/AiverAiva/Endfield-Permit-Export/releases">
      <img src="https://img.shields.io/github/downloads/AiverAiva/Endfield-Permit-Export/total?style=flat-square" />
    </a>
    <img src="https://img.shields.io/github/last-commit/AiverAiva/Endfield-Permit-Export/main?style=flat-square" />
  </p>
</div>

This project is modified from [star-rail-warp-export](https://github.com/biuuu/star-rail-warp-export/), adapted for *Arknights: Endfield* (Gryphline).

An Electron-based desktop tool that runs on Windows 64-bit.

Logs in with an official Hypergryph (CN) or Gryphline (Global) account to fetch gacha records. The game client does not need to be open.

## Other languages

Modify the JSON files in the `src/i18n/` directory to translate into the appropriate language.

If you find existing translations inaccurate or improvable, feel free to submit a pull request.

## Usage

1. Download and unzip the tool — [GitHub Releases](https://github.com/AiverAiva/Endfield-Permit-Export/releases/latest)
2. Click **Login** (tooltip: Add Account)

   ![Login](login-button.png)

3. Select a server: CN (Hypergryph) or Global (Gryphline)

   ![Select server](login-server.png)

4. Sign in in the popup window

   ![Login window](login-window.png)

5. After login, pick the account from the dropdown in the top right

   ![Select account](account-select.png)

6. Click **Update** to fetch pull history

   ![Update data](update-data.png)

To add another account, click **Login** again. Switch accounts from the dropdown.

## Development

```
# Install dependencies
yarn install

# Development mode
yarn dev

# Build a distributable executable
yarn build
```

## License

[MIT](https://github.com/AiverAiva/Endfield-Permit-Export/blob/main/LICENSE)