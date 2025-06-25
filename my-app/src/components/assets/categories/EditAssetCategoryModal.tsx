"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { AlertCircle, Edit3, Calendar, FileText } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  templates?: { id: string; name: string; }[];
}

interface EditAssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AssetCategory | null;
  onCategoryUpdated?: () => void;
}

interface CategoryUpdateFormData {
  name: string;
  description: string;
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const EditAssetCategoryModal: React.FC<EditAssetCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onCategoryUpdated,
}) => {
  const [formData, setFormData] = useState<CategoryUpdateFormData>({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
      });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    } else if (!isOpen) {
        setFormData({ name: '', description: '' });
        setErrors({});
        setGeneralError(null);
        setIsSubmitting(false);
    }
  }, [isOpen, category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!category) {
      setGeneralError("Los datos de la categoría no están disponibles.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const payload: Partial<CategoryUpdateFormData> = { name: formData.name };
      payload.description = formData.description || undefined;

      await axios.put(`${API_BASE_URL}/assets/categories/${category.id}`, payload);

      if (onCategoryUpdated) {
        onCategoryUpdated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update asset category:', err);
      if (err.response?.data?.detail) {
        const errorDetails = err.response.data.detail;
        if (Array.isArray(errorDetails)) {
          const newErrors: Record<string, string> = {};
          errorDetails.forEach((detail: ApiErrorDetail) => {
            if (detail.loc && detail.loc.length > 1) {
              newErrors[detail.loc[1]] = detail.msg;
            } else {
               setGeneralError(detail.msg || "Ocurrió un error de validación desconocido.");
            }
          });
          setErrors(newErrors);
          if (Object.keys(newErrors).length === 0 && !generalError && errorDetails.length > 0) {
             setGeneralError("Error de validación. Por favor verifica tu información.");
          }
        } else if (typeof errorDetails === 'string') {
          setGeneralError(errorDetails);
        } else {
          setGeneralError('Ocurrió un error inesperado. Por favor intenta nuevamente.');
        }
      } else {
        setGeneralError('Ocurrió un error del servidor. Por favor intenta más tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="medium"
      footer={
        <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            form="edit-asset-category-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Edit3 className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900">Editar Categoría</h3>
            <p className="text-sm text-gray-500">Modifica los detalles de la categoría "{category?.name}"</p>
          </div>
        </div>

        {/* Información de la categoría */}
        {category && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Creado:</span>
                <span className="ml-1">{formatDate(category.created_at)}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                <span className="font-medium">Plantillas:</span>
                <span className="ml-1">{category.templates?.length || 0}</span>
              </div>
            </div>
          </div>
        )}

        <form id="edit-asset-category-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Error General */}
          {generalError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error al actualizar la categoría</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{generalError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campo Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Categoría <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="ej. Laptops, Mobiliario, Equipos de Oficina"
              disabled={isSubmitting}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                errors.name 
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
            />
            {errors.name && (
              <div className="mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                <p className="text-xs text-red-600">{errors.name}</p>
              </div>
            )}
          </div>

          {/* Campo Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
              <span className="text-gray-400 font-normal ml-1">(Opcional)</span>
            </label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción breve de la categoría y los tipos de activos que incluye..."
              disabled={isSubmitting}
              className={`block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors resize-none ${
                errors.description 
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isSubmitting ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
            />
            {errors.description && (
              <div className="mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                <p className="text-xs text-red-600">{errors.description}</p>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Puedes dejar este campo vacío si no deseas proporcionar una descripción.
            </p>
          </div>

          {/* Advertencia sobre plantillas */}
          {category?.templates && category.templates.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Importante</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Esta categoría tiene {category.templates.length} plantillas asociadas. Los cambios en el nombre se reflejarán en todas las plantillas relacionadas.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default EditAssetCategoryModal;