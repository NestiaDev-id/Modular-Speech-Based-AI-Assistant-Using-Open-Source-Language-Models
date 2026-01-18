/**
 * API Service - Connects frontend to FastAPI backend
 */

const API_BASE_URL = 'http://localhost:8000';

// Types
export interface ChatRequest {
  message: string;
  session_id?: string;
  use_voice_output?: boolean;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  audio_path?: string;
  response_time: number;
}

export interface VoiceProfile {
  name: string;
  audio_path: string;
  sample_rate: number;
  description: string;
}

export interface VoiceListResponse {
  voices: VoiceProfile[];
  active_voice?: string;
}

export interface HealthResponse {
  status: string;
  llm_loaded: boolean;
  voice_cloning_active: boolean;
  active_voice?: string;
}

export interface AudioAnalysis {
  filepath: string;
  sample_rate: number;
  duration: number;
  channels: number;
  rms_level: number;
  peak_level: number;
  noise_floor: number;
  quality: string;
}

export interface PreprocessResponse {
  success: boolean;
  output_path?: string;
  original_analysis?: AudioAnalysis;
  processed_analysis?: AudioAnalysis;
  message: string;
}

export interface SessionInfo {
  session_id: string;
  turn_count: number;
}

// API Functions
export const api = {
  // Health check
  async health(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/chat/health`);
    return res.json();
  },

  // Load LLM model
  async loadModel(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE_URL}/chat/load-model`, { method: 'POST' });
    return res.json();
  },

  // Send chat message
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE_URL}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to send message');
    }
    return res.json();
  },

  // TTS synthesize
  async synthesize(text: string, saveAudio: boolean = true): Promise<{ success: boolean; audio_path?: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/tts/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, save_audio: saveAudio }),
    });
    return res.json();
  },

  // Get audio file URL
  getAudioUrl(filename: string): string {
    return `${API_BASE_URL}/audio/${filename}`;
  },

  // List voices
  async listVoices(): Promise<VoiceListResponse> {
    const res = await fetch(`${API_BASE_URL}/voice/list`);
    return res.json();
  },

  // Set active voice
  async setActiveVoice(voiceName: string): Promise<{ status: string; active_voice: string }> {
    const res = await fetch(`${API_BASE_URL}/voice/set-active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voice_name: voiceName }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to set voice');
    }
    return res.json();
  },

  // Upload voice sample
  async uploadVoice(file: File): Promise<{ status: string; voice_name?: string; processed_path?: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/voice/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  // Analyze audio
  async analyzeAudio(file: File): Promise<AudioAnalysis> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/preprocess/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to analyze audio');
    }
    return res.json();
  },

  // Preprocess audio
  async preprocessAudio(file: File): Promise<PreprocessResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/preprocess/process`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  // Validate for cloning
  async validateForCloning(file: File): Promise<{ valid: boolean; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/preprocess/validate`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  // Session info
  async getSession(): Promise<SessionInfo> {
    const res = await fetch(`${API_BASE_URL}/session/current`);
    return res.json();
  },

  // Clear session
  async clearSession(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE_URL}/session/clear`, { method: 'POST' });
    return res.json();
  },

  // ==================
  // Character API
  // ==================

  // List characters
  async listCharacters(): Promise<CharacterListResponse> {
    const res = await fetch(`${API_BASE_URL}/character/list`);
    return res.json();
  },

  // Set active character
  async setActiveCharacter(characterId: string): Promise<{ status: string; active_character: string }> {
    const res = await fetch(`${API_BASE_URL}/character/set-active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: characterId }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Gagal mengubah karakter');
    }
    
    return res.json();
  },

  // Get character thumbnail URL
  getCharacterThumbnailUrl(path: string): string {
    return `${API_BASE_URL}${path}`;
  },
};

// Character types
export interface CharacterData {
  id: string;
  name: string;
  type: 'svg' | 'image' | 'live2d';
  thumbnail?: string | null;
  path?: string | null;
}

export interface CharacterListResponse {
  characters: CharacterData[];
  active_character: string;
}

export default api;
