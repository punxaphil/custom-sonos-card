import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { listStyle } from '../../constants';
import Store from '../../model/store';
import '../../components/operation-overlay';
import '../../components/play-menu';
import './queue-header';
import './queue-list';
import { queueStyles } from './styles';
import { MASS_CONFIG_MESSAGE, MASS_QUEUE_MESSAGE } from './queue-section-utils';
import { QueueController } from './queue-controller';
import {
  cancelCurrentOperation,
  dismissPlayMenu,
  handleHeaderAction,
  handleKeyDown,
  handleListAction,
  handlePlayMenuAction,
  handleSearchAction,
} from './queue-controller-utils';

export class QueueMass extends LitElement {
  @property() store!: Store;
  ctrl = new QueueController(this, () => this.store);

  render() {
    const { ctrl } = this;
    const hasSelection = ctrl.selectedIndices.size > 0;
    const operationRunning = ctrl.operationProgress !== null;
    const shownIndices = ctrl.showOnlyMatches ? ctrl.shownIndices : [];
    return html`
      <div class="queue-container" @keydown=${(e: KeyboardEvent) => handleKeyDown(ctrl, e.key)} tabindex="-1">
        <sonos-operation-overlay
          .progress=${ctrl.operationProgress}
          .hass=${this.store.hass}
          @cancel-operation=${() => cancelCurrentOperation(ctrl)}
        ></sonos-operation-overlay>
        <div class="error-message" ?hidden=${!ctrl.showConfigMessage}><p>${MASS_CONFIG_MESSAGE}</p></div>
        <div class="error-message" ?hidden=${!ctrl.showQueueMessage}><p>${MASS_QUEUE_MESSAGE}</p></div>
        <div class="error-message" ?hidden=${!ctrl.errorMessage}><p>${ctrl.errorMessage}</p></div>
        <div class="queue-content" ?hidden=${ctrl.hasError}>
          <sonos-queue-header
            .queueTitle=${ctrl.queueTitle}
            .itemCount=${ctrl.queueItems.length}
            .items=${ctrl.queueItems}
            .selectMode=${ctrl.selectMode}
            .hasSelection=${hasSelection}
            .operationRunning=${operationRunning}
            .store=${this.store}
            @queue-search-action=${(e: Event) => handleSearchAction(ctrl, (e as CustomEvent).detail)}
            @queue-header-action=${(e: Event) => handleHeaderAction(ctrl, (e as CustomEvent).detail)}
          ></sonos-queue-header>
          <sonos-queue-list
            .loading=${ctrl.loading}
            .searchExpanded=${ctrl.searchExpanded}
            .selectedIndex=${ctrl.selectedQueueIndex}
            .searchHighlightIndex=${ctrl.searchHighlightIndex}
            .selectMode=${ctrl.selectMode}
            .store=${this.store}
            .displayItems=${ctrl.displayItems}
            .shownIndices=${shownIndices}
            .selectedIndices=${ctrl.selectedIndices}
            @queue-list-action=${(e: Event) => handleListAction(ctrl, (e as CustomEvent).detail)}
          ></sonos-queue-list>
        </div>
        <div
          class="play-menu-overlay"
          ?hidden=${ctrl.playMenuItemIndex === null}
          @click=${() => dismissPlayMenu(ctrl)}
          @wheel=${(e: Event) => e.preventDefault()}
          @touchmove=${(e: Event) => e.preventDefault()}
        >
          <sonos-play-menu
            .hasSelection=${true}
            .inline=${true}
            @play-menu-action=${(e: Event) => handlePlayMenuAction(ctrl, (e as CustomEvent).detail)}
            @play-menu-close=${() => dismissPlayMenu(ctrl)}
          ></sonos-play-menu>
        </div>
      </div>
    `;
  }

  static get styles() {
    return [listStyle, ...queueStyles];
  }
}
