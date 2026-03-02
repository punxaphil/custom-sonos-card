import { Player } from './sections/player/player-section';
import { Card } from './card';
import { Grouping } from './sections/grouping/grouping-section';
import { Groups } from './sections/groups/groups-section';
import { MediaBrowser } from './sections/media-browser/media-browser-section';
import { MediaBrowserBrowser } from './sections/media-browser/browser';
import { Favorites } from './sections/media-browser/favorites/favorites';
import { Queue } from './sections/queue/queue-section';
import { QueueMass } from './sections/queue/queue-mass';
import { QueueSonos } from './sections/queue/queue-sonos';
import { Search } from './sections/search/search-section';
import { Volumes } from './sections/volumes/volumes-section';

window.customCards.push({
  type: 'sonos-card',
  name: 'Sonos',
  description: 'Media player for your Sonos speakers',
  preview: true,
});

customElements.define('sonos-card', Card);
customElements.define('sonos-grouping', Grouping);
customElements.define('sonos-groups', Groups);
customElements.define('sonos-media-browser', MediaBrowser);
customElements.define('sonos-media-browser-browser', MediaBrowserBrowser);
customElements.define('sonos-favorites', Favorites);
customElements.define('sonos-player', Player);
customElements.define('sonos-volumes', Volumes);
customElements.define('sonos-queue', Queue);
customElements.define('sonos-queue-mass', QueueMass);
customElements.define('sonos-queue-sonos', QueueSonos);
customElements.define('sonos-search', Search);
