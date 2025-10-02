'use client';

import { useState, useEffect } from 'react';
import { X, Search, User, Calendar, Clock, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, parse, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';

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

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess: () => void;
}

export function EditAppointmentModal({ isOpen, onClose, appointment, onSuccess }: EditAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Клиент
  const [searchQuery, setSearchQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });

  // Детали
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('SCHEDULED');

  // Загрузка данных записи
  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedClient(appointment.client);
      setSelectedService(appointment.service);
      setAppointmentDate(format(new Date(appointment.appointmentDate), 'yyyy-MM-dd'));
      setStartTime(appointment.startTime);
      setEndTime(appointment.endTime);
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
      loadServices();
    }
  }, [isOpen, appointment]);

  // Поиск клиентов
  useEffect(() => {
    if (searchQuery.length > 1) {
      fetch(`/api/clients?search=${searchQuery}`)
        .then(res => res.json())
        .then(data => setClients(data.data || []));
    } else {
      setClients([]);
    }
  }, [searchQuery]);

  // Загрузка услуг
  const loadServices = async () => {
    const res = await fetch('/api/services');
    const data = await res.json();
    setServices(data.data || []);
  };

  // Расчёт времени окончания
  useEffect(() => {
    if (startTime && selectedService) {
      const start = parse(startTime, 'HH:mm', new Date());
      const end = addMinutes(start, selectedService.duration);
      setEndTime(format(end, 'HH:mm'));
    }
  }, [startTime, selectedService]);

  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.phone) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      const data = await res.json();
      if (data.success) {
        setSelectedClient(data.data);
        setShowNewClientForm(false);
        setNewClient({ name: '', phone: '', email: '' });
        setSearchQuery('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedService || !appointmentDate || !startTime || !appointment) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          serviceId: selectedService.id,
          appointmentDate,
          startTime,
          endTime,
          status,
          notes
        })
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSearchQuery('');
    setClients([]);
    setShowNewClientForm(false);
    setNotes('');
    onClose();
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Редактировать запись</h2>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full transition-all ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`flex-1 h-2 rounded-full transition-all ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'font-semibold' : 'opacity-60'}>Клиент</span>
            <span className={step >= 2 ? 'font-semibold' : 'opacity-60'}>Детали</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {/* Шаг 1: Клиент */}
          {step === 1 && (
            <div className="space-y-4">
              {!selectedClient ? (
                <>
                  {!showNewClientForm ? (
                    <>
                      {/* Поиск */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Поиск клиента по имени или телефону..."
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Результаты */}
                      {clients.length > 0 && (
                        <div className="space-y-2">
                          {clients.map(client => (
                            <button
                              key={client.id}
                              onClick={() => setSelectedClient(client)}
                              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                            >
                              <div className="font-semibold text-gray-900">{client.name}</div>
                              <div className="text-sm text-gray-600">{client.phone}</div>
                              {client.email && <div className="text-sm text-gray-500">{client.email}</div>}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Новый клиент */}
                      <button
                        onClick={() => setShowNewClientForm(true)}
                        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-blue-600 font-semibold"
                      >
                        + Создать нового клиента
                      </button>
                    </>
                  ) : (
                    /* Форма нового клиента */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Имя *</label>
                        <input
                          type="text"
                          value={newClient.name}
                          onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Телефон *</label>
                        <input
                          type="tel"
                          value={newClient.phone}
                          onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={newClient.email}
                          onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowNewClientForm(false)}
                          className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleCreateClient}
                          disabled={!newClient.name || !newClient.phone || loading}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                          {loading ? 'Создание...' : 'Создать'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Выбранный клиент */
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {selectedClient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{selectedClient.name}</div>
                          <div className="text-sm text-gray-600">{selectedClient.phone}</div>
                          {selectedClient.email && <div className="text-sm text-gray-500">{selectedClient.email}</div>}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedClient(null)}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                      >
                        Изменить
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Шаг 2: Детали */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Услуга */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Услуга *</label>
                <select
                  value={selectedService?.id || ''}
                  onChange={(e) => {
                    const service = services.find(s => s.id === e.target.value);
                    setSelectedService(service || null);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Выберите услугу</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.duration} мин - {service.price} ₽
                    </option>
                  ))}
                </select>
              </div>

              {/* Дата */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Дата *</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Время */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Начало *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Окончание</label>
                  <input
                    type="time"
                    value={endTime}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              {/* Статус */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Статус *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="SCHEDULED">Запланирована</option>
                  <option value="CONFIRMED">Подтверждена</option>
                  <option value="IN_PROGRESS">В работе</option>
                  <option value="COMPLETED">Завершена</option>
                  <option value="CANCELLED">Отменена</option>
                </select>
              </div>

              {/* Примечания */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Примечания</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Дополнительная информация..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Назад
              </button>
            )}
            
            {step < 2 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!selectedClient}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Далее
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!selectedClient || !selectedService || !appointmentDate || !startTime || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg"
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
