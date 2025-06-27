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
  classroom: Classroom | null; // Classroom data to pre-fill
  onClassroomUpdated?: () => void;
}

interface ClassroomUpdateFormData {
  name: string;
  capacity: string; // Keep as string for form input
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
        // Reset form when modal is closed and not just re-opened with new data
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
      setGeneralError("Classroom data is missing.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const capacityValue = formData.capacity === '' ? null : parseInt(formData.capacity, 10);
      if (formData.capacity !== '' && (isNaN(capacityValue!) || capacityValue! < 0)) {
        setErrors(prev => ({...prev, capacity: "Capacity must be a non-negative number."}));
        setIsSubmitting(false);
        return;
      }

      const payload: { name: string; capacity?: number | null } = { name: formData.name };
       if (capacityValue !== null) {
        payload.capacity = capacityValue;
      } else if (formData.capacity === '') { // If capacity was left empty
        // If API expects null for empty capacity, or expects field to be omitted.
        // For PUT, often sending null is explicit, or omitting means "no change".
        // Assuming API handles omission or null correctly for optional fields.
        // Let's explicitly send null if user cleared it, assuming API handles it.
        payload.capacity = null;
      }


      await axios.put(`${API_BASE_URL}/classrooms/${classroom.id}`, payload);

      if (onClassroomUpdated) {
        onClassroomUpdated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update classroom:', err);
      if (err.response?.data?.detail) {
        const errorDetails = err.response.data.detail;
        if (Array.isArray(errorDetails)) {
          const newErrors: Record<string, string> = {};
          errorDetails.forEach((detail: ApiErrorDetail) => {
            if (detail.loc && detail.loc.length > 1) {
              newErrors[detail.loc[1]] = detail.msg;
            } else {
              setGeneralError(detail.msg || "An unknown validation error occurred.");
            }
          });
          setErrors(newErrors);
          if (Object.keys(newErrors).length === 0 && !generalError && errorDetails.length > 0) {
             setGeneralError("Validation failed. Please check your input.");
          }
        } else if (typeof errorDetails === 'string') {
          setGeneralError(errorDetails);
        } else {
          setGeneralError('An unexpected error occurred. Please try again.');
        }
      } else {
        setGeneralError('An unexpected server error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Classroom: ${classroom?.name || ''}`}
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            form="edit-classroom-form"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="edit-classroom-form" onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-accentRed rounded-radiusSmall text-sm text-accentRed">
            {generalError}
          </div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutralDark mb-1">
            Classroom Name <span className="text-accentRed">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Room 101, Science Lab"
            disabled={isSubmitting}
            hasError={!!errors.name}
          />
          {errors.name && <p className="text-xs text-accentRed mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-neutralDark mb-1">
            Capacity
          </label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={handleChange}
            placeholder="e.g., 30 (Optional)"
            disabled={isSubmitting}
            hasError={!!errors.capacity}
          />
          {errors.capacity && <p className="text-xs text-accentRed mt-1">{errors.capacity}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default EditClassroomModal;
