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

// Efectos

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
  
  // Estados para datos de la API
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  
  // Estados de QR y impresión
  const [qrData, setQrData] = useState<Asset | null>(null);
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);
  
  // Referencias tipadas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrScannerRef = useRef<HTMLVideoElement>(null);

  // Configuración de la API
  const API_BASE = 'https://finalqr-1-2-27-6-25.onrender.com/api';

  // Efectos
  useEffect(() => {
    loadInitialData();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Cargar datos iniciales de la API
  const loadInitialData = async (): Promise<void> => {
    try {
      // Cargar categorías
      const categoriesResponse = await fetch(`${API_BASE}/assets/categories/`);
      if (categoriesResponse.ok) {
        const categoriesData: Category[] = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Cargar escuelas
      const schoolsResponse = await fetch(`${API_BASE}/schools/`);
      if (schoolsResponse.ok) {
        const schoolsData: School[] = await schoolsResponse.json();
        setSchools(schoolsData);
        if (schoolsData.length > 0) {
          setSelectedSchool(schoolsData[0].id);
          await loadClassroomsBySchool(schoolsData[0].id);
        }
      }
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      setError('Error cargando datos iniciales');
    }
  };

  // Cargar aulas por escuela
  const loadClassroomsBySchool = async (schoolId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/schools/${schoolId}/classrooms/`);
      if (response.ok) {
        const classroomsData: Classroom[] = await response.json();
        setClassrooms(classroomsData);
      }
    } catch (err) {
      console.error('Error cargando aulas:', err);
      setError('Error cargando aulas');
    }
  };

  // Cargar templates por categoría
  const loadTemplatesByCategory = async (categoryId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/assets/templates/by_category/${categoryId}`);
      if (response.ok) {
        const templatesData: Template[] = await response.json();
        setTemplates(templatesData);
      }
    } catch (err) {
      console.error('Error cargando templates:', err);
      setError('Error cargando plantillas');
    }
  };

  // Funciones de cámara
  const startCamera = async (): Promise<void> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCurrentStep('camera');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError('No se pudo acceder a la cámara: ' + errorMsg);
    }
  };

  const stopCamera = (): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = (): void => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        setAssetData(prev => ({ ...prev, image_url: result }));
        setCurrentStep('form');
        stopCamera();
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.8);
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
    if (categoryId) {
      loadTemplatesByCategory(categoryId);
    }
  };

  const handleSchoolChange = (schoolId: string): void => {
    setSelectedSchool(schoolId);
    setAssetData(prev => ({ ...prev, classroom_id: '' }));
    if (schoolId) {
      loadClassroomsBySchool(schoolId);
    }
  };

  // Crear activo usando la API
  const createAsset = async (): Promise<void> => {
    if (!assetData.template_id || !assetData.classroom_id) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/assets/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetData)
      });

      if (!response.ok) {
        throw new Error('Error al crear el activo');
      }

      const newAsset: Asset = await response.json();
      
      // El activo ya viene con QR code generado según tu API
      if (newAsset.qr_code) {
        setQrData(newAsset);
        setSuccess('¡Activo creado exitosamente!');
        setCurrentStep('qr-result');
      } else {
        // Generar QR si no viene incluido
        await generateQRCode(newAsset.id);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al crear el activo: ' + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Generar código QR
  const generateQRCode = async (assetId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/assets/${assetId}/qr-codes/`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Error al generar código QR');
      }

      const qrCode: QRCode = await response.json();
      const assetWithQR: Asset = {
        ...assetData,
        id: assetId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        template: templates.find(t => t.id === assetData.template_id)!,
        qr_code: qrCode
      };
      
      setQrData(assetWithQR);
      setSuccess('¡Código QR generado exitosamente!');
      setCurrentStep('qr-result');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al generar QR: ' + errorMsg);
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

  // Imprimir QR
  const printQR = async (): Promise<void> => {
    if (printerStatus === 'connected' && bluetoothDevice && qrData) {
      // Aquí implementarías la lógica específica de impresión
      // Esto depende del protocolo de tu impresora térmica
      setSuccess('Enviando a impresión...');
    } else {
      // Opción de descarga si no hay impresora
      downloadQR();
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

  // Escanear QR
  const startQRScanner = async (): Promise<void> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (qrScannerRef.current) {
        qrScannerRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCurrentStep('scanner');
    } catch (err) {
      setError('No se pudo acceder a la cámara para escanear');
    }
  };

  // Buscar activo por QR (simulado - necesitarías una librería de QR scanner)
  const handleQRScan = async (qrCodeId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/qr-codes/${qrCodeId}`);
      
      if (!response.ok) {
        throw new Error('QR no encontrado');
      }
      
      const qrCode: QRCode = await response.json();
      
      // Obtener datos del activo
      const assetResponse = await fetch(`${API_BASE}/assets/${qrCode.asset_id}`);
      if (assetResponse.ok) {
        const asset: Asset = await assetResponse.json();
        // Mostrar información del activo
        setSuccess(`Activo encontrado: ${asset.template?.name || 'Sin nombre'}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al procesar QR: ' + errorMsg);
    } finally {
      setIsLoading(false);
    }
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
    stopCamera();
  };

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
              : 'bg-black hover:bg-gray-800'
          } text-white`}
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Menú de opciones */}
        {isOpen && currentStep === 'menu' && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 min-w-[250px]">
            <h3 className="font-semibold text-gray-900 mb-3">Gestión de Activos</h3>
            
            <div className="space-y-2">
              <button
                onClick={startCamera}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Camera className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Crear Activo</div>
                  <div className="text-sm text-gray-500">Tomar foto y registrar</div>
                </div>
              </button>
              
              <button
                onClick={startQRScanner}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
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
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <div className="w-12 h-12 bg-white rounded-full"></div>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Posiciona el activo en el centro y toca el botón para capturar
                  </p>
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
                        className="w-24 h-24 object-cover rounded-lg mx-auto mb-4"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Escuela
                    </label>
                    <select
                      value={selectedSchool}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
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
                      Aula
                    </label>
                    <select
                      name="classroom_id"
                      value={assetData.classroom_id}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      disabled={!selectedSchool}
                    >
                      <option value="">Seleccionar aula</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
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
                      Plantilla
                    </label>
                    <select
                      name="template_id"
                      value={assetData.template_id}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      disabled={!selectedCategory}
                    >
                      <option value="">Seleccionar plantilla</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Estimado
                    </label>
                    <input
                      type="number"
                      name="value_estimate"
                      value={assetData.value_estimate}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <button
                    onClick={createAsset}
                    disabled={isLoading}
                    className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                  </div>

                  {qrData.qr_code?.qr_url && (
                    <div className="bg-white p-4 rounded-lg border">
                      <img 
                        src={qrData.qr_code.qr_url} 
                        alt="Código QR"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Bluetooth className={`h-4 w-4 ${printerStatus === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>
                      Impresora: {printerStatus === 'connected' ? 'Conectada' : 'Desconectada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {printerStatus !== 'connected' && (
                      <button
                        onClick={connectBluetoothPrinter}
                        disabled={printerStatus === 'connecting'}
                        className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Bluetooth className="h-4 w-4" />
                        <span>{printerStatus === 'connecting' ? 'Conectando...' : 'Conectar'}</span>
                      </button>
                    )}
                    
                    <button
                      onClick={printQR}
                      className="flex items-center justify-center space-x-2 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Imprimir</span>
                    </button>
                    
                    <button
                      onClick={downloadQR}
                      className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Scanner QR */}
              {currentStep === 'scanner' && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={qrScannerRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Posiciona el código QR dentro del marco
                  </p>
                </div>
              )}

              {/* Mensajes de error y éxito */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-green-800 text-sm">{success}</p>
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

