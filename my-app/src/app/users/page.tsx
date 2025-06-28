"use client"; 

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Shield, 
  ShieldOff, 
  Trash2, 
  Mail, 
  Calendar, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  UserX,
  Eye,
  Plus,
  X,
  Loader2
} from 'lucide-react';

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  roles: {
    super_admin: boolean;
    school_admin: boolean;
    teacher: boolean;
    inventory_manager: boolean;
  };
  created_at: string;
  last_login: string | null;
  school_id?: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  pending_users: number;
  super_admins: number;
  school_admins: number;
  teachers: number;
  inventory_managers: number;
}

interface School {
  id: string;
  name: string;
  address: string;
  description: string | null;
  logo_url: string | null;
}

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitationSent?: () => void;
}

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated?: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onUserUpdated 
}) => {
  const { token } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Limpiar mensajes cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleUserAction = async (action: string) => {
    if (!user || !token) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await axios.post(`${API_BASE_URL}/admin-users/${user.id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const actionMessages = {
        activate: 'Usuario activado exitosamente',
        suspend: 'Usuario suspendido exitosamente',
        'set-pending': 'Usuario marcado como pendiente'
      };
      
      setSuccessMessage(actionMessages[action as keyof typeof actionMessages] || 'Acción completada');
      
      if (onUserUpdated) {
        setTimeout(() => {
          onUserUpdated();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || `Error al ${action} usuario`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Activo' },
      suspended: { color: 'bg-red-100 text-red-800', icon: UserX, text: 'Suspendido' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.text}
      </span>
    );
  };

  const getRolesList = (roles: User['roles']) => {
    const activeRoles = Object.entries(roles)
      .filter(([_, isActive]) => isActive)
      .map(([role, _]) => {
        const roleNames = {
          super_admin: 'Super Administrador',
          school_admin: 'Administrador de Escuela',
          teacher: 'Profesor',
          inventory_manager: 'Gestor de Inventario'
        };
        return roleNames[role as keyof typeof roleNames];
      });
    
    return activeRoles.length > 0 ? activeRoles : ['Sin roles asignados'];
  };

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Detalles del Usuario</h2>
                  <p className="text-blue-100 text-sm">Información completa y acciones disponibles</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">¡Éxito!</p>
                  <p className="text-green-600 text-sm">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            <div className="space-y-6">
              {/* Información básica */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                    <p className="text-gray-900 font-medium">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Correo Electrónico</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <div className="mt-1">
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID de Usuario</label>
                    <p className="text-gray-600 font-mono text-sm">{user.id}</p>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Roles Asignados</h3>
                <div className="flex flex-wrap gap-2">
                  {getRolesList(user.roles).map((role, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Fechas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Actividad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                    <p className="text-gray-900">{new Date(user.created_at).toLocaleString('es-ES')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Último Acceso</label>
                    <p className="text-gray-900">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleString('es-ES') 
                        : 'Nunca ha iniciado sesión'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Selecciona una acción para cambiar el estado del usuario
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                
                {user.status !== 'active' && (
                  <button
                    onClick={() => handleUserAction('activate')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                    <span>Activar</span>
                  </button>
                )}
                
                {user.status !== 'suspended' && (
                  <button
                    onClick={() => handleUserAction('suspend')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                    <span>Suspender</span>
                  </button>
                )}
                
                {user.status !== 'pending' && (
                  <button
                    onClick={() => handleUserAction('set-pending')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                    <span>Pendiente</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const InvitationModal: React.FC<InvitationModalProps> = ({ isOpen, onClose, onInvitationSent }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    role_id: 0,
    school_id: ''
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const roleOptions = [
    { id: 0, name: 'Super Administrador', value: 'super_admin' },
    { id: 1, name: 'Administrador de Escuela', value: 'school_admin' },
    { id: 2, name: 'Profesor', value: 'teacher' },
    { id: 3, name: 'Gestor de Inventario', value: 'inventory_manager' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchSchools();
      setFormData({ email: '', role_id: 0, school_id: '' });
      setErrors({});
      setGeneralError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  const fetchSchools = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/schools/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchools(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const payload = {
        email: formData.email,
        role_id: formData.role_id,
        ...(formData.school_id && { school_id: formData.school_id })
      };

      const response = await axios.post(`${API_BASE_URL}/invitations/`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
        setShowSuccess(true);
        setTimeout(() => {
          if (onInvitationSent) onInvitationSent();
          onClose();
        }, 2000);
      }

    } catch (err: any) {
      console.error('Error sending invitation:', err);
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const newErrors: Record<string, string> = {};
          err.response.data.detail.forEach((detail: any) => {
            if (detail.loc && detail.loc.length > 1) {
              newErrors[detail.loc[1]] = detail.msg;
            }
          });
          setErrors(newErrors);
        } else {
          setGeneralError(err.response.data.detail);
        }
      } else {
        setGeneralError('Error al enviar la invitación. Por favor intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Invitar Usuario</h2>
                  <p className="text-blue-100 text-sm">Envía una invitación para registrar un nuevo usuario</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {showSuccess && (
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">¡Invitación enviada exitosamente!</p>
                  <p className="text-green-600 text-sm">El usuario recibirá un correo con las instrucciones.</p>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {generalError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">Error</p>
                      <p className="text-red-600 text-sm">{generalError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>Correo Electrónico</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="usuario@ejemplo.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span>Rol</span>
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roleOptions.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              {formData.role_id !== 0 && (
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Escuela</span>
                    <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <select
                    value={formData.school_id}
                    onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar escuela</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </form>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isSubmitting ? 'Enviando...' : 'Enviar Invitación'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const UsersAdminPage: React.FC = () => {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && user && token) {
      fetchUsers();
      fetchStats();
    }
  }, [searchTerm, statusFilter, user, token, isAuthLoading]);

  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      const params = new URLSearchParams({
        skip: '0',
        limit: '100'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status_filter', statusFilter);

      const response = await axios.get(`${API_BASE_URL}/admin-users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError('Error al cargar los usuarios. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/admin-users/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    if (!token) return;
    
    try {
      await axios.post(`${API_BASE_URL}/admin-users/${userId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      fetchStats();
      setShowDropdown(null);
    } catch (error) {
      console.error(`Error ${action} user:`, error);
    }
  };

  // FIX: Función corregida para abrir el modal de detalles
  const openUserDetailsModal = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
    setShowDropdown(null);
  };

  // FIX: Función para cerrar el modal de detalles
  const closeUserDetailsModal = () => {
    setShowUserDetailsModal(false);
    setSelectedUser(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Activo' },
      suspended: { color: 'bg-red-100 text-red-800', icon: UserX, text: 'Suspendido' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getRolesList = (roles: User['roles']) => {
    const activeRoles = Object.entries(roles)
      .filter(([_, isActive]) => isActive)
      .map(([role, _]) => {
        const roleNames = {
          super_admin: 'Super Admin',
          school_admin: 'Admin Escuela',
          teacher: 'Profesor',
          inventory_manager: 'Gestor Inventario'
        };
        return roleNames[role as keyof typeof roleNames];
      });
    
    return activeRoles.length > 0 ? activeRoles.join(', ') : 'Sin roles';
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para ver esta página.</p>
        </div>
      </div>
    );
  }

if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando usuarios...</p>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">Administra usuarios, roles y permisos del sistema</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              <span>Invitar Usuario</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspendidos</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.suspended_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending_users}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="suspended">Suspendidos</option>
                    <option value="pending">Pendientes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acceso
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{userItem.full_name}</div>
                        <div className="text-sm text-gray-500">{userItem.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(userItem.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getRolesList(userItem.roles)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.last_login 
                        ? new Date(userItem.last_login).toLocaleDateString('es-ES')
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === userItem.id ? null : userItem.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {showDropdown === userItem.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => openUserDetailsModal(userItem)}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Eye className="h-4 w-4" />
                                <span>Ver Detalles</span>
                              </button>
                              
                              {userItem.status !== 'active' && (
                                <button
                                  onClick={() => handleUserAction(userItem.id, 'activate')}
                                  className="flex items-center space-x-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  <span>Activar</span>
                                </button>
                              )}
                              
                              {userItem.status !== 'suspended' && (
                                <button
                                  onClick={() => handleUserAction(userItem.id, 'suspend')}
                                  className="flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                                >
                                  <UserX className="h-4 w-4" />
                                  <span>Suspender</span>
                                </button>
                              )}
                              
                              {userItem.status !== 'pending' && (
                                <button
                                  onClick={() => handleUserAction(userItem.id, 'set-pending')}
                                  className="flex items-center space-x-2 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 w-full text-left"
                                >
                                  <Clock className="h-4 w-4" />
                                  <span>Marcar Pendiente</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza invitando tu primer usuario'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <InvitationModal 
        isOpen={showInviteModal} 
        onClose={() => setShowInviteModal(false)}
        onInvitationSent={() => {
          fetchUsers();
          fetchStats();
        }}
      />
      
      <UserDetailsModal 
        isOpen={showUserDetailsModal} 
        onClose={closeUserDetailsModal}
        user={selectedUser}
        onUserUpdated={() => {
          fetchUsers();
          fetchStats();
        }}
      />
    </div>
  );
};

export default UsersAdminPage;

function post(arg0: string, payload: { school_id?: string | undefined; email: string; role_id: number; }, arg2: { headers: { Authorization: string; 'Content-Type': string; }; }) {
    throw new Error('Function not implemented.');
}
