'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import Link from 'next/link';
import { ChevronRight, Camera, AlertTriangle } from 'lucide-react';

export default function AffectiveDashboard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const [metrics, setMetrics] = useState({ frust: 0, surp: 0, happy: 0 });
  const [status, setStatus] = useState({ text: 'A inicializar IA...', color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' });
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [showCamModal, setShowCamModal] = useState(false);
  const [camError, setCamError] = useState(false);

  useEffect(() => {
    let lastVideoTime = -1;

    const initSystem = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true
      });
      setIsLoaded(true);

      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          startCamera();
        } else if (permissionStatus.state === 'prompt') {
          setShowCamModal(true);
        } else {
          setCamError(true);
        }
      } catch (error) {
        setShowCamModal(true);
      }
    };

    const predictWebcam = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const faceLandmarker = faceLandmarkerRef.current;
      
      if (!video || !canvas || !faceLandmarker) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const startTimeMs = performance.now();

      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = faceLandmarker.detectForVideo(video, startTimeMs);

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          const blendshapes = results.faceBlendshapes[0].categories;
          const getScore = (name: string) => blendshapes.find(b => b.categoryName === name)?.score || 0;

          const smileScore = (getScore("mouthSmileLeft") + getScore("mouthSmileRight")) / 2;
          const frownScore = (getScore("browDownLeft") + getScore("browDownRight")) / 2;
          const surpriseScore = (getScore("jawOpen") + getScore("browInnerUp")) / 2;

          setMetrics({
            happy: Math.round(smileScore * 100),
            frust: Math.round(frownScore * 100),
            surp: Math.round(surpriseScore * 100)
          });

          if (surpriseScore > 0.35) {
            setStatus({ text: "SURPRESA / SUSTO", color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/30" });
          } else if (frownScore > 0.3) {
            setStatus({ text: "ALTA FRUSTRAÇÃO", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/30" });
          } else if (smileScore > 0.4) {
            setStatus({ text: "FELICIDADE ALTA", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" });
          } else {
            setStatus({ text: "FOCADO / NEUTRO", color: "text-slate-400", bg: "bg-slate-700/30", border: "border-slate-700/50" });
          }
        }
      }
      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    (window as any).startMediaPipeWebcam = predictWebcam;

    initSystem();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", (window as any).startMediaPipeWebcam);
        }
        setShowCamModal(false);
        setCamError(false);
      }
    } catch (err) {
      console.error("Acesso à câmara negado:", err);
      setShowCamModal(false);
      setCamError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col items-center py-12 px-6 relative">

      {showCamModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-700 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Acesso à Câmara</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Para testar a deteção de emoções em tempo real, este sistema precisa de aceder à tua câmara. 
              <br/><br/>
              <strong>Privacidade garantida:</strong> Todo o processamento é feito localmente no teu navegador. Nenhuma imagem é enviada ou guardada em servidores.
            </p>
            <button 
              onClick={startCamera} 
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              Autorizar Câmara
            </button>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row gap-6 md:gap-0 text-center mb-10 w-full max-w-6xl justify-between items-center">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Affective Learning Engine</h1>
          <p className="text-slate-400 text-sm">Dashboard de Monitorização (Testes Livres)</p>
        </div>
        <Link href="/quiz" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors">
          Testar Quiz Adaptativo
          <ChevronRight size={18} />
        </Link>
      </header>

      <div className="flex flex-wrap justify-center gap-8 w-full max-w-7xl">
        <div className="relative w-[640px] h-[480px] bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          
          {camError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-400 bg-slate-900 z-20 px-8 text-center">
              <AlertTriangle size={48} className="mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2 text-rose-300">Câmara Bloqueada</h3>
              <p className="text-sm opacity-80">
                Parece que o acesso à câmara foi negado no teu navegador. Por favor, altera a permissão da Câmara para "Permitir" e recarrega a página.
              </p>
            </div>
          ) : !isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 animate-pulse z-20">A carregar IA...</div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-0">A aguardar vídeo...</div>
          )}

          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100"></video>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -scale-x-100 z-10"></canvas>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-[380px] shadow-2xl ring-1 ring-white/10 flex flex-col">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Estado Cognitivo</h2>
          <div className={`px-4 py-3 rounded-lg text-center font-bold text-lg mb-8 border transition-colors duration-300 ${status.bg} ${status.color} ${status.border}`}>{status.text}</div>

          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">Métricas Biométricas</h2>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2 font-medium"><span className="text-slate-300">Frustração / Confusão</span><span className="text-rose-500">{metrics.frust}%</span></div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${metrics.frust}%` }}></div></div>
          </div>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2 font-medium"><span className="text-slate-300">Surpresa / Susto</span><span className="text-sky-400">{metrics.surp}%</span></div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-sky-400 rounded-full" style={{ width: `${metrics.surp}%` }}></div></div>
          </div>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2 font-medium"><span className="text-slate-300">Felicidade (Positivo)</span><span className="text-emerald-500">{metrics.happy}%</span></div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.happy}%` }}></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}