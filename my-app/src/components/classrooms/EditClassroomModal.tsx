
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

interface Classroom {
  id: string;
  name: string;
  capacity: number | null;
  school_id: string;
}

interface EditClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom | null; // Datos del aula para pre-llenar
  onClassroomUpdated?: () => void;
}

interface ClassroomUpdateFormData {
  name: string;
  capacity: string; // Mantener como string para el input del formulario
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const EditClassroomModal: React.FC<EditClassroomModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onClassroomUpdated,
}) => {
  const [formData, setFormData] = useState<ClassroomUpdateFormData>({
    name: '',
    capacity: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && classroom) {
      setFormData({
        name: classroom.name || '',
        capacity: classroom.capacity !== null && classroom.capacity !== undefined ? String(classroom.capacity) : '',
      });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    } else if (!isOpen) {
        // Reiniciar formulario cuando el modal se cierra y no solo se reabre con nuevos datos
        setFormData({ name: '', capacity: '' });
        setErrors({});
        setGeneralError(null);
        setIsSubmitting(false);
    }
  }, [isOpen, classroom]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!classroom) {
      setGeneralError("Faltan los datos del aula.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const capacityValue = formData.capacity === '' ? null : parseInt(formData.capacity, 10);
      if (formData.capacity !== '' && (isNaN(capacityValue!) || capacityValue! < 0)) {
        setErrors(prev => ({...prev, capacity: "La capacidad debe ser un número no negativo."}));
        setIsSubmitting(false);
        return;
      }

      const payload: { name: string; capacity?: number | null } = { name: formData.name };
       if (capacityValue !== null) {
        payload.capacity = capacityValue;
      } else if (formData.capacity === '') {
        // Si se dejó vacía la capacidad, enviar null explícitamente
        payload.capacity = null;
      }

      await axios.put(`${API_BASE_URL}/classrooms/${classroom.id}`, payload);

      if (onClassroomUpdated) {
        onClassroomUpdated();
      }
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar el aula:', err);
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
             setGeneralError("Error de validación. Por favor verifica los datos ingresados.");
          }
        } else if (typeof errorDetails === 'string') {
          setGeneralError(errorDetails);
        } else {
          setGeneralError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
        }
      } else {
        setGeneralError('Ocurrió un error inesperado en el servidor.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Aula: ${classroom?.name || ''}`}
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            form="edit-classroom-form"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="edit-classroom-form" onSubmit={handleSubmit} className="space-y-6 p-1">
        {generalError && (
          <div className="p-4 bg-red-50 border border-accentRed rounded-radiusSmall text-sm text-accentRed">
            {generalError}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-neutralDark">
            Nombre del Aula <span className="text-accentRed">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="ej., Salón 101, Laboratorio de Ciencias"
            disabled={isSubmitting}
            hasError={!!errors.name}
          />
          {errors.name && <p className="text-xs text-accentRed mt-1.5">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="capacity" className="block text-sm font-medium text-neutralDark">
            Capacidad
          </label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="ej., 30 (Opcional)"
            disabled={isSubmitting}
            hasError={!!errors.capacity}
          />
          {errors.capacity && <p className="text-xs text-accentRed mt-1.5">{errors.capacity}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default EditClassroomModal;