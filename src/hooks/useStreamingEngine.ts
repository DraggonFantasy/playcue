import { useReducer, useEffect, useRef, useCallback } from 'react';
import type { Replica, StreamState } from '../types';
import {
  DEFAULT_SPEED_MS,
  DEFAULT_PAUSE_BETWEEN_MS,
  FLASH_DURATION_MS,
  MISSED_CUE_TIMEOUT_MS,
  DEFAULT_HINT_WORDS,
} from '../constants';

type Action =
  | { type: 'TICK' }
  | { type: 'SPACE_PRESSED' }
  | { type: 'FLASH_DONE' }
  | { type: 'PAUSE_DONE' }
  | { type: 'MISSED_CUE' }
  | { type: 'SET_SPEED'; speedMs: number }
  | { type: 'SET_HINT_WORDS'; n: number }
  | { type: 'SEEK'; index: number }
  | { type: 'START' }
  | { type: 'RESET' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESTORE'; index: number; speedMs: number; hintWordsN: number; score: { correct: number; missed: number } };

interface EngineContext {
  replicas: Replica[];
  userCharacters: Set<string>;
}

function isUserReplica(ctx: EngineContext, index: number): boolean {
  if (index >= ctx.replicas.length) return false;
  return ctx.userCharacters.has(ctx.replicas[index].character);
}

function createReducer(ctx: EngineContext) {
  return function reducer(state: StreamState, action: Action): StreamState {
    switch (action.type) {
      case 'START':
        if (ctx.replicas.length === 0) return { ...state, phase: 'finished' };
        // If starting and first replica is user's, go to waiting_for_space
        if (isUserReplica(ctx, state.currentReplicaIndex)) {
          return { ...state, phase: 'waiting_for_space', currentCharIndex: 0 };
        }
        return { ...state, phase: 'streaming', currentCharIndex: 0 };

      case 'TICK': {
        if (state.phase !== 'streaming') return state;
        const replica = ctx.replicas[state.currentReplicaIndex];
        if (!replica) return { ...state, phase: 'finished' };

        const nextCharIndex = state.currentCharIndex + 1;
        if (nextCharIndex <= replica.text.length) {
          return { ...state, currentCharIndex: nextCharIndex };
        }

        // Current replica finished streaming, move to pause
        return { ...state, phase: 'pause_between' };
      }

      case 'PAUSE_DONE': {
        if (state.phase !== 'pause_between') return state;
        const nextIndex = state.currentReplicaIndex + 1;
        if (nextIndex >= ctx.replicas.length) {
          return { ...state, phase: 'finished' };
        }

        if (isUserReplica(ctx, nextIndex)) {
          return {
            ...state,
            phase: 'waiting_for_space',
            currentReplicaIndex: nextIndex,
            currentCharIndex: 0,
          };
        }

        return {
          ...state,
          phase: 'streaming',
          currentReplicaIndex: nextIndex,
          currentCharIndex: 0,
        };
      }

      case 'MISSED_CUE': {
        if (state.phase !== 'waiting_for_space') return state;
        return {
          ...state,
          phase: 'missed_cue_flash',
          score: { ...state.score, missed: state.score.missed + 1 },
        };
      }

      case 'SPACE_PRESSED': {
        switch (state.phase) {
          case 'waiting_for_space':
            return {
              ...state,
              phase: 'user_reciting',
              score: { ...state.score, correct: state.score.correct + 1 },
            };

          case 'user_reciting':
            return { ...state, phase: 'user_reveal' };

          case 'user_reveal': {
            const nextIndex = state.currentReplicaIndex + 1;
            if (nextIndex >= ctx.replicas.length) {
              return { ...state, phase: 'finished' };
            }
            if (isUserReplica(ctx, nextIndex)) {
              return {
                ...state,
                phase: 'waiting_for_space',
                currentReplicaIndex: nextIndex,
                currentCharIndex: 0,
              };
            }
            return {
              ...state,
              phase: 'streaming',
              currentReplicaIndex: nextIndex,
              currentCharIndex: 0,
            };
          }

          case 'streaming':
          case 'pause_between':
            // Wrong press — next is not user's character
            return { ...state, phase: 'wrong_press_flash' };

          default:
            return state;
        }
      }

      case 'FLASH_DONE': {
        if (state.phase === 'wrong_press_flash') {
          // Resume streaming from where we were
          const replica = ctx.replicas[state.currentReplicaIndex];
          if (state.currentCharIndex >= (replica?.text.length ?? 0)) {
            // Was in pause_between when wrong press happened
            return { ...state, phase: 'pause_between' };
          }
          return { ...state, phase: 'streaming' };
        }
        if (state.phase === 'missed_cue_flash') {
          // Stream user's replica as if it's someone else's
          return { ...state, phase: 'streaming', currentCharIndex: 0 };
        }
        return state;
      }

      case 'SET_SPEED':
        return { ...state, speedMs: action.speedMs };

      case 'SET_HINT_WORDS':
        return { ...state, hintWordsN: action.n };

      case 'SEEK': {
        const idx = Math.max(0, Math.min(action.index, ctx.replicas.length - 1));
        if (isUserReplica(ctx, idx)) {
          return {
            ...state,
            phase: 'waiting_for_space',
            currentReplicaIndex: idx,
            currentCharIndex: 0,
          };
        }
        return {
          ...state,
          phase: 'streaming',
          currentReplicaIndex: idx,
          currentCharIndex: 0,
        };
      }

      case 'RESTORE': {
        const idx = Math.max(0, Math.min(action.index, ctx.replicas.length - 1));
        const phase = isUserReplica(ctx, idx) ? 'waiting_for_space' as const : 'streaming' as const;
        return {
          ...createInitialState(),
          phase,
          paused: true,
          currentReplicaIndex: idx,
          currentCharIndex: 0,
          speedMs: action.speedMs,
          hintWordsN: action.hintWordsN,
          score: action.score,
        };
      }

      case 'TOGGLE_PAUSE':
        // Only allow pause during active phases
        if (['streaming', 'pause_between', 'waiting_for_space'].includes(state.phase)) {
          return { ...state, paused: !state.paused };
        }
        return state;

      case 'RESET':
        return createInitialState();

      default:
        return state;
    }
  };
}

function createInitialState(): StreamState {
  return {
    phase: 'idle',
    paused: false,
    currentReplicaIndex: 0,
    currentCharIndex: 0,
    score: { correct: 0, missed: 0 },
    hintWordsN: DEFAULT_HINT_WORDS,
    speedMs: DEFAULT_SPEED_MS,
    pauseBetweenMs: DEFAULT_PAUSE_BETWEEN_MS,
  };
}

export function useStreamingEngine(
  replicas: Replica[],
  userCharacters: Set<string>
) {
  const ctxRef = useRef<EngineContext>({ replicas, userCharacters });
  ctxRef.current = { replicas, userCharacters };

  const reducerRef = useRef(createReducer(ctxRef.current));
  reducerRef.current = createReducer(ctxRef.current);

  const [state, dispatch] = useReducer(
    (s: StreamState, a: Action) => reducerRef.current(s, a),
    undefined,
    createInitialState
  );

  const tickTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);
  const pauseTimer = useRef<number | null>(null);
  const missedCueTimer = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    if (tickTimer.current !== null) {
      clearTimeout(tickTimer.current);
      tickTimer.current = null;
    }
    if (flashTimer.current !== null) {
      clearTimeout(flashTimer.current);
      flashTimer.current = null;
    }
    if (pauseTimer.current !== null) {
      clearTimeout(pauseTimer.current);
      pauseTimer.current = null;
    }
    if (missedCueTimer.current !== null) {
      clearTimeout(missedCueTimer.current);
      missedCueTimer.current = null;
    }
  }, []);

  // Streaming tick
  useEffect(() => {
    if (state.phase === 'streaming' && !state.paused) {
      tickTimer.current = window.setTimeout(() => {
        dispatch({ type: 'TICK' });
      }, state.speedMs);
      return () => {
        if (tickTimer.current !== null) clearTimeout(tickTimer.current);
      };
    }
  }, [state.phase, state.paused, state.currentCharIndex, state.speedMs]);

  // Pause between replicas
  useEffect(() => {
    if (state.phase === 'pause_between' && !state.paused) {
      pauseTimer.current = window.setTimeout(() => {
        dispatch({ type: 'PAUSE_DONE' });
      }, state.pauseBetweenMs);
      return () => {
        if (pauseTimer.current !== null) clearTimeout(pauseTimer.current);
      };
    }
  }, [state.phase, state.paused, state.pauseBetweenMs, state.currentReplicaIndex]);

  // Flash timers
  useEffect(() => {
    if ((state.phase === 'wrong_press_flash' || state.phase === 'missed_cue_flash') && !state.paused) {
      flashTimer.current = window.setTimeout(() => {
        dispatch({ type: 'FLASH_DONE' });
      }, FLASH_DURATION_MS);
      return () => {
        if (flashTimer.current !== null) clearTimeout(flashTimer.current);
      };
    }
  }, [state.phase, state.paused]);

  // Missed cue timer
  useEffect(() => {
    if (state.phase === 'waiting_for_space' && !state.paused) {
      missedCueTimer.current = window.setTimeout(() => {
        dispatch({ type: 'MISSED_CUE' });
      }, MISSED_CUE_TIMEOUT_MS);
      return () => {
        if (missedCueTimer.current !== null) clearTimeout(missedCueTimer.current);
      };
    }
  }, [state.phase, state.paused, state.currentReplicaIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return clearAllTimers;
  }, [clearAllTimers]);

  const actions = {
    start: () => dispatch({ type: 'START' }),
    togglePause: () => dispatch({ type: 'TOGGLE_PAUSE' }),
    spacePressed: () => dispatch({ type: 'SPACE_PRESSED' }),
    setSpeed: (ms: number) => dispatch({ type: 'SET_SPEED', speedMs: ms }),
    setHintWords: (n: number) => dispatch({ type: 'SET_HINT_WORDS', n }),
    seek: (index: number) => dispatch({ type: 'SEEK', index }),
    restore: (index: number, speedMs: number, hintWordsN: number, score: { correct: number; missed: number }) => {
      clearAllTimers();
      dispatch({ type: 'RESTORE', index, speedMs, hintWordsN, score });
    },
    reset: () => {
      clearAllTimers();
      dispatch({ type: 'RESET' });
    },
  };

  return { state, actions };
}
