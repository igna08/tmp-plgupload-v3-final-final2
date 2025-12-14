"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Using App Router
import { useParams } from 'next/navigation'; // For getting route parameters
import axios from 'axios';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { updateAssetImage, downloadQRCode as downloadQR } from '@/services/api';
import {
  ChevronLeft,
  Eye,
  ShieldAlert,
  Building,
  Package,
  AlertCircle,
  Loader2,
  Download,
  QrCode,
  Edit,
  Trash2,
  X,
  Calendar,
  DollarSign,
  ImageIcon,
  Users,
  Tag,
  RefreshCw,
  FileText,
  Settings,
  MapPin,
  Clock,
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Save,
  ArrowLeft,
  History,
  Bug,
  Upload,
  Printer
} from 'lucide-react';
import Link from 'next/link';

// Interfaces
interface AssetCategory {
  id: string;
  name: string;
}

interface AssetTemplate {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  model_number: string;
  category_id: string;
  category: AssetCategory;
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
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  classroom_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  template: AssetTemplate;
  qr_code?: QRCode;
}

interface AssetEvent {
  id: string;
  asset_id: string;
  user_id: string;
  event_type: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface AssetIncident {
  id: string;
  asset_id: string;
  description: string;
  photo_url: string;
  status: string;
  reported_by: string;
  reported_at: string;
  resolved_at?: string;
}

interface BluetoothPrinter {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';
const BASE_APP_URL = 'https://issa-qr.vercel.app';

const statusOptions = [
  { value: 'available', label: 'Disponible', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'in_use', label: 'En Uso', color: 'bg-blue-100 text-blue-800', icon: Users },
  { value: 'maintenance', label: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-800', icon: Settings },
  { value: 'retired', label: 'Retirado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
];

const SingleAssetPage: React.FC = () => {
  const router = useRouter();
  const params = useParams(); // For App Router
  const id = params?.id as string; // Get the asset ID from route parameters
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assetEvents, setAssetEvents] = useState<AssetEvent[]>([]);
  const [assetIncidents, setAssetIncidents] = useState<AssetIncident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});
  const [isSaving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'events' | 'incidents'>('details');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [bluetoothPrinter, setBluetoothPrinter] = useState<BluetoothPrinter | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Debug logging
  const debugLog = (message: string, data?: any) => {
    console.log(`[SingleAssetPage] ${message}`, data || '');
  };

  // Fetch single asset
  const fetchAsset = useCallback(async () => {
    if (!id || !user) {
      debugLog('Cannot fetch asset', { hasId: !!id, hasUser: !!user });
      return;
    }
    
    debugLog('Fetching asset', { id, userId: user.id });
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/assets/${id}`);
      debugLog('Asset fetched successfully', response.data);
      setAsset(response.data);
      setEditForm(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error al cargar el activo';
      debugLog('Fetch asset error', { error: err, message: errorMessage });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  // Fetch asset events
  const fetchAssetEvents = useCallback(async () => {
    if (!id) {
      debugLog('Cannot fetch events - no ID');
      return;
    }
    
    debugLog('Fetching asset events', { id });
    setIsLoadingEvents(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/assets/${id}/events/`);
      debugLog('Events fetched', response.data);
      setAssetEvents(response.data);
    } catch (err) {
      debugLog('Error fetching asset events', err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [id]);

  // Fetch asset incidents
  const fetchAssetIncidents = useCallback(async () => {
    if (!id) {
      debugLog('Cannot fetch incidents - no ID');
      return;
    }
    
    debugLog('Fetching asset incidents', { id });
    setIsLoadingIncidents(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/assets/${id}/incidents/`);
      debugLog('Incidents fetched', response.data);
      setAssetIncidents(response.data);
    } catch (err) {
      debugLog('Error fetching asset incidents', err);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, [id]);

  // Generate or regenerate QR Code
  const handleQRCodeAction = async () => {
    if (!asset) return;
    
    try {
      debugLog('Generating/regenerating QR code', { assetId: asset.id });
      const response = await axios.post(`${API_BASE_URL}/assets/${asset.id}/qr-codes/`);
      setAsset(prev => prev ? { ...prev, qr_code: response.data } : null);
      alert('Código QR generado/regenerado exitosamente');
      debugLog('QR code generated successfully', response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error desconocido';
      debugLog('QR code generation error', { error: err, message: errorMessage });
      alert('Error al generar código QR: ' + errorMessage);
    }
  };

  // Download QR Code
  const downloadQRCode = () => {
    if (!asset?.qr_code?.qr_url) {
      debugLog('Cannot download QR code - no URL');
      return;
    }

    debugLog('Downloading QR code', { url: asset.qr_code.qr_url });
    downloadQR(asset.qr_code.qr_url, `qr-code-${asset.serial_number}.png`);
  };

  // Update asset status
  const updateAssetStatus = async (newStatus: string) => {
    if (!asset) return;
    
    try {
      debugLog('Updating asset status', { assetId: asset.id, newStatus });
      const response = await axios.put(`${API_BASE_URL}/assets/${asset.id}`, {
        ...asset,
        status: newStatus
      });
      setAsset(response.data);
      alert('Estado actualizado exitosamente');
      debugLog('Status updated successfully', response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error desconocido';
      debugLog('Status update error', { error: err, message: errorMessage });
      alert('Error al actualizar estado: ' + errorMessage);
    }
  };

  // Save asset changes
// ✅ BIEN - Enviando solo los campos permitidos
const saveAssetChanges = async () => {
  if (!asset || !editForm) return;

  // Preparar el payload SOLO con los campos que realmente queremos editar
  // EXCLUIMOS image_url porque no se puede editar por ahora
  const updatePayload = {
    template_id: editForm.template_id || null,
    serial_number: editForm.serial_number || null,
    purchase_date: editForm.purchase_date || null,
    value_estimate: editForm.value_estimate || null,
    // image_url: editForm.image_url || null, // ← COMENTADO/ELIMINADO
    status: editForm.status || null,
    classroom_id: editForm.classroom_id || null,
    description: editForm.description || null
  };

  console.log('=== PAYLOAD QUE SE ENVÍA ===');
  console.log(JSON.stringify(updatePayload, null, 2));

  debugLog('Saving asset changes', { assetId: asset.id, payload: updatePayload });
  setSaving(true);
  try {
    const response = await axios.put(`${API_BASE_URL}/assets/${asset.id}`, updatePayload);
    setAsset(response.data);
    setIsEditing(false);
    alert('Activo actualizado exitosamente');
    debugLog('Asset updated successfully', response.data);
  } catch (err: any) {
    console.log('=== ERROR COMPLETO ===');
    console.log('Status:', err.response?.status);
    console.log('Error detail:', err.response?.data);

    const errorMessage = err.response?.data?.detail || 'Error desconocido';
    debugLog('Asset update error', { error: err, message: errorMessage });
    alert('Error al actualizar activo: ' + JSON.stringify(err.response?.data, null, 2));
  } finally {
    setSaving(false);
  }
};
  // Delete asset
  const deleteAsset = async () => {
    if (!asset) return;

    if (!confirm('¿Estás seguro de que quieres eliminar este activo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      debugLog('Deleting asset', { assetId: asset.id });
      await axios.delete(`${API_BASE_URL}/assets/${asset.id}`);
      alert('Activo eliminado exitosamente');
      router.push('/assets');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Error desconocido';
      debugLog('Asset deletion error', { error: err, message: errorMessage });
      alert('Error al eliminar activo: ' + errorMessage);
    }
  };

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert image file to base64 Data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Update asset image
  const handleUpdateAssetImage = async () => {
    if (!asset || !imageFile) return;

    setIsUploadingImage(true);
    try {
      debugLog('Converting image to base64', { assetId: asset.id });

      // Convert file to base64 Data URL (same as camera capture)
      const imageDataUrl = await fileToBase64(imageFile);
      debugLog('Image converted to base64');

      // Update asset with base64 image URL
      const updatedAsset = await updateAssetImage(asset.id, imageDataUrl);
      setAsset(updatedAsset);
      setImageFile(null);
      setImagePreview(null);
      alert('Imagen actualizada exitosamente');
      debugLog('Asset image updated successfully');
    } catch (err: any) {
      debugLog('Image update error', { error: err });
      alert('Error al actualizar imagen: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Update asset image with URL directly
  const handleUpdateImageURL = async (imageUrl: string) => {
    if (!asset || !imageUrl) return;

    setIsUploadingImage(true);
    try {
      debugLog('Updating image URL', { assetId: asset.id, url: imageUrl });
      const updatedAsset = await updateAssetImage(asset.id, imageUrl);
      setAsset(updatedAsset);
      alert('Imagen actualizada exitosamente');
      debugLog('Asset image updated successfully');
    } catch (err: any) {
      debugLog('Image update error', { error: err });
      alert('Error al actualizar imagen: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Connect to Bluetooth printer
  const connectBluetooth = async (): Promise<void> => {
    try {
      setIsPrinting(true);
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
      alert('Impresora conectada exitosamente');
    } catch (error) {
      alert('Error al conectar con la impresora');
      console.error('Bluetooth error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  // Generate TSPL sticker commands
  const generateTSPLSticker = (assetData: Asset): string => {
    const assetUrl = `${BASE_APP_URL}/assets/${assetData.id}`;
    const aulaInfo = "AULA";
    const itemInfo = assetData.template.name || "";
    const assetId = `ID: ${assetData.id.substring(0, 8)}`;

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

  // Send TSPL commands to printer
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

  // Print QR sticker
  const printQRSticker = async (): Promise<void> => {
    if (!asset) {
      alert('No hay activo para imprimir');
      return;
    }

    if (!bluetoothPrinter) {
      await connectBluetooth();
      // Wait a bit for the connection to be established
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!bluetoothPrinter) {
      return; // Connection failed
    }

    try {
      setIsPrinting(true);

      const tsplCommands = generateTSPLSticker(asset);
      await sendTSPLCommands(tsplCommands);

      alert('Etiqueta impresa correctamente');
    } catch (error) {
      alert(`Error al imprimir etiqueta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  // Main effect for fetching data
  useEffect(() => {
    debugLog('Main effect triggered', {
      isAuthLoading,
      hasUser: !!user,
      hasId: !!id,
      assetId: id
    });

    if (!isAuthLoading && user && id) {
      debugLog('Conditions met, fetching data');
      fetchAsset();
      fetchAssetEvents();
      fetchAssetIncidents();
    }
  }, [user, isAuthLoading, id, fetchAsset, fetchAssetEvents, fetchAssetIncidents]);

  // Loading auth state
  if (isAuthLoading) {
    debugLog('Rendering auth loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!user) {
    debugLog('Rendering access denied');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">Necesitas iniciar sesión para ver esta página.</p>
        </div>
      </div>
    );
  }

  // No ID provided
  if (!id) {
    debugLog('No asset ID provided');
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center">
                <Link href="/assets" className="mr-4">
                  <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-800" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">ID de activo requerido</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    debugLog('Rendering error state', { error });
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center">
                <Link href="/assets" className="mr-4">
                  <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-800" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Activo no encontrado</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar activo</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAsset}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !asset) {
    debugLog('Rendering loading state', { isLoading, hasAsset: !!asset });
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center">
                <Link href="/assets" className="mr-4">
                  <ArrowLeft className="h-6 w-6 text-gray-600 hover:text-gray-800" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Cargando Activo...</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del activo...</p>
          <p className="text-xs text-gray-400 mt-2">ID: {id}</p>
        </div>
      </div>
    );
  }

  const currentStatus = statusOptions.find(s => s.value === asset.status);
  const StatusIcon = currentStatus?.icon || Package;

  debugLog('Rendering main content', { asset: asset.id, status: asset.status });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center">
                <Link href="/assets" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{asset.template.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Serie: {asset.serial_number} | ID: {asset.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${currentStatus?.color || 'bg-gray-100 text-gray-800'}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {currentStatus?.label || asset.status}
                </span>
                
                {!isEditing ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    
                    {user?.is_superuser && (
                      <button
                        onClick={deleteAsset}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </button>
                    <button
                      onClick={saveAssetChanges}
                      disabled={isSaving}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Guardar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 inline mr-1" />
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="h-4 w-4 inline mr-1" />
              Eventos ({assetEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'incidents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bug className="h-4 w-4 inline mr-1" />
              Incidentes ({assetIncidents.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Asset Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editForm.template?.name || ''}
                            // Only allow display/edit if template exists, but don't mutate template object
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled
                        />
                    ) : (
                        <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{asset.template.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.serial_number || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, serial_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{asset.serial_number}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex items-center">
                      <Tag className="h-4 w-4 text-gray-400 mr-2" />
                      {asset.template.category.name}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    {isEditing ? (
                      <select
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as Asset['status'] }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${currentStatus?.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {currentStatus?.label}
                        </span>
                        <div className="flex space-x-1">
                          {statusOptions.filter(s => s.value !== asset.status).map(status => {
                            const Icon = status.icon;
                            return (
                              <button
                                key={status.value}
                                onClick={() => updateAssetStatus(status.value)}
                                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 flex items-center transition-colors"
                                title={`Cambiar a ${status.label}`}
                              >
                                <Icon className="h-3 w-3 mr-1" />
                                {status.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{asset.template.manufacturer}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{asset.template.model_number}</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
                <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Financiera</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado</label>
                  {isEditing ? (
                    <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    pattern="[0-9]*([.,][0-9]+)?"
                    value={editForm.value_estimate ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditForm(prev => ({
                      ...prev,
                      value_estimate: v === '' ? undefined : parseFloat(v)
                      }));
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingresa un valor"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    ${asset.value_estimate.toLocaleString()}
                    </p>
                  )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Compra</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.purchase_date || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, purchase_date: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(asset.purchase_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aula Asignada</label>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <Link 
                        href={`/classrooms/${asset.classroom_id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        Ver aula
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h3>
                {isEditing ? (
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Ingresa una descripción del activo..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                    {asset.description || asset.template.description || 'Sin descripción disponible'}
                  </p>
                )}
              </div>

              {/* Timestamps */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(asset.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                    <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex items-center">
                      <RefreshCw className="h-4 w-4 text-gray-400 mr-2" />
                      {new Date(asset.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Asset Image */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Imagen del Activo</h3>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : asset.image_url ? (
                    <img
                      src={asset.image_url}
                      alt={asset.template.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`text-center ${(imagePreview || asset.image_url) ? 'hidden' : ''}`}>
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No hay imagen disponible</p>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargar desde archivo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer"
                    />
                    {imageFile && (
                      <div className="mt-2 flex items-center space-x-2">
                        <button
                          onClick={handleUpdateAssetImage}
                          disabled={isUploadingImage}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Subir imagen
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      O ingresar URL de imagen
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget as HTMLInputElement;
                            handleUpdateImageURL(input.value);
                            input.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          handleUpdateImageURL(input.value);
                          input.value = '';
                        }}
                        disabled={isUploadingImage}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Actualizar'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Código QR</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleQRCodeAction}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title={asset.qr_code ? "Regenerar QR" : "Generar QR"}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    {asset.qr_code && (
                      <button
                        onClick={downloadQRCode}
                        className="text-green-600 hover:text-green-800 p-1 rounded"
                        title="Descargar QR"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  {asset.qr_code ? (
                    <div className="text-center">
                      <img
                        src={asset.qr_code.qr_url}
                        alt="QR Code"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No hay código QR generado</p>
                      <button
                        onClick={handleQRCodeAction}
                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center mx-auto"
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        Generar QR
                      </button>
                    </div>
                  )}
                </div>
                
                {asset.qr_code && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={printQRSticker}
                      disabled={isPrinting}
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center disabled:opacity-50"
                    >
                      {isPrinting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Imprimiendo...
                        </>
                      ) : (
                        <>
                          <Printer className="h-4 w-4 mr-1" />
                          Imprimir Etiqueta
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadQRCode}
                      className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar QR
                    </button>
                    <button
                      onClick={handleQRCodeAction}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 flex items-center justify-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerar QR
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
                <div className="space-y-2">
                  <Link
                    href={`/classrooms/${asset.classroom_id}`}
                    className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-100 flex items-center justify-center border border-blue-200"
                  >
                    <Building className="h-4 w-4 mr-1" />
                    Ver Aula
                  </Link>
                  

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Historial de Eventos</h3>
                <button
                  onClick={fetchAssetEvents}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                  title="Actualizar eventos"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-sm text-gray-500">Cargando eventos...</span>
                </div>
              ) : assetEvents.length > 0 ? (
                <div className="space-y-4">
                  {assetEvents.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <History className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="bg-white rounded p-2 mt-2">
                              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">ID: {event.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No hay eventos registrados</h4>
                  <p className="text-sm text-gray-500">Los eventos del activo aparecerán aquí cuando ocurran.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Incidentes Reportados</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchAssetIncidents}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                    title="Actualizar incidentes"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/incidents/new?asset_id=${asset.id}`}
                    className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 flex items-center"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Reportar Incidente
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {isLoadingIncidents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-sm text-gray-500">Cargando incidentes...</span>
                </div>
              ) : assetIncidents.length > 0 ? (
                <div className="space-y-4">
                  {assetIncidents.map((incident) => (
                    <div key={incident.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-gray-900">Incidente #{incident.id.slice(0, 8)}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            incident.resolved_at 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {incident.resolved_at ? 'Resuelto' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Reportado: {new Date(incident.reported_at).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-700">{incident.description}</p>
                      </div>
                      
                      {incident.photo_url && (
                        <div className="mb-3">
                          <img
                            src={incident.photo_url}
                            alt="Foto del incidente"
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Reportado por: {incident.reported_by}</span>
                        {incident.resolved_at && (
                          <span>Resuelto: {new Date(incident.resolved_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No hay incidentes reportados</h4>
                  <p className="text-sm text-gray-500 mb-4">Este activo no tiene incidentes registrados.</p>
                  <Link
                    href={`/incidents/new?asset_id=${asset.id}`}
                    className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Reportar Primer Incidente
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleAssetPage;