"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Camera, 
  QrCode, 
  X, 
  Upload,
  Download,
  Printer,
  Check,
  AlertCircle,
  Loader2,
  Scan,
  Save,
  Bluetooth
} from 'lucide-react';
import jsQR from "jsqr";

// Interfaces para TypeScript
interface AssetTemplate {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  model_number: string;
  category_id: string;
  category: {
    id: string;
    name: string;
  };
}

interface AssetCategory {
  id: string;
  name: string;
  description: string;
}

interface QRCodeData {
  asset_id: string;
  id: string;
  qr_url: string;
  payload: any;
}

interface NewAssetData {
  template_id: string;
  serial_number: string;
  purchase_date: string;
  value_estimate: number;
  image_url?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  classroom_id?: string;
}

interface ScannedAsset {
  id: string;
  serial_number: string;
  status: string;
  template: {
    name: string;
    manufacturer: string;
    model_number: string;
  };
  image_url?: string;
  purchase_date: string;
  value_estimate: number;
}

const FloatingAssetButton: React.FC = () => {
  // Estados principales
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'menu' | 'create' | 'scan' | 'camera' | 'form' | 'qr-generated'>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados para crear activo
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [templates, setTemplates] = useState<AssetTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedQR, setGeneratedQR] = useState<QRCodeData | null>(null);

  // Estados para formulario de activo
  const [formData, setFormData] = useState<Partial<NewAssetData>>({
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    value_estimate: 0,
    status: 'available'
  });

  // Estados para escáner QR
  const [scannedData, setScannedData] = useState<ScannedAsset | null>(null);
  const [isScanning, setIsScanning] = useState(false);
