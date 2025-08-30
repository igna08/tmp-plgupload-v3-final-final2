"use client";


import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Camera, 
  QrCode, 
  X, 
  Check,
  AlertCircle,
  Loader2,
  Save,
  RefreshCw
} from 'lucide-react';

interface FormData {
  name: string;
  serial_number: string;
  price: string;
  quantity: number;
}

const FloatingAssetButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'menu' | 'camera' | 'form' | 'success'>('menu');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    serial_number: '',
    price: '',
    quantity: 1
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpiar cámara
  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track detenido:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  // Iniciar cámara
  const startCamera = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setCameraReady(false);
      
      stopCamera();

      console.log('Solicitando acceso a cámara...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata cargada');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video reproduciendo');
              setCameraReady(true);
              setCurrentView('camera');
              setLoading(false);
            }).catch((err: Error) => {
              console.error('Error reproduciendo video:', err);
              setError('Error al iniciar la reproducción del video');
              setLoading(false);
            });
          }
        };

        videoRef.current.onerror = (err: Event | string) => {
          console.error('Error en video element:', err);
          setError('Error en el elemento de video');
          setLoading(false);
        };
      }

    } catch (err: any) {
      console.error('Error accediendo a cámara:', err);
      let errorMessage = 'No se pudo acceder a la cámara. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Permisos denegados. Permite el acceso a la cámara.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No se encontró ninguna cámara disponible.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'La cámara está siendo usada por otra aplicación.';
      } else {
        errorMessage += err.message || 'Error desconocido';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Capturar foto
  const capturePhoto = (): void => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      setError('La cámara no está lista para capturar');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    try {
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      
      console.log('Capturando foto:', canvas.width, 'x', canvas.height);
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        if (imageDataUrl && imageDataUrl.length > 1000) {
          setCapturedImage(imageDataUrl);
          setSuccess('Foto capturada correctamente');
          stopCamera();
          setCurrentView('form');
        } else {
          setError('Error al procesar la imagen capturada');
        }
      } else {
        setError('Error al obtener contexto del canvas');
      }
      
    } catch (err: any) {
      console.error('Error capturando foto:', err);
      setError('Error al capturar la foto: ' + (err.message || 'Error desconocido'));
    }
  };

  // Manejar cambios de formulario
  const handleInputChange = (field: keyof FormData, value: string | number): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Envío de formulario
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      setLoading(false);
      setSuccess('Activo creado exitosamente con QR generado');
      setCurrentView('success');
    }, 2000);
  };

  // Reiniciar formulario
  const resetForm = (): void => {
    setFormData({ name: '', serial_number: '', price: '', quantity: 1 });
    setCapturedImage(null);
    setError(null);
    setSuccess(null);
    setCameraReady(false);
  };

  // Cerrar modal
  const closeModal = (): void => {
    stopCamera();
    setIsOpen(false);
    setCurrentView('menu');
    resetForm();
  };

  // Navegar hacia atrás
  const goBack = (): void => {
    setError(null);
    setSuccess(null);
    
    if (currentView === 'camera') {
      stopCamera();
      setCurrentView('menu');
    } else if (currentView === 'form') {
      setCurrentView('menu');
      setCapturedImage(null);
    } else if (currentView === 'success') {
      closeModal();
    } else {
      closeModal();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'menu':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Activos</h3>
              <p className="text-gray-600">Selecciona una acción para continuar</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={startCamera}
                className="w-full flex items-center space-x-4 p-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <Camera className="h-8 w-8" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-lg font-semibold">Crear Nuevo Activo</h4>
                  <p className="text-blue-100">Captura foto y registra objeto</p>
                </div>
              </button>
              
              <button
                onClick={() => setSuccess('Función de escaneo QR en desarrollo')}
                className="w-full flex items-center space-x-4 p-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <QrCode className="h-8 w-8" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-lg font-semibold">Escanear QR</h4>
                  <p className="text-green-100">Buscar información de activo</p>
                </div>
              </button>
            </div>
          </div>
        );

      case 'camera':
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Capturar Foto</h3>
              <p className="text-gray-600">Posiciona el objeto en el centro</p>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-gray-600">Inicializando cámara...</p>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-2xl bg-black aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-6 border-2 border-white border-dashed rounded-lg opacity-60"></div>
                    <div className="absolute top-4 left-4 right-4 text-center">
                      <span className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
                        Centra el objeto aquí
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="w-full flex items-center justify-center space-x-3 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all duration-200 font-semibold text-lg disabled:cursor-not-allowed"
                  >
                    <Camera className="h-6 w-6" />
                    <span>{cameraReady ? 'Capturar Foto' : 'Preparando cámara...'}</span>
                  </button>

                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Reiniciar Cámara</span>
                  </button>
                </div>
              </>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Registrar Activo</h3>
              <p className="text-gray-600">Completa la información</p>
            </div>
            
            {capturedImage && (
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Foto capturada"
                  className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                />
                <button
                  onClick={startCamera}
                  className="absolute top-2 right-2 p-2 bg-black bg-opacity-60 text-white rounded-lg hover:bg-opacity-80"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del objeto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Laptop Dell"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de serie
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange('serial_number', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ABC123456"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
                className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Guardar y Generar QR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-green-100 rounded-full">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">¡Éxito!</h3>
                <p className="text-gray-600 mt-2">Operación completada correctamente</p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-xl">
              <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">Código QR generado</p>
              <p className="text-xs text-gray-500 mt-1">Activo: {formData.name}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={closeModal}
                className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-semibold"
              >
                Crear Otro Activo
              </button>
              <button
                onClick={closeModal}
                className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transform hover:scale-110"
        >
          <Plus className="h-8 w-8 group-hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={closeModal}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
                
                <div className="flex space-x-1">
                  {(['menu', 'camera', 'form', 'success'] as const).map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        currentView === step ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="w-10" />
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-green-700 text-sm">{success}</p>
                    </div>
                  </div>
                )}

                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAssetButton;