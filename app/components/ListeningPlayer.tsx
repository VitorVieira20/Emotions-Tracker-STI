'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Headset } from 'lucide-react';

interface ListeningPlayerProps {
  audioUrl: string;
}

export default function ListeningPlayer({ audioUrl }: ListeningPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [listenCount, setListenCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reiniciar o player quando o URL do áudio muda (nova pergunta)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      setListenCount(0);
      audioRef.current.load();
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      if (progress === 0) {
        setListenCount(prev => prev + 1);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(currentProgress);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0); // Reset progress visually so they can play again
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
    setListenCount(prev => prev + 1);
  };

  return (
    <div className="w-full bg-slate-800/40 border border-white/10 backdrop-blur-md rounded-xl p-4 mb-6 shadow-2xl transition-all duration-300">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      
      <div className="flex items-center gap-4">
        {/* Play/Pause Button with Pulse Animation when paused */}
        <button
          onClick={togglePlay}
          className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg active:scale-95 group relative ${!isPlaying && progress === 0 ? 'animate-none' : ''}`}
          title={isPlaying ? 'Pausar' : 'Ouvir'}
        >
          {!isPlaying && progress === 0 && (
            <span className="absolute inset-0 rounded-full bg-indigo-500/40 animate-ping"></span>
          )}
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
        </button>

        <div className="flex-grow">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Headset size={16} className="text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Audio Player</span>
            </div>
            {listenCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Ouvido: {listenCount} {listenCount === 1 ? 'vez' : 'vezes'}
              </span>
            )}
          </div>
          
          <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={restart}
          className="flex-shrink-0 p-2 text-slate-500 hover:text-indigo-400 transition-colors"
          title="Ouvir novamente"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
