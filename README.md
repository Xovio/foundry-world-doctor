# World Doctor

A read-only health report for your **Foundry VTT** world. It shows what takes up space and which leftovers are worth a look. It never changes your data.

## What it shows

- **Overview:** size and number of entries per document type
- **Largest entries:** the biggest actors, scenes and other entries, with what makes them big
- **Data by module:** how much data each module stores in flags, and whether that module is active
- **Findings:** data without a matching module, data from inactive modules, tokens without an actor, possibly duplicated effects, large unlinked tokens, embedded files and fog of war without a scene

## Screenshots

### Overview:

<img width="780" height="642" alt="image" src="https://github.com/user-attachments/assets/e563cda4-99dd-47ec-afd0-259316911542" />

### Largest Entries

<img width="781" height="641" alt="image" src="https://github.com/user-attachments/assets/77a1f07b-a7b6-4f96-8578-0e4371a21a83" />

### Data By Module

<img width="780" height="640" alt="image" src="https://github.com/user-attachments/assets/82afa5ec-a601-4c24-b607-1ebd9956a5d5" />

### Findings

<img width="777" height="633" alt="image" src="https://github.com/user-attachments/assets/f7adb35f-2258-4bd5-8390-80d3ff9684fe" />


## Usage

Open **Game Settings** in the sidebar and click **World Doctor** (GM only). You can also assign a key under **Configure Controls**. **Copy report** puts the full result on the clipboard.

Findings are hints. Check an entry before you change anything by hand.

## Settings

- **Language:** English or German

## Requirements

- Foundry VTT v12 (tested with build 343)

## Installation

In Foundry, go to **Add-on Modules → Install Module** and paste this manifest URL:

```
https://github.com/Xovio/foundry-world-doctor/releases/latest/download/module.json
```

## License

[MIT](LICENSE) – use it, change it, build on it.
