import { Player } from './cards/player';
import { AllSections } from './cards/all-sections';
import { Grouping } from './cards/grouping';
import { Groups } from './cards/groups';
import { MediaBrowser } from './cards/media-browser';
import './cards/volumes';

const name = (type?: string) => `Sonos${type ? ` (${type})` : ''}`;
const desc = (type?: string) => `Media player for your Sonos speakers${type ? ` (${type})` : ''}`;

window.customCards.push(
  {
    type: 'sonos-card',
    name: name(),
    description: desc(),
    preview: true,
  },
  {
    type: 'sonos-grouping',
    name: name('Grouping section'),
    description: desc('Grouping section'),
    preview: true,
  },
  {
    type: 'sonos-groups',
    name: name('Groups section'),
    description: desc('Groups section'),
    preview: true,
  },
  {
    type: 'sonos-media-browser',
    name: name('Media Browser section'),
    description: desc('Media Browser section'),
    preview: true,
  },
  {
    type: 'sonos-player',
    name: name('Player section'),
    description: 'Media player for your Sonos speakers (Player section)',
    preview: true,
  },
);

customElements.define('dev-sonos-card', AllSections);
customElements.define('dev-sonos-grouping', Grouping);
customElements.define('dev-sonos-groups', Groups);
customElements.define('dev-sonos-media-browser', MediaBrowser);
customElements.define('dev-sonos-player', Player);
