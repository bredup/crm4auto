'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, User, Car, Filter, RefreshCw, Phone, Mail } from 'lucide-react';
import { AppointmentModal } from '@/components/modals/appointment-modal';
import { EditAppointmentModal } from '@/components/modals/edit-appointment-modal';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

interface Appointment {
  id: string;
  clientId: string;
  client: Client;
  serviceId: string;
  service: Service;
  vehicleId?: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
}

const statusColors = {
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
};

const statusLabels = {
  SCHEDULED: 'Запланирована',
  CONFIRMED: 'Подтверждена',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена'
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    date: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.date) {
        params.append('date', filters.date);
      }

      const response = await fetch(`/api/appointments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAppointments(data.data || []);
      } else {
        throw new Error(data.error || 'Ошибка при загрузке записей');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке записей');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const handleModalSuccess = () => {
    fetchAppointments();
  };

  const handleEditSuccess = () => {
    fetchAppointments();
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status as keyof typeof statusColors] || statusColors.SCHEDULED;
    const label = statusLabels[status as keyof typeof statusLabels] || status;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Записи на обслуживание</h1>
          <p className="text-gray-600 mt-1">Управление записями клиентов</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Новая запись
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Статус:</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="SCHEDULED">Запланированы</option>
              <option value="CONFIRMED">Подтверждены</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="COMPLETED">Завершены</option>
              <option value="CANCELLED">Отменены</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Дата:</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {(filters.status !== 'all' || filters.date) && (
            <button
              onClick={() => setFilters({ status: 'all', date: '' })}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-800">
              <strong>Ошибка:</strong> {error}
            </div>
            <button
              onClick={handleRefresh}
              className="ml-auto text-red-600 hover:text-red-800 text-sm underline"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Записей не найдено</h3>
            <p className="text-gray-600 mb-4">
              {filters.status !== 'all' || filters.date 
                ? 'Попробуйте изменить фильтры или' 
                : 'Создайте первую запись для клиента'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать запись
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Main Info */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{appointment.startTime} - {appointment.endTime}</span>
                      </div>
                      
                      {getStatusBadge(appointment.status)}
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center text-gray-800">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{appointment.client.name}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 text-sm">
                        <Phone className="w-3 h-3 mr-1 text-gray-400" />
                        <span>{appointment.client.phone}</span>
                      </div>
                      
                      {appointment.client.email && (
                        <div className="flex items-center text-gray-600 text-sm">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          <span>{appointment.client.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="flex items-center text-gray-700">
                      <Car className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{appointment.service.name}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-green-600 font-medium">{appointment.service.price}₽</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-gray-600">{appointment.service.duration} мин</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(appointment)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        Изменить
                      </button>
                      <span className="text-gray-300">|</span>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
                        Отменить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {appointments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Всего записей: <span className="font-medium text-gray-900">{appointments.length}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>
                Активных: <span className="font-medium text-blue-600">
                  {appointments.filter(a => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status)).length}
                </span>
              </span>
              <span>
                Завершенных: <span className="font-medium text-green-600">
                  {appointments.filter(a => a.status === 'COMPLETED').length}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <EditAppointmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
