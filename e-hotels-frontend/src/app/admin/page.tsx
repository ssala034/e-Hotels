'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllChains,
  getAllHotels,
  getAllRooms,
  getAllEmployees,
  getAllCustomers,
  createChain,
  updateChain,
  deleteChain,
  createHotel,
  updateHotel,
  deleteHotel,
  createRoom,
  updateRoom,
  deleteRoom,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  deleteCustomer,
} from '@/lib/api';
import { HotelChain, Hotel, Room, Employee, Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { Building2, Hotel as HotelIcon, DoorOpen, Users, UserCog, Plus, Edit, Trash2, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type TabType = 'chains' | 'hotels' | 'rooms' | 'employees' | 'customers';
type ModalMode = 'create' | 'edit' | null;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('chains');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [chains, setChains] = useState<HotelChain[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [chainForm, setChainForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  const [hotelForm, setHotelForm] = useState({
    chainId: '',
    name: '',
    starRating: 3,
    email: '',
    phoneNumber: '',
    street: '',
    city: '',
    stateProvince: '',
    zipCode: '',
    country: 'USA',
  });

  const [roomForm, setRoomForm] = useState({
    hotelId: '',
    roomNumber: '',
    pricePerNight: 0,
    capacity: 2,
    category: 3,
    viewType: '',
    canBeExtended: true,
    isDamaged: false,
    amenities: '',
  });

  const [employeeForm, setEmployeeForm] = useState({
    hotelId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Employee' as 'Employee',
    street: '',
    city: '',
    stateProvince: '',
    zipCode: '',
    country: 'USA',
    idType: 'SSN' as any,
    idNumber: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      router.push('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [chainsData, hotelsData, roomsData, employeesData, customersData] = await Promise.all([
        getAllChains(),
        getAllHotels(),
        getAllRooms(),
        getAllEmployees(),
        getAllCustomers(),
      ]);
      setChains(chainsData);
      setHotels(hotelsData);
      setRooms(roomsData);
      setEmployees(employeesData);
      setCustomers(customersData);
    } catch (error) {
      toast({
        title: 'Error loading data',
        description: 'Could not load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'chains', label: 'Hotel Chains', icon: Building2, count: chains.length },
    { id: 'hotels', label: 'Hotels', icon: HotelIcon, count: hotels.length },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen, count: rooms.length },
    { id: 'employees', label: 'Employees', icon: UserCog, count: employees.length },
    { id: 'customers', label: 'Customers', icon: Users, count: customers.length },
  ];

  // Hotel Chain Handlers
  const handleCreateChain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createChain({
        name: chainForm.name,
        contactEmails: [chainForm.email],
        phoneNumbers: [chainForm.phoneNumber],
        centralOfficeAddress: { street: '', city: '', stateProvince: '', zipCode: '', country: 'USA' },
      });
      toast({ title: 'Chain created successfully' });
      setModalMode(null);
      setChainForm({ name: '', email: '', phoneNumber: '' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create chain', variant: 'destructive' });
    }
  };

  const handleUpdateChain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await updateChain(selectedItem.id, {
        name: chainForm.name,
        contactEmails: [chainForm.email],
        phoneNumbers: [chainForm.phoneNumber],
        centralOfficeAddress: selectedItem.centralOfficeAddress,
      });
      toast({ title: 'Chain updated successfully' });
      setModalMode(null);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update chain', variant: 'destructive' });
    }
  };

  const handleDeleteChain = async (id: string) => {
    if (!confirm('Delete this hotel chain? This will also delete all associated hotels and rooms.')) return;
    try {
      await deleteChain(id);
      toast({ title: 'Chain deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete chain', variant: 'destructive' });
    }
  };

  // Hotel Handlers
  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHotel({
        chainId: hotelForm.chainId,
        name: hotelForm.name,
        category: hotelForm.starRating as 1 | 2 | 3 | 4 | 5,
        address: {
          street: hotelForm.street,
          city: hotelForm.city,
          stateProvince: hotelForm.stateProvince,
          zipCode: hotelForm.zipCode || '00000',
          country: hotelForm.country,
        },
        contactEmail: hotelForm.email,
        contactPhone: hotelForm.phoneNumber,
        managerId: 'emp-1', // Default manager
      });
      toast({ title: 'Hotel created successfully' });
      setModalMode(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create hotel', variant: 'destructive' });
    }
  };

  const handleDeleteHotel = async (id: string) => {
    if (!confirm('Delete this hotel? This will also delete all associated rooms.')) return;
    try {
      await deleteHotel(id);
      toast({ title: 'Hotel deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete hotel', variant: 'destructive' });
    }
  };

  // Room Handlers
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRoom({
        hotelId: roomForm.hotelId,
        roomNumber: roomForm.roomNumber,
        roomType: 'Standard',
        price: roomForm.pricePerNight,
        capacity: roomForm.capacity as any,
        viewType: (roomForm.viewType || 'No View') as any,
        isExtendable: roomForm.canBeExtended,
        amenities: roomForm.amenities.split(',').map(a => a.trim()).filter(Boolean),
        problems: roomForm.isDamaged ? 'Damaged' : undefined,
      });
      toast({ title: 'Room created successfully' });
      setModalMode(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create room', variant: 'destructive' });
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Delete this room?')) return;
    try {
      await deleteRoom(id);
      toast({ title: 'Room deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete room', variant: 'destructive' });
    }
  };

  // Employee Handlers
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployee({
        firstName: employeeForm.firstName,
        lastName: employeeForm.lastName,
        email: employeeForm.email,
        password: 'employee123', // Default password
        hotelId: employeeForm.hotelId,
        role: employeeForm.role as any,
        ssnSin: employeeForm.idNumber,
        address: {
          street: employeeForm.street,
          city: employeeForm.city,
          stateProvince: employeeForm.stateProvince,
          zipCode: employeeForm.zipCode,
          country: employeeForm.country,
        },
      });
      toast({ title: 'Employee created successfully' });
      setModalMode(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create employee', variant: 'destructive' });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await deleteEmployee(id);
      toast({ title: 'Employee deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete employee', variant: 'destructive' });
    }
  };

  // Customer Handlers
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer? This will also delete their bookings and rentings.')) return;
    try {
      await deleteCustomer(id);
      toast({ title: 'Customer deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete customer', variant: 'destructive' });
    }
  };

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage all hotel chain resources</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
              <Badge variant="secondary" className="ml-2">{tab.count}</Badge>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {/* Hotel Chains Tab */}
          {activeTab === 'chains' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Hotel Chains</h2>
                <Button onClick={() => { setModalMode('create'); setChainForm({ name: '', email: '', phoneNumber: '' }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Chain
                </Button>
              </div>

              {modalMode && (
                <Card>
                  <CardHeader>
                    <CardTitle>{modalMode === 'create' ? 'Create' : 'Edit'} Hotel Chain</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={modalMode === 'create' ? handleCreateChain : handleUpdateChain} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Chain Name</Label>
                        <Input value={chainForm.name} onChange={(e) => setChainForm({ ...chainForm, name: e.target.value })} required />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={chainForm.email} onChange={(e) => setChainForm({ ...chainForm, email: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={chainForm.phoneNumber} onChange={(e) => setChainForm({ ...chainForm, phoneNumber: e.target.value })} required />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">{modalMode === 'create' ? 'Create' : 'Update'}</Button>
                        <Button type="button" variant="outline" onClick={() => { setModalMode(null); setSelectedItem(null); }}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {chains.map((chain) => (
                  <Card key={chain.id}>
                    <CardHeader>
                      <CardTitle>{chain.name}</CardTitle>
                      <CardDescription>{chain.contactEmails[0] || 'No email'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{chain.phoneNumbers[0] || 'No phone'}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { 
                          setModalMode('edit'); 
                          setSelectedItem(chain);
                          setChainForm({ name: chain.name, email: chain.contactEmails[0] || '', phoneNumber: chain.phoneNumbers[0] || '' });
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteChain(chain.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Hotels Tab */}
          {activeTab === 'hotels' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Hotels</h2>
                <Button onClick={() => setModalMode('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hotel
                </Button>
              </div>

              {modalMode === 'create' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create Hotel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateHotel} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Hotel Chain</Label>
                          <select value={hotelForm.chainId} onChange={(e) => setHotelForm({ ...hotelForm, chainId: e.target.value })} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                            <option value="">Select chain</option>
                            {chains.map((chain) => <option key={chain.id} value={chain.id}>{chain.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Hotel Name</Label>
                          <Input value={hotelForm.name} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Star Rating</Label>
                          <Input type="number" min="1" max="5" value={hotelForm.starRating} onChange={(e) => setHotelForm({ ...hotelForm, starRating: Number(e.target.value) })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={hotelForm.email} onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={hotelForm.phoneNumber} onChange={(e) => setHotelForm({ ...hotelForm, phoneNumber: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Street</Label>
                          <Input value={hotelForm.street} onChange={(e) => setHotelForm({ ...hotelForm, street: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input value={hotelForm.city} onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>State/Province</Label>
                          <Input value={hotelForm.stateProvince} onChange={(e) => setHotelForm({ ...hotelForm, stateProvince: e.target.value })} required />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Create Hotel</Button>
                        <Button type="button" variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {hotels.map((hotel) => (
                  <Card key={hotel.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{hotel.name}</h3>
                          <p className="text-sm text-muted-foreground">{hotel.address.city}, {hotel.address.stateProvince}</p>
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm">{hotel.category} Star</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteHotel(hotel.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rooms Tab */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Rooms</h2>
                <Button onClick={() => setModalMode('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </div>

              {modalMode === 'create' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create Room</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateRoom} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Hotel</Label>
                          <select value={roomForm.hotelId} onChange={(e) => setRoomForm({ ...roomForm, hotelId: e.target.value })} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                            <option value="">Select hotel</option>
                            {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Room Number</Label>
                          <Input value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Price per Night</Label>
                          <Input type="number" value={roomForm.pricePerNight} onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: Number(e.target.value) })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Capacity</Label>
                          <Input type="number" min="1" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Category (Stars)</Label>
                          <Input type="number" min="1" max="5" value={roomForm.category} onChange={(e) => setRoomForm({ ...roomForm, category: Number(e.target.value) })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>View Type</Label>
                          <Input value={roomForm.viewType} onChange={(e) => setRoomForm({ ...roomForm, viewType: e.target.value })} placeholder="e.g., Sea View" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Amenities (comma-separated)</Label>
                        <Input value={roomForm.amenities} onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })} placeholder="WiFi, TV, Mini Bar" />
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" checked={roomForm.canBeExtended} onChange={(e) => setRoomForm({ ...roomForm, canBeExtended: e.target.checked })} />
                          <span className="text-sm">Can be extended</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" checked={roomForm.isDamaged} onChange={(e) => setRoomForm({ ...roomForm, isDamaged: e.target.checked })} />
                          <span className="text-sm">Damaged</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Create Room</Button>
                        <Button type="button" variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {rooms.slice(0, 50).map((room) => (
                  <Card key={room.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">Room #{room.roomNumber}</h3>
                          <p className="text-sm text-muted-foreground">{room.hotel?.name || 'Hotel'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge>{room.hotel?.category || 3} Star Hotel</Badge>
                            <Badge variant="secondary">{room.capacity}</Badge>
                            <span className="text-sm font-semibold">{formatCurrency(room.price)}/night</span>
                            {room.problems && <Badge variant="destructive">Has Issues</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteRoom(room.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {rooms.length > 50 && (
                  <p className="text-center text-muted-foreground">Showing 50 of {rooms.length} rooms</p>
                )}
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Employees</h2>
                <Button onClick={() => setModalMode('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </div>

              {modalMode === 'create' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create Employee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateEmployee} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>First Name</Label>
                          <Input value={employeeForm.firstName} onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <Input value={employeeForm.lastName} onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Hotel</Label>
                          <select value={employeeForm.hotelId} onChange={(e) => setEmployeeForm({ ...employeeForm, hotelId: e.target.value })} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                            <option value="">Select hotel</option>
                            {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Create Employee</Button>
                        <Button type="button" variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {employees.map((employee) => (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{employee.firstName} {employee.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                          <Badge variant="secondary" className="mt-1">{employee.role}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteEmployee(employee.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Customers</h2>
              </div>

              <div className="space-y-3">
                {customers.map((customer) => (
                  <Card key={customer.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{customer.firstName} {customer.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                          <p className="text-sm text-muted-foreground mt-1">{customer.address?.city}, {customer.address?.stateProvince}</p>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteCustomer(customer.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
