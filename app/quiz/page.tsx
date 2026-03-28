'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getUserBaseline } from '../actions/quiz';
import { startAdaptiveQuiz, submitAnswerAndGetNext } from '../actions/adaptiveEngine';

type Question = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  hint: string;
};

export default function AffectiveQuizRoute() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(0);
  const frustFramesRef = useRef<number>(0);
  const baselineRef = useRef<{ frownBase: number, frownMax: number } | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const initializedRef = useRef(false);

  const [metrics, setMetrics] = useState({ frust: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);

  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [isHintActive, setIsHintActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const fetchBaseline = async () => {
      const data = await getUserBaseline();
      if (data && data.frownBase !== null && data.frownMax !== null) {
        baselineRef.current = { frownBase: data.frownBase, frownMax: data.frownMax };
      }
    };
    fetchBaseline();

    let faceLandmarker: FaceLandmarker;
    let lastVideoTime = -1;

    const initAI = async () => {
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true
      });
      setIsLoaded(true);

      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
      }
    };

    const predictWebcam = () => {
        const video = videoRef.current;
        if (!video || !faceLandmarker) return;
  
        const startTimeMs = performance.now();
  
        if (lastVideoTime !== video.currentTime) {
          lastVideoTime = video.currentTime;
          const results = faceLandmarker.detectForVideo(video, startTimeMs);
  
          if (results.faceBlendshapes?.[0]?.categories) {
            const blendshapes = results.faceBlendshapes[0].categories;
            const getScore = (name: string) => blendshapes.find(b => b.categoryName === name)?.score || 0;
  
            const frownScoreRaw = (getScore("browDownLeft") + getScore("browDownRight")) / 2;
  
            let frustPercent = 0;
            const baseline = baselineRef.current;
  
            if (baseline && (baseline.frownMax - baseline.frownBase) > 0) {
              const range = baseline.frownMax - baseline.frownBase;
              const normalized = ((frownScoreRaw - baseline.frownBase) / range) * 100;
              frustPercent = Math.max(0, Math.min(100, Math.round(normalized)));
            } else {
              frustPercent = Math.round(frownScoreRaw * 100);
            }
  
            setMetrics({ frust: frustPercent });
  
            if (frustPercent > 25) {
              frustFramesRef.current += 1;
              if (frustFramesRef.current > 45) {
                setShowHintModal(prev => {
                  if (!prev) setIsHintActive(curr => { if (!curr) return false; return curr; });
                  return true;
                });
                frustFramesRef.current = 0;
              }
            } else {
              frustFramesRef.current = 0;
            }
          }
        }
        requestRef.current = requestAnimationFrame(predictWebcam);
      };
  
      initAI();
  
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (videoRef.current?.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
      };
    }, []);
  
    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      const initializeQuiz = async () => {
        const result = await startAdaptiveQuiz();
        if (result && !result.error) {
          setAttemptId(result.attemptId);
          setQuestion(result.firstQuestion);
          questionStartTimeRef.current = Date.now();
        } else {
          console.error("Failed to start quiz:", result?.error);
        }
      };
      initializeQuiz();
    }, []);
  
    const handleAnswer = async () => {
      if (selectedOpt === null || !attemptId || !question) return;
  
      setIsFetchingNext(true);
  
      const timeSpentSeconds = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      const isCorrect = selectedOpt === question.correctOption;
  
      const result = await submitAnswerAndGetNext(
        attemptId,
        question.id,
        isCorrect,
        isHintActive,
        metrics.frust,
        timeSpentSeconds
      );
  
      if (result.finished) {
        setQuizFinished(true);
      } else if (result.nextQuestion) {
        setQuestion(result.nextQuestion);
        setQuestionNumber(n => n + 1);
        setSelectedOpt(null);
        setIsHintActive(false);
        setShowHintModal(false);
        questionStartTimeRef.current = Date.now();
      } else {
        console.error("Error fetching next question:", result.error);
        setQuizFinished(true);
      }
  
      setIsFetchingNext(false);
    };
  
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col p-4 md:p-6 relative items-center">
  
        <header className="flex flex-col md:flex-row gap-4 md:gap-0 w-full max-w-7xl justify-between items-center mb-6 md:mb-8 text-center md:text-left">
          <Link href="/" className="flex items-center justify-center md:justify-start gap-2 text-slate-400 hover:text-white transition-colors w-full md:w-auto">
            <ChevronLeft size={20} />
            Voltar ao Monitor
          </Link>
          <h1 className="text-lg md:text-xl font-bold w-full md:w-auto">Investigação: Intervenção Adaptativa</h1>
        </header>
  
        {showHintModal && !isHintActive && !quizFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-[90%] md:max-w-sm border border-slate-700 text-center">
              <h3 className="text-lg md:text-xl font-bold mb-2">Precisas de uma ajuda?</h3>
              <p className="text-slate-400 text-sm mb-6">Detetámos que podes estar a achar a questão confusa. Queres ver uma dica?</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setShowHintModal(false)} className="w-full sm:flex-1 px-4 py-3 sm:py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors cursor-pointer order-2 sm:order-1">Não</button>
                <button onClick={() => { setIsHintActive(true); setShowHintModal(false); }} className="w-full sm:flex-1 px-4 py-3 sm:py-2 rounded-lg bg-sky-500 hover:bg-sky-400 font-medium transition-colors cursor-pointer order-1 sm:order-2">Sim, ver dica</button>
              </div>
            </div>
          </div>
        )}
  
        <div className="flex flex-col md:flex-row w-full max-w-7xl gap-6 md:gap-8">
  
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 shadow-xl">
              <h2 className="text-xs font-semibold text-slate-500 uppercase mb-3">Motor Biométrico</h2>
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
                {!isLoaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">A iniciar...</div>}
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-60"></video>
              </div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-400">Frustração</span>
                <span className={metrics.frust > 35 ? "text-rose-400" : "text-emerald-400"}>{metrics.frust}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full"><div className={`h-full rounded-full transition-all ${metrics.frust > 35 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${metrics.frust}%` }}></div></div>
            </div>
          </div>
  
          <div className="w-full md:w-2/3 bg-slate-900 p-5 md:p-8 rounded-2xl border border-white/5 shadow-xl flex flex-col">
          {!question && !quizFinished ? (
            <div className="text-center my-auto py-10">
              <h2 className="text-xl md:text-2xl font-bold mb-2">A preparar a tua sessão adaptativa...</h2>
              <p className="text-slate-400">Por favor, aguarda um momento.</p>
            </div>
          ) : !quizFinished && question ? (
              <>
                <div className="flex justify-between items-center mb-6 md:mb-8">
                  <span className="text-xs md:text-sm text-slate-500">Pergunta {questionNumber} de {totalQuestions}</span>
                  {isHintActive && <span className="text-[10px] md:text-xs font-bold text-sky-400 bg-sky-400/10 px-2 py-1 md:px-3 rounded-full border border-sky-400/20">DICA ATIVA</span>}
                </div>
  
                <h2 className="text-xl md:text-2xl font-semibold leading-relaxed mb-6 md:mb-8">{question.text}</h2>
  
                {isHintActive && (
                  <div className="mb-6 p-3 md:p-4 bg-sky-900/30 border border-sky-500/30 rounded-xl text-sky-200 text-sm">💡 {question.hint}</div>
                )}
  
                <div className="flex flex-col gap-3 mb-auto">
                  {question.options.map((opt, i) => (
                    <button key={i} onClick={() => setSelectedOpt(i)} className={`text-left px-4 md:px-5 py-3 md:py-4 rounded-xl border transition-all text-sm md:text-base ${selectedOpt === i ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'} cursor-pointer`}>
                      {opt}
                    </button>
                  ))}
                </div>
  
                <button onClick={handleAnswer} disabled={selectedOpt === null || isFetchingNext} className="mt-6 md:mt-8 w-full py-3 md:py-4 rounded-xl bg-slate-100 text-slate-900 font-bold hover:bg-white disabled:opacity-50 transition-all cursor-pointer text-sm md:text-base">
                  {isFetchingNext ? 'A avaliar...' : 'Avançar'}
                </button>
              </>
            ) : (
              <div className="text-center my-auto py-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Quiz Concluído!</h2>
                <p className="text-slate-400">A tua pontuação final e análise estarão disponíveis no dashboard.</p>
                <Link href="/dashboard" className="mt-6 inline-block px-6 py-3 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-400 transition-colors">
                  Ir para o Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  