'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, User, Car, Clock, Plus, X, ChevronLeft, ChevronRight, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface Vehicle {
  id: number;
  clientId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number; // в минутах
  category: string;
}

interface Appointment {
  id?: number;
  clientId: number;
  vehicleId: number;
  serviceId: number;
  scheduledDate: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  estimatedCost: number;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedDate?: string;
  appointment?: Appointment; // Для редактирования существующей записи
}

type Step = 1 | 2 | 3;

export function AppointmentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  selectedDate,
  appointment 
}: AppointmentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  
  // Состояние для поиска клиентов
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Состояние для нового клиента
  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  
  // Состояние для автомобилей
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [newVehicleData, setNewVehicleData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: ''
  });
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  
  // Состояние для записи
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Загрузка услуг при открытии модала
  useEffect(() => {
    if (isOpen) {
      loadServices();
      if (appointment) {
        // Загружаем данные для редактирования
        loadAppointmentData();
      } else {
        // Сброс формы для новой записи
        resetForm();
      }
    }
  }, [isOpen, appointment]);

  // Поиск клиентов с debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchClients();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Загрузка автомобилей при выборе клиента
  useEffect(() => {
    if (selectedClient) {
      loadClientVehicles();
    }
  }, [selectedClient]);

  // Загрузка свободных слотов при выборе даты и услуги
  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedService]);

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedClient(null);
    setSelectedVehicle(null);
    setSelectedService(null);
    setSearchQuery('');
    setSearchResults([]);
    setNotes('');
    setAppointmentTime('09:00');
    setShowNewClientForm(false);
    setShowNewVehicleForm(false);
    setNewClientData({ firstName: '', lastName: '', phone: '', email: '' });
    setNewVehicleData({ make: '', model: '', year: new Date().getFullYear(), licensePlate: '' });
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServices(data.services || data);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    }
  };

  const searchClients = async () => {
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/clients?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Обеспечиваем, что у каждого клиента есть поле name
          const clientsWithNames = data.clients.map((client: any) => ({
            ...client,
            name: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim()
          }));
          setSearchResults(clientsWithNames);
        }
      }
    } catch (error) {
      console.error('Ошибка поиска клиентов:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const createClient = async () => {
    if (!newClientData.firstName || !newClientData.lastName || !newClientData.phone) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newClient = {
            ...data.client,
            name: `${data.client.firstName} ${data.client.lastName}`.trim()
          };
          setSelectedClient(newClient);
          setShowNewClientForm(false);
          setNewClientData({ firstName: '', lastName: '', phone: '', email: '' });
          setCurrentStep(2);
        } else {
          alert(data.error || 'Ошибка создания клиента');
        }
      }
    } catch (error) {
      console.error('Ошибка создания клиента:', error);
      alert('Ошибка создания клиента');
    } finally {
      setLoading(false);
    }
  };

  const loadClientVehicles = async () => {
    if (!selectedClient) return;
    
    try {
      const response = await fetch(`/api/clients/${selectedClient.id}/vehicles`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки автомобилей:', error);
      setVehicles([]);
    }
  };

  const createVehicle = async () => {
    if (!selectedClient || !newVehicleData.make || !newVehicleData.model) {
      alert('Пожалуйста, заполните марку и модель автомобиля');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newVehicleData,
          clientId: selectedClient.id
        })
      });
      
      if (response.ok) {
        const newVehicle = await response.json();
        setVehicles([...vehicles, newVehicle]);
        setSelectedVehicle(newVehicle);
        setShowNewVehicleForm(false);
        setNewVehicleData({ make: '', model: '', year: new Date().getFullYear(), licensePlate: '' });
      }
    } catch (error) {
      console.error('Ошибка создания автомобиля:', error);
      alert('Ошибка создания автомобиля');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedService) return;
    
    try {
      const response = await fetch(`/api/appointments/available-slots?date=${selectedDate}&duration=${selectedService.duration}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки свободных слотов:', error);
    }
  };

  const createAppointment = async () => {
    if (!selectedClient || !selectedVehicle || !selectedService || !selectedDate) {
      alert('Пожалуйста, заполните все необходимые поля');
      return;
    }
    
    setLoading(true);
    try {
      const appointmentData = {
        clientId: selectedClient.id.toString(),
        vehicleId: selectedVehicle.id.toString(),
        serviceId: selectedService.id.toString(),
        date: selectedDate,
        startTime: appointmentTime,
        // Вычисляем время окончания на основе длительности услуги
        endTime: calculateEndTime(appointmentTime, selectedService.duration),
        status: 'SCHEDULED',
        notes,
        estimatedCost: selectedService.price
      };

      const url = appointment ? `/api/appointments/${appointment.id}` : '/api/appointments';
      const method = appointment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Запись успешно создана!');
          onSuccess?.();
          handleClose();
        } else {
          alert(data.error || 'Ошибка при создании записи');
        }
      }
    } catch (error) {
      console.error('Ошибка создания записи:', error);
      alert('Ошибка создания записи');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const loadAppointmentData = async () => {
    if (!appointment) return;
    // Здесь можно загрузить данные для редактирования
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
  };

  const canProceedToStep2 = selectedClient !== null;
  const canProceedToStep3 = selectedClient && selectedVehicle;
  const canCreateAppointment = selectedClient && selectedVehicle && selectedService && selectedDate;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {appointment ? 'Редактирование записи' : 'Новая запись в автосервис'}
            </span>
            <div className="flex items-center space-x-2 text-sm">
              <Badge variant={currentStep === 1 ? "default" : currentStep > 1 ? "secondary" : "outline"}>
                1. Клиент
              </Badge>
              <Badge variant={currentStep === 2 ? "default" : currentStep > 2 ? "secondary" : "outline"}>
                2. Автомобиль
              </Badge>
              <Badge variant={currentStep === 3 ? "default" : "outline"}>
                3. Запись
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ШАГ 1: Выбор клиента */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-medium">
                <User className="h-5 w-5" />
                <span>Выберите клиента</span>
              </div>

              {!showNewClientForm ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по имени или телефону..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {searchLoading && (
                    <div className="text-center text-muted-foreground py-4">Поиск...</div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.map((client) => (
                        <Card
                          key={client.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedClient(client);
                            setCurrentStep(2);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{client.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center space-x-4">
                                  <span className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {client.phone}
                                  </span>
                                  {client.email && (
                                    <span className="flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {client.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {selectedClient && (
                    <Card className="bg-muted/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-green-700">✓ Выбран клиент:</div>
                            <div className="font-medium">{selectedClient.name}</div>
                            <div className="text-sm text-muted-foreground">{selectedClient.phone}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedClient(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowNewClientForm(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить нового клиента
                  </Button>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Новый клиент</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="client-first-name">Имя *</Label>
                        <Input
                          id="client-first-name"
                          value={newClientData.firstName}
                          onChange={(e) => setNewClientData({...newClientData, firstName: e.target.value})}
                          placeholder="Введите имя"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="client-last-name">Фамилия *</Label>
                        <Input
                          id="client-last-name"
                          value={newClientData.lastName}
                          onChange={(e) => setNewClientData({...newClientData, lastName: e.target.value})}
                          placeholder="Введите фамилию"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="client-phone">Телефон *</Label>
                      <Input
                        id="client-phone"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="client-email">Email</Label>
                      <Input
                        id="client-email"
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                        placeholder="client@example.com"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={createClient} disabled={loading}>
                        {loading ? 'Создание...' : 'Создать клиента'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewClientForm(false)}
                      >
                        Отмена
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ШАГ 2: Выбор автомобиля */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-medium">
                <Car className="h-5 w-5" />
                <span>Выберите автомобиль</span>
              </div>

              {selectedClient && (
                <Card className="bg-muted/20">
                  <CardContent className="p-3">
                    <span className="text-sm text-muted-foreground">Клиент: </span>
                    <span className="font-medium">{selectedClient.name}</span>
                  </CardContent>
                </Card>
              )}

              {!showNewVehicleForm ? (
                <>
                  {vehicles.length > 0 && (
                    <div className="space-y-2">
                      {vehicles.map((vehicle) => (
                        <Card
                          key={vehicle.id}
                          className={`cursor-pointer transition-colors ${
                            selectedVehicle?.id === vehicle.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedVehicle(vehicle)}
                        >
                          <CardContent className="p-4">
                            <div className="font-medium">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Гос. номер: {vehicle.licensePlate || 'не указан'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {vehicles.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      У клиента пока нет зарегистрированных автомобилей
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowNewVehicleForm(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить новый автомобиль
                  </Button>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Новый автомобиль</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicle-make">Марка *</Label>
                        <Input
                          id="vehicle-make"
                          value={newVehicleData.make}
                          onChange={(e) => setNewVehicleData({...newVehicleData, make: e.target.value})}
                          placeholder="Toyota, BMW, Lada..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="vehicle-model">Модель *</Label>
                        <Input
                          id="vehicle-model"
                          value={newVehicleData.model}
                          onChange={(e) => setNewVehicleData({...newVehicleData, model: e.target.value})}
                          placeholder="Camry, X5, Granta..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="vehicle-year">Год выпуска</Label>
                        <Input
                          id="vehicle-year"
                          type="number"
                          min="1900"
                          max={new Date().getFullYear() + 1}
                          value={newVehicleData.year}
                          onChange={(e) => setNewVehicleData({...newVehicleData, year: parseInt(e.target.value)})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="vehicle-plate">Гос. номер</Label>
                        <Input
                          id="vehicle-plate"
                          value={newVehicleData.licensePlate}
                          onChange={(e) => setNewVehicleData({...newVehicleData, licensePlate: e.target.value.toUpperCase()})}
                          placeholder="А123БВ77"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button onClick={createVehicle} disabled={loading}>
                        {loading ? 'Добавление...' : 'Добавить автомобиль'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewVehicleForm(false)}
                      >
                        Отмена
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ШАГ 3: Детали записи */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-medium">
                <Clock className="h-5 w-5" />
                <span>Детали записи</span>
              </div>

              <Card className="bg-muted/20">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Клиент: </span>
                      <span className="font-medium">{selectedClient?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Автомобиль: </span>
                      <span className="font-medium">
                        {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : ''}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="service">Услуга *</Label>
                  <Select value={selectedService?.id.toString() || ''} onValueChange={(value) => {
                    const service = services.find(s => s.id === parseInt(value));
                    setSelectedService(service || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите услугу" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          <div className="flex justify-between items-center w-full">
                            <span>{service.name}</span>
                            <span className="text-muted-foreground ml-4">
                              {service.price} ₽ • {service.duration}мин
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Дата записи</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate || ''}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="time">Время записи</Label>
                    <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))
                        ) : (
                          Array.from({ length: 18 }, (_, i) => {
                            const hour = 9 + Math.floor(i / 2);
                            const minute = (i % 2) * 30;
                            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            return (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Примечания</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Дополнительная информация о записи..."
                    rows={3}
                  />
                </div>

                {selectedService && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-base">Сводка записи</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Услуга:</span>
                        <span className="font-medium">{selectedService.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Длительность:</span>
                        <span>{selectedService.duration} минут</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Дата и время:</span>
                        <span>
                          {selectedDate && format(new Date(selectedDate), 'dd MMMM yyyy', { locale: ru })} в {appointmentTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Время окончания:</span>
                        <span>{calculateEndTime(appointmentTime, selectedService.duration)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg">
                        <span>Стоимость:</span>
                        <span className="text-green-600">{selectedService.price} ₽</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Навигация между шагами */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>

            <div className="flex space-x-2">
              {currentStep < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !canProceedToStep2) ||
                    (currentStep === 2 && !canProceedToStep3)
                  }
                >
                  Далее
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={createAppointment}
                  disabled={!canCreateAppointment || loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Сохранение...' : (appointment ? 'Сохранить изменения' : 'Создать запись')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
