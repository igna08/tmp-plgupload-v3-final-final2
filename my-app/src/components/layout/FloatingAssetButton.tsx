"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, X, Save, Download, Check, AlertCircle, Loader, FileDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

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
  name: string;
  price: string;
  quantity: number;
  school_id: string;
  classroom_id: string;
  template_id: string;
  use_existing_template: boolean;
  category_id: string;
}

interface QRData {
  asset_id: string;
  qr_url: string;
  name: string;
  school: string;
  classroom: string;
}

interface StatusState {
  type: 'success' | 'error' | '';
  message: string;
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
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [status, setStatus] = useState<StatusState>({ type: '', message: '' });
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    quantity: 1,
    school_id: '',
    classroom_id: '',
    template_id: '',
    use_existing_template: true,
    category_id: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // =====================
  // FUNCIONES TSPL PARA RAWBT
  // =====================

  // Generar comandos TSPL optimizados para etiquetas 50x25mm
  const generateTSPLForRawBT = (qrText: string, name: string, school: string, classroom: string): string => {
    return `SIZE 50 mm, 25 mm
GAP 2 mm, 0
DIRECTION 1
REFERENCE 0,0
OFFSET 0 mm
SET PEEL OFF
SET CUTTER OFF
SET PARTIAL_CUTTER OFF
SET TEAR ON
CLS
QRCODE 10,10,L,4,A,0,"${qrText}"
TEXT 120,20,"2",0,1,1,"${name.substring(0, 18)}"
TEXT 120,45,"1",0,1,1,"${school.substring(0, 15)}"
TEXT 120,65,"1",0,1,1,"${classroom.substring(0, 15)}"
PRINT 1,1
`;
  };

  // Convertir string a hexadecimal
  const stringToHex = (str: string): string => {
    return Array.from(str)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  };

