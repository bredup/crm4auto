'use client';

import { useState, useEffect } from 'react';
import { X, Search, Plus, User, Phone, Mail, Clock, Calendar, Car } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: string;
}

export default function AppointmentModal({ isOpen, onClose, onSuccess, selectedDate }: AppointmentModalProps) {
  // States
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Form data
  const [appointmentData, setAppointmentData] = useState({
    date: selectedDate || new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    serviceId: '',
    status: 'scheduled'
  });

  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  // Загружаем услуги при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      fetchServices();
      resetForm();
    }
  }, [isOpen]);

  // Обновляем дату если она передана извне
  useEffect(() => {
    if (selectedDate) {
      setAppointmentData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);

  const resetForm = () => {
    setStep(1);
    setSelectedClient(null);
    setSearchQuery('');
    setClients([]);
    setIsCreatingClient(false);
    setAppointmentData({
      date: selectedDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      serviceId: '',
      status: 'scheduled'
    });
    setNewClientData({
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    });
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const searchClients = async (query: string) => {
    if (!query.trim()) {
      setClients([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/clients?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async () => {
    if (!newClientData.firstName || !newClientData.lastName || !newClientData.phone) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClientData)
      });

      const data = await response.json();
      if (data.success) {
        // Создаем объект клиента с полем name из firstName и lastName
        const clientWithName = {
          ...data.client,
          name: `${data.client.firstName} ${data.client.lastName}`.trim()
        };
        setSelectedClient(clientWithName);
        setStep(2);
        setIsCreatingClient(false);
      } else {
        alert(data.error || 'Ошибка при создании клиента');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Ошибка при создании клиента');
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    if (!selectedClient || !appointmentData.serviceId || !appointmentData.date || 
        !appointmentData.startTime || !appointmentData.endTime) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      setLoading(true);
      
      // Подготавливаем данные для отправки
      const requestData = {
        clientId: selectedClient.id.toString(),  // Преобразуем в строку
        serviceId: appointmentData.serviceId,     // Уже строка из select
        date: appointmentData.date,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        status: appointmentData.status
      };

      console.log('Sending appointment data:', requestData);

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Запись успешно создана!');
        onSuccess?.();
        onClose();
      } else {
        console.error('Server response:', data);
        alert(data.error || 'Ошибка при создании записи');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Ошибка при создании записи');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setAppointmentData(prev => ({ ...prev, serviceId }));
    
    // Автоматически рассчитываем время окончания
    const service = services.find(s => s.id.toString() === serviceId);
    if (service) {
      const [hours, minutes] = appointmentData.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + service.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      
      setAppointmentData(prev => ({ ...prev, endTime }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {step === 1 ? 'Выбор клиента' : 'Создание записи'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            // Шаг 1: Выбор или создание клиента
            <div className="space-y-6">
              {!isCreatingClient ? (
                <>
                  {/* Поиск клиента */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Поиск клиента
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchClients(e.target.value);
                        }}
                        placeholder="Введите имя или телефон клиента"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Список найденных клиентов */}
                  {clients.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      {clients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client);
                            setStep(2);
                          }}
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                        >
                          <User className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {client.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-4">
                              <span className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {client.phone}
                              </span>
                              {client.email && (
                                <span className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {client.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Кнопка создания нового клиента */}
                  <div className="text-center">
                    <button
                      onClick={() => setIsCreatingClient(true)}
                      className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Создать нового клиента
                    </button>
                  </div>
                </>
              ) : (
                // Форма создания нового клиента
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Новый клиент</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Имя *
                      </label>
                      <input
                        type="text"
                        value={newClientData.firstName}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Имя"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Фамилия *
                      </label>
                      <input
                        type="text"
                        value={newClientData.lastName}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Фамилия"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон *
                    </label>
                    <input
                      type="tel"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="client@example.com"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setIsCreatingClient(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={createClient}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Создание...' : 'Создать клиента'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Шаг 2: Создание записи
            <div className="space-y-6">
              {/* Выбранный клиент */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Клиент:</h3>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {selectedClient?.name}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">{selectedClient?.phone}</span>
                </div>
              </div>

              {/* Форма записи */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Дата
                  </label>
                  <input
                    type="date"
                    value={appointmentData.date}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Car className="inline w-4 h-4 mr-1" />
                    Услуга
                  </label>
                  <select
                    value={appointmentData.serviceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Выберите услугу</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration} мин, {service.price}₽)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Время начала
                  </label>
                  <input
                    type="time"
                    value={appointmentData.startTime}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Время окончания
                  </label>
                  <input
                    type="time"
                    value={appointmentData.endTime}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={appointmentData.status}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="scheduled">Запланирована</option>
                  <option value="confirmed">Подтверждена</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Завершена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>

              {/* Кнопки */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedClient(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Назад
                </button>
                <button
                  onClick={createAppointment}
                  disabled={loading || !selectedClient || !appointmentData.serviceId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Создание записи...' : 'Создать запись'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
