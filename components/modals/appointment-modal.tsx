'use client';

import { useState, useEffect } from 'react';
import { X, Search, Plus, User, Phone, Mail, Clock, Calendar, Wrench, Car } from 'lucide-react';

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
  category: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: string;
}

// Функция форматирования телефона
const formatPhone = (value: string): string => {
  // Удаляем все нецифровые символы
  const cleaned = value.replace(/\D/g, '');
  
  // Если начинается с 8, заменяем на 7
  let digits = cleaned;
  if (digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  
  // Если не начинается с 7, добавляем 7
  if (!digits.startsWith('7')) {
    digits = '7' + digits;
  }
  
  // Форматируем: +7 (XXX) XXX-XX-XX
  if (digits.length >= 1) {
    let formatted = '+7';
    if (digits.length > 1) {
      formatted += ' (' + digits.slice(1, 4);
      if (digits.length >= 4) {
        formatted += ')';
      }
      if (digits.length > 4) {
        formatted += ' ' + digits.slice(4, 7);
      }
      if (digits.length > 7) {
        formatted += '-' + digits.slice(7, 9);
      }
      if (digits.length > 9) {
        formatted += '-' + digits.slice(9, 11);
      }
    }
    return formatted;
  }
  
  return value;
};

// Функция для получения только цифр (для API)
const getPhoneDigits = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};

