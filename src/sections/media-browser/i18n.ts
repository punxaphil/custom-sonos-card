import { HomeAssistant } from 'custom-card-helpers';

const STRINGS = {
  en: {
    library: 'Library',
    mediaBrowser: 'Media Browser',
    filter: 'Filter',
    filterPlaceholder: 'Filter {title}…',
    closeFilter: 'Close filter',
    clear: 'Clear',
    results: '{count} of {total}',
    noResults: 'No match for “{text}”',
    back: 'Back',
    menu: 'More options',
    favorites: 'Favorites',
    browse: 'Browse library',
    layout: 'Display',
    layoutAuto: 'Auto',
    layoutGrid: 'Grid',
    layoutList: 'List',
    playAll: 'Play all',
    playAllCount: 'Play all ({count})',
    playAllConfirm: 'Add {count} items to the queue?',
    cancel: 'Cancel',
    play: 'Play',
    setStart: 'Open here by default',
    unsetStart: 'Default start page',
    shortcut: 'Shortcut',
    items: '{count} items',
  },
  fr: {
    library: 'Bibliothèque',
    mediaBrowser: 'Bibliothèque',
    filter: 'Filtrer',
    filterPlaceholder: 'Filtrer {title}…',
    closeFilter: 'Fermer le filtre',
    clear: 'Effacer',
    results: '{count} sur {total}',
    noResults: 'Aucun résultat pour « {text} »',
    back: 'Retour',
    menu: 'Plus d’options',
    favorites: 'Favoris',
    browse: 'Parcourir la bibliothèque',
    layout: 'Affichage',
    layoutAuto: 'Auto',
    layoutGrid: 'Grille',
    layoutList: 'Liste',
    playAll: 'Tout lire',
    playAllCount: 'Tout lire ({count})',
    playAllConfirm: 'Ajouter {count} éléments à la file d’attente ?',
    cancel: 'Annuler',
    play: 'Lire',
    setStart: 'Ouvrir ici par défaut',
    unsetStart: 'Page de départ par défaut',
    shortcut: 'Raccourci',
    items: '{count} éléments',
  },
};

export type BrowserStringKey = keyof (typeof STRINGS)['en'];

export function browserText(hass: HomeAssistant | undefined, key: BrowserStringKey, vars: Record<string, string | number> = {}): string {
  const language = ((hass as unknown as { locale?: { language?: string } })?.locale?.language ?? hass?.language ?? 'en').toLowerCase();
  const table = language.startsWith('fr') ? STRINGS.fr : STRINGS.en;
  let text: string = table[key] ?? STRINGS.en[key] ?? key;
  for (const [name, value] of Object.entries(vars)) {
    text = text.replace(`{${name}}`, String(value));
  }
  return text;
}