const [qrDetector, setQrDetector] = useState<typeof jsQR | null>(null);

  // Estados para impresión Bluetooth
  const [printerConnected, setPrinterConnected] = useState(false);
  const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | null>(null);
  const [bluetoothServer, setBluetoothServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [printerCharacteristic, setPrinterCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  // Referencias
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);

  const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

  // Efectos
  useEffect(() => {
    if (isOpen && currentView === 'create') {
      fetchCategories();
    }
  }, [isOpen, currentView]);

  useEffect(() => {
    if (selectedCategory) {
      fetchTemplatesByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    // Importar jsQR dinámicamente

  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      stopCamera();
    };
  }, []);

  // Funciones de API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/categories/`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplatesByCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/assets/templates/by_category/${categoryId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Error al cargar plantillas');
      const data = await response.json();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const uploadImageToServer = async (imageDataUrl: string): Promise<string> => {
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', blob, 'asset-image.jpg');
    
    const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      body: formDataUpload,
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Error al subir imagen');
    }
    
    const uploadData = await uploadResponse.json();
    return uploadData.url || uploadData.image_url;
  };

  const createAsset = async () => {
    try {
      setLoading(true);
      setError(null);

      let imageUrl = undefined;
      if (capturedImage) {
        try {
          imageUrl = await uploadImageToServer(capturedImage);
        } catch (imgError) {
          console.warn('Error al subir imagen, continuando sin imagen:', imgError);
        }
      }

      const assetData: NewAssetData = {
        template_id: selectedTemplate,
        serial_number: formData.serial_number || '',
        purchase_date: formData.purchase_date || new Date().toISOString().split('T')[0],
        value_estimate: formData.value_estimate || 0,
        status: formData.status || 'available',
        image_url: imageUrl
      };

      const response = await fetch(`${API_BASE_URL}/assets/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear el activo');
      }
      
      const createdAsset = await response.json();
      
      if (createdAsset.qr_code) {
        setGeneratedQR(createdAsset.qr_code);
        setCurrentView('qr-generated');
        setSuccess('Activo creado exitosamente');
      } else {
        await generateQRForAsset(createdAsset.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear activo');
    } finally {
      setLoading(false);
    }
  };

  const generateQRForAsset = async (assetId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/qr-codes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error al generar QR');
      
      const qrData = await response.json();
      setGeneratedQR(qrData);
      setCurrentView('qr-generated');
      setSuccess('QR generado exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error al generar QR');
    }
  };

  const getAssetByQR = async (qrCodeId: string) => {
    try {
      setLoading(true);
      setError(null);

      const qrResponse = await fetch(`${API_BASE_URL}/qr-codes/${qrCodeId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!qrResponse.ok) throw new Error('QR no válido o no encontrado');
      const qrData = await qrResponse.json();
      
      const assetResponse = await fetch(`${API_BASE_URL}/assets/${qrData.asset_id}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!assetResponse.ok) throw new Error('Error al cargar información del activo');
      const assetData = await assetResponse.json();
      
      setScannedData(assetData);
      setSuccess('Activo encontrado correctamente');
    } catch (err: any) {
      setError(err.message || 'Error al buscar activo');
      setScannedData(null);
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

// Funciones de cámara corregidas
const startCamera = async () => {
  try {
    setError(null);
    setLoading(true);
    
    // Verificar si getUserMedia está disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('La cámara no es compatible con este navegador');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 }
      } 
    });
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      
      // Esperar a que el video esté listo
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => {
          setCurrentView('camera');
          setLoading(false);
        }).catch((playError) => {
          console.error('Error al reproducir video:', playError);
          setError('Error al iniciar la vista de cámara');
          setLoading(false);
        });
      };

      // Timeout de seguridad
      setTimeout(() => {
        if (loading) {
          setLoading(false);
          setCurrentView('camera');
        }
      }, 3000);
    }
  } catch (err) {
    console.error('Error al acceder a la cámara:', err);
    setError('No se pudo acceder a la cámara. Verifique los permisos del navegador.');
    setLoading(false);
  }
};

const capturePhoto = () => {
  if (!videoRef.current || !canvasRef.current) {
    setError('Error: elementos de cámara no disponibles');
    return;
  }

  const video = videoRef.current;
  const canvas = canvasRef.current;
  const context = canvas.getContext('2d');
  
  if (!context) {
    setError('Error al procesar la imagen');
    return;
  }

  // Verificar que el video tenga dimensiones válidas
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    setError('La cámara aún no está lista. Intente nuevamente.');
    return;
  }
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  try {
    context.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (imageData && imageData !== 'data:,') {
      setCapturedImage(imageData);
      stopCamera();
      setCurrentView('form');
      setSuccess('Foto capturada correctamente');
    } else {
      setError('Error al capturar la imagen. Intente nuevamente.');
    }
  } catch (captureError) {
    console.error('Error al capturar foto:', captureError);
    setError('Error al procesar la imagen capturada');
  }
};

const stopCamera = () => {
  try {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsScanning(false);
  } catch (error) {
    console.error('Error al detener la cámara:', error);
  }
};

// Función QR Scanner corregida
const startQRScanner = async () => {
  try {
    setError(null);
    setScannedData(null);
    setIsScanning(true);
    setLoading(true);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('La cámara no es compatible con este navegador');
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 }
      } 
    });
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => {
          setCurrentView('scan');
          setLoading(false);
          // Iniciar el escaneo después de un pequeño delay
          setTimeout(() => {
            scanQRCode();
          }, 500);
        }).catch((playError) => {
          console.error('Error al reproducir video:', playError);
          setError('Error al iniciar la vista de escaneo');
          setLoading(false);
          setIsScanning(false);
        });
      };

      // Timeout de seguridad
      setTimeout(() => {
        if (loading) {
          setLoading(false);
          setCurrentView('scan');
          scanQRCode();
        }
      }, 3000);
    }
  } catch (err) {
    console.error('Error al acceder a la cámara para escanear:', err);
    setError('No se pudo acceder a la cámara para escanear. Verifique los permisos.');
    setLoading(false);
    setIsScanning(false);
  }
};

const scanQRCode = () => {
  if (!isScanning || !videoRef.current || !scanCanvasRef.current) {
    return;
  }

  const video = videoRef.current;
  const canvas = scanCanvasRef.current;
  const context = canvas.getContext('2d');

  if (video.readyState === video.HAVE_ENOUGH_DATA && context && video.videoWidth > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Usar jsQR directamente ya que está importado
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code && code.data) {
        console.log('QR detectado:', code.data);
        setIsScanning(false);
        stopCamera();
        
        // Extraer ID del QR (asumiendo que el QR contiene directamente el ID)
        const qrId = code.data;
        getAssetByQR(qrId);
        return;
      }
    } catch (err) {
      console.error('Error en detección QR:', err);
    }
  }

  if (isScanning) {
    animationRef.current = requestAnimationFrame(scanQRCode);
  }
};
  // Funciones de Bluetooth e impresión
  const connectBluetoothPrinter = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!navigator.bluetooth) {
        throw new Error('Bluetooth no es compatible en este dispositivo');
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] },
          { namePrefix: 'POS-' },
          { namePrefix: 'Printer' },
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('No se pudo conectar al dispositivo');

      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      setPrinterDevice(device);
      setBluetoothServer(server);
      setPrinterCharacteristic(characteristic);
      setPrinterConnected(true);
      setSuccess('Impresora conectada correctamente');

      device.addEventListener('gattserverdisconnected', () => {
        setPrinterConnected(false);
        setPrinterDevice(null);
        setBluetoothServer(null);
        setPrinterCharacteristic(null);
      });

    } catch (err: any) {
      setError('Error al conectar impresora: ' + err.message);
      setPrinterConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const printQRCode = async () => {
    if (!generatedQR || !printerConnected || !printerCharacteristic) {
      if (!printerConnected) {
        await connectBluetoothPrinter();
        return;
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => reject(new Error('Error al cargar imagen QR'));
        qrImage.src = generatedQR.qr_url;
      });

      const printData = await generateESCPOSData(qrImage, generatedQR);
await printerCharacteristic.writeValue(new Uint8Array(printData));
      
      setSuccess('QR impreso correctamente');
    } catch (err: any) {
      setError('Error al imprimir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateESCPOSData = async (image: HTMLImageElement, qrData: QRCodeData): Promise<Uint8Array> => {
    const ESC = 0x1B;
    const GS = 0x1D;
    
    const commands: number[] = [
      ESC, 0x40, // Reset
      ESC, 0x61, 0x01, // Centrar texto
    ];

    const headerText = `ACTIVO: ${qrData.asset_id}\n`;
    commands.push(...Array.from(new TextEncoder().encode(headerText)));
    commands.push(0x0A, 0x0A);

    commands.push(...[
      GS, 0x76, 0x30, 0x00,
      0x20, 0x00, 0x20, 0x00,
    ]);

    const imageData = new Array(128).fill(0xFF);
    commands.push(...imageData);

    const footerText = `\nFecha: ${new Date().toLocaleDateString()}\n`;
    commands.push(...Array.from(new TextEncoder().encode(footerText)));
    
    commands.push(...[0x0A, 0x0A, 0x0A, GS, 0x56, 0x00]);

    return new Uint8Array(commands);
  };

  const downloadQRCode = async () => {
    if (!generatedQR?.qr_url) return;
    
    try {
      const response = await fetch(generatedQR.qr_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-asset-${generatedQR.asset_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      setSuccess('QR descargado correctamente');
    } catch (err: any) {
      setError('Error al descargar QR: ' + err.message);
    }
  };

  // Funciones de UI
  const closeModal = () => {
    setIsOpen(false);
    setCurrentView('menu');
    setError(null);
    setSuccess(null);
    setCapturedImage(null);
    setGeneratedQR(null);
    setScannedData(null);
    setSelectedCategory('');
    setSelectedTemplate('');
    setFormData({
      serial_number: '',
      purchase_date: new Date().toISOString().split('T')[0],
      value_estimate: 0,
      status: 'available'
    });
    stopCamera();
  };

  const goBack = () => {
    if (currentView === 'camera' || currentView === 'scan') {
      stopCamera();
    }
    
    switch (currentView) {
      case 'create':
      case 'scan':
        setCurrentView('menu');
        break;
      case 'camera':
        setCurrentView('create');
        break;
      case 'form':
        setCurrentView('create');
        setCapturedImage(null);
        break;
      case 'qr-generated':
        closeModal();
        break;
      default:
        closeModal();
    }
  };

  const handleFormChange = (field: keyof NewAssetData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Render condicional de vistas
  const renderContent = () => {
    switch (currentView) {
      case 'menu':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 text-center">
              Gestión de Activos
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Selecciona una acción para continuar
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  clearMessages();
                  setCurrentView('create');
                }}
                className="w-full flex items-center space-x-4 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all duration-200 group"
              >
                <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-blue-900 font-semibold">Crear Nuevo Activo</h4>
                  <p className="text-blue-700 text-sm">Captura foto y registra activo</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  clearMessages();
                  startQRScanner();
                }}
                className="w-full flex items-center space-x-4 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all duration-200 group"
              >
                <div className="p-2 bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-green-900 font-semibold">Escanear Código QR</h4>
                  <p className="text-green-700 text-sm">Buscar información de activo</p>
                </div>
              </button>
            </div>
          </div>
        );

      case 'create':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Crear Nuevo Activo</h3>
              <p className="text-sm text-gray-600 mt-1">Completa la información básica</p>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Cargando datos...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Categoría del Activo
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">-- Seleccionar categoría --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {selectedCategory && templates.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Plantilla del Producto
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">-- Seleccionar plantilla --</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} - {template.manufacturer}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedTemplate && (
                  <div className="pt-2">
                    <button
                      onClick={startCamera}
                      className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                    >
                      <Camera className="h-6 w-6" />
                      <span>Capturar Foto del Activo</span>
                    </button>
                  </div>
                )}

                {selectedCategory && templates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No hay plantillas disponibles para esta categoría</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

case 'camera':
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Capturar Foto</h3>
        <p className="text-sm text-gray-600">Posiciona el activo en el centro del marco</p>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Inicializando cámara...</p>
          <p className="text-sm text-gray-500">Por favor, permite el acceso a la cámara</p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-80 object-cover"
            />
            
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
              <div className="absolute top-4 left-4 right-4 text-center">
                <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Centra el objeto aquí
                </span>
              </div>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <button
            onClick={capturePhoto}
            className="w-full flex items-center justify-center space-x-3 p-4 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200 font-semibold"
          >
            <Camera className="h-6 w-6" />
            <span>Capturar Foto</span>
          </button>
        </>
      )}
    </div>
  );
      case 'form':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Datos del Activo</h3>
              <p className="text-sm text-gray-600">Completa la información requerida</p>
            </div>
            
            {capturedImage && (
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Activo capturado"
                  className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                />
                <button
                  onClick={() => setCurrentView('camera')}
                  className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Número de Serie *
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => handleFormChange('serial_number', e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: ABC123456"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleFormChange('purchase_date', e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Valor Estimado ($)
                </label>
                <input
                  type="number"
                  value={formData.value_estimate}
                  onChange={(e) => handleFormChange('value_estimate', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Estado del Activo
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="available">Disponible</option>
                  <option value="in_use">En Uso</option>
                  <option value="maintenance">En Mantenimiento</option>
                  <option value="retired">Retirado</option>
                </select>
              </div>
            </div>

            <button
              onClick={createAsset}
              disabled={loading || !formData.serial_number?.trim()}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Creando Activo...</span>
                </>
              ) : (
                <>
                  <Save className="h-6 w-6" />
                  <span>Crear y Generar QR</span>
                </>
              )}
            </button>
          </div>
        );

      case 'qr-generated':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">¡Activo Creado!</h3>
              <p className="text-sm text-gray-600 mt-1">Código QR generado exitosamente</p>
            </div>
            
            {generatedQR && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white border-2 border-gray-300 rounded-xl">
                      <img
                        src={generatedQR.qr_url}
                        alt="Código QR del Activo"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-gray-700">ID del Activo</p>
                    <p className="text-xs font-mono bg-gray-100 px-3 py-1 rounded-lg text-gray-800">
                      {generatedQR.asset_id}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={printQRCode}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Imprimiendo...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="h-5 w-5" />
                        <span>
                          {printerConnected ? 'Imprimir QR' : 'Conectar e Imprimir'}
                        </span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={downloadQRCode}
                    className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                  >
                    <Download className="h-5 w-5" />
                    <span>Descargar QR</span>
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-2 text-sm">
                  <Bluetooth className={`h-4 w-4 ${printerConnected ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={printerConnected ? 'text-green-700' : 'text-gray-600'}>
                    {printerConnected ? 'Impresora conectada' : 'Sin impresora conectada'}
                  </span>
                </div>

                {!printerConnected && (
                  <button
                    onClick={connectBluetoothPrinter}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-xl transition-all duration-200 text-sm font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <Bluetooth className="h-4 w-4" />
                        <span>Conectar Impresora Bluetooth</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        );

case 'scan':
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Escanear Código QR</h3>
        <p className="text-sm text-gray-600">Apunta la cámara hacia el código QR</p>
      </div>
      
      {scannedData ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Check className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Activo Encontrado</h4>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase">Nombre</p>
                  <p className="text-sm text-green-900 font-semibold">{scannedData.template?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase">Estado</p>
                  <p className="text-sm text-green-900 font-semibold capitalize">{scannedData.status}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase">Serie</p>
                  <p className="text-sm text-green-900 font-mono">{scannedData.serial_number}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase">Fabricante</p>
                  <p className="text-sm text-green-900">{scannedData.template?.manufacturer}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase">Modelo</p>
                  <p className="text-sm text-green-900">{scannedData.template?.model_number}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase">Valor</p>
                  <p className="text-sm text-green-900 font-semibold">${scannedData.value_estimate}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-green-700 uppercase">Fecha de Compra</p>
                <p className="text-sm text-green-900">{new Date(scannedData.purchase_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          {scannedData.image_url && (
            <div className="rounded-xl overflow-hidden border-2 border-gray-200">
              <img
                src={scannedData.image_url}
                alt="Imagen del activo"
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <button
            onClick={() => {
              setScannedData(null);
              startQRScanner();
            }}
            className="w-full flex items-center justify-center space-x-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-semibold"
          >
            <QrCode className="h-5 w-5" />
            <span>Escanear Otro Código</span>
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Inicializando escáner...</p>
          <p className="text-sm text-gray-500">Preparando la cámara para escanear QR</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-80 object-cover"
            />
            
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-64 border-2 border-white rounded-2xl opacity-80">
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-blue-400 rounded-br-lg"></div>
                    
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium">
                      <Scan className="inline h-4 w-4 mr-2 animate-pulse" />
                      Escaneando QR...
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <canvas ref={scanCanvasRef} className="hidden" />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-gray-600 text-sm">
              Posiciona el código QR dentro del marco
            </p>
            <p className="text-gray-500 text-xs">
              La detección es automática
            </p>
          </div>
        </div>
      )}
    </div>
  );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Botón Flotante Principal */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transform hover:scale-110"
        >
          <Plus className="h-8 w-8 group-hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>

{/* Modal Principal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
            {/* Overlay con animación */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={closeModal}
            />

            {/* Contenido del Modal */}
            <div className="relative inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all duration-300 w-full max-w-lg mx-auto mt-8 sm:mt-20">
              {/* Header del Modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                <button
                  onClick={goBack}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-colors duration-200 group"
                >
                  <X className="h-6 w-6 text-gray-600 group-hover:text-gray-800" />
                </button>
                
                {/* Indicador de Vista Actual */}
                <div className="flex space-x-1">
                  {['menu', 'create', 'camera', 'form', 'qr-generated'].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        currentView === step ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Contenido Principal */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Mensajes de Error/Éxito */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-medium text-sm">Error</p>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-800 font-medium text-sm">Éxito</p>
                        <p className="text-green-700 text-sm mt-1">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contenido de la Vista */}
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