import { Player } from './sections/player';
import { Card } from './card';
import { Grouping } from './sections/grouping';
import { Groups } from './sections/groups';
import { Media } from './sections/media';
import './sections/volumes';
import './components/ha-player';
import { Queue } from './sections/queue';
import { Volumes } from './sections/volumes';

const name = (type?: string) => `Sonos${type ? ` (${type})` : ''}`;
const desc = (type?: string) => `Media player for your Sonos speakers${type ? ` (${type})` : ''}`;

window.customCards.push({
  type: 'sonos-card',
  name: name(),
  description: desc(),
  preview: true,
});

customElements.define('sonos-card', Card);
customElements.define('sonos-grouping', Grouping);
customElements.define('sonos-groups', Groups);
customElements.define('sonos-media', Media);
customElements.define('sonos-player', Player);
customElements.define('sonos-volumes', Volumes);
customElements.define('sonos-queue', Queue);
