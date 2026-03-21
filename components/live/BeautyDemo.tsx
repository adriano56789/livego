// Componente de demonstração do sistema de beleza
// Mostra o processamento em tempo real e controles

import React, { useRef, useEffect, useState } from 'react';
import { useSimpleBeauty } from '../../hooks/useBeautyProcessor';
import { BeautyEffectSettings } from '../../services/VideoProcessor';

interface BeautyDemoProps {
  width?: number;
  height?: number;
  showControls?: boolean;
  autoStart?: boolean;
}

const BeautyDemo: React.FC<BeautyDemoProps> = ({
  width = 640,
  height = 480,
  showControls = true,
  autoStart = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const beauty = useSimpleBeauty(videoRef);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [fps, setFps] = useState(0);

  // Iniciar stream da câmera
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsStreaming(true);
      }

      console.log('✅ [BEAUTY_DEMO] Câmera iniciada');
    } catch (error) {
      console.error('❌ [BEAUTY_DEMO] Erro ao iniciar câmera:', error);
    }
  };

  // Parar stream da câmera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Controles de beleza
  const handleSettingChange = (setting: keyof BeautyEffectSettings, value: number) => {
    beauty.updateSettings({ [setting]: value });
  };

  // Medir FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    if (beauty.isActive) {
      requestAnimationFrame(measureFPS);
    }

    return () => {
      // Cleanup
    };
  }, [beauty.isActive]);

  // Auto-start
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
  }, [autoStart]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-gray-900 rounded-lg p-4 max-w-4xl mx-auto">
      <div className="mb-4">
        <h3 className="text-white text-lg font-semibold mb-2">Sistema de Beleza - Demo</h3>
        
        {/* Status */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded text-xs ${
            isStreaming ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            Câmera: {isStreaming ? 'Ativa' : 'Inativa'}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            beauty.isReady ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            Processador: {beauty.isReady ? 'Pronto' : 'Iniciando'}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            beauty.isActive ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            Beleza: {beauty.isActive ? 'Ativa' : 'Inativa'}
          </span>
          <span className="px-2 py-1 rounded text-xs bg-blue-600 text-white">
            FPS: {fps}
          </span>
        </div>

        {/* Vídeo */}
        <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ width, height }}>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Overlay de informações */}
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded">
            <div>Resolução: {width}x{height}</div>
            <div>Processamento: {beauty.isActive ? 'WebGL' : 'CSS'}</div>
          </div>
        </div>

        {/* Controles principais */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={startCamera}
            disabled={isStreaming}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Iniciar Câmera
          </button>
          <button
            onClick={stopCamera}
            disabled={!isStreaming}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Parar Câmera
          </button>
          <button
            onClick={beauty.toggle}
            disabled={!beauty.isReady}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {beauty.isActive ? 'Desativar Beleza' : 'Ativar Beleza'}
          </button>
          <button
            onClick={beauty.reset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Resetar Efeitos
          </button>
        </div>

        {/* Controles de efeitos */}
        {showControls && beauty.isReady && (
          <div className="space-y-4">
            <h4 className="text-white font-medium">Controles de Efeitos</h4>
            
            {/* Branqueamento */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Branqueamento</span>
                <span>{beauty.settings.whitening}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.settings.whitening}
                onChange={(e) => handleSettingChange('whitening', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Suavização */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Suavização de Pele</span>
                <span>{beauty.settings.smoothing}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.settings.smoothing}
                onChange={(e) => handleSettingChange('smoothing', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Saturação */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Saturação (Rubor)</span>
                <span>{beauty.settings.saturation}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.settings.saturation}
                onChange={(e) => handleSettingChange('saturation', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Contraste */}
            <div className="space-y-2">
              <label className="text-gray-300 text-sm flex justify-between">
                <span>Contraste</span>
                <span>{beauty.settings.contrast}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.settings.contrast}
                onChange={(e) => handleSettingChange('contrast', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Informações técnicas */}
        <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-300">
          <h4 className="font-semibold text-white mb-2">Informações Técnicas</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>• Processamento: {beauty.isActive ? 'WebGL Shaders' : 'CSS Filters'}</div>
            <div>• Resolução: {width}x{height}</div>
            <div>• FPS Alvo: 30</div>
            <div>• FPS Atual: {fps}</div>
            <div>• Backend: WebGL + Canvas</div>
            <div>• WebRTC: Integrado</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeautyDemo;
