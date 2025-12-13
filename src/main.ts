import { Player } from './sections/player';
import { Card } from './card';
import { Grouping } from './sections/grouping';
import { Groups } from './sections/groups';
import { Favorites } from './sections/favorites';
import { Queue } from './sections/queue';
import { Volumes } from './sections/volumes';

window.customCards.push({
  type: 'sonos-card',
  name: 'Sonos',
  description: 'Media player for your Sonos speakers',
  preview: true,
});

customElements.define('sonos-card', Card);
customElements.define('sonos-grouping', Grouping);
customElements.define('sonos-groups', Groups);
customElements.define('sonos-favorites', Favorites);
customElements.define('sonos-player', Player);
customElements.define('sonos-volumes', Volumes);
customElements.define('sonos-queue', Queue);
