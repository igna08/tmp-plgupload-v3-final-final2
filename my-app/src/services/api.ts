import axios from 'axios';

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

// Types
export interface BulkDeleteResponse {
  deleted_count: number;
  total_requested: number;
  errors: Array<{
    asset_id: string;
    error: string;
  }> | null;
}

export interface BulkUpdateResponse {
  updated_count: number;
  total_requested: number;
  errors: Array<{
    asset_id: string;
    error: string;
  }> | null;
}

export interface QRCodeData {
  id: string;
  asset_id: string;
  qr_url: string;
  payload: Record<string, any>;
}

export interface ClassroomInventoryAsset {
  template_name: string;
  category_name: string;
  status: string;
  value_estimate: number;
  quantity: number;
  total_value: number;
  asset_ids: string[];
}

export interface ClassroomInventory {
  classroom_id: string;
  classroom_name: string;
  classroom_code: string;
  school_id: string;
  total_assets: number;
  total_value: number;
  assets: ClassroomInventoryAsset[];
}

// Image Management API
export const updateAssetImage = async (assetId: string, imageUrl: string) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/assets/${assetId}/image`, {
      image_url: imageUrl
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar imagen');
  }
};

// QR Code APIs
export const generateQRCode = async (assetId: string): Promise<QRCodeData> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/assets/${assetId}/qr-codes/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al generar código QR');
  }
};

export const getQRCode = async (assetId: string): Promise<QRCodeData> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/assets/${assetId}/qr-codes/`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // Si no existe, generarlo
      return generateQRCode(assetId);
    }
    throw new Error(error.response?.data?.detail || 'Error al obtener código QR');
  }
};

// Bulk Operations APIs
export const bulkDeleteAssets = async (assetIds: string[]): Promise<BulkDeleteResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/assets/bulk-delete`, {
      asset_ids: assetIds
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al eliminar activos');
  }
};

export const bulkUpdateAssets = async (
  assetIds: string[],
  updates: {
    value_estimate?: number;
    status?: string;
    image_url?: string;
  }
): Promise<BulkUpdateResponse> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/assets/bulk-update`, {
      asset_ids: assetIds,
      ...updates
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar activos');
  }
};

// Classroom Inventory API
export const getClassroomInventory = async (classroomId: string): Promise<ClassroomInventory> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/classrooms/${classroomId}/inventory`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Error al obtener inventario de aula');
  }
};

// Utility: Download QR Code
export const downloadQRCode = (qrUrl: string, filename: string = 'qr-code.png') => {
  const link = document.createElement('a');
  link.href = qrUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Utility: Print QR Codes
export const printQRCodes = async (assetIds: string[]) => {
  const qrCodes: QRCodeData[] = [];

  // Obtener o generar todos los QR codes
  for (const assetId of assetIds) {
    try {
      const qrData = await getQRCode(assetId);
      qrCodes.push(qrData);
    } catch (error) {
      console.error(`Error al obtener QR para activo ${assetId}:`, error);
    }
  }

  // Crear ventana de impresión
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('No se pudo abrir ventana de impresión');
  }

  // Generar HTML con todos los QR codes
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Códigos QR</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .qr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            padding: 20px;
          }
          .qr-item {
            text-align: center;
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
          }
          .qr-item img {
            width: 200px;
            height: 200px;
            margin: 0 auto;
            display: block;
          }
          .qr-item p {
            margin: 10px 0 0 0;
            font-size: 12px;
            color: #666;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
            Imprimir
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">
            Cerrar
          </button>
        </div>
        <div class="qr-grid">
          ${qrCodes.map(qr => `
            <div class="qr-item">
              <img src="${qr.qr_url}" alt="QR Code" />
              <p>ID: ${qr.asset_id.slice(0, 8)}...</p>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
