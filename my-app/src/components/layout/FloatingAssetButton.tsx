"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, X, Save, Printer, Download, Check, AlertCircle, Loader } from 'lucide-react';

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

interface BluetoothPrinter {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

type StepType = 'camera' | 'form' | 'qr';

const AssetCreatorFAB: React.FC = () => {
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

  // Load schools on component mount
  useEffect(() => {
    loadSchools();
    loadCategories();
    loadTemplates();
  }, []);

  // Load classrooms when school changes
  useEffect(() => {
    if (selectedSchool) {
      loadClassrooms(selectedSchool);
    }
  }, [selectedSchool]);

  // Cleanup camera stream on unmount or when modal closes
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
      
      // Clean up any existing stream first
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
        // Wait for video to be ready
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
    
    // Ensure video dimensions are available
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
    
    // Clean up camera after capture
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

      // Create new template only if user chooses to create new one
      if (!formData.use_existing_template) {
        console.log('Creating new template at:', `${API_BASE_URL}/assets/templates/`);
        const templateResponse = await fetch(`${API_BASE_URL}/assets/templates/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
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

      // Create the asset using existing or newly created template
      console.log('Creating asset at:', `${API_BASE_URL}/assets/`);
      const assetResponse = await fetch(`${API_BASE_URL}/assets/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
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

      // Generate QR Code
      console.log('Generating QR at:', `${API_BASE_URL}/assets/${asset.id}/qr-codes/`);
      const qrResponse = await fetch(`${API_BASE_URL}/assets/${asset.id}/qr-codes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  const printQR = async (): Promise<void> => {
    if (!bluetoothPrinter || !qrData) {
      await connectBluetooth();
      if (!bluetoothPrinter || !qrData) return;
    }

    try {
      setIsLoading(true);

      // Create print commands for thermal printer using Uint8Array
      const qrUrl = qrData?.qr_url ?? '';
      const qrUrlBytes = new TextEncoder().encode(qrUrl);
      const pL = (qrUrlBytes.length + 3) & 0xff;
      const pH = ((qrUrlBytes.length + 3) >> 8) & 0xff;

      // Build the command as a Uint8Array
      const commands: number[] = [];
      // Initialize printer
      commands.push(0x1B, 0x40);
      // Center align
      commands.push(0x1B, 0x61, 0x01);
      // Print asset name
      for (const c of (qrData?.name ?? '').split('')) commands.push(...new TextEncoder().encode(c));
      commands.push(0x0A);
      // Print school and classroom
      for (const c of (`${qrData?.school ?? ''} - ${qrData?.classroom ?? ''}`).split('')) commands.push(...new TextEncoder().encode(c));
      commands.push(0x0A);
      // QR code: model 2, size 6
      commands.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
      // Store QR data
      commands.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...qrUrlBytes);
      // Print QR code
      commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);
      // Feed paper
      commands.push(0x0A, 0x0A, 0x0A);
      // Cut paper
      commands.push(0x1B, 0x69);

      await bluetoothPrinter.characteristic.writeValue(new Uint8Array(commands));

      setStatus({ type: 'success', message: 'QR impreso exitosamente' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error al imprimir QR' });
      console.error('Print error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQR = (): void => {
    if (!qrData) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 300;
    canvas.height = 350;
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Create QR code placeholder (you'd use a QR library here)
    ctx.fillStyle = 'black';
    ctx.fillRect(50, 50, 200, 200);
    
    // Add text
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(qrData.name, 150, 280);
    ctx.fillText(`${qrData.school} - ${qrData.classroom}`, 150, 300);
    
    // Download
    const link = document.createElement('a');
    link.download = `QR_${qrData.name}_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const resetForm = (): void => {
    cleanupCamera(); // Clean up camera before resetting
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
    cleanupCamera(); // Properly clean up camera
    setIsExpanded(false);
    resetForm();
  };

  const handleStepBack = (): void => {
    if (currentStep === 'form') {
      cleanupCamera(); // Clean up when going back to camera
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
                        handleInputChange('classroom_id', ''); // Reset classroom
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
                    <div className="w-32 h-32 bg-white border-2 border-gray-300 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-xs text-gray-500">QR Code</span>
                    </div>
                    <h4 className="font-medium">{qrData.name}</h4>
                    <p className="text-sm text-gray-600">{qrData.school} - {qrData.classroom}</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={printQR}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    >
                      {isLoading ? (
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Printer className="w-5 h-5 mr-2" />
                      )}
                      Imprimir QR
                    </button>

                    <button
                      onClick={downloadQR}
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Descargar QR
                    </button>

                    <button
                      onClick={resetForm}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium"
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