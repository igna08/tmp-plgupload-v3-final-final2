"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, X, Save, Printer, Download, Check, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';
const BASE_APP_URL = 'https://issa-qr.vercel.app';

interface School {
  id: string;
  name: string;
  address: string;
  description: string;
  logo_url: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  templates: any[];
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

interface FormData {
  price: string;
  quantity: string;
  school_id: string;
  classroom_id: string;
  template_id: string;
}

interface QRData {
  asset_id: string;
  qr_url: string;
  name: string;
  school: string;
  classroom: string;
  asset_url: string;
}

interface StatusState {
  type: 'success' | 'error' | '';
  message: string;
}

interface BluetoothPrinter {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

type StepType = 'camera' | 'form' | 'qr';

const AssetCreatorFAB: React.FC = () => {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<StepType>('camera');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [bluetoothPrinter, setBluetoothPrinter] = useState<BluetoothPrinter | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [status, setStatus] = useState<StatusState>({ type: '', message: '' });
  const [formData, setFormData] = useState<FormData>({
    price: '',
    quantity: '1',
    school_id: '',
    classroom_id: '',
    template_id: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (token) {
      loadSchools();
      loadCategories();
      loadTemplates();
    }
  }, [token]);

  useEffect(() => {
    if (selectedSchool && token) {
      loadClassrooms(selectedSchool);
    }
  }, [selectedSchool, token]);

  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, []);

