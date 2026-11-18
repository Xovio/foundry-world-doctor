export default {
  title: "Welt-Doktor",
  locale: "de-DE",
  keybinding: "Welt-Doktor öffnen",
  readOnly: "Nur Anzeige: Dieser Bericht verändert deine Welt nicht.",
  scannedAt: "Geprüft um {time}.",
  scanning: "Welt wird geprüft …",
  scanFailed: "Die Prüfung konnte nicht abgeschlossen werden.",
  rescan: "Erneut prüfen",
  copy: "Bericht kopieren",
  copied: "Bericht in die Zwischenablage kopiert.",
  tabs: {
    overview: "Übersicht",
    largest: "Größte Einträge",
    modules: "Daten pro Modul",
    findings: "Auffälligkeiten"
  },
  types: {
    Actor: "Actors",
    Item: "Items",
    Scene: "Szenen",
    JournalEntry: "Journale",
    RollTable: "Tabellen",
    Macro: "Makros",
    ChatMessage: "Chatnachrichten",
    Playlist: "Playlists",
    Cards: "Karten",
    Combat: "Kämpfe",
    Folder: "Ordner",
    FogExploration: "Fog of War"
  },
  overview: {
    total: "Weltdaten",
    type: "Typ",
    count: "Einträge",
    size: "Größe",
    share: "Anteil",
    unavailable: "nicht lesbar",
    hint: "Die Größen beschreiben die gespeicherten Daten der Einträge. Die Datenbankdateien auf der Festplatte können größer sein, weil sie noch ältere Stände enthalten können. Kompendien sind nicht enthalten."
  },
  largest: {
    name: "Name",
    parts: "Größte Bestandteile"
  },
  modules: {
    module: "Modul",
    status: "Status",
    documents: "Einträge",
    hint: "Wie viele Daten jedes Modul in den Flags deiner Welteinträge gespeichert hat."
  },
  status: {
    active: "Aktiv",
    inactive: "Inaktiv",
    missing: "Kein passendes Modul",
    system: "Spielsystem",
    core: "Foundry"
  },
  findings: {
    none: "Nichts Auffälliges gefunden.",
    more: "{count} weitere Einträge stehen im kopierten Bericht.",
    flagItem: "Flag „{scope}“ in {count} Einträgen",
    missingFlags: {
      title: "Daten ohne passendes Modul",
      hint: "Kein installiertes Modul nutzt diesen Flag-Namen. Meist sind das Reste entfernter Module, importierte Daten können aber genauso aussehen."
    },
    inactiveFlags: {
      title: "Daten inaktiver Module",
      hint: "Diese Module sind installiert, aber in dieser Welt nicht aktiv. Ihre Daten werden wieder genutzt, sobald du sie aktivierst."
    },
    brokenTokens: {
      title: "Tokens ohne Actor",
      hint: "Diese Tokens verweisen auf einen Actor, den es in der Welt nicht mehr gibt.",
      item: "{count} Tokens: {names}"
    },
    duplicateEffects: {
      title: "Möglicherweise doppelte Effekte",
      hint: "Ein Actor hat mehrere Effekte mit gleichem Namen und gleicher Herkunft. Absichtlich stapelnde Effekte erscheinen hier ebenfalls.",
      item: "{name} × {count}"
    },
    largeDeltas: {
      title: "Große unverknüpfte Tokens",
      hint: "Diese unverknüpften Tokens speichern viele eigene Daten in der Szene."
    },
    inlineData: {
      title: "In Einträge eingebettete Dateien",
      hint: "Diese Einträge enthalten Bilder oder Dateien als Text, statt auf eine Datei zu verweisen, und werden dadurch deutlich größer."
    },
    orphanFog: {
      title: "Fog of War ohne Szene",
      hint: "Dieser Fog gehört zu einer Szene, die weder in der Welt noch in einem Kompendium existiert.",
      label: "Szene {id}",
      item: "{count} Fog-Einträge"
    }
  }
};
