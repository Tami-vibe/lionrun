"use client";
import {useMemo, useState} from 'react';
import {ACCEPT, assetStore, LIMITS, type Asset} from './store';
import {publishAsset, useMediaLibrary} from './library';
import {isAssetUnused, libraryBytes, usageLabels, type MediaUsageIndex, type MediaUse} from './usage';

function AssetThumb({kind, url}: {kind: Asset['kind']; url: string}) {
  if (kind === 'image' && url) return <span className="asset-thumb" aria-hidden="true"><img src={url} alt="" /></span>;
  if (kind === 'video' && url) return <span className="asset-thumb is-video" aria-hidden="true"><video src={url} muted playsInline preload="metadata" /></span>;
  return <span className="asset-thumb is-empty" aria-hidden="true" />;
}

type Filter = 'all' | 'used' | 'unused';

export function MediaLibraryBoard({
  usage,
  onJump
}: {
  usage: MediaUsageIndex;
  onJump?: (use: MediaUse) => void;
}) {
  const {assets, resolve, reload, error} = useMediaLibrary();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const usedBytes = libraryBytes(assets);
  const ratio = Math.min(1, usedBytes / LIMITS.total);
  const warn = ratio >= 0.8;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets.filter(asset => {
      if (needle && !asset.name.toLowerCase().includes(needle)) return false;
      const unused = isAssetUnused(usage, asset.id);
      if (filter === 'used') return !unused;
      if (filter === 'unused') return unused;
      return true;
    });
  }, [assets, filter, query, usage]);

  async function remove(asset: Asset) {
    if (!isAssetUnused(usage, asset.id)) return;
    if (!window.confirm(`Delete ${asset.name} from this browser? This cannot be undone.`)) return;
    setBusy(true);
    setNotice('');
    try {
      await assetStore('delete', asset.id);
      await reload();
      setNotice('Unused file deleted.');
    } catch (reason) {
      setNotice(String(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="media-library-board" aria-label="Media library">
      <p className="helper-text">Files saved in this browser. Pick them from any section. Delete only unused files.</p>
      {(error || notice) && <p role="status" className="helper-text">{error || notice}</p>}
      <div className="library-quota" data-warn={warn || undefined} aria-label="Library storage">
        <div className="library-quota-bar"><span style={{width: `${Math.round(ratio * 100)}%`}} /></div>
        <p className="helper-text">{(usedBytes / 1_000_000).toFixed(1)} MB of {(LIMITS.total / 1_000_000).toFixed(0)} MB used{warn ? ' — free unused files before uploading more.' : '.'}</p>
      </div>
      <label className="field"><span>Search library</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="library-filters" role="group" aria-label="Library filter">
        {([
          ['all', 'All'],
          ['used', 'Used'],
          ['unused', 'Unused']
        ] as const).map(([id, label]) => (
          <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      <label className="upload-media">{busy ? 'Saving…' : 'Upload image or video'}
        <input disabled={busy} type="file" accept={ACCEPT} onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          setBusy(true);
          setNotice('');
          void publishAsset(file, reload)
            .then(() => setNotice('Saved to your media library.'))
            .catch(reason => setNotice(String(reason)))
            .finally(() => setBusy(false));
        }} />
      </label>
      <div className="asset-list library-board-grid" role="list" aria-label="Library files">
        {rows.map(asset => {
          const unused = isAssetUnused(usage, asset.id);
          const labels = usageLabels(usage, asset.id);
          const first = usage.get(asset.id)?.[0];
          return (
            <article key={asset.id} className="library-card" role="listitem">
              <AssetThumb kind={asset.kind} url={resolve(`media:${asset.id}`)} />
              <div className="asset-meta">
                <strong>{asset.name}</strong>
                <small>{asset.kind} · {(asset.size / 1_000_000).toFixed(2)} MB</small>
                {labels.length > 0 ? (
                  <ul className="library-uses">
                    {labels.slice(0, 3).map(label => <li key={label}>{label}</li>)}
                    {labels.length > 3 && <li>+{labels.length - 3} more</li>}
                  </ul>
                ) : (
                  <p className="helper-text">Not used on any page</p>
                )}
              </div>
              <div className="library-card-actions">
                {first && onJump && (
                  <button type="button" className="subtle-action" onClick={() => onJump(first)}>Open use</button>
                )}
                <button
                  type="button"
                  className="subtle-action"
                  disabled={busy || !unused}
                  title={unused ? 'Delete from this browser' : 'Remove from every page first'}
                  onClick={() => void remove(asset)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
        {!rows.length && <p className="helper-text">No matching files in this browser’s library.</p>}
      </div>
    </section>
  );
}
