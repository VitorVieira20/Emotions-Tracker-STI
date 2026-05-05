'use client';

import { useEffect, useRef, useState, useCallback, use } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trophy, Target, Home, Clock, Brain, Lightbulb, RefreshCcw, CheckCircle2, XCircle, Medal } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getUserBaseline } from '../../actions/quiz';
import { getQuizAttemptStatus, submitAnswerAndGetNext, startAdaptiveQuiz } from '../../actions/adaptiveEngine';
import { Question } from '@/types/Question';
import SummaryView from '@/app/components/SummaryView';
import ListeningPlayer from '@/app/components/ListeningPlayer';

export default function AffectiveQuizRoute({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>(0);
  const frustFramesRef = useRef<number>(0);
  const baselineRef = useRef<{ frownBase: number, frownMax: number } | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const initializedRef = useRef(false);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const [metrics, setMetrics] = useState({ frust: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const [question, setQuestion] = useState<Question | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);

  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [isHintActive, setIsHintActive] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizStats, setQuizStats] = useState<{
    score: number;
    totalQuestions: number;
    totalHints: number;
    avgFrustration: number;
    totalTimeSpent: number;
  } | null>(null);

  const stopCamera = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  if (quizStats) stopCamera();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopCamera]);

  useEffect(() => {
    let isMounted = true;

    const fetchBaseline = async () => {
      const data = await getUserBaseline();
      if (!isMounted) return;
      if (data && data.frownBase !== null && data.frownMax !== null) {
        baselineRef.current = { frownBase: data.frownBase, frownMax: data.frownMax };
      }
    };
    fetchBaseline();

    let lastVideoTime = -1;

    const initAI = async () => {
      stopCamera();

      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        if (!isMounted) return;

        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true
        });

        if (!isMounted) return;
        setIsLoaded(true);

        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });

          if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", predictWebcam);
          }
        }
      } catch (error) {
        console.error("Failed to initialize AI or camera:", error);
      }
    };

    const predictWebcam = () => {
      if (!isMounted) return;
      const video = videoRef.current;
      if (!video || !faceLandmarkerRef.current) return;

      const startTimeMs = performance.now();

      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

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
    window.addEventListener('beforeunload', stopCamera);

    return () => {
      isMounted = false;
      stopCamera();
      window.removeEventListener('beforeunload', stopCamera);
      if (videoRef.current) {
        videoRef.current.removeEventListener("loadeddata", predictWebcam);
      }
    };
  }, [stopCamera]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const loadQuizData = async () => {
      setIsFetchingNext(true);
      const result = await getQuizAttemptStatus(attemptId);

      if (result && !result.error) {
        if (result.finished) {
          router.push('/dashboard');
          return;
        }
        if (result.question) {
          setQuestion(result.question as unknown as Question);
          setQuestionNumber(result.questionNumber || 1);
          questionStartTimeRef.current = Date.now();
        }
      } else {
        console.error("Failed to load quiz data:", result?.error);
        router.push('/dashboard');
      }
      setIsFetchingNext(false);
    };
    loadQuizData();
  }, [attemptId, router]);

  const handleAnswer = async () => {
    if (selectedOpt === null || !attemptId || !question) return;

    if (!hasChecked) {
      setHasChecked(true);
      return;
    }

    setIsFetchingNext(true);

    const timeSpentSeconds = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const isCorrect = selectedOpt === question.correctOption;
    const userAnswer = question.options[selectedOpt];

    const result = await submitAnswerAndGetNext(
      attemptId,
      question.id,
      isCorrect,
      userAnswer,
      isHintActive,
      metrics.frust,
      timeSpentSeconds
    );

    if (result.finished) {
      stopCamera();
      if (result.stats) {
        setQuizStats(result.stats);
      }
      setQuizFinished(true);
    } else if (result.nextQuestion) {
      setQuestion(result.nextQuestion as unknown as Question);
      setQuestionNumber(n => n + 1); setSelectedOpt(null);
      setHasChecked(false);
      setIsHintActive(false);
      setShowHintModal(false);
      questionStartTimeRef.current = Date.now();
    } else {
      console.error("Error fetching next question:", result.error);
      stopCamera();
      setQuizFinished(true);
    }

    setIsFetchingNext(false);
  };

  const handleRestart = async () => {
    try {
      const result = await startAdaptiveQuiz(question?.area);
      setQuizStats(null);
      setQuizFinished(false);
      setSelectedOpt(null);
      setHasChecked(false);
      setIsHintActive(false);
      setShowHintModal(false);
      
      if (result.attemptId) {
        router.push(`/quiz/${result.attemptId}`);
        window.location.href = `/quiz/${result.attemptId}`;
      }
    } catch (error) {
      console.error("Failed to restart quiz:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col p-4 md:p-6 relative items-center">
      <header className="flex flex-col md:flex-row gap-4 md:gap-0 w-full max-w-7xl justify-between items-center mb-6 md:mb-8 text-center md:text-left">
        <Link href="/dashboard" className="flex items-center justify-center md:justify-start gap-2 text-slate-400 hover:text-white transition-colors w-full md:w-auto">
          <ChevronLeft size={20} />
          Terminar e ir para o Dashboard
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
        {!quizStats && (
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 shadow-xl">
              <h2 className="text-xs font-semibold text-slate-500 uppercase mb-3">Motor Biométrico</h2>
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
                {!isLoaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">A iniciar Câmara...</div>}
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-60"></video>
              </div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-400">Frustração</span>
                <span className={metrics.frust > 35 ? "text-rose-400" : "text-emerald-400"}>{metrics.frust}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full"><div className={`h-full rounded-full transition-all ${metrics.frust > 35 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${metrics.frust}%` }}></div></div>
            </div>
          </div>
        )}

        <div
          className={`w-full p-5 md:p-8 rounded-2xl flex flex-col bg-slate-900 ${quizStats ? 'md:w-full items-center justify-center bg-transparent' : 'md:w-2/3 shadow-xl bg-slate-900 border border-white/5'
            }`}
        >
          {!question && !quizFinished ? (
            <div className="text-center my-auto py-10">
              <h2 className="text-xl md:text-2xl font-bold mb-2">A preparar a tua sessão adaptativa...</h2>
              <p className="text-slate-400">Por favor, aguarda um momento.</p>
            </div>
          ) : !quizFinished && question ? (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pergunta {questionNumber} de {totalQuestions}</span>
                {isHintActive && <span className="text-[10px] md:text-xs font-bold text-sky-400 bg-sky-400/10 px-2 py-1 md:px-3 rounded-full border border-sky-400/20">DICA ATIVA</span>}
              </div>

              <h2 className="text-xl md:text-2xl font-semibold leading-relaxed mb-6">
                {question.area === 'Listening' 
                  ? (question.text.replace(/\(Audio:\s*'.+?'\)/g, '').trim() || 'Listen to the audio transcript.')
                  : question.text}
              </h2>

              {question.area === 'Listening' && question.audioUrl && (
                <div className="mb-8">
                  <p className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    🎧 Ouve o áudio com atenção.
                  </p>
                  <ListeningPlayer key={question.id} audioUrl={question.audioUrl} />
                </div>
              )}

              {isHintActive && (
                <div className="mb-6 p-3 md:p-4 bg-sky-900/30 border border-sky-500/30 rounded-xl text-sky-200 text-sm">💡 {question.hint}</div>
              )}

              <div className="flex flex-col gap-3 mb-auto">
                {question.options.map((opt, i) => {
                  const isSelected = selectedOpt === i;
                  const isCorrect = i === question.correctOption;

                  let buttonStyles = "bg-slate-800 border-slate-700 hover:bg-slate-700";
                  let Icon = null;

                  if (hasChecked) {
                    if (isCorrect) {
                      buttonStyles = "bg-emerald-500/20 border-emerald-500 text-emerald-100";
                      Icon = <CheckCircle2 className="text-emerald-500" size={20} />;
                    } else if (isSelected) {
                      buttonStyles = "bg-rose-500/20 border-rose-500 text-rose-100";
                      Icon = <XCircle className="text-rose-500" size={20} />;
                    } else {
                      buttonStyles = "bg-slate-800/40 border-slate-700 opacity-50";
                    }
                  } else if (isSelected) {
                    buttonStyles = "bg-indigo-600 border-indigo-500";
                  }

                  return (
                    <button
                      key={i}
                      disabled={hasChecked}
                      onClick={() => setSelectedOpt(i)}
                      className={`flex items-center justify-between text-left px-4 md:px-5 py-3 md:py-4 rounded-xl border transition-all text-sm md:text-base ${buttonStyles} ${!hasChecked && 'cursor-pointer'}`}
                    >
                      <span>{opt}</span>
                      {Icon}
                    </button>
                  );
                })}
              </div>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-8">
                <div
                  className="h-full bg-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                ></div>
              </div>

              <button
                onClick={handleAnswer}
                disabled={selectedOpt === null || isFetchingNext}
                className={`mt-6 md:mt-8 w-full py-3 md:py-4 rounded-xl font-bold transition-all text-sm md:text-base cursor-pointer disabled:opacity-50 ${hasChecked
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-900 hover:bg-white'
                  }`}
              >
                {isFetchingNext ? 'A carregar...' : hasChecked ? 'Continuar' : 'Verificar'}
              </button>
            </>
          ) : (
            <SummaryView
              stats={quizStats!}
              onRestart={handleRestart}
              area={question?.area}
            />
          )}
        </div>
      </div>
    </div>
  );
}