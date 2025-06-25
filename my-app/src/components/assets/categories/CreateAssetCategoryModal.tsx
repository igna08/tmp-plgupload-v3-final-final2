"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { AlertCircle, FolderPlus } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

interface CreateAssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: () => void;
}

interface CategoryFormData {
  name: string;
  description: string;
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const CreateAssetCategoryModal: React.FC<CreateAssetCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', description: '' });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const payload: Partial<CategoryFormData> = { name: formData.name };
      if (formData.description) {
        payload.description = formData.description;
      }

      await axios.post(`${API_BASE_URL}/assets/categories/`, payload);

      if (onCategoryCreated) {
        onCategoryCreated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create asset category:', err);
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
            form="create-asset-category-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FolderPlus className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Nueva Categoría de Activos</h3>
            <p className="text-sm text-gray-500">Crea una nueva categoría para organizar tus activos</p>
          </div>
        </div>

        <form id="create-asset-category-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Error General */}
          {generalError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error al crear la categoría</h3>
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
              Proporciona una descripción clara para ayudar a otros usuarios a entender qué activos pertenecen a esta categoría.
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FolderPlus className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Consejo</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Las categorías te ayudan a organizar y filtrar tus activos de manera eficiente. Usa nombres descriptivos y únicos.</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateAssetCategoryModal;