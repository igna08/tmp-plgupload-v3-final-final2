"use client";

import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
// import Textarea from '@/components/ui/Textarea'; // If asset had a description field

const API_BASE_URL = 'http://localhost:8000/api';

interface AssetTemplateOption {
  id: string;
  name: string;
}

interface ClassroomOption {
  id: string;
  name: string;
}

interface Asset { // For pre-filling the form
  id: string;
  template_id: string;
  serial_number: string;
  purchase_date: string | null;
  value_estimate: number | null;
  image_url: string | null;
  status: string;
  classroom_id: string | null;
  // template and qr_code objects not needed for edit form if not directly editable here
}

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null; // Asset data to pre-fill
  onAssetUpdated?: () => void;
}

interface AssetUpdateFormData {
  template_id: string;
  serial_number: string;
  purchase_date: string;
  value_estimate: string;
  image_url: string;
  status: string;
  classroom_id: string;
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const EditAssetModal: React.FC<EditAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  onAssetUpdated,
}) => {
  const [formData, setFormData] = useState<AssetUpdateFormData>({
    template_id: '',
    serial_number: '',
    purchase_date: '',
    value_estimate: '',
    image_url: '',
    status: 'available',
    classroom_id: '',
  });

  const [templates, setTemplates] = useState<AssetTemplateOption[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [isDropdownDataLoading, setIsDropdownDataLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fetchDropdownData = useCallback(async () => {
    if (!isOpen) return;
    setIsDropdownDataLoading(true);
    try {
      const [templatesRes, classroomsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/assets/templates/?limit=1000`),
        axios.get(`${API_BASE_URL}/classrooms/?limit=1000`),
      ]);
      setTemplates(templatesRes.data || []);
      setClassrooms(classroomsRes.data || []);
    } catch (error) {
      console.error("Failed to load dropdown data for asset modal", error);
      setGeneralError("Failed to load options for templates or classrooms.");
    } finally {
      setIsDropdownDataLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        template_id: asset.template_id || (templates[0]?.id || ''),
        serial_number: asset.serial_number || '',
        purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '', // Format for <input type="date">
        value_estimate: asset.value_estimate !== null ? String(asset.value_estimate) : '',
        image_url: asset.image_url || '',
        status: asset.status || 'available',
        classroom_id: asset.classroom_id || '',
      });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    } else if (!isOpen) {
        setFormData({ template_id: '', serial_number: '', purchase_date: '', value_estimate: '', image_url: '', status: 'available', classroom_id: ''});
        setErrors({});
        setGeneralError(null);
        setIsSubmitting(false);
    }
  }, [isOpen, asset, templates]); // re-run if templates load after asset to set default template_id

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    if (!asset) {
      setGeneralError("Asset data is missing.");
      return;
    }
    if (!formData.template_id) {
        setErrors(prev => ({...prev, template_id: "Template is required."}));
        setIsSubmitting(false);
        return;
    }
    if (!formData.status) {
        setErrors(prev => ({...prev, status: "Status is required."}));
        setIsSubmitting(false);
        return;
    }

    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const payload: any = {
        template_id: formData.template_id,
        serial_number: formData.serial_number,
        status: formData.status,
        // Handle optional fields: send null if empty, or omit if API prefers that for PUT
        purchase_date: formData.purchase_date || null,
        value_estimate: formData.value_estimate ? parseFloat(formData.value_estimate) : null,
        image_url: formData.image_url || null,
        classroom_id: formData.classroom_id || null,
      };

      await axios.put(`${API_BASE_URL}/assets/${asset.id}`, payload);

      if (onAssetUpdated) {
        onAssetUpdated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update asset:', err);
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

  const templateOptions = templates.map(t => ({ value: t.id, label: t.name }));
  const classroomOptions = [{ value: "", label: "None (Unassigned)" }].concat(
    classrooms.map(c => ({ value: c.id, label: c.name }))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Asset: ${asset?.serial_number || ''}`}
      size="large"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting || isDropdownDataLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isDropdownDataLoading || !formData.template_id}
            form="edit-asset-form"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      {isDropdownDataLoading ? <p className="text-center">Loading options...</p> :
      <form id="edit-asset-form" onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-accentRed rounded-radiusSmall text-sm text-accentRed">
            {generalError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="template_id_edit" className="block text-sm font-medium text-neutralDark mb-1">
                Template <span className="text-accentRed">*</span>
              </label>
              {templateOptions.length > 0 ? (
                <Select
                    id="template_id_edit" // Unique ID for edit form
                    name="template_id"
                    value={formData.template_id}
                    onChange={handleChange}
                    options={templateOptions}
                    disabled={isSubmitting}
                    hasError={!!errors.template_id}
                />
              ) : (
                 <p className="text-sm text-neutralTextSecondary mt-1 py-2 px-3 border border-neutralLight rounded-radiusSmall">No templates available.</p>
              )}
              {errors.template_id && <p className="text-xs text-accentRed mt-1">{errors.template_id}</p>}
            </div>
            <div>
              <label htmlFor="serial_number_edit" className="block text-sm font-medium text-neutralDark mb-1">
                Serial Number <span className="text-accentRed">*</span>
              </label>
              <Input
                id="serial_number_edit"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                disabled={isSubmitting}
                hasError={!!errors.serial_number}
              />
              {errors.serial_number && <p className="text-xs text-accentRed mt-1">{errors.serial_number}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="status_edit" className="block text-sm font-medium text-neutralDark mb-1">
                    Status <span className="text-accentRed">*</span>
                </label>
                <Select
                    id="status_edit"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={statusOptions}
                    disabled={isSubmitting}
                    hasError={!!errors.status}
                />
                {errors.status && <p className="text-xs text-accentRed mt-1">{errors.status}</p>}
            </div>
            <div>
              <label htmlFor="purchase_date_edit" className="block text-sm font-medium text-neutralDark mb-1">
                Purchase Date
              </label>
              <Input
                id="purchase_date_edit"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleChange}
                disabled={isSubmitting}
                hasError={!!errors.purchase_date}
              />
              {errors.purchase_date && <p className="text-xs text-accentRed mt-1">{errors.purchase_date}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="value_estimate_edit" className="block text-sm font-medium text-neutralDark mb-1">
                Value Estimate ($)
              </label>
              <Input
                id="value_estimate_edit"
                name="value_estimate"
                type="number"
                step="0.01"
                value={formData.value_estimate}
                onChange={handleChange}
                disabled={isSubmitting}
                hasError={!!errors.value_estimate}
              />
              {errors.value_estimate && <p className="text-xs text-accentRed mt-1">{errors.value_estimate}</p>}
            </div>
            <div>
              <label htmlFor="classroom_id_edit" className="block text-sm font-medium text-neutralDark mb-1">
                Assign to Classroom
              </label>
              <Select
                id="classroom_id_edit"
                name="classroom_id"
                value={formData.classroom_id}
                onChange={handleChange}
                options={classroomOptions}
                disabled={isSubmitting || classrooms.length === 0}
                hasError={!!errors.classroom_id}
              />
              {errors.classroom_id && <p className="text-xs text-accentRed mt-1">{errors.classroom_id}</p>}
            </div>
        </div>
        <div>
            <label htmlFor="image_url_edit" className="block text-sm font-medium text-neutralDark mb-1">
            Image URL
            </label>
            <Input
            id="image_url_edit"
            name="image_url"
            type="url"
            value={formData.image_url}
            onChange={handleChange}
            disabled={isSubmitting}
            hasError={!!errors.image_url}
            />
            {errors.image_url && <p className="text-xs text-accentRed mt-1">{errors.image_url}</p>}
        </div>
      </form>
    }
    </Modal>
  );
};

export default EditAssetModal;
