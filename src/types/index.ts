export interface Replica {
  id: number;
  character: string;
  text: string;
}

export interface ParsedScript {
  replicas: Replica[];
  characters: string[];
}

export type StreamPhase =
  | 'idle'
  | 'streaming'
  | 'pause_between'
  | 'waiting_for_space'
  | 'user_reciting'
  | 'user_reveal'
  | 'wrong_press_flash'
  | 'missed_cue_flash'
  | 'finished';

export interface StreamState {
  phase: StreamPhase;
  paused: boolean;
  currentReplicaIndex: number;
  currentCharIndex: number;
  score: { correct: number; missed: number };
  hintWordsN: number;
  speedMs: number;
  pauseBetweenMs: number;
}

export interface CharacterColorMap {
  [character: string]: string;
}
