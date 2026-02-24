import { LibraryFilter, SearchConfig, SearchExecutionState, SearchHost, SearchMediaType } from './search.types';
import { performMassSearch, saveSearchState } from './search-utils';

export class SearchService {
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor(private host: SearchHost) {}

  private updateHost(state: Partial<SearchExecutionState>) {
    Object.assign(this.host, state);
  }

  dispose() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  scheduleSearch(searchText: string, mediaTypes: Set<SearchMediaType>, libraryFilter: LibraryFilter, config: SearchConfig) {
    saveSearchState(mediaTypes, searchText, libraryFilter);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    const { autoSearchMinChars = 2, autoSearchDebounceMs = 1000 } = config;
    if (searchText.trim().length < autoSearchMinChars) {
      this.updateHost({ results: [], loading: false });
      return;
    }
    this.updateHost({ loading: true, results: [] });
    this.debounceTimer = setTimeout(() => this.execute(searchText, mediaTypes, libraryFilter, config), autoSearchDebounceMs);
  }

  async execute(searchText: string, mediaTypes: Set<SearchMediaType>, libraryFilter: LibraryFilter, config: SearchConfig) {
    if (!searchText.trim() || !this.host.massConfigEntryId) {
      return;
    }
    this.updateHost({ loading: true, error: null });
    const { searchLimit = 50 } = config;
    try {
      const results = await performMassSearch(this.host.musicAssistantService, this.host.massConfigEntryId, searchText, mediaTypes, libraryFilter, searchLimit);
      this.updateHost({ results });
    } catch (e) {
      this.updateHost({ error: `Search failed: ${e instanceof Error ? e.message : 'Unknown error'}`, results: [] });
    } finally {
      this.updateHost({ loading: false });
    }
  }

  clear(mediaTypes: Set<SearchMediaType>, libraryFilter: LibraryFilter) {
    this.dispose();
    this.debounceTimer = undefined;
    this.updateHost({ results: [], loading: false, error: null });
    saveSearchState(mediaTypes, '', libraryFilter);
  }
}
