"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Camera, 
  QrCode, 
  X, 
  Check, 
  Upload, 
  Printer, 
  Download, 
  AlertCircle,
  Loader2,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Hash,
  ImageIcon,
  Bluetooth,
  Scan
} from 'lucide-react';

// Interfaces basadas en tu API
interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  templates: Template[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  model_number: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  };
}

interface Classroom {
  id: string;
  name: string;
  capacity: number;
  school_id: string;
}

interface School {
  id: string;
  name: string;
  address: string;
  description: string;
  logo_url: string;
}

interface AssetData {
  template_id: string;
  serial_number: string;
  purchase_date: string;
  value_estimate: number;
  image_url: string;
  status: string;
  classroom_id: string;
}

interface QRCode {
  asset_id: string;
  id: string;
  qr_url: string;
  payload: Record<string, any>;
}

interface Asset {
  id: string;
  template_id: string;
  serial_number: string;
  purchase_date: string;
  value_estimate: number;
  image_url: string;
  status: string;
  classroom_id: string;
  created_at: string;
  updated_at: string;
  template: Template;
  qr_code?: QRCode;
}

const FloatingAssetButton: React.FC = () => {
  // Estados principales
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'menu' | 'camera' | 'form' | 'qr-result' | 'scanner'>('menu');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  
  // Estados del formulario basado en tu API
  const [assetData, setAssetData] = useState<AssetData>({
    template_id: '',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    value_estimate: 0,
    image_url: '',
    status: 'available',
    classroom_id: ''
  });
  
  // Estados para datos de la API (usando datos mock para demo)
  const [categories] = useState<Category[]>([
    { 
      id: '1', 
      name: 'Equipos de Cómputo', 
      description: 'Computadoras y accesorios',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      templates: []
    },
    { 
      id: '2', 
      name: 'Mobiliario', 
      description: 'Mesas, sillas y armarios',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      templates: []
    }
  ]);
  
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Laptop Dell',
      description: 'Laptop corporativa',
      manufacturer: 'Dell',
      model_number: 'L3520',
      category_id: '1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      category: { id: '1', name: 'Equipos de Cómputo' }
    },
    {
      id: '2',
      name: 'Mesa de Trabajo',
      description: 'Mesa de madera',
      manufacturer: 'Mueblería XYZ',
      model_number: 'MT-001',
      category_id: '2',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      category: { id: '2', name: 'Mobiliario' }
    }
  ]);
  
  const [classrooms] = useState<Classroom[]>([
    { id: '1', name: 'Aula 101', capacity: 30, school_id: '1' },
    { id: '2', name: 'Aula 102', capacity: 25, school_id: '1' },
    { id: '3', name: 'Laboratorio', capacity: 20, school_id: '1' }
  ]);
  
  const [schools] = useState<School[]>([
    {
      id: '1',
      name: 'Escuela Primaria Central',
      address: 'Calle Principal 123',
      description: 'Escuela pública',
      logo_url: ''
    }
  ]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('1');
  
  // Estados de QR y impresión
  const [qrData, setQrData] = useState<Asset | null>(null);
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  
  // Referencias tipadas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrScannerRef = useRef<HTMLVideoElement>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Funciones de cámara mejoradas
  const startCamera = async (): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      setCameraReady(false);
      
      // Detener cualquier stream previo
      stopCamera();
      
      console.log('Solicitando acceso a la cámara...');
      
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Stream obtenido:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata cargada');
          setCameraReady(true);
          setIsLoading(false);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('Video puede reproducirse');
          setCameraReady(true);
          setIsLoading(false);
        };
        
        // Timeout de seguridad
        setTimeout(() => {
          if (!cameraReady) {
            console.log('Activando cámara por timeout');
            setCameraReady(true);
            setIsLoading(false);
          }
        }, 3000);
      }
      
      setCurrentStep('camera');
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No se pudo acceder a la cámara: ${errorMsg}`);
      setIsLoading(false);
      setCameraReady(false);
    }
  };

  const stopCamera = (): void => {
    console.log('Deteniendo cámara...');
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

  const capturePhoto = (): void => {
    console.log('Capturando foto...');
    
    if (!videoRef.current || !canvasRef.current) {
      setError('Error: Referencias de video o canvas no disponibles');
      return;
    }
    
    if (!cameraReady) {
      setError('La cámara no está lista. Por favor espere.');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setError('Error al obtener contexto del canvas');
      return;
    }
    
    // Verificar que el video tiene dimensiones válidas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('El video no tiene dimensiones válidas. Intente nuevamente.');
      return;
    }
    
    console.log('Dimensiones del video:', video.videoWidth, 'x', video.videoHeight);
    
    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0);
    
    try {
      // Convertir a blob y luego a data URL
      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Error al generar la imagen');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log('Foto capturada exitosamente');
          setCapturedImage(result);
          setAssetData(prev => ({ ...prev, image_url: result }));
          setCurrentStep('form');
          setSuccess('Foto capturada exitosamente');
          stopCamera();
        };
        reader.onerror = () => {
          setError('Error al procesar la imagen capturada');
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.8);
    } catch (err) {
      console.error('Error al capturar foto:', err);
      setError('Error al procesar la imagen');
    }
  };

  // Funciones del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setAssetData(prev => ({
      ...prev,
      [name]: name === 'value_estimate' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCategoryChange = (categoryId: string): void => {
    setSelectedCategory(categoryId);
    setAssetData(prev => ({ ...prev, template_id: '' }));
  };

  const handleSchoolChange = (schoolId: string): void => {
    setSelectedSchool(schoolId);
    setAssetData(prev => ({ ...prev, classroom_id: '' }));
  };

  // Crear activo (simulado)
  const createAsset = async (): Promise<void> => {
    if (!assetData.template_id || !assetData.classroom_id) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const selectedTemplate = templates.find(t => t.id === assetData.template_id);
      
      const newAsset: Asset = {
        ...assetData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        template: selectedTemplate!,
        qr_code: {
          id: 'qr-' + Date.now(),
          asset_id: Date.now().toString(),
          qr_url: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12">QR Code for Asset ${assetData.serial_number}</text></svg>`,
          payload: { asset_id: Date.now().toString() }
        }
      };
      
      setQrData(newAsset);
      setSuccess('¡Activo creado exitosamente!');
      setCurrentStep('qr-result');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al crear el activo: ' + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Conectar impresora Bluetooth
  const connectBluetoothPrinter = async (): Promise<void> => {
    if (!navigator.bluetooth) {
      setError('Bluetooth no es compatible con este navegador');
      return;
    }

    setPrinterStatus('connecting');
    
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt?.connect();
      if (server) {
        setBluetoothDevice(device);
        setPrinterStatus('connected');
        setSuccess('Impresora conectada exitosamente');
      }
    } catch (err) {
      setPrinterStatus('disconnected');
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error conectando impresora: ' + errorMsg);
    }
  };

  // Descargar QR
  const downloadQR = (): void => {
    if (!qrData?.qr_code?.qr_url) return;
    
    const link = document.createElement('a');
    link.href = qrData.qr_code.qr_url;
    link.download = `qr-${qrData.serial_number || 'asset'}.png`;
    link.click();
  };

  // Resetear estado
  const resetState = (): void => {
    setCurrentStep('menu');
    setIsOpen(false);
    setCapturedImage(null);
    setAssetData({
      template_id: '',
      serial_number: '',
      purchase_date: new Date().toISOString().split('T')[0],
      value_estimate: 0,
      image_url: '',
      status: 'available',
      classroom_id: ''
    });
    setQrData(null);
    setError(null);
    setSuccess(null);
    setSelectedCategory('');
    setCameraReady(false);
    stopCamera();
  };

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <>
      {/* Botón flotante principal */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            if (isOpen) {
              resetState();
            } else {
              setIsOpen(true);
            }
          }}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            isOpen 
              ? 'bg-red-500 hover:bg-red-600 rotate-45' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Menú de opciones */}
        {isOpen && currentStep === 'menu' && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 min-w-[250px] border">
            <h3 className="font-semibold text-gray-900 mb-3">Gestión de Activos</h3>
            
            <div className="space-y-2">
              <button
                onClick={startCamera}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-gray-200"
              >
                <Camera className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Crear Activo</div>
                  <div className="text-sm text-gray-500">Tomar foto y registrar</div>
                </div>
              </button>
              
              <button
                onClick={() => setCurrentStep('scanner')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left border border-gray-200"
              >
                <Scan className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Escanear QR</div>
                  <div className="text-sm text-gray-500">Ver información del activo</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal fullscreen */}
      {isOpen && currentStep !== 'menu' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentStep === 'camera' && 'Capturar Imagen'}
                {currentStep === 'form' && 'Registrar Activo'}
                {currentStep === 'qr-result' && 'Código QR Generado'}
                {currentStep === 'scanner' && 'Escanear QR'}
              </h2>
              <button
                onClick={resetState}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido según el paso */}
            <div className="p-4">
              {/* Vista de cámara */}
              {currentStep === 'camera' && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                        <div className="text-white text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p>Iniciando cámara...</p>
                        </div>
                      </div>
                    )}
                    
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    
                    {cameraReady && (
                      <button
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:scale-105 transition-all"
                      >
                        <Camera className="w-6 h-6 text-gray-700" />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      {isLoading 
                        ? 'Iniciando cámara...' 
                        : cameraReady 
                        ? 'Posiciona el activo en el centro y toca el botón para capturar'
                        : 'Cargando cámara...'
                      }
                    </p>
                    {!cameraReady && !isLoading && (
                      <button
                        onClick={startCamera}
                        className="text-blue-600 text-sm underline"
                      >
                        Reintentar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Formulario */}
              {currentStep === 'form' && (
                <div className="space-y-4">
                  {capturedImage && (
                    <div className="text-center">
                      <img 
                        src={capturedImage} 
                        alt="Capturada" 
                        className="w-24 h-24 object-cover rounded-lg mx-auto mb-4 border border-gray-200"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Escuela *
                    </label>
                    <select
                      value={selectedSchool}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar escuela</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aula *
                    </label>
                    <select
                      name="classroom_id"
                      value={assetData.classroom_id}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!selectedSchool}
                    >
                      <option value="">Seleccionar aula</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} (Capacidad: {classroom.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plantilla *
                    </label>
                    <select
                      name="template_id"
                      value={assetData.template_id}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!selectedCategory}
                    >
                      <option value="">Seleccionar plantilla</option>
                      {templates
                        .filter(template => template.category_id === selectedCategory)
                        .map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} - {template.manufacturer}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Serie
                    </label>
                    <input
                      type="text"
                      name="serial_number"
                      value={assetData.serial_number}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ingrese número de serie"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Compra
                    </label>
                    <input
                      type="date"
                      name="purchase_date"
                      value={assetData.purchase_date}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Estimado ($)
                    </label>
                    <input
                      type="number"
                      name="value_estimate"
                      value={assetData.value_estimate}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <button
                    onClick={createAsset}
                    disabled={isLoading || !assetData.template_id || !assetData.classroom_id}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        <span>Crear Activo</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Resultado QR */}
              {currentStep === 'qr-result' && qrData && (
                <div className="space-y-4 text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">¡Activo creado exitosamente!</p>
                    <p className="text-sm text-green-600 mt-1">
                      {qrData.template.name} - {qrData.serial_number}
                    </p>
                  </div>

                  {qrData.qr_code?.qr_url && (
                    <div className="bg-white p-4 rounded-lg border">
                      <img 
                        src={qrData.qr_code.qr_url} 
                        alt="Código QR"
                        className="w-48 h-48 mx-auto border border-gray-200 rounded"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Bluetooth className={`h-4 w-4 ${printerStatus === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>
                      Impresora: {printerStatus === 'connected' ? 'Conectada' : 'Desconectada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {printerStatus !== 'connected' && (
                      <button
                        onClick={connectBluetoothPrinter}
                        disabled={printerStatus === 'connecting'}
                        className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Bluetooth className="h-4 w-4" />
                        <span>{printerStatus === 'connecting' ? 'Conectando...' : 'Conectar Impresora'}</span>
                      </button>
                    )}
                    
                    <button
                      onClick={downloadQR}
                      className="flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Descargar QR</span>
                    </button>
                    
                    {printerStatus === 'connected' && (
                      <button
                        onClick={() => setSuccess('Enviando a impresión...')}
                        className="flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Imprimir QR</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        resetState();
                        setIsOpen(true);
                      }}
                      className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crear Otro Activo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Scanner QR */}
              {currentStep === 'scanner' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-800 font-medium">Funcionalidad en desarrollo</p>
                    <p className="text-sm text-blue-600 mt-1">
                      El escáner QR estará disponible próximamente
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setCurrentStep('menu')}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Volver al Menú
                  </button>
                </div>
              )}

              {/* Mensajes de error y éxito */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 text-sm">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-600 text-xs underline mt-1"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-800 text-sm">{success}</p>
                    <button
                      onClick={() => setSuccess(null)}
                      className="text-green-600 text-xs underline mt-1"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default FloatingAssetButton;