  // Abrir RawBT directamente con el archivo TSPL
  const openRawBTWithTSPL = (qrText: string, name: string, school: string, classroom: string, quantity: number = 1): void => {
    try {
      let tsplContent = `SIZE 50 mm, 25 mm
GAP 2 mm, 0
DIRECTION 1
REFERENCE 0,0
OFFSET 0 mm
SET PEEL OFF
SET CUTTER OFF
SET PARTIAL_CUTTER OFF
SET TEAR ON
CLS
`;

      // Generar múltiples etiquetas si es necesario
      for (let i = 0; i < quantity; i++) {
        tsplContent += `QRCODE 10,10,L,4,A,0,"${qrText}"
TEXT 120,20,"2",0,1,1,"${name.substring(0, 18)}"
TEXT 120,45,"1",0,1,1,"${school.substring(0, 15)}"
TEXT 120,65,"1",0,1,1,"${classroom.substring(0, 15)}"
PRINT 1,1
`;
        
        if (i < quantity - 1) {
          tsplContent += 'CLS\n';
        }
      }

      // Convertir a hexadecimal para RawBT
      const hexContent = stringToHex(tsplContent);
      const rawbtUri = `rawbt://printhex/${hexContent}`;
      
      // Intentar abrir RawBT directamente
      window.location.href = rawbtUri;
      
      setStatus({ 
        type: 'success', 
        message: `Abriendo RawBT con ${quantity} etiqueta(s)...` 
      });
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: 'Error al abrir RawBT. Asegúrate de que esté instalado.' 
      });
      console.error('Error opening RawBT:', error);
    }
  };

  // Función principal para abrir RawBT
  const handleOpenRawBT = (quantity: number = 1): void => {
    if (!qrData) return;
    
    openRawBTWithTSPL(
      qrData.qr_url,
      qrData.name,
      qrData.school,
      qrData.classroom,
      quantity
    );
  };

  // Descargar archivo TSPL como fallback
  const downloadTSPLFile = (tsplContent: string, filename: string = 'etiqueta'): void => {
    try {
      const blob = new Blob([tsplContent], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.tspl`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      setStatus({ 
        type: 'success', 
        message: 'Archivo TSPL descargado como respaldo.' 
      });
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: 'Error al generar archivo TSPL' 
      });
      console.error('Error downloading TSPL:', error);
    }
  };

  const handleDownloadTSPLFallback = (): void => {
    if (!qrData) return;
    
    const tsplContent = generateTSPLForRawBT(
      qrData.qr_url,
      qrData.name,
      qrData.school,
      qrData.classroom
    );
    
    downloadTSPLFile(tsplContent, `QR_${qrData.name}_${Date.now()}`);
  };

  // =====================
  // FUNCIONES ORIGINALES
  // =====================

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
      console.log('Loading schools from:', `${API_BASE_URL}/schools/`);
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
      console.log('Schools loaded:', data);
      setSchools(data);
      setStatus({ type: 'success', message: 'Escuelas cargadas correctamente' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al cargar escuelas' });
      console.error('Error loading schools:', error);
    }
  };

  const loadCategories = async (): Promise<void> => {
    try {
      console.log('Loading categories from:', `${API_BASE_URL}/assets/categories/`);
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
      console.log('Categories loaded:', data);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTemplates = async (): Promise<void> => {
    try {
      console.log('Loading templates from:', `${API_BASE_URL}/assets/templates/`);
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
      console.log('Templates loaded:', data);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadClassrooms = async (schoolId: string): Promise<void> => {
    try {
      console.log('Loading classrooms from:', `${API_BASE_URL}/schools/${schoolId}/classrooms/`);
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
      console.log('Classrooms loaded:', data);
      setClassrooms(data);
      setStatus({ type: 'success', message: 'Aulas cargadas correctamente' });
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

  const handleInputChange = (field: keyof FormData, value: string | number | boolean): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!capturedImage) {
      setStatus({ type: 'error', message: 'Por favor capture una foto del objeto' });
      return false;
    }
    if (!formData.name.trim()) {
      setStatus({ type: 'error', message: 'El nombre es obligatorio' });
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
    if (formData.use_existing_template && !formData.template_id) {
      setStatus({ type: 'error', message: 'Seleccione una plantilla existente o elija crear nueva' });
      return false;
    }
    if (!formData.use_existing_template && !formData.category_id) {
      setStatus({ type: 'error', message: 'Seleccione una categoría para la nueva plantilla' });
      return false;
    }
    return true;
  };

  const createAsset = async (): Promise<void> => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let templateId = formData.template_id;

      if (!formData.use_existing_template) {
        console.log('Creating new template at:', `${API_BASE_URL}/assets/templates/`);
        const templateResponse = await fetch(`${API_BASE_URL}/assets/templates/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            description: `Asset template created via mobile app`,
            manufacturer: 'Generic',
            model_number: 'N/A',
            category_id: formData.category_id || null
          })
        });

        if (!templateResponse.ok) {
          throw new Error(`Template creation failed with status: ${templateResponse.status}`);
        }
        const template = await templateResponse.json();
        console.log('Template created:', template);
        templateId = template.id;
      }

      console.log('Creating asset at:', `${API_BASE_URL}/assets/`);
      const assetResponse = await fetch(`${API_BASE_URL}/assets/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          template_id: templateId,
          serial_number: `SA-${Date.now()}`,
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
      console.log('Asset created:', asset);

      console.log('Generating QR at:', `${API_BASE_URL}/assets/${asset.id}/qr-codes/`);
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
      console.log('QR generated:', qr);

      const selectedSchoolData = schools.find(s => s.id === formData.school_id);
      const selectedClassroomData = classrooms.find(c => c.id === formData.classroom_id);

      setQrData({
        asset_id: asset.id,
        qr_url: qr.qr_url,
        name: formData.name,
        school: selectedSchoolData?.name || '',
        classroom: selectedClassroomData?.name || ''
      });

      setCurrentStep('qr');
      setStatus({ type: 'success', message: '¡Activo creado exitosamente!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al crear el activo' });
      console.error('Error creating asset:', error);
    } finally {
      setIsLoading(false);
    }
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

  const resetForm = (): void => {
    cleanupCamera();
    setCurrentStep('camera');
    setCapturedImage(null);
    setQrData(null);
    setFormData({
      name: '',
      price: '',
      quantity: 1,
      school_id: '',
      classroom_id: '',
      template_id: '',
      use_existing_template: true,
      category_id: ''
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

  return (
    <>
      {/* Floating Action Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all duration-300 hover:scale-110 z-50"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out">
            {/* Header */}
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

              {/* Camera Step */}
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

              {/* Form Step */}
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
                      Nombre del objeto *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Ingrese el nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio estimado
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
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Plantilla del Activo</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="existing-template"
                          name="template-choice"
                          checked={formData.use_existing_template}
                          onChange={() => handleInputChange('use_existing_template', true)}
                          className="w-4 h-4 text-black focus:ring-black"
                        />
                        <label htmlFor="existing-template" className="text-sm text-gray-700">
                          Usar plantilla existente
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          id="new-template"
                          name="template-choice"
                          checked={!formData.use_existing_template}
                          onChange={() => handleInputChange('use_existing_template', false)}
                          className="w-4 h-4 text-black focus:ring-black"
                        />
                        <label htmlFor="new-template" className="text-sm text-gray-700">
                          Crear nueva plantilla
                        </label>
                      </div>
                    </div>

                    {formData.use_existing_template ? (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Seleccionar plantilla *
                        </label>
                        <select
                          value={formData.template_id}
                          onChange={(e) => handleInputChange('template_id', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                          <option value="">Seleccionar plantilla</option>
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({template.category?.name || 'Sin categoría'})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Categoría para nueva plantilla *
                        </label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => handleInputChange('category_id', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
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
                      Crear Activo
                    </button>
                  </div>
                </div>
              )}

              {/* QR Step */}
              {currentStep === 'qr' && qrData && (
                <div className="space-y-4 text-center">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-green-800">¡Activo Creado!</h3>
                    <p className="text-green-600">El código QR ha sido generado</p>
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
                  </div>

                  <div className="space-y-3">
                    {/* Botón principal para abrir RawBT */}
                    <button
                      onClick={() => handleOpenRawBT(1)}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    >
                      <FileDown className="w-5 h-5 mr-2" />
                      Imprimir con RawBT (1 etiqueta)
                    </button>

                    {/* Botones para múltiples etiquetas */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Imprimir múltiples etiquetas</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleOpenRawBT(2)}
                          className="bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium"
                        >
                          2 etiquetas
                        </button>
                        <button
                          onClick={() => handleOpenRawBT(3)}
                          className="bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium"
                        >
                          3 etiquetas
                        </button>
                        <button
                          onClick={() => handleOpenRawBT(5)}
                          className="bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium"
                        >
                          5 etiquetas
                        </button>
                      </div>
                    </div>

                    {/* Botón de descarga como fallback */}
                    <button
                      onClick={handleDownloadTSPLFallback}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar archivo TSPL (alternativa)
                    </button>

                    <button
                      onClick={downloadQR}
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Descargar QR (PNG)
                    </button>

                    <button
                      onClick={resetForm}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium"
                    >
                      Crear Otro Activo
                    </button>
                  </div>

                  {/* Información sobre RawBT */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800 text-left">
                      <strong>Instrucciones:</strong><br/>
                      • Al hacer clic en "Imprimir con RawBT", se abrirá automáticamente la app RawBT<br/>
                      • Si no se abre, descarga el archivo TSPL y ábrelo manualmente en RawBT<br/>
                      • Asegúrate de tener RawBT instalado en tu dispositivo
                    </p>
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