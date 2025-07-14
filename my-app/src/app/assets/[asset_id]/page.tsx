import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Loader2, 
  Image, 
  QrCode, 
  Calendar, 
  DollarSign, 
  Package, 
  Building, 
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
  Edit3
} from 'lucide-react';

const AssetEditPage = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  
  // Tipos para asset y otros datos
  interface AssetType {
    id: string;
    template: {
      id: string;
      name: string;
      manufacturer: string;
      model_number: string;
      category?: {
        id: string;
        name: string;
      };
    };
    template_id: string;
    serial_number: string;
    purchase_date: string;
    value_estimate: number;
    image_url: string;
    status: string;
    classroom_id: string;
    qr_code?: {
      qr_url: string;
    };
    created_at: string;
    [key: string]: any;
  }

  // Estados principales
  const [asset, setAsset] = useState<AssetType | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [assetEvents, setAssetEvents] = useState<any[]>([]);
  
  // Estados de carga
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Estados de UI
  const [showEvents, setShowEvents] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState<ErrorsType>({});
  
  // Tipos para los datos del formulario y errores
  interface FormDataType {
    template_id: string;
    serial_number: string;
    purchase_date: string;
    value_estimate: number;
    image_url: string;
    status: string;
    classroom_id: string;
  }

  interface ErrorsType {
    template_id?: string;
    serial_number?: string;
    purchase_date?: string;
    value_estimate?: string;
    status?: string;
    [key: string]: string | undefined;
  }

  // Datos del formulario
  const [formData, setFormData] = useState<FormDataType>({
    template_id: '',
    serial_number: '',
    purchase_date: '',
    value_estimate: 0,
    image_url: '',
    status: 'available',
    classroom_id: ''
  });

  // Opciones de estado
  const statusOptions = [
    { value: 'available', label: 'Disponible', color: 'bg-green-100 text-green-800' },
    { value: 'in_use', label: 'En Uso', color: 'bg-blue-100 text-blue-800' },
    { value: 'maintenance', label: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'damaged', label: 'Dañado', color: 'bg-red-100 text-red-800' },
    { value: 'retired', label: 'Retirado', color: 'bg-gray-100 text-gray-800' }
  ];

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar asset, categorías, templates y aulas en paralelo
        const [assetRes, categoriesRes, templatesRes] = await Promise.all([
          fetch(`/api/assets/${assetId}`),
          fetch('/api/assets/categories/'),
          fetch('/api/assets/templates/')
        ]);

        if (!assetRes.ok) throw new Error('Error al cargar el activo');
        if (!categoriesRes.ok) throw new Error('Error al cargar las categorías');
        if (!templatesRes.ok) throw new Error('Error al cargar los templates');

        const assetData = await assetRes.json();
        const categoriesData = await categoriesRes.json();
        const templatesData = await templatesRes.json();

        setAsset(assetData);
        setCategories(categoriesData);
        setTemplates(templatesData);

        // Configurar datos del formulario
        setFormData({
          template_id: assetData.template_id || '',
          serial_number: assetData.serial_number || '',
          purchase_date: assetData.purchase_date || '',
          value_estimate: assetData.value_estimate || 0,
          image_url: assetData.image_url || '',
          status: assetData.status || 'available',
          classroom_id: assetData.classroom_id || ''
        });

        // Cargar aulas si hay una escuela asociada
        if (assetData.classroom_id) {
          try {
            const classroomRes = await fetch(`/api/classrooms/${assetData.classroom_id}`);
            if (classroomRes.ok) {
              const classroomData = await classroomRes.json();
              if (classroomData.school_id) {
                const classroomsRes = await fetch(`/api/schools/${classroomData.school_id}/classrooms/`);
                if (classroomsRes.ok) {
                  const classroomsData = await classroomsRes.json();
                  setClassrooms(classroomsData);
                }
              }
            }
          } catch (err) {
            console.error('Error al cargar aulas:', err);
          }
        }

      } catch (error) {
        console.error('Error al cargar datos:', error);
        setMessage({ type: 'error', text: 'Error al cargar los datos del activo' });
      } finally {
        setIsLoading(false);
      }
    };

    if (assetId) {
      loadInitialData();
    }
  }, [assetId]);

  // Cargar eventos del activo
  const loadAssetEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch(`/api/assets/${assetId}/events/`);
      if (response.ok) {
        const events = await response.json();
        setAssetEvents(events);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors: ErrorsType = {};
    
    if (!formData.template_id) newErrors.template_id = 'Selecciona un template';
    if (!formData.serial_number.trim()) newErrors.serial_number = 'El número de serie es requerido';
    if (!formData.purchase_date) newErrors.purchase_date = 'La fecha de compra es requerida';
    if (formData.value_estimate < 0) newErrors.value_estimate = 'El valor debe ser positivo';
    if (!formData.status) newErrors.status = 'Selecciona un estado';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedAsset = await response.json();
        setAsset(updatedAsset);
        setMessage({ type: 'success', text: 'Activo actualizado exitosamente' });
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.detail || 'Error al actualizar el activo' });
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setMessage({ type: 'error', text: 'Error al guardar los cambios' });
    } finally {
      setIsSaving(false);
    }
  };

  // Generar código QR
  const generateQRCode = async () => {
    try {
      const response = await fetch(`/api/assets/${assetId}/qr/generate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const updatedAsset = await response.json();
        setAsset(updatedAsset);
        setMessage({ type: 'success', text: 'Código QR generado exitosamente' });
      }
    } catch (error) {
      console.error('Error al generar QR:', error);
      setMessage({ type: 'error', text: 'Error al generar el código QR' });
    }
  };

  // Mostrar eventos
  const toggleEvents = () => {
    setShowEvents(!showEvents);
    if (!showEvents && assetEvents.length === 0) {
      loadAssetEvents();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/assets')}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver a la lista
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {asset.template?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  ID: {asset.id}
                </p>
              </div>
            </div>
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/assets')}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver a la lista
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {asset.template.name}
                </h1>
                <p className="text-sm text-gray-500">
                  ID: {asset.id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleEvents}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Historial
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Edit3 className="h-5 w-5 mr-2" />
                  Información del Activo
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template *
                  </label>
                  <select
                    name="template_id"
                    value={formData.template_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.template_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecciona un template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.manufacturer} {template.model_number}
                      </option>
                    ))}
                  </select>
                  {errors.template_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.template_id}</p>
                  )}
                </div>

                {/* Número de serie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Serie *
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.serial_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ingresa el número de serie"
                  />
                  {errors.serial_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.serial_number}</p>
                  )}
                </div>

                {/* Fecha de compra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Compra *
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.purchase_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.purchase_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.purchase_date}</p>
                  )}
                </div>

                {/* Valor estimado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Estimado
                  </label>
                  <input
                    type="number"
                    name="value_estimate"
                    value={formData.value_estimate}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.value_estimate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.value_estimate && (
                    <p className="mt-1 text-sm text-red-600">{errors.value_estimate}</p>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                  )}
                </div>

                {/* Aula */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aula
                  </label>
                  <select
                    name="classroom_id"
                    value={formData.classroom_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {classrooms.map(classroom => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* URL de imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Imagen del activo */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Imagen del Activo
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt={asset.template.name}
                      className="max-w-full max-h-48 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`text-center ${formData.image_url ? 'hidden' : ''}`}>
                    <Image className="h-12 w-12 text-gray-400 mx-auto mb-2"
                </div>
              </div>
            </div>

            {/* Código QR */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Código QR
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
                  {asset.qr_code ? (
                    <div className="text-center">
                      <img
                        src={asset.qr_code.qr_url}
                        alt="QR Code"
                        className="w-32 h-32 mx-auto mb-2"
                      />
                      <p className="text-xs text-gray-500">QR Code generado</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-4">No hay código QR generado</p>
                      <button
                        onClick={generateQRCode}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                      >
                        Generar QR
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Información Adicional</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center text-sm">
                  <Package className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700">Categoría:</span>
                  <span className="ml-2 text-gray-900">{asset.template.category?.name || 'Sin categoría'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700">Fabricante:</span>
                  <span className="ml-2 text-gray-900">{asset.template.manufacturer}</span>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700">Modelo:</span>
                  <span className="ml-2 text-gray-900">{asset.template.model_number}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-700">Creado:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de eventos */}
        {showEvents && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Historial de Eventos</h3>
            </div>
            <div className="p-6">
              {loadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-500">Cargando historial...</span>
                </div>
              ) : assetEvents.length > 0 ? (
                <div className="space-y-4">
                  {assetEvents.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No hay eventos registrados</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetEditPage;