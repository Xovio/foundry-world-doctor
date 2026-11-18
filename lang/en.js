export default {
  title: "World Doctor",
  locale: "en-US",
  keybinding: "Open World Doctor",
  readOnly: "Read-only: this report never changes your world.",
  scannedAt: "Scanned at {time}.",
  scanning: "Scanning the world…",
  scanFailed: "The scan could not be completed.",
  rescan: "Scan again",
  copy: "Copy report",
  copied: "Report copied to the clipboard.",
  tabs: {
    overview: "Overview",
    largest: "Largest entries",
    modules: "Data by module",
    findings: "Findings"
  },
  types: {
    Actor: "Actors",
    Item: "Items",
    Scene: "Scenes",
    JournalEntry: "Journals",
    RollTable: "Roll tables",
    Macro: "Macros",
    ChatMessage: "Chat messages",
    Playlist: "Playlists",
    Cards: "Cards",
    Combat: "Combats",
    Folder: "Folders",
    FogExploration: "Fog of war"
  },
  overview: {
    total: "World data",
    type: "Type",
    count: "Entries",
    size: "Size",
    share: "Share",
    unavailable: "not readable",
    hint: "Sizes describe the stored data of each entry. Database files on disk can be larger because they may still hold older versions. Compendiums are not included."
  },
  largest: {
    name: "Name",
    parts: "Biggest parts"
  },
  modules: {
    module: "Module",
    status: "Status",
    documents: "Entries",
    hint: "How much data each module has stored in the flags of your world's entries."
  },
  status: {
    active: "Active",
    inactive: "Inactive",
    missing: "No matching module",
    system: "Game system",
    core: "Foundry"
  },
  findings: {
    none: "Nothing stood out.",
    more: "{count} more entries are included in the copied report.",
    flagItem: "Flag \"{scope}\" in {count} entries",
    missingFlags: {
      title: "Data without a matching module",
      hint: "No installed module uses this flag name. It is often left over from a removed module, but imported data can look the same."
    },
    inactiveFlags: {
      title: "Data from inactive modules",
      hint: "These modules are installed but not active in this world. Their data returns to use if you activate them again."
    },
    brokenTokens: {
      title: "Tokens without an actor",
      hint: "These tokens point to an actor that no longer exists in the world.",
      item: "{count} tokens: {names}"
    },
    duplicateEffects: {
      title: "Possibly duplicated effects",
      hint: "An actor has several effects with the same name and origin. Effects that stack on purpose appear here too.",
      item: "{name} × {count}"
    },
    largeDeltas: {
      title: "Large unlinked tokens",
      hint: "These unlinked tokens store a lot of their own data inside the scene."
    },
    inlineData: {
      title: "Files embedded in entries",
      hint: "These entries contain images or files as text instead of linking to a file, which makes them much larger."
    },
    orphanFog: {
      title: "Fog of war without a scene",
      hint: "This fog belongs to a scene that exists neither in the world nor in a compendium.",
      label: "Scene {id}",
      item: "{count} fog entries"
    }
  }
};
