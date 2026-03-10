import { useState, useMemo, useCallback } from 'react';
import type { ParsedScript } from './types';
import { parseScript } from './utils/parseScript';
import { assignColors } from './utils/assignColors';
import { useStreamingEngine } from './hooks/useStreamingEngine';
import { useKeyboardHandler } from './hooks/useKeyboardHandler';
import { FileUpload } from './components/FileUpload';
import { CharacterSelector } from './components/CharacterSelector';
import { StreamingTextArea } from './components/StreamingTextArea';
import { ReplicaList } from './components/ReplicaList';
import { ControlBar } from './components/ControlBar';
import { RedFlash } from './components/RedFlash';
import './App.css';

function App() {
  const [script, setScript] = useState<ParsedScript | null>(null);
  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const colorMap = useMemo(
    () => (script ? assignColors(script.characters) : {}),
    [script]
  );

  const replicas = script?.replicas ?? [];

  const { state, actions } = useStreamingEngine(replicas, selectedChars);

  const showFlash =
    state.phase === 'wrong_press_flash' || state.phase === 'missed_cue_flash';

  const keyboardActive =
    state.phase === 'streaming' ||
    state.phase === 'pause_between' ||
    state.phase === 'waiting_for_space' ||
    state.phase === 'user_reciting' ||
    state.phase === 'user_reveal';

  useKeyboardHandler(actions.spacePressed, keyboardActive);

  const handleFileLoaded = useCallback((text: string) => {
    const parsed = parseScript(text);
    setScript(parsed);
    setSelectedChars(new Set());
    setStarted(false);
    actions.reset();
  }, [actions]);

  const handleToggleChar = useCallback((char: string) => {
    setSelectedChars((prev) => {
      const next = new Set(prev);
      if (next.has(char)) next.delete(char);
      else next.add(char);
      return next;
    });
  }, []);

  const handleStart = useCallback(() => {
    if (selectedChars.size === 0) return;
    setStarted(true);
    actions.start();
  }, [selectedChars, actions]);

  const handleNewFile = useCallback(() => {
    setScript(null);
    setSelectedChars(new Set());
    setStarted(false);
    actions.reset();
  }, [actions]);

  // Not loaded
  if (!script) {
    return (
      <div className="app app--upload">
        <h1>Вивчаємо текст п'єси</h1>
        <FileUpload onFileLoaded={handleFileLoaded} />
      </div>
    );
  }

  // Character selection
  if (!started) {
    return (
      <div className="app app--setup">
        <h1>Вивчаємо текст п'єси</h1>
        <CharacterSelector
          characters={script.characters}
          colorMap={colorMap}
          selected={selectedChars}
          onToggle={handleToggleChar}
        />
        <div className="setup-actions">
          <button
            className="btn btn--primary"
            disabled={selectedChars.size === 0}
            onClick={handleStart}
          >
            Почати
          </button>
          <button className="btn btn--secondary" onClick={handleNewFile}>
            Інший файл
          </button>
        </div>
      </div>
    );
  }

  // Main player
  return (
    <div className="app app--player">
      <RedFlash visible={showFlash} />

      <header className="app__header">
        <h1>Вивчаємо текст п'єси</h1>
        <div className="app__header-actions">
          <button
            className="btn btn--small"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? 'Сховати список' : 'Список реплік'}
          </button>
          <button className="btn btn--small btn--secondary" onClick={handleNewFile}>
            Новий файл
          </button>
        </div>
      </header>

      <div className="app__body">
        {sidebarOpen && (
          <aside className="app__sidebar">
            <ReplicaList
              replicas={replicas}
              colorMap={colorMap}
              currentIndex={state.currentReplicaIndex}
              onSeek={actions.seek}
            />
          </aside>
        )}

        <main className="app__main">
          <StreamingTextArea
            replicas={replicas}
            currentReplicaIndex={state.currentReplicaIndex}
            currentCharIndex={state.currentCharIndex}
            phase={state.phase}
            colorMap={colorMap}
            userCharacters={selectedChars}
            hintWordsN={state.hintWordsN}
          />
        </main>
      </div>

      <footer className="app__footer">
        <ControlBar
          speedMs={state.speedMs}
          onSpeedChange={actions.setSpeed}
          hintWords={state.hintWordsN}
          onHintChange={actions.setHintWords}
          correct={state.score.correct}
          missed={state.score.missed}
          currentIndex={state.currentReplicaIndex}
          totalReplicas={replicas.length}
          onSeek={actions.seek}
          onRewind={() => actions.seek(state.currentReplicaIndex - 1)}
          onForward={() => actions.seek(state.currentReplicaIndex + 1)}
        />
      </footer>
    </div>
  );
}

export default App;
