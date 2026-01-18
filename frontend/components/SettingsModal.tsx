import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Mic,
  Volume2,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  User,
  Sparkles,
} from "lucide-react";
import api from "../src/api";
import type { VoiceProfile, AudioAnalysis, CharacterData } from "../src/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceChange?: (voiceName: string) => void;
  onCharacterChange?: (character: CharacterData) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onVoiceChange,
  onCharacterChange,
}) => {
  const [activeTab, setActiveTab] = useState<"voice" | "upload" | "character" | "system">(
    "voice",
  );
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(
    null,
  );
  const [llmLoaded, setLlmLoaded] = useState(false);

  // Upload form state
  const [voiceName, setVoiceName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Character state
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<string>("default");
  const [characterError, setCharacterError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadVoices();
      loadCharacters();
      checkHealth();
    }
  }, [isOpen]);

  const loadVoices = async () => {
    try {
      setLoading(true);
      const res = await api.listVoices();
      setVoices(res.voices);
      setActiveVoice(res.active_voice || "default");
    } catch (err) {
      console.error("Failed to load voices:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCharacters = async () => {
    try {
      const res = await api.listCharacters();
      setCharacters(res.characters);
      setActiveCharacter(res.active_character);
    } catch (err) {
      console.error("Failed to load characters:", err);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await api.health();
      setLlmLoaded(res.llm_loaded);
    } catch (err) {
      console.error("Health check failed:", err);
    }
  };

  const handleCharacterSelect = async (character: CharacterData) => {
    try {
      setLoading(true);
      setCharacterError(null);
      await api.setActiveCharacter(character.id);
      setActiveCharacter(character.id);
      onCharacterChange?.(character);
    } catch (err: unknown) {
      // Extract error message from backend
      let errorMessage = "Gagal mengubah karakter";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          errorMessage = parsed.detail || err.message;
        } catch {
          errorMessage = err.message;
        }
      }
      // Try to get detail from fetch error response
      if (typeof err === 'object' && err !== null && 'detail' in err) {
        errorMessage = (err as {detail: string}).detail;
      }
      setCharacterError(errorMessage);
      console.error("Character error:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSelect = async (voiceName: string) => {
    try {
      setLoading(true);
      if (voiceName === "default") {
        // Use default pyttsx3 voice
        setActiveVoice("default");
        onVoiceChange?.("default");
      } else {
        await api.setActiveVoice(voiceName);
        setActiveVoice(voiceName);
        onVoiceChange?.(voiceName);
      }
    } catch (err) {
      console.error("Failed to set voice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "audio/wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/flac",
      "audio/ogg",
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(wav|mp3|flac|ogg|m4a)$/i)
    ) {
      setUploadStatus("error");
      setUploadMessage(
        "Format tidak didukung. Gunakan WAV, MP3, FLAC, atau OGG.",
      );
      return;
    }

    setSelectedFile(file);
    setUploadStatus("idle");
    setUploadMessage("");

    // Auto-generate name from filename if empty
    if (!voiceName) {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setVoiceName(baseName);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("error");
      setUploadMessage("Pilih file audio terlebih dahulu");
      return;
    }

    if (!voiceName.trim()) {
      setUploadStatus("error");
      setUploadMessage("Masukkan nama untuk voice profile");
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("Menganalisis audio...");

    try {
      const analysis = await api.analyzeAudio(selectedFile);
      setAudioAnalysis(analysis);

      setUploadMessage("Memproses audio...");
      setUploadStatus("processing");

      // Create FormData with custom name
      const formData = new FormData();
      formData.append("file", selectedFile);

      const result = await api.uploadVoice(selectedFile);

      if (result.status === "success") {
        setUploadStatus("success");
        setUploadMessage(`Voice "${voiceName}" berhasil ditambahkan!`);
        loadVoices();

        // Reset form
        setVoiceName("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setUploadStatus("error");
        setUploadMessage(result.message || "Gagal memproses audio");
      }
    } catch (err: unknown) {
      setUploadStatus("error");
      setUploadMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan",
      );
    }
  };

  const handleLoadModel = async () => {
    try {
      setLoading(true);
      await api.loadModel();
      setLlmLoaded(true);
    } catch (err) {
      console.error("Failed to load model:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSession = async () => {
    try {
      await api.clearSession();
    } catch (err) {
      console.error("Failed to clear session:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-slate-800 overflow-x-auto">
          {[
            { id: "voice", label: "Voice", icon: Volume2 },
            { id: "upload", label: "Upload", icon: Upload },
            { id: "character", label: "Character", icon: Sparkles },
            { id: "system", label: "System", icon: Mic },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "voice" | "upload" | "character" | "system")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Voice Profiles Tab */}
          {activeTab === "voice" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Pilih voice profile untuk TTS output. Voice profile dari folder
                data/ akan menggunakan suara yang di-clone.
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {/* Default Voice */}
                  <button
                    onClick={() => handleVoiceSelect("default")}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      activeVoice === "default"
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activeVoice === "default"
                            ? "bg-indigo-600"
                            : "bg-slate-700"
                        }`}
                      >
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Default (Male)</p>
                        <p className="text-xs text-slate-500">
                          System pyttsx3 voice
                        </p>
                      </div>
                    </div>
                    {activeVoice === "default" && (
                      <Check className="w-5 h-5 text-indigo-400" />
                    )}
                  </button>

                  {/* Voice profiles from data/ */}
                  {voices.length === 0 ? (
                    <div className="text-center py-4 text-slate-500">
                      <p className="text-xs">
                        Belum ada voice profile custom. Upload di tab "Upload
                        Voice".
                      </p>
                    </div>
                  ) : (
                    voices.map((voice) => (
                      <button
                        key={voice.name}
                        onClick={() => handleVoiceSelect(voice.name)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          activeVoice === voice.name
                            ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                            : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              activeVoice === voice.name
                                ? "bg-indigo-600"
                                : "bg-slate-700"
                            }`}
                          >
                            <Volume2 className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{voice.name}</p>
                            <p className="text-xs text-slate-500">
                              {voice.sample_rate}Hz •{" "}
                              {voice.description || "Custom voice"}
                            </p>
                          </div>
                        </div>
                        {activeVoice === voice.name && (
                          <Check className="w-5 h-5 text-indigo-400" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-4">
                  Upload audio untuk membuat voice profile baru. Audio akan
                  diproses secara otomatis (noise reduction, volume
                  normalization).
                </p>
              </div>

              {/* Voice Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Nama Voice Profile
                </label>
                <input
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="Contoh: Luna, Sarah, Custom Voice..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  File Audio
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".wav,.mp3,.flac,.ogg,.m4a"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    uploadStatus === "uploading" ||
                    uploadStatus === "processing"
                  }
                  className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all ${
                    selectedFile
                      ? "border-emerald-500/50 bg-emerald-600/10"
                      : uploadStatus === "uploading" ||
                          uploadStatus === "processing"
                        ? "border-indigo-500/50 bg-indigo-600/10"
                        : "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50"
                  }`}
                >
                  {uploadStatus === "uploading" ||
                  uploadStatus === "processing" ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="text-sm text-indigo-400">{uploadMessage}</p>
                    </div>
                  ) : selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Check className="w-8 h-8 text-emerald-500" />
                      <p className="text-sm text-emerald-400">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Klik untuk ganti file
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-500" />
                      <p className="text-sm text-slate-400">
                        Klik untuk pilih file audio
                      </p>
                      <p className="text-xs text-slate-600">
                        WAV, MP3, FLAC, OGG (min 6 detik)
                      </p>
                    </div>
                  )}
                </button>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={
                  !selectedFile ||
                  !voiceName.trim() ||
                  uploadStatus === "uploading" ||
                  uploadStatus === "processing"
                }
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors"
              >
                {uploadStatus === "uploading" || uploadStatus === "processing"
                  ? "Processing..."
                  : "Upload & Process"}
              </button>

              {/* Status Message */}
              {uploadStatus !== "idle" &&
                uploadStatus !== "uploading" &&
                uploadStatus !== "processing" && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-xl ${
                      uploadStatus === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-rose-500/10 border border-rose-500/20"
                    }`}
                  >
                    {uploadStatus === "success" ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                    <p
                      className={`text-sm ${uploadStatus === "success" ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {uploadMessage}
                    </p>
                  </div>
                )}

              {/* Audio Analysis */}
              {audioAnalysis && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h4 className="text-sm font-medium text-white mb-3">
                    Audio Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Duration:</span>
                      <span className="text-white ml-2">
                        {audioAnalysis.duration.toFixed(1)}s
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Sample Rate:</span>
                      <span className="text-white ml-2">
                        {audioAnalysis.sample_rate}Hz
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Channels:</span>
                      <span className="text-white ml-2">
                        {audioAnalysis.channels}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Quality:</span>
                      <span
                        className={`ml-2 ${
                          audioAnalysis.quality === "excellent" ||
                          audioAnalysis.quality === "good"
                            ? "text-emerald-400"
                            : audioAnalysis.quality === "acceptable"
                              ? "text-yellow-400"
                              : "text-rose-400"
                        }`}
                      >
                        {audioAnalysis.quality}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Character Tab */}
          {activeTab === "character" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Pilih karakter VTuber untuk tampilan. Karakter dari folder data/vtuber_chara.
              </p>

              {/* Error Notification */}
              {characterError && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-rose-400">Error</p>
                    <p className="text-xs text-rose-300/80 mt-0.5">{characterError}</p>
                  </div>
                  <button 
                    onClick={() => setCharacterError(null)}
                    className="ml-auto p-1 hover:bg-rose-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => handleCharacterSelect(char)}
                      className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                        activeCharacter === char.id
                          ? "bg-indigo-600/20 border-indigo-500/50"
                          : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-xl flex items-center justify-center mb-2 overflow-hidden ${
                          activeCharacter === char.id
                            ? "bg-indigo-600"
                            : "bg-slate-700"
                        }`}
                      >
                        {char.thumbnail ? (
                          <img
                            src={api.getCharacterThumbnailUrl(char.thumbnail)}
                            alt={char.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Sparkles className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-white text-center">
                        {char.name}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase">
                        {char.type}
                      </p>
                      {activeCharacter === char.id && (
                        <Check className="w-4 h-4 text-indigo-400 mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              {/* LLM Status */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">LLM Model</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Qwen 2.5 1.5B Instruct
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${llmLoaded ? "text-emerald-400" : "text-slate-500"}`}
                    >
                      {llmLoaded ? "Loaded" : "Not loaded"}
                    </span>
                    {!llmLoaded && (
                      <button
                        onClick={handleLoadModel}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Load Model"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Clear Session */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">Clear Session</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Reset conversation history
                    </p>
                  </div>
                  <button
                    onClick={handleClearSession}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600/20 text-rose-400 text-sm font-medium hover:bg-rose-600/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>

              {/* API Status */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <h4 className="font-medium text-white mb-3">API Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-400">localhost:8000</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