  const cleanupCamera = (): void => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      setCameraStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const loadSchools = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/schools/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: School[] = await response.json();
      setSchools(data);
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al cargar escuelas' });
      console.error('Error loading schools:', error);
    }
  };

  const loadCategories = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/categories/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTemplates = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/templates/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Template[] = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadClassrooms = async (schoolId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/schools/${schoolId}/classrooms/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Classroom[] = await response.json();
      setClassrooms(data);
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al cargar aulas' });
      console.error('Error loading classrooms:', error);
    }
  };

  const startCamera = async (): Promise<void> => {
    try {
      setIsLoading(true);
      cleanupCamera();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });
      }
      
      setStatus({ type: 'success', message: 'Cámara lista para capturar' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al acceder a la cámara' });
      console.error('Camera error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const capturePhoto = (): void => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setStatus({ type: 'error', message: 'Video no está listo para capturar' });
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    setCurrentStep('form');
    
    cleanupCamera();
    setStatus({ type: 'success', message: 'Foto capturada exitosamente' });
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!capturedImage) {
      setStatus({ type: 'error', message: 'Por favor capture una foto del objeto' });
      return false;
    }
    if (!formData.template_id) {
      setStatus({ type: 'error', message: 'Seleccione una plantilla' });
      return false;
    }
    if (!formData.school_id) {
      setStatus({ type: 'error', message: 'Seleccione una escuela' });
      return false;
    }
    if (!formData.classroom_id) {
      setStatus({ type: 'error', message: 'Seleccione un aula' });
      return false;
    }
    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity < 1 || quantity > 50) {
      setStatus({ type: 'error', message: 'La cantidad debe estar entre 1 y 50' });
      return false;
    }
    return true;
  };

  const createAsset = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const quantity = parseInt(formData.quantity);
      const createdAssets: QRData[] = [];
      const selectedTemplate = templates.find(t => t.id === formData.template_id);
      const selectedSchoolData = schools.find(s => s.id === formData.school_id);
      const selectedClassroomData = classrooms.find(c => c.id === formData.classroom_id);

      // Crear múltiples activos según la cantidad
      for (let i = 0; i < quantity; i++) {
        setStatus({ 
          type: 'success', 
          message: `Creando activo ${i + 1} de ${quantity}...` 
        });

        // Crear el activo
        const assetResponse = await fetch(`${API_BASE_URL}/assets/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            template_id: formData.template_id,
            serial_number: `SA-${Date.now()}-${i}`,
            purchase_date: new Date().toISOString().split('T')[0],
            value_estimate: parseFloat(formData.price) || 0,
            image_url: capturedImage,
            status: 'available',
            classroom_id: formData.classroom_id
          })
        });

        if (!assetResponse.ok) {
          throw new Error(`Asset creation failed with status: ${assetResponse.status}`);
        }
        const asset = await assetResponse.json();

        // Generar QR para el activo
        const qrResponse = await fetch(`${API_BASE_URL}/assets/${asset.id}/qr-codes/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!qrResponse.ok) {
          throw new Error(`QR generation failed with status: ${qrResponse.status}`);
        }
        const qr = await qrResponse.json();

        const assetUrl = `${BASE_APP_URL}/assets/${asset.id}`;

        createdAssets.push({
          asset_id: asset.id,
          qr_url: qr.qr_url,
          name: selectedTemplate?.name || 'Activo',
          school: selectedSchoolData?.name || '',
          classroom: selectedClassroomData?.name || '',
          asset_url: assetUrl
        });

        // Pequeña pausa entre creaciones
        if (i < quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Guardar todos los activos creados para impresión
      setQrData(createdAssets[0]); // Mostrar el primero
      // Guardar todos en el estado para impresión posterior
      (window as any).createdAssets = createdAssets;

      setCurrentStep('qr');
      setStatus({ 
        type: 'success', 
        message: `¡${quantity} activo${quantity > 1 ? 's' : ''} creado${quantity > 1 ? 's' : ''} exitosamente!` 
      });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al crear los activos' });
      console.error('Error creating assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectBluetooth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }]
      });
      
      if (!device.gatt) {
        throw new Error('GATT not available');
      }
      
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
      setBluetoothPrinter({ device, characteristic });
      setStatus({ type: 'success', message: 'Impresora conectada exitosamente' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al conectar con la impresora' });
      console.error('Bluetooth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTSPLSticker = (data: QRData): string => {
    const assetUrl = data.asset_url || `${BASE_APP_URL}/assets/${data.asset_id}`;
    const aulaInfo = data.classroom || "AULA";
    const itemInfo = data.name || "";
    const assetId = `ID: ${data.asset_id.substring(0, 8)}`;

    // Calcular tamaño de fuente según longitud del texto
    const getTextSize = (text: string, maxChars: number, maxSize: number): number => {
      if (text.length <= maxChars) return maxSize;
      if (text.length <= maxChars * 1.5) return maxSize - 1;
      return Math.max(1, maxSize - 2);
    };

    // Función para dividir texto largo en múltiples líneas
    const splitText = (text: string, maxCharsPerLine: number): string[] => {
      if (text.length <= maxCharsPerLine) return [text];
      
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      
      if (currentLine) lines.push(currentLine);
      return lines.slice(0, 2); // Máximo 2 líneas
    };

    // Configuración del aula
    const aulaSize = getTextSize(aulaInfo, 12, 3);
    const aulaLines = splitText(aulaInfo, 15);
    
    // Configuración del nombre del item
    const itemSize = getTextSize(itemInfo, 15, 2);
    const itemLines = splitText(itemInfo, 20);

    // Generar comandos TSPL
    let tspl = `SIZE 50 mm,25 mm
GAP 2 mm,0
DIRECTION 1
DENSITY 8
CLS
QRCODE 15,30,M,4,A,0,M2,S7,"${assetUrl}"
`;

    // Texto comienza en la mitad derecha
    const textStartX = 207;

    // Agregar texto del aula
    let yPos = 25;
    aulaLines.forEach((line, index) => {
      tspl += `TEXT ${textStartX},${yPos + (index * 40)},"${aulaSize}",0,1,1,"${line}"\n`;
    });

    // Agregar texto del nombre
    yPos = aulaLines.length > 1 ? 105 : 75;
    itemLines.forEach((line, index) => {
      tspl += `TEXT ${textStartX},${yPos + (index * 35)},"${itemSize}",0,1,1,"${line}"\n`;
    });

    // Agregar ID en la parte inferior
    yPos = itemLines.length > 1 ? 175 : (aulaLines.length > 1 ? 155 : 140);
    tspl += `TEXT ${textStartX},${yPos},"1",0,1,1,"${assetId}"\n`;

    tspl += `PRINT 1\n`;

    return tspl;
  };

  const sendTSPLCommands = async (tsplString: string): Promise<void> => {
    if (!bluetoothPrinter?.characteristic) {
      throw new Error('Impresora Bluetooth no conectada');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(tsplString);

    const chunkSize = 512;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
      await bluetoothPrinter.characteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const printMultipleStickers = async (): Promise<void> => {
    const assetsToPrint = (window as any).createdAssets as QRData[] || [qrData];
    
    if (assetsToPrint.length === 0 || !assetsToPrint[0]) {
      throw new Error('No hay activos para imprimir');
    }

    if (!bluetoothPrinter) {
      await connectBluetooth();
      if (!bluetoothPrinter) return;
    }

    try {
      setIsLoading(true);
      
      for (let i = 0; i < assetsToPrint.length; i++) {
        const asset = assetsToPrint[i];
        setStatus({
          type: 'success',
          message: `Imprimiendo etiqueta ${i + 1} de ${assetsToPrint.length}...`
        });

        const tsplCommands = generateTSPLSticker(asset);
        await sendTSPLCommands(tsplCommands);
        
        // Pausa entre impresiones
        if (i < assetsToPrint.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setStatus({
        type: 'success',
        message: `${assetsToPrint.length} etiqueta${assetsToPrint.length > 1 ? 's' : ''} impresa${assetsToPrint.length > 1 ? 's' : ''} correctamente`
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Error al imprimir etiquetas: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = (): void => {
    cleanupCamera();
    setCurrentStep('camera');
    setCapturedImage(null);
    setQrData(null);
    (window as any).createdAssets = null;
    setFormData({
      price: '',
      quantity: '1',
      school_id: '',
      classroom_id: '',
      template_id: ''
    });
    setSelectedSchool('');
    setClassrooms([]);
    setStatus({ type: '', message: '' });
  };

  const handleClose = (): void => {
    cleanupCamera();
    setIsExpanded(false);
    resetForm();
  };

  const handleStepBack = (): void => {
    if (currentStep === 'form') {
      cleanupCamera();
      setCurrentStep('camera');
    }
  };

  const StatusIndicator: React.FC = () => {
    if (!status.message) return null;
    
    return (
      <div className={`flex items-center p-3 rounded-lg mb-4 ${
        status.type === 'error' 
          ? 'bg-red-50 border-l-4 border-red-500' 
          : 'bg-green-50 border-l-4 border-green-500'
      }`}>
        {status.type === 'error' ? (
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
        ) : (
          <Check className="w-5 h-5 text-green-500 mr-2" />
        )}
        <span className={`text-sm ${
          status.type === 'error' ? 'text-red-700' : 'text-green-700'
        }`}>
          {status.message}
        </span>
      </div>
    );
  };

  const downloadQR = async (): Promise<void> => {
    if (!qrData || !qrData.qr_url) return;

    try {
      if (qrData.qr_url.startsWith('data:')) {
        const link = document.createElement('a');
        link.download = `QR_${qrData.name}_${Date.now()}.png`;
        link.href = qrData.qr_url;
        link.click();
        return;
      }

      const response = await fetch(qrData.qr_url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch QR image');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `QR_${qrData.name}_${Date.now()}.png`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
      
      setStatus({ type: 'success', message: 'QR descargado exitosamente' });
    } catch (error) {
      console.error('Error downloading QR:', error);
      setStatus({ type: 'error', message: 'Error al descargar el QR' });
    }
  };

  return (
    <>
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all duration-300 hover:scale-110 z-50"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Crear Activo</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <StatusIndicator />

              {currentStep === 'camera' && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover rounded-lg bg-gray-900"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={startCamera}
                      disabled={!!cameraStream || isLoading}
                      className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Camera className="w-5 h-5 mr-2" />
                      )}
                      {cameraStream ? 'Cámara Activa' : 'Activar Cámara'}
                    </button>
                    
                    {cameraStream && (
                      <button
                        onClick={capturePhoto}
                        className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 'form' && (
                <div className="space-y-4">
                  {capturedImage && (
                    <div className="text-center mb-4">
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-32 h-32 object-cover rounded-lg mx-auto shadow-md"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plantilla del Activo *
                    </label>
                    <select
                      value={formData.template_id}
                      onChange={(e) => handleInputChange('template_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Seleccionar plantilla</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.category?.name || 'Sin categoría'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aula *
                    </label>
                    <select
                      value={formData.classroom_id}
                      onChange={(e) => handleInputChange('classroom_id', e.target.value)}
                      disabled={!selectedSchool}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Seleccionar aula</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleStepBack}
                      className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-medium"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={createAsset}
                      disabled={isLoading}
                      className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    >
                      {isLoading ? (
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Save className="w-5 h-5 mr-2" />
                      )}
                      {formData.quantity && parseInt(formData.quantity) > 1 
                        ? `Crear ${formData.quantity} Activos` 
                        : 'Crear Activo'}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'qr' && qrData && (
                <div className="space-y-4 text-center">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-green-800">
                      ¡{((window as any).createdAssets?.length || 1) > 1 
                        ? 'Activos Creados' 
                        : 'Activo Creado'}!
                    </h3>
                    <p className="text-green-600">
                      {((window as any).createdAssets?.length || 1) > 1 
                        ? `Se crearon ${(window as any).createdAssets?.length} activos con sus códigos QR` 
                        : 'El código QR ha sido generado'}
                    </p>
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="w-32 h-32 bg-white border-2 border-gray-300 mx-auto mb-3 flex items-center justify-center overflow-hidden rounded-lg">
                      {qrData.qr_url ? (
                        <img 
                          src={qrData.qr_url} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Error loading QR image:', qrData.qr_url);
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center" style={{display: qrData.qr_url ? 'none' : 'flex'}}>
                        <span className="text-xs text-gray-500 text-center">
                          {qrData.qr_url ? 'Cargando QR...' : 'QR no disponible'}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-medium">{qrData.name}</h4>
                    <p className="text-sm text-gray-600">{qrData.school} - {qrData.classroom}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {((window as any).createdAssets?.length || 1) > 1 
                        ? `${(window as any).createdAssets?.length} activos con IDs únicos` 
                        : `ID: ${qrData.asset_id.substring(0, 8)}...`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => printMultipleStickers()}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Printer className="w-5 h-5 mr-2" />
                      )}
                      Imprimir {((window as any).createdAssets?.length || 1) > 1 
                        ? `${(window as any).createdAssets?.length} Etiquetas` 
                        : 'Etiqueta'}
                    </button>

                    <button
                      onClick={downloadQR}
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center hover:bg-gray-700"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Descargar QR
                    </button>

                    <button
                      onClick={resetForm}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700"
                    >
                      Crear Otro Activo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssetCreatorFAB;>
                    <p className="text-xs text-gray-500 mt-1">
                      El nombre de la plantilla se usará para identificar el activo
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio estimado (unitario)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad de activos a crear *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Solo permitir números
                        if (value === '' || /^\d+$/.test(value)) {
                          handleInputChange('quantity', value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.quantity && parseInt(formData.quantity) > 0 
                        ? `Se crearán ${formData.quantity} activo${parseInt(formData.quantity) > 1 ? 's' : ''} individual${parseInt(formData.quantity) > 1 ? 'es' : ''} con IDs únicos`
                        : 'Ingrese la cantidad de activos a crear (1-50)'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Escuela *
                    </label>
                    <select
                      value={formData.school_id}
                      onChange={(e) => {
                        setSelectedSchool(e.target.value);
                        handleInputChange('school_id', e.target.value);
                        handleInputChange('classroom_id', '');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
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
                      value={formData.classroom_id}
                      onChange={(e) => handleInputChange('classroom_id', e.target.value)}
                      disabled={!selectedSchool}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Seleccionar aula</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleStepBack}
                      className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-medium"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={createAsset}
                      disabled={isLoading}
                      className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    >
                      {isLoading ? (
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Save className="w-5 h-5 mr-2" />
                      )}
                      {formData.quantity && parseInt(formData.quantity) > 1 
                        ? `Crear ${formData.quantity} Activos` 
                        : 'Crear Activo'}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'qr' && qrData && (
                <div className="space-y-4 text-center">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-green-800">
                      ¡{((window as any).createdAssets?.length || 1) > 1 
                        ? 'Activos Creados' 
                        : 'Activo Creado'}!
                    </h3>
                    <p className="text-green-600">
                      {((window as any).createdAssets?.length || 1) > 1 
                        ? `Se crearon ${(window as any).createdAssets?.length} activos con sus códigos QR` 
                        : 'El código QR ha sido generado'}
                    </p>
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="w-32 h-32 bg-white border-2 border-gray-300 mx-auto mb-3 flex items-center justify-center overflow-hidden rounded-lg">
                      {qrData.qr_url ? (
                        <img 
                          src={qrData.qr_url} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Error loading QR image:', qrData.qr_url);
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center" style={{display: qrData.qr_url ? 'none' : 'flex'}}>
                        <span className="text-xs text-gray-500 text-center">
                          {qrData.qr_url ? 'Cargando QR...' : 'QR no disponible'}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-medium">{qrData.name}</h4>
                    <p className="text-sm text-gray-600">{qrData.school} - {qrData.classroom}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {((window as any).createdAssets?.length || 1) > 1 
                        ? `${(window as any).createdAssets?.length} activos con IDs únicos` 
                        : `ID: ${qrData.asset_id.substring(0, 8)}...`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => printMultipleStickers()}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Printer className="w-5 h-5 mr-2" />
                      )}
                      Imprimir {((window as any).createdAssets?.length || 1) > 1 
                        ? `${(window as any).createdAssets?.length} Etiquetas` 
                        : 'Etiqueta'}
                    </button>

                    <button
                      onClick={downloadQR}
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center hover:bg-gray-700"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Descargar QR
                    </button>

                    <button
                      onClick={resetForm}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700"
                    >
                      Crear Otro Activo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssetCreatorFAB;
