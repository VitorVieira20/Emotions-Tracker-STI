'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { completeOnboarding } from '../actions/onboarding';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const STEPS = [
  { id: 1, title: 'Seu Perfil' },
  { id: 2, title: 'Nível de Inglês' },
  { id: 3, title: 'Calibração Biométrica' },
];

const SKILLS = ['Reading', 'Listening', 'Grammar', 'Vocabulary', 'Speaking', 'Writing'];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);

  const [name, setName] = useState('');

  const [englishLevel, setEnglishLevel] = useState('');
  const [strongAreas, setStrongAreas] = useState<string[]>([]);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const collectedScoresRef = useRef<number[]>([]);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStage, setCalibrationStage] = useState<'neutral' | 'frustrated' | 'happy' | 'done'>('neutral');
  const [calibrationCountdown, setCalibrationCountdown] = useState(3);
  const [frownBase, setFrownBase] = useState<number | null>(null);
  const [frownMax, setFrownMax] = useState<number | null>(null);
  const [smileMax, setSmileMax] = useState<number | null>(null);

  const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    if (currentStep !== 3) return;

    async function initialize() {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true
        });
        setMediaPipeLoaded(true);
        startCamera();
      } catch (e) {
        console.error(e);
        setCamError("Falha ao carregar o modelo de IA.");
      }
    }
    initialize();

    return () => {
      stopWebcam();
    };
  }, [currentStep]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamError(null);
    } catch (err) {
      setCamError("Acesso à câmara negado. Por favor, autorize nas definições do seu navegador.");
    }
  };

  const stopWebcam = () => {
    cancelAnimationFrame(animationFrameRef.current);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const predictWebcam = (stage: 'neutral' | 'frustrated' | 'happy') => {
    if (!videoRef.current || !faceLandmarkerRef.current) return;
    const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());

    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0].categories;
      const getScore = (name: string) => blendshapes.find(b => b.categoryName === name)?.score || 0;

      let score = 0;
      if (stage === 'neutral' || stage === 'frustrated') {
        score = (getScore('browDownLeft') + getScore('browDownRight')) / 2;
      } else if (stage === 'happy') {
        score = (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) / 2;
      }
      collectedScoresRef.current.push(score);
    }
    animationFrameRef.current = requestAnimationFrame(() => predictWebcam(stage));
  };

  const startCalibration = (stage: 'neutral' | 'frustrated' | 'happy') => {
    setIsCalibrating(true);
    collectedScoresRef.current = [];
    predictWebcam(stage);

    const countdownInterval = setInterval(() => {
      setCalibrationCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          finishCalibration(stage);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishCalibration = (stage: 'neutral' | 'frustrated' | 'happy') => {
    cancelAnimationFrame(animationFrameRef.current);
    const averageScore = collectedScoresRef.current.reduce((a, b) => a + b, 0) / (collectedScoresRef.current.length || 1);

    if (stage === 'neutral') setFrownBase(averageScore);
    if (stage === 'frustrated') setFrownMax(averageScore);
    if (stage === 'happy') setSmileMax(averageScore);

    setIsCalibrating(false);
    setCalibrationCountdown(3);
    const nextStage = stage === 'neutral' ? 'frustrated' : stage === 'frustrated' ? 'happy' : 'done';
    setCalibrationStage(nextStage as any);
  };

  const handleNextStep = () => {
    setStepError(null); 

    if (currentStep === 1) {
      if (name.trim() === '') {
        setStepError('Por favor, preenche o teu nome para avançar.');
        return;
      }
    }

    if (currentStep === 2) {
      if (englishLevel.trim() === '') {
        setStepError('Por favor, seleciona o teu nível de inglês.');
        return;
      }
      if (strongAreas.length === 0) {
        setStepError('Deves selecionar pelo menos uma área forte.');
        return;
      }
      if (weakAreas.length === 0) {
        setStepError('Deves selecionar pelo menos uma área a melhorar.');
        return;
      }
    }

    setCurrentStep(prev => (prev < STEPS.length ? prev + 1 : prev));
  }

  const prevStep = () => {
      if (currentStep === 3) stopWebcam();
      setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));
  }

  const isNextButtonDisabled = () => {
    switch (currentStep) {
      case 1:
        return name.trim() === '';
      case 2:
        return englishLevel.trim() === '' || strongAreas.length === 0 || weakAreas.length === 0;
      default:
        return false;
    }
  };

  const handleCheckboxChange = (area: string, type: 'strong' | 'weak') => {
    const areas = type === 'strong' ? strongAreas : weakAreas;
    const setAreas = type === 'strong' ? setStrongAreas : setWeakAreas;
    setAreas(areas.includes(area) ? areas.filter(a => a !== area) : [...areas, area]);
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('englishLevel', englishLevel);
    strongAreas.forEach(area => formData.append('strongAreas', area));
    weakAreas.forEach(area => formData.append('weakAreas', area));
    formData.append('frownBase', String(frownBase ?? 0));
    formData.append('frownMax', String(frownMax ?? 0));
    formData.append('smileMax', String(smileMax ?? 0));

    console.log(formData)

    try {
      const result = await completeOnboarding(formData);

      if (result.success) {
        await update({ onboardingCompleted: true }); 

        window.location.href = '/dashboard';
      } else {
        setError(result.message || 'Ocorreu um erro desconhecido.');
      }
    } catch (err) {
      setError('Falha ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return (
        <div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Bem-vindo(a)!</h2>
            <p className="text-slate-400 mb-6">Vamos começar por configurar o seu perfil.</p>
            <label htmlFor="name" className="text-sm font-medium text-slate-400">Qual é o seu nome?</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Maria Silva" className="w-full px-3 py-2 mt-1 text-slate-50 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      );
      case 2: return (
        <div>
            <h2 className="text-xl font-bold text-slate-100 mb-6">Seu nível de conhecimento</h2>
            <div className='space-y-6'>
                <div>
                    <label htmlFor="english-level" className="text-sm font-medium text-slate-400">Qual o seu nível de inglês (aproximado)?</label>
                    <select id="english-level" value={englishLevel} onChange={(e) => setEnglishLevel(e.target.value)} className="w-full px-3 py-2 mt-1 text-slate-50 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                        <option value="">Selecione um nível</option>
                        <option value="A2">A2 (Básico)</option>
                        <option value="B1">B1 (Intermediário)</option>
                        <option value="B2">B2 (Intermediário-Avançado)</option>
                        <option value="C1">C1 (Avançado)</option>
                    </select>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Quais são as suas áreas mais fortes?</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SKILLS.map(skill => (
                            <label key={`strong-${skill}`} className="flex items-center space-x-2 p-2 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700 transition-colors duration-200">
                                <input type="checkbox" checked={strongAreas.includes(skill)} onChange={() => handleCheckboxChange(skill, 'strong')} className="form-checkbox h-4 w-4 text-indigo-600 bg-slate-700 border-slate-600 rounded" />
                                <span className="text-slate-300">{skill}</span>
                            </label>
                        ))}
                    </div>
                </div>
                 <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Quais áreas gostaria de melhorar?</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SKILLS.map(skill => (
                            <label key={`weak-${skill}`} className="flex items-center space-x-2 p-2 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700 transition-colors duration-200">
                                <input type="checkbox" checked={weakAreas.includes(skill)} onChange={() => handleCheckboxChange(skill, 'weak')} className="form-checkbox h-4 w-4 text-indigo-600 bg-slate-700 border-slate-600 rounded" />
                                <span className="text-slate-300">{skill}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      );
      case 3: return (
        <div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Calibração Biométrica</h2>
            <p className="text-slate-400 mb-6">Para adaptar a experiência, olhe para a câmara e siga as instruções.</p>
            <div className="relative w-full aspect-video bg-slate-800 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                {camError && <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-center p-4"><p className="text-rose-400">{camError}</p></div>}
                {!mediaPipeLoaded && !camError && <div className="absolute inset-0 flex items-center justify-center"><p className="text-slate-400">A carregar IA...</p></div>}
            </div>

            <div className="h-16">
                {calibrationStage === 'neutral' && <button onClick={() => startCalibration('neutral')} disabled={isCalibrating || !mediaPipeLoaded} className="w-full py-3 bg-indigo-600 rounded-md text-white font-bold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"> {isCalibrating ? `Mantenha o rosto neutro... ${calibrationCountdown}s` : 'Gravar Rosto Neutro'} </button>}
                {calibrationStage === 'frustrated' && <button onClick={() => startCalibration('frustrated')} disabled={isCalibrating} className="w-full py-3 bg-indigo-600 rounded-md text-white font-bold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"> {isCalibrating ? `Finja frustração... ${calibrationCountdown}s` : 'Gravar Rosto Frustrado'} </button>}
                {calibrationStage === 'happy' && <button onClick={() => startCalibration('happy')} disabled={isCalibrating} className="w-full py-3 bg-indigo-600 rounded-md text-white font-bold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"> {isCalibrating ? `Dê um sorriso... ${calibrationCountdown}s` : 'Gravar Rosto Feliz'} </button>}
                {calibrationStage === 'done' && <p className="text-center text-green-400 font-bold text-lg">Calibração completa!</p>}
            </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-slate-900 rounded-2xl shadow-2xl p-8">
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-400">Passo {currentStep} de {STEPS.length}</span>
                <span className="text-sm font-bold text-slate-300">{STEPS[currentStep-1].title}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentStep -1) / (STEPS.length -1)) * 100}%` }}></div>
            </div>
        </div>

        <div className="min-h-104 md:min-h-96">
            {renderStepContent()}
        </div>

        {stepError && <p className="text-rose-400 text-sm mt-4 text-center font-medium">{stepError}</p>}

        <div className="flex justify-between mt-8">
          <button onClick={prevStep} disabled={currentStep === 1} className="px-6 py-2 bg-slate-700 rounded-md text-white font-bold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
          {currentStep < STEPS.length ? (
            <button onClick={handleNextStep} disabled={isNextButtonDisabled()} className="px-6 py-2 bg-indigo-600 rounded-md text-white font-bold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">Próximo</button>
          ) : (
            <button onClick={handleFinalSubmit} disabled={isLoading || calibrationStage !== 'done'} className="px-6 py-2 bg-green-600 rounded-md text-white font-bold cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'A guardar...' : 'Concluir'}</button>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}