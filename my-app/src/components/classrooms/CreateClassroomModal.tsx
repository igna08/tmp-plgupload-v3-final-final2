"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const API_BASE_URL = 'http://localhost:8000/api';

interface CreateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string; // Crucial for the API endpoint
  onClassroomCreated?: () => void;
}

interface ClassroomFormData {
  name: string;
  capacity: string; // Keep as string for form input, convert on submit
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const CreateClassroomModal: React.FC<CreateClassroomModalProps> = ({
  isOpen,
  onClose,
  schoolId,
  onClassroomCreated,
}) => {
  const [formData, setFormData] = useState<ClassroomFormData>({
    name: '',
    capacity: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', capacity: '' });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    if (!schoolId) {
        setGeneralError("School ID is missing. Cannot create classroom.");
        setIsSubmitting(false);
        return;
    }

    try {
      const capacityValue = formData.capacity === '' ? null : parseInt(formData.capacity, 10);
      if (formData.capacity !== '' && (isNaN(capacityValue!) || capacityValue! < 0) ) {
        setErrors(prev => ({...prev, capacity: "Capacity must be a non-negative number."}));
        setIsSubmitting(false);
        return;
      }

      const payload: { name: string; capacity?: number | null } = { name: formData.name };
      if (capacityValue !== null) { // Only include capacity if it's a valid number or explicitly set to null if API allows
        payload.capacity = capacityValue;
      } else if (formData.capacity === '') { // If capacity was left empty, send undefined or null based on API expectation
        // If API defaults capacity or expects it to be omitted if not set, this is fine.
        // If it must be null, payload.capacity = null;
      }


      await axios.post(`${API_BASE_URL}/schools/${schoolId}/classrooms/`, payload);

      if (onClassroomCreated) {
        onClassroomCreated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create classroom:', err);
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
      title="Add New Classroom"
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
            form="create-classroom-form"
          >
            {isSubmitting ? 'Adding...' : 'Add Classroom'}
          </Button>
        </>
      }
    >
      <form id="create-classroom-form" onSubmit={handleSubmit} className="space-y-4">
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
            type="number" // HTML5 number input
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

export default CreateClassroomModal;
