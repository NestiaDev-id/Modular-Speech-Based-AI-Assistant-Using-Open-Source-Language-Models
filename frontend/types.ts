
// Voice profiles are now dynamic - loaded from API
// Default voice is the system pyttsx3 voice (male)
export const DEFAULT_VOICE = "default";

export interface TranscriptionEntry {
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface VTuberState {
  isTalking: boolean;
  isBlinking: boolean;
  isThinking: boolean;
  expression: 'happy' | 'neutral' | 'surprised' | 'talking';
}

export interface PipelineState {
  input: 'idle' | 'active';
  uplink: 'idle' | 'transmitting';
  processing: 'idle' | 'thinking';
  downlink: 'idle' | 'receiving';
  output: 'idle' | 'playing';
}

// Voice profile from API
export interface VoiceProfile {
  name: string;
  audio_path: string;
  sample_rate: number;
  description: string;
}
