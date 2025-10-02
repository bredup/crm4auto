'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, Plus } from 'lucide-react';
import { format, parse, addMinutes } from 'date-fns';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date | string;
}

export function AppointmentModal({ isOpen, onClose, onSuccess, selectedDate }: AppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Шаг 1: Клиент
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });

  // Шаг 2: Детали
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadServices();
      resetForm();
      // Предзаполнение даты
      if (selectedDate) {
        const dateStr = selectedDate instanceof Date 
          ? format(selectedDate, 'yyyy-MM-dd')
          : selectedDate;
        setAppointmentDate(dateStr);
      } else {
        setAppointmentDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, selectedDate]);

  // Поиск клиентов
  const searchClients = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setClients([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/clients?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Ошибка поиска клиентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    }
  };

  // Расчёт времени окончания
  useEffect(() => {
    if (startTime && selectedService) {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = addMinutes(start, selectedService.duration);
      setEndTime(format(end, 'HH:mm'));
    }
  }, [startTime, selectedService]);

  const createClient = async () => {
    if (!newClientData.firstName || !newClientData.lastName || !newClientData.phone) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });

      const data = await response.json();
      if (data.success) {
        const clientWithName = {
          ...data.client,
          name: `${data.client.firstName || ''} ${data.client.lastName || ''}`.trim() || data.client.name
        };
        setSelectedClient(clientWithName);
        setIsCreatingClient(false);
      } else {
        alert(data.error || 'Ошибка создания клиента');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка создания клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedService || !appointmentDate || !startTime) {
      alert('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          serviceId: selectedService.id,
          date: appointmentDate,  // API ждёт "date" а не "appointmentDate"!
          startTime,
          endTime,
          status: 'scheduled'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert('Запись успешно создана!');
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Ошибка создания записи');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка создания записи');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSearchQuery('');
    setClients([]);
    setSelectedClient(null);
    setIsCreatingClient(false);
    setSelectedService(null);
    setAppointmentDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setNotes('');
    setNewClientData({
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Шапка - ЕДИНЫЙ СТИЛЬ */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Новая запись</h2>
            <p className="text-sm text-gray-500 mt-1">Шаг {step} из 2</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Прогресс - ЕДИНЫЙ СТИЛЬ */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${((step - 1) / 1) * 100}%` }}
              />
            </div>
            
            {[1, 2].map((num) => (
              <div key={num} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= num ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {num}
                </div>
                <span className="text-xs mt-2 text-gray-600 font-medium">
                  {num === 1 ? 'Клиент' : 'Детали'}
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
                  onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+7 (999) 123-45-67"
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

          {/* Шаг 2: Детали */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Услуга *</label>
                <select
                  value={selectedService?.id || ''}
                  onChange={(e) => {
                    const service = services.find(s => s.id === e.target.value);
                    setSelectedService(service || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите услугу</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration} мин, {service.price}₽)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Дата *</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Время начала *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Время окончания</label>
                  <input
                    type="time"
                    value={endTime}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>
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
            
            {step < 2 && !isCreatingClient ? (
              <button
                onClick={() => setStep(2)}
                disabled={!selectedClient}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Далее
              </button>
            ) : step === 2 ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedClient || !selectedService}
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
