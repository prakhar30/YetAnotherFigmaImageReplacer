import React, { useState, useEffect, useCallback } from 'react';
import type {
  ImageFileData,
  LayerInfo,
  MatchPreview,
  MatchResult,
  PluginToUIMessage,
  UIToPluginMessage
} from '../plugin-src/types';
import FolderSelector from './components/FolderSelector';
import PreviewTable from './components/PreviewTable';
import ProgressBar from './components/ProgressBar';
import ErrorList from './components/ErrorList';

type AppState = 'select-folder' | 'previewing' | 'replacing' | 'complete';
type SearchScope = 'selection' | 'page' | 'document';

function App() {
  const [state, setState] = useState<AppState>('select-folder');
  const [scope, setScope] = useState<SearchScope>('selection');
  const [files, setFiles] = useState<ImageFileData[]>([]);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [preview, setPreview] = useState<MatchPreview | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, current: '' });
  const [results, setResults] = useState<MatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Send message to plugin
  const sendToPlugin = useCallback((message: UIToPluginMessage) => {
    parent.postMessage({ pluginMessage: message }, '*');
  }, []);

  // Handle messages from plugin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as PluginToUIMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'layers-found':
          setLayers(msg.layers);
          break;
        case 'match-preview':
          setPreview(msg.preview);
          setState('previewing');
          break;
        case 'replacement-progress':
          setProgress({
            completed: msg.completed,
            total: msg.total,
            current: msg.current
          });
          break;
        case 'replacement-complete':
          setResults(msg.results);
          setState('complete');
          break;
        case 'error':
          setError(msg.message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Request layers when scope changes
  useEffect(() => {
    sendToPlugin({ type: 'get-layers', scope });
  }, [scope, sendToPlugin]);

  // Handle folder selection
  const handleFilesSelected = useCallback((selectedFiles: ImageFileData[]) => {
    setFiles(selectedFiles);
    setError(null);
    sendToPlugin({ type: 'preview-matches', files: selectedFiles });
  }, [sendToPlugin]);

  // Execute replacement
  const handleExecute = useCallback(() => {
    if (!preview) return;

    const matchedIds = preview.matches.map(m => m.layerId);
    setState('replacing');
    sendToPlugin({
      type: 'execute-replacement',
      files,
      matchedLayerIds: matchedIds
    });
  }, [preview, files, sendToPlugin]);

  // Reset to start
  const handleReset = useCallback(() => {
    setState('select-folder');
    setFiles([]);
    setPreview(null);
    setProgress({ completed: 0, total: 0, current: '' });
    setResults([]);
    setError(null);
  }, []);

  // Cancel and close
  const handleCancel = useCallback(() => {
    sendToPlugin({ type: 'cancel' });
  }, [sendToPlugin]);

  return (
    <div className="app">
      <header>
        <h1>Bulk Image Replacer</h1>
        <p className="subtitle">Replace images by matching layer names to filenames</p>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {state === 'select-folder' && (
        <div className="section">
          <div className="scope-selector">
            <label>Search in:</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as SearchScope)}
            >
              <option value="selection">Selected layers only</option>
              <option value="page">Current page</option>
              <option value="document">Entire document</option>
            </select>
            <span className="layer-count">
              {layers.length} layer{layers.length !== 1 ? 's' : ''} found
            </span>
          </div>

          <FolderSelector onFilesSelected={handleFilesSelected} />
        </div>
      )}

      {state === 'previewing' && preview && (
        <div className="section">
          <PreviewTable preview={preview} />

          <div className="actions">
            <button className="secondary" onClick={handleReset}>
              Back
            </button>
            <button
              className="primary"
              onClick={handleExecute}
              disabled={preview.matches.length === 0}
            >
              Replace {preview.matches.length} image{preview.matches.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {state === 'replacing' && (
        <div className="section">
          <ProgressBar
            completed={progress.completed}
            total={progress.total}
            current={progress.current}
          />
        </div>
      )}

      {state === 'complete' && (
        <div className="section">
          <div className="complete-summary">
            <h2>Replacement Complete</h2>
            <p>
              {results.filter(r => r.status === 'replaced').length} of {results.length} images replaced successfully
            </p>
          </div>

          <ErrorList
            errors={results.filter(r => r.status === 'error')}
          />

          <div className="actions">
            <button className="secondary" onClick={handleReset}>
              Replace More
            </button>
            <button className="primary" onClick={handleCancel}>
              Done
            </button>
          </div>
        </div>
      )}

      <footer>
        <button className="text-button" onClick={handleCancel}>
          Cancel
        </button>
      </footer>
    </div>
  );
}

export default App;