export function AppointmentModal({ isOpen, onClose, onSuccess, selectedDate }: AppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const [appointmentData, setAppointmentData] = useState({
    date: selectedDate || new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    status: 'SCHEDULED'
  });

  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    addVehicle: false,
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehicleLicensePlate: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate) {
      setAppointmentData(prev => ({ ...prev, date: selectedDate }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (serviceSearch) {
      const filtered = services.filter(service => 
        service.name?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        service.category?.toLowerCase().includes(serviceSearch.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services.slice(0, 20));
    }
  }, [serviceSearch, services]);

  const resetForm = () => {
    setStep(1);
    setSelectedClient(null);
    setSelectedService(null);
    setSearchQuery('');
    setServiceSearch('');
    setClients([]);
    setIsCreatingClient(false);
    setAppointmentData({
      date: selectedDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      status: 'SCHEDULED'
    });
    setNewClientData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      addVehicle: false,
      vehicleBrand: '',
      vehicleModel: '',
      vehicleYear: new Date().getFullYear(),
      vehicleLicensePlate: ''
    });
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
        setFilteredServices(data.services.slice(0, 20));
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
    // Проверяем только наличие символов, не длину
    const phoneDigits = newClientData.phone.replace(/\D/g, '');
    
    if (!newClientData.firstName.trim() || !newClientData.lastName.trim() || phoneDigits.length < 10) {
      alert('Заполните все обязательные поля корректно');
      return;
    }

    // Если включено добавление авто, проверяем его поля
    if (newClientData.addVehicle) {
      if (!newClientData.vehicleBrand.trim() || !newClientData.vehicleModel.trim()) {
        alert('Заполните данные автомобиля');
        return;
      }
    }

    try {
      setLoading(true);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: newClientData.firstName,
          lastName: newClientData.lastName,
          phone: newClientData.phone,
          email: newClientData.email
        })
      });

      const data = await response.json();
      if (data.success) {
        const clientWithName = {
          ...data.client,
          name: `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim() || data.client.name
        };
        setSelectedClient(clientWithName);

        // Если нужно создать автомобиль (опционально для записи)
        if (newClientData.addVehicle) {
          const vehicleResponse = await fetch('/api/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: clientWithName.id,
              brand: newClientData.vehicleBrand,
              model: newClientData.vehicleModel,
              year: newClientData.vehicleYear,
              licensePlate: newClientData.vehicleLicensePlate
            })
          });

          if (!vehicleResponse.ok) {
            console.warn('Не удалось создать автомобиль, но клиент создан');
          }
        }

        setIsCreatingClient(false);
        setStep(2); // Переходим на шаг выбора услуги
      } else {
        alert(data.error || 'Ошибка создания клиента');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Ошибка создания клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    
    const [hours, minutes] = appointmentData.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + service.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    
    setAppointmentData(prev => ({ ...prev, endTime }));
  };

  const createAppointment = async () => {
    if (!selectedClient || !selectedService || !appointmentData.date || 
        !appointmentData.startTime || !appointmentData.endTime) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        clientId: selectedClient.id.toString(),
        serviceId: selectedService.id.toString(),
        date: appointmentData.date,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        status: appointmentData.status
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Запись успешно создана!');
        onSuccess?.();
        onClose();
      } else {
        alert(data.error || 'Ошибка при создании записи');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Ошибка при создании записи');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Новая запись</h2>
            <p className="text-sm text-gray-500 mt-1">Шаг {step} из 3</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Прогресс */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
            </div>
            
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= num ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {num}
                </div>
                <span className="text-xs mt-2 text-gray-600 font-medium">
                  {num === 1 ? 'Клиент' : num === 2 ? 'Услуга' : 'Детали'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {/* Шаг 1: Клиент */}
          {step === 1 && !isCreatingClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Выберите клиента</h3>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по имени или телефону..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchClients(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {selectedClient ? (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                      <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                      {selectedClient.email && (
                        <p className="text-sm text-gray-500">{selectedClient.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Изменить
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                      >
                        <p className="font-semibold text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                        {client.email && (
                          <p className="text-sm text-gray-500">{client.email}</p>
                        )}
                      </div>
                    ))}
                    {searchQuery.length >= 2 && clients.length === 0 && !loading && (
                      <p className="text-center text-gray-500 py-8">Клиенты не найдены</p>
                    )}
                    {searchQuery.length < 2 && (
                      <p className="text-center text-gray-500 py-8">Введите минимум 2 символа для поиска</p>
                    )}
                    {loading && (
                      <p className="text-center text-gray-500 py-8">Поиск...</p>
                    )}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      onClick={() => setIsCreatingClient(true)}
                      className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Создать нового клиента
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Форма создания клиента */}
          {step === 1 && isCreatingClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Новый клиент</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Имя *</label>
                  <input
                    type="text"
                    value={newClientData.firstName}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия *</label>
                  <input
                    type="text"
                    value={newClientData.lastName}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Иванов"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Телефон *</label>
                <input
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setNewClientData(prev => ({ ...prev, phone: formatted }));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+7 (999) 123-45-67"
                  maxLength={18}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="client@example.com"
                />
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newClientData.addVehicle}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, addVehicle: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Добавить автомобиль клиенту
                  </span>
                </label>
              </div>

              {newClientData.addVehicle && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Данные автомобиля
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Марка *</label>
                      <input
                        type="text"
                        value={newClientData.vehicleBrand}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, vehicleBrand: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Модель *</label>
                      <input
                        type="text"
                        value={newClientData.vehicleModel}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Camry"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Год</label>
                      <input
                        type="number"
                        value={newClientData.vehicleYear}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, vehicleYear: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Гос. номер</label>
                      <input
                        type="text"
                        value={newClientData.vehicleLicensePlate}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, vehicleLicensePlate: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="А123БВ777"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsCreatingClient(false)}
                  className="flex-1 px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={createClient}
                  disabled={loading}
                  className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          )}

          {/* Шаг 2: Услуга */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Выберите услугу</h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск услуги..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {selectedService ? (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{selectedService.name}</p>
                      <p className="text-xs text-gray-500">{selectedService.category}</p>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-gray-900">{selectedService.price.toLocaleString()} ₽</p>
                      <p className="text-xs text-gray-500">{selectedService.duration} мин</p>
                    </div>
                    <button
                      onClick={() => setSelectedService(null)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Изменить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-500">{service.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{service.price.toLocaleString()} ₽</p>
                          <p className="text-xs text-gray-500">{service.duration} мин</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredServices.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Услуги не найдены</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Шаг 3: Детали записи */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Детали записи</h3>
              </div>

              <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Клиент:</span>
                  <span className="text-sm text-gray-900">{selectedClient?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Услуга:</span>
                  <span className="text-sm text-gray-900">{selectedService?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Стоимость:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {selectedService?.price.toLocaleString()} ₽
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Дата
                </label>
                <input
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                    onChange={(e) => {
                      setAppointmentData(prev => ({ ...prev, startTime: e.target.value }));
                      if (selectedService) {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const startMinutes = hours * 60 + minutes;
                        const endMinutes = startMinutes + selectedService.duration;
                        const endHours = Math.floor(endMinutes / 60);
                        const endMins = endMinutes % 60;
                        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                        setAppointmentData(prev => ({ ...prev, endTime }));
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <select
                  value={appointmentData.status}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="SCHEDULED">Запланирована</option>
                  <option value="CONFIRMED">Подтверждена</option>
                  <option value="IN_PROGRESS">В работе</option>
                  <option value="COMPLETED">Завершена</option>
                  <option value="CANCELLED">Отменена</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            {step > 1 && !isCreatingClient && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Назад
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
            >
              Отмена
            </button>
            
            {step < 3 && !isCreatingClient ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedClient) ||
                  (step === 2 && !selectedService)
                }
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Далее
              </button>
            ) : step === 3 ? (
              <button
                onClick={createAppointment}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать запись'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
