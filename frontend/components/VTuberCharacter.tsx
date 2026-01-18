import React, { useEffect, useState, useRef, useCallback } from "react";
import type { VTuberState } from "../types";

// Character types
export interface VTuberCharacterData {
  id: string;
  name: string;
  type: "svg" | "image" | "live2d";
  path?: string | null;
  thumbnail?: string | null;
}

// Default SVG character
export const DEFAULT_CHARACTER: VTuberCharacterData = {
  id: "default",
  name: "Luna (Default)",
  type: "svg",
};

interface VTuberCharacterProps {
  state: VTuberState;
  character?: VTuberCharacterData;
  apiBaseUrl?: string;
}

// Default SVG Character Component
const DefaultSVGCharacter: React.FC<{ state: VTuberState; blink: boolean }> = ({
  state,
  blink,
}) => (
  <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
    {/* Hair Back */}
    <path
      d="M40,100 Q40,40 100,40 Q160,40 160,100 L170,140 Q100,160 30,140 Z"
      fill="#4C1D95"
    />

    {/* Body */}
    <ellipse cx="100" cy="180" rx="60" ry="40" fill="#6D28D9" />
    <rect x="70" y="150" width="60" height="30" fill="#6D28D9" rx="10" />

    {/* Head Shape */}
    <path
      d="M55,100 Q55,50 100,50 Q145,50 145,100 Q145,145 100,145 Q55,145 55,100"
      fill="#FDE047"
    />

    {/* Blush */}
    <circle cx="75" cy="115" r="8" fill="#FCA5A5" opacity="0.4" />
    <circle cx="125" cy="115" r="8" fill="#FCA5A5" opacity="0.4" />

    {/* Eyes */}
    {blink ? (
      <>
        <line
          x1="70"
          y1="100"
          x2="90"
          y2="100"
          stroke="#1E1B4B"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="110"
          y1="100"
          x2="130"
          y2="100"
          stroke="#1E1B4B"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
        {/* Left Eye */}
        <circle cx="80" cy="100" r="10" fill="#1E1B4B" />
        <circle cx="83" cy="97" r="3" fill="white" />
        {/* Right Eye */}
        <circle cx="120" cy="100" r="10" fill="#1E1B4B" />
        <circle cx="123" cy="97" r="3" fill="white" />
      </>
    )}

    {/* Brows */}
    <path
      d="M70,85 Q80,80 90,85"
      fill="none"
      stroke="#1E1B4B"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M110,85 Q120,80 130,85"
      fill="none"
      stroke="#1E1B4B"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Mouth */}
    <g transform="translate(100, 125)">
      {state.isTalking ? (
        <ellipse
          cx="0"
          cy="0"
          rx="12"
          ry="8"
          fill="#881337"
          className="mouth-talking"
          style={{ transformOrigin: "center" }}
        />
      ) : (
        <path
          d="M-8,0 Q0,8 8,0"
          fill="none"
          stroke="#881337"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </g>

    {/* Hair Front */}
    <path
      d="M50,100 Q50,45 100,45 Q150,45 150,100 Q150,60 120,55 Q100,50 80,55 Q50,60 50,100"
      fill="#5B21B6"
    />
  </svg>
);

// Live2D Character Component using iframe approach (more reliable)
const Live2DCharacter: React.FC<{
  state: VTuberState;
  modelPath: string;
  apiBaseUrl: string;
}> = ({ state, modelPath, apiBaseUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  const initLive2D = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Clear previous content
      containerRef.current.innerHTML = "";

      // Create canvas element
      const canvas = document.createElement("canvas");
      canvas.id = "live2d-canvas";
      canvas.width = 400;
      canvas.height = 400;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      containerRef.current.appendChild(canvas);

      // Check if PIXI and Live2DModel are available globally (from CDN)
      const PIXI = (window as any).PIXI;
      const Live2DModel = PIXI?.live2d?.Live2DModel;

      if (!PIXI) {
        throw new Error("PIXI.js belum dimuat. Pastikan CDN script di index.html sudah benar.");
      }

      if (!Live2DModel) {
        throw new Error("Live2DModel tidak tersedia. Pastikan pixi-live2d-display sudah dimuat.");
      }

      // Create PIXI Application (v6 style for CDN)
      const app = new PIXI.Application({
        view: canvas,
        transparent: true,
        backgroundAlpha: 0,
        width: 400,
        height: 400,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // Full model URL
      const fullModelPath = `${apiBaseUrl}${modelPath}`;
      console.log("Loading Live2D model:", fullModelPath);

      // Load the model
      const model = await Live2DModel.from(fullModelPath, {
        autoInteract: true,
      });

      // Scale and position
      const scale = Math.min(
        app.screen.width / model.width,
        app.screen.height / model.height
      ) * 0.8;

      model.scale.set(scale);
      model.anchor.set(0.5, 0.5);
      model.x = app.screen.width / 2;
      model.y = app.screen.height / 2;

      app.stage.addChild(model);

      // Store model reference for animations
      (containerRef.current as any)._live2dModel = model;
      (containerRef.current as any)._pixiApp = app;

      setModelLoaded(true);
      setIsLoading(false);
      console.log("Live2D model loaded successfully!");

    } catch (err) {
      console.error("Live2D Load Error:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat Live2D model");
      setIsLoading(false);
    }
  }, [modelPath, apiBaseUrl]);

  useEffect(() => {
    initLive2D();

    return () => {
      if (containerRef.current) {
        const app = (containerRef.current as any)._pixiApp;
        if (app) {
          app.destroy(true);
        }
        containerRef.current.innerHTML = "";
      }
    };
  }, [initLive2D]);

  // Handle talking animation
  useEffect(() => {
    if (!containerRef.current || !modelLoaded) return;

    const model = (containerRef.current as any)._live2dModel;
    if (!model) return;

    let animId: number;

    const updateMouth = () => {
      try {
        const coreModel = model.internalModel?.coreModel;
        if (coreModel && typeof coreModel.setParameterValueById === "function") {
          if (state.isTalking) {
            const value = Math.sin(Date.now() / 80) * 0.4 + 0.4;
            coreModel.setParameterValueById("ParamMouthOpenY", value);
          } else {
            coreModel.setParameterValueById("ParamMouthOpenY", 0);
          }
        }
      } catch (e) {
        // Parameter might not exist
      }
      animId = requestAnimationFrame(updateMouth);
    };

    updateMouth();
    return () => cancelAnimationFrame(animId);
  }, [state.isTalking, modelLoaded]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-rose-400 p-4">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-sm text-center max-w-[250px] mb-2">{error}</p>
        <p className="text-xs text-slate-500 text-center mb-4">
          Pastikan Live2D SDK script di index.html sudah benar
        </p>
        <button
          onClick={initLive2D}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <p className="text-xs text-slate-400">Loading Live2D...</p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full max-w-[400px] max-h-[400px]"
        style={{ minWidth: "300px", minHeight: "300px" }}
      />
    </div>
  );
};

const VTuberCharacter: React.FC<VTuberCharacterProps> = ({
  state,
  character = DEFAULT_CHARACTER,
  apiBaseUrl = "http://localhost:8000",
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
      },
      4000 + Math.random() * 3000
    );
    return () => clearInterval(blinkInterval);
  }, []);

  const renderCharacter = () => {
    // Default SVG character
    if (character.id === "default" || character.type === "svg") {
      return <DefaultSVGCharacter state={state} blink={blink} />;
    }

    // Live2D character
    if (character.type === "live2d" && character.path) {
      return (
        <Live2DCharacter
          state={state}
          modelPath={character.path}
          apiBaseUrl={apiBaseUrl}
        />
      );
    }

    // Fallback to default
    return <DefaultSVGCharacter state={state} blink={blink} />;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <style>{`
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes mouthMove {
          0% { transform: scaleY(0.2); }
          50% { transform: scaleY(1.2); }
          100% { transform: scaleY(0.2); }
        }
        .animate-float {
          animation: floating 4s ease-in-out infinite;
        }
        .mouth-talking {
          animation: mouthMove 0.15s ease-in-out infinite;
        }
      `}</style>

      <div className="animate-float relative w-64 h-64 md:w-96 md:h-96">
        {renderCharacter()}

        {/* STATUS INDICATOR (THOUGHT BUBBLE STYLE) */}
        <div className="absolute top-0 left-[60%] -translate-x-1/2 z-20">
          {state.isThinking && (
            <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div
                className="bg-slate-800/90 backdrop-blur-xl px-5 py-3 rounded-3xl border border-indigo-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                              after:absolute after:content-[''] 
                              after:border-t-[12px] after:border-t-slate-800/90 
                              after:border-l-[12px] after:border-l-transparent
                              after:border-r-[0px] after:border-r-transparent
                              after:bottom-[-11px] after:left-6 after:skew-x-[-10deg]"
              >
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VTuberCharacter;
