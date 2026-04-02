'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getChainById,
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
  getArchivedReservations,
} from '@/lib/api';
import { HotelChain, Hotel, Room, Employee, Customer, EmployeeRole, IDType, ArchivedReservation, RoomCapacity, ViewType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { HotelCapacityView } from '@/components/analytics/HotelCapacityView';
import { Building2, Hotel as HotelIcon, DoorOpen, Users, UserCog, Plus, Edit, Trash2, Star, Archive, AlertTriangle, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

type TabType = 'chains' | 'hotels' | 'rooms' | 'employees' | 'customers' | 'analytics';
type ModalMode = 'create' | 'edit' | null;
type DeleteTargetType = 'chain' | 'hotel';

type DeleteConfirmationState = {
  type: DeleteTargetType;
  id: string;
  name: string;
} | null;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

  const [activeTab, setActiveTab] = useState<TabType>('chains');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [chains, setChains] = useState<HotelChain[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [archivedReservations, setArchivedReservations] = useState<ArchivedReservation[]>([]);
  const [expandedArchivedReservationIds, setExpandedArchivedReservationIds] = useState<Record<string, boolean>>({});

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedItem, setSelectedItem] = useState<HotelChain | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    roomIssue: '',
  });

  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Receptionist' as EmployeeRole,
    chainId: '',
    hotelName: '',
    street: '',
    city: '',
    stateProvince: '',
    zipCode: '',
    country: 'USA',
    idType: 'SSN' as IDType,
    idNumber: '',
  });
  const [replacementManagerEmployeeId, setReplacementManagerEmployeeId] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      router.push('/');
      return;
    }
    loadData();
  }, [user?.id, user?.chainId, user?.hotelId, user?.role]);

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const managerChainId = user.chainId;
      const managerHotelId = user.hotelId;
      const managerPersonId = user.personId;

      if (!managerChainId || !managerHotelId || !managerPersonId) {
        throw new Error('Manager scope is missing chain/hotel assignment');
      }

      const [hotelsData, roomsData, employeesData, customersData, archivedData] = await Promise.all([
        getAllHotels({ managerId: managerPersonId }),
        getAllRooms({ managerId: managerPersonId }),
        getAllEmployees({ hotelId: managerHotelId }),
        getAllCustomers({ chainId: managerChainId, hotelId: managerHotelId }),
        getArchivedReservations({ chainId: managerChainId, hotelId: managerHotelId }),
      ]);

      const uniqueChainIds = Array.from(new Set(hotelsData.map((hotel) => hotel.chainId)));
      const chainsData = (
        await Promise.all(uniqueChainIds.map((chainId) => getChainById(chainId)))
      ).filter((chain): chain is HotelChain => !!chain);

      setChains(chainsData);
      setHotels(hotelsData);
      setRooms(roomsData);
      setEmployees(employeesData);
      setCustomers(customersData);
      setArchivedReservations(archivedData);
    } catch (error) {
      toast({
        title: 'Error loading data',
        description: error instanceof Error ? error.message : 'Could not load dashboard data',
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
    { id: 'analytics', label: 'Analytics', icon: BarChart3, count: undefined },
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

  const requestDeleteChain = (chain: HotelChain) => {
    setDeleteConfirmation({
      type: 'chain',
      id: chain.id,
      name: chain.name,
    });
  };

  const requestDeleteHotel = (hotel: Hotel) => {
    setDeleteConfirmation({
      type: 'hotel',
      id: hotel.id,
      name: hotel.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation) return;

    const isChainDelete = deleteConfirmation.type === 'chain';

    setIsDeleting(true);
    try {
      if (isChainDelete) {
        await deleteChain(deleteConfirmation.id);
      } else {
        await deleteHotel(deleteConfirmation.id);
      }

      toast({ title: `${isChainDelete ? 'Hotel chain' : 'Hotel'} deleted successfully` });
      setDeleteConfirmation(null);
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Could not delete ${isChainDelete ? 'hotel chain' : 'hotel'}`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
        managerId: user?.id || '',
      });
      toast({ title: 'Hotel created successfully' });
      setModalMode(null);
      setSelectedHotel(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create hotel', variant: 'destructive' });
    }
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel) return;
    try {
      await updateHotel(selectedHotel.id, {
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
        managerId: selectedHotel.managerId || (user?.id || ''),
      });
      toast({ title: 'Hotel updated successfully' });
      setModalMode(null);
      setSelectedHotel(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update hotel', variant: 'destructive' });
    }
  };

  // Room Handlers
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const validViewTypes: ViewType[] = ['Sea View', 'Mountain View', 'City View', 'Garden View', 'No View'];
    const normalizedViewType: ViewType = validViewTypes.includes(roomForm.viewType as ViewType)
      ? (roomForm.viewType as ViewType)
      : 'No View';
    const normalizedIssue = roomForm.roomIssue.trim();

    try {
      await createRoom({
        hotelId: roomForm.hotelId,
        roomNumber: roomForm.roomNumber,
        roomType: 'Standard',
        price: roomForm.pricePerNight,
        capacity: roomForm.capacity,
        viewType: normalizedViewType,
        isExtendable: roomForm.canBeExtended,
        amenities: roomForm.amenities.split(',').map(a => a.trim()).filter(Boolean),
        problems: normalizedIssue || (roomForm.isDamaged ? 'Damaged' : undefined),
      });
      toast({ title: 'Room created successfully' });
      setModalMode(null);
      setSelectedRoom(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create room', variant: 'destructive' });
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    const validViewTypes: ViewType[] = ['Sea View', 'Mountain View', 'City View', 'Garden View', 'No View'];
    const normalizedViewType: ViewType = validViewTypes.includes(roomForm.viewType as ViewType)
      ? (roomForm.viewType as ViewType)
      : 'No View';
    const normalizedIssue = roomForm.roomIssue.trim();

    try {
      await updateRoom(selectedRoom.id, {
        hotelId: roomForm.hotelId,
        roomNumber: roomForm.roomNumber,
        roomType: 'Standard',
        price: roomForm.pricePerNight,
        capacity: roomForm.capacity,
        viewType: normalizedViewType,
        isExtendable: roomForm.canBeExtended,
        amenities: roomForm.amenities.split(',').map(a => a.trim()).filter(Boolean),
        problems: normalizedIssue || (roomForm.isDamaged ? 'Damaged' : undefined),
      });
      toast({ title: 'Room updated successfully' });
      setModalMode(null);
      setSelectedRoom(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update room', variant: 'destructive' });
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
    if (!user?.personId) {
      toast({ title: 'Error', description: 'Manager session is missing context', variant: 'destructive' });
      return;
    }

    const normalizedHotelName = employeeForm.hotelName.trim().toLowerCase();
    const targetHotel = hotels.find(
      (hotel) => hotel.chainId === employeeForm.chainId && hotel.name.trim().toLowerCase() === normalizedHotelName,
    );

    if (!targetHotel) {
      toast({
        title: 'Error',
        description: 'The provided chain ID and hotel name do not match any hotel you manage.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createEmployee({
        firstName: employeeForm.firstName,
        lastName: employeeForm.lastName,
        email: employeeForm.email,
        password: employeeForm.password,
        role: employeeForm.role,
        ssnSin: employeeForm.idNumber,
        idType: employeeForm.idType,
        chainId: employeeForm.chainId,
        hotelId: targetHotel.id,
        hotelName: targetHotel.name,
        address: {
          street: employeeForm.street,
          city: employeeForm.city,
          stateProvince: employeeForm.stateProvince,
          zipCode: employeeForm.zipCode,
          country: employeeForm.country,
        },
      }, user.personId);
      toast({ title: 'Employee created successfully' });
      setModalMode(null);
      setSelectedEmployee(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create employee', variant: 'destructive' });
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const isEditingManager = selectedEmployee.role === 'Manager';
    const selectedEmployeePersonId = Number.parseInt(selectedEmployee.id.replace('emp-', ''), 10);
    const isCurrentManager = user?.personId === selectedEmployeePersonId;
    const replacementCandidates = employees.filter(
      (employee) => employee.hotelId === selectedEmployee.hotelId && employee.id !== selectedEmployee.id,
    );

    if (employeeForm.role === 'Manager') {
      toast({ title: 'Error', description: 'Manager role cannot be selected directly.', variant: 'destructive' });
      return;
    }

    if (isEditingManager) {
      if (!isCurrentManager) {
        toast({
          title: 'Error',
          description: 'Only the current manager can transfer manager responsibilities.',
          variant: 'destructive',
        });
        return;
      }
      if (replacementCandidates.length === 0) {
        toast({
          title: 'Error',
          description: 'No other employee in this hotel can be selected as manager.',
          variant: 'destructive',
        });
        return;
      }
      if (!replacementManagerEmployeeId) {
        toast({
          title: 'Error',
          description: 'Select another employee in this hotel to become manager.',
          variant: 'destructive',
        });
        return;
      }
    }

    const replacementManagerPersonId = isEditingManager
      ? Number.parseInt(replacementManagerEmployeeId.replace('emp-', ''), 10)
      : undefined;

    if (isEditingManager && !Number.isInteger(replacementManagerPersonId)) {
      toast({
        title: 'Error',
        description: 'Selected replacement manager is invalid.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateEmployee(selectedEmployee.id, {
        firstName: employeeForm.firstName,
        lastName: employeeForm.lastName,
        email: employeeForm.email,
        password: employeeForm.password,
        role: employeeForm.role,
        ssnSin: employeeForm.idNumber,
        idType: employeeForm.idType,
        address: {
          street: employeeForm.street,
          city: employeeForm.city,
          stateProvince: employeeForm.stateProvince,
          zipCode: employeeForm.zipCode,
          country: employeeForm.country,
        },
      }, {
        managerPersonId: user?.personId,
        replacementManagerPersonId,
      });
      toast({ title: 'Employee updated successfully' });
      setModalMode(null);
      setSelectedEmployee(null);
      setReplacementManagerEmployeeId('');
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not update employee',
        variant: 'destructive',
      });
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

  const managedHotelKeys = useMemo(() => {
    return new Set(hotels.map((hotel) => `${hotel.chainId}::${hotel.name.toLowerCase()}`));
  }, [hotels]);

  const managedChainOptions = useMemo(() => {
    return Array.from(new Set(hotels.map((hotel) => hotel.chainId))).sort();
  }, [hotels]);

  const managedHotelsForSelectedChain = useMemo(() => {
    if (!employeeForm.chainId) return [];
    return hotels
      .filter((hotel) => hotel.chainId === employeeForm.chainId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hotels, employeeForm.chainId]);

  const isEditingManager = useMemo(
    () => modalMode === 'edit' && selectedEmployee?.role === 'Manager',
    [modalMode, selectedEmployee?.role],
  );

  const managerReplacementCandidates = useMemo(() => {
    if (!isEditingManager || !selectedEmployee) return [];
    return employees.filter(
      (employee) => employee.hotelId === selectedEmployee.hotelId && employee.id !== selectedEmployee.id,
    );
  }, [isEditingManager, selectedEmployee, employees]);

  const canTransferManagerRole = useMemo(
    () => !!(
      isEditingManager
      && selectedEmployee
      && user?.personId === Number.parseInt(selectedEmployee.id.replace('emp-', ''), 10)
    ),
    [isEditingManager, selectedEmployee, user?.personId],
  );

  const managerTransferBlocked = isEditingManager && managerReplacementCandidates.length === 0;

  useEffect(() => {
    if (modalMode !== 'create') return;

    if (managedHotelsForSelectedChain.length === 0) {
      if (employeeForm.hotelName) {
        setEmployeeForm((prev) => ({ ...prev, hotelName: '' }));
      }
      return;
    }

    const selectedHotelStillValid = managedHotelsForSelectedChain.some(
      (hotel) => hotel.name === employeeForm.hotelName,
    );

    if (!selectedHotelStillValid) {
      setEmployeeForm((prev) => ({ ...prev, hotelName: managedHotelsForSelectedChain[0].name }));
    }
  }, [modalMode, managedHotelsForSelectedChain, employeeForm.hotelName]);

  const managedArchivedReservations = useMemo(() => {
    const scoped = archivedReservations.filter((reservation) =>
      managedHotelKeys.has(`${reservation.chainId}::${reservation.hotelName.toLowerCase()}`)
    );

    if (scoped.length > 0 || hotels.length === 0) {
      return scoped;
    }
    return scoped;
  }, [managedHotelKeys, hotels, archivedReservations]);

  const orphanedArchivedReservations = useMemo(() => {
    return archivedReservations.filter((reservation) => !reservation.hotelId);
  }, [archivedReservations]);

  const toggleArchivedReservationDetails = (reservationId: string) => {
    setExpandedArchivedReservationIds((prev) => ({
      ...prev,
      [reservationId]: !prev[reservationId],
    }));
  };

  const getReservationStatusVariant = (status: ArchivedReservation['reservationStatus']) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Cancelled':
      case 'No Show':
        return 'warning';
      case 'Converted':
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusVariant = (status: ArchivedReservation['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Unpaid':
      default:
        return 'destructive';
    }
  };

  const renderArchivedReservationCard = (reservation: ArchivedReservation, isOrphaned: boolean = false) => {
    const isExpanded = !!expandedArchivedReservationIds[reservation.id];
    const derivedPaymentStatus: ArchivedReservation['paymentStatus'] =
      reservation.amountPaid !== null && reservation.amountPaid > 0 ? 'Paid' : 'Unpaid';

    return (
      <Card key={reservation.id}>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h4 className="font-semibold">{reservation.hotelName} - Room {reservation.roomNumber}</h4>
              <p className="text-sm text-muted-foreground">{reservation.customerName} ({reservation.customerEmail})</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {isOrphaned && (
                <Badge variant="warning" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Orphaned
                </Badge>
              )}
              <Badge variant={getReservationStatusVariant(reservation.reservationStatus)}>{reservation.reservationStatus}</Badge>
              <Badge variant={getPaymentStatusVariant(derivedPaymentStatus)}>{derivedPaymentStatus}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleArchivedReservationDetails(reservation.id)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    View Details
                  </>
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Reservation ID</p>
                <p className="font-medium">{reservation.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Archived At</p>
                <p className="font-medium">{formatDate(reservation.archivedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Chain ID</p>
                <p className="font-medium">{reservation.chainId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Hotel ID</p>
                <p className="font-medium">{reservation.hotelId || 'Not found'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Room Type</p>
                <p className="font-medium">{reservation.roomType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Source</p>
                <p className="font-medium">{reservation.source}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">{formatCurrency(reservation.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount Paid</p>
                <p className="font-medium">
                  {reservation.amountPaid !== null ? formatCurrency(reservation.amountPaid) : 'N/A'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Archive Reason</p>
                <p className="font-medium">{reservation.reasonArchived}</p>
              </div>
              {reservation.notes && (
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="font-medium">{reservation.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
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
                        <Button size="sm" variant="destructive" onClick={() => requestDeleteChain(chain)}>
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Hotels</h2>
                <Button onClick={() => setModalMode('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hotel
                </Button>
              </div>

              {modalMode && (
                <Card>
                  <CardHeader>
                    <CardTitle>{modalMode === 'create' ? 'Create Hotel' : 'Edit Hotel'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={modalMode === 'create' ? handleCreateHotel : handleUpdateHotel} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Hotel Chain</Label>
                          <select value={hotelForm.chainId} onChange={(e) => setHotelForm({ ...hotelForm, chainId: e.target.value })} required className={selectClassName}>
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
                        <Button type="submit">{modalMode === 'create' ? 'Create Hotel' : 'Update Hotel'}</Button>
                        <Button type="button" variant="outline" onClick={() => { setModalMode(null); setSelectedHotel(null); }}>Cancel</Button>
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
                          <Button size="sm" variant="outline" onClick={() => {
                            setModalMode('edit');
                            setSelectedHotel(hotel);
                            setHotelForm({
                              chainId: hotel.chainId,
                              name: hotel.name,
                              starRating: hotel.category,
                              email: hotel.contactEmail,
                              phoneNumber: hotel.contactPhone,
                              street: hotel.address.street,
                              city: hotel.address.city,
                              stateProvince: hotel.address.stateProvince,
                              zipCode: hotel.address.zipCode,
                              country: hotel.address.country,
                            });
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => requestDeleteHotel(hotel)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    Archived Reservations
                  </CardTitle>
                  <CardDescription>
                    Historical reservations for hotels you manage. Expand any record to view full details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Managed Hotels Archive</h3>
                      <Badge variant="secondary">{managedArchivedReservations.length}</Badge>
                    </div>
                    {managedArchivedReservations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No archived reservations found for your managed hotels yet.</p>
                    ) : (
                      managedArchivedReservations.map((reservation) => renderArchivedReservationCard(reservation))
                    )}
                  </div>

                  <div className="space-y-3 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Orphaned (chain_id, hotel_name) Archive</h3>
                      <Badge variant="outline">{orphanedArchivedReservations.length}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Frontend placeholder subsection for archived reservations whose source hotel reference no longer exists.
                    </p>
                    {orphanedArchivedReservations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No orphaned archived reservations found.</p>
                    ) : (
                      orphanedArchivedReservations.map((reservation) => renderArchivedReservationCard(reservation, true))
                    )}
                  </div>
                </CardContent>
              </Card>
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

              {modalMode && (
                <Card>
                  <CardHeader>
                    <CardTitle>{modalMode === 'create' ? 'Create Room' : 'Edit Room'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={modalMode === 'create' ? handleCreateRoom : handleUpdateRoom} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Hotel</Label>
                          <select value={roomForm.hotelId} onChange={(e) => setRoomForm({ ...roomForm, hotelId: e.target.value })} required className={selectClassName}>
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
                      <div className="space-y-2">
                        <Label>Room Issue</Label>
                        <Input
                          value={roomForm.roomIssue}
                          onChange={(e) => setRoomForm({ ...roomForm, roomIssue: e.target.value })}
                          placeholder="e.g., Broken AC"
                        />
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
                        <Button type="submit">{modalMode === 'create' ? 'Create Room' : 'Update Room'}</Button>
                        <Button type="button" variant="outline" onClick={() => { setModalMode(null); setSelectedRoom(null); }}>Cancel</Button>
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
                          <p className="text-sm text-muted-foreground">
                            {room.hotel?.name || hotels.find((hotel) => hotel.id === room.hotelId)?.name || 'Hotel'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {room.hotel?.name || hotels.find((hotel) => hotel.id === room.hotelId)?.name || 'Hotel'}
                            </Badge>
                            <Badge>{room.hotel?.category || 3} Star Hotel</Badge>
                            <Badge variant="secondary">{room.capacity}</Badge>
                            <span className="text-sm font-semibold">{formatCurrency(room.price)}/night</span>
                            {room.problems && <Badge variant="destructive">Has Issues</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setModalMode('edit');
                            setSelectedRoom(room);
                            setRoomForm({
                              hotelId: room.hotelId,
                              roomNumber: room.roomNumber,
                              pricePerNight: room.price,
                              capacity: room.capacity === 'Single' ? 1 : room.capacity === 'Double' ? 2 : room.capacity === 'Triple' ? 3 : room.capacity === 'Family' ? 5 : room.capacity === 'Studio' ? 6 : 4,
                              category: room.hotel?.category || 3,
                              viewType: room.viewType,
                              canBeExtended: !!room.isExtendable,
                              isDamaged: !!room.problems,
                              amenities: (room.amenities || []).join(', '),
                              roomIssue: room.problems || '',
                            });
                          }}>
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
                <Button onClick={() => {
                  const preferredChainId =
                    (user?.chainId && hotels.some((hotel) => hotel.chainId === user.chainId) ? user.chainId : '') ||
                    hotels[0]?.chainId ||
                    '';
                  const preferredHotelName = hotels.find((hotel) => hotel.chainId === preferredChainId)?.name || '';

                  setModalMode('create');
                  setEmployeeForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    role: 'Receptionist' as EmployeeRole,
                    chainId: preferredChainId,
                    hotelName: preferredHotelName,
                    street: '',
                    city: '',
                    stateProvince: '',
                    zipCode: '',
                    country: 'USA',
                    idType: 'SSN' as IDType,
                    idNumber: '',
                  });
                  setReplacementManagerEmployeeId('');
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </div>

              {modalMode && (
                <Card>
                  <CardHeader>
                    <CardTitle>{modalMode === 'create' ? 'Create Employee' : 'Edit Employee'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={modalMode === 'create' ? handleCreateEmployee : handleUpdateEmployee} className="space-y-4">
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
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={employeeForm.password}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                            minLength={8}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <select
                            value={employeeForm.role}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value as EmployeeRole })}
                            required
                            className={selectClassName}
                            disabled={isEditingManager && !canTransferManagerRole}
                          >
                            {employeeForm.role === 'Manager' && <option value="Manager" hidden>Current: Manager</option>}
                            <option value="Receptionist">Receptionist</option>
                            <option value="Housekeeping">Housekeeping</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Concierge">Concierge</option>
                          </select>
                        </div>
                        {isEditingManager && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Update Manager</Label>
                            <select
                              value={replacementManagerEmployeeId}
                              onChange={(e) => setReplacementManagerEmployeeId(e.target.value)}
                              className={selectClassName}
                              required
                              disabled={!canTransferManagerRole || managerReplacementCandidates.length === 0}
                            >
                              <option value="">
                                {managerReplacementCandidates.length === 0
                                  ? 'No available employee in this hotel'
                                  : 'Select the new manager'}
                              </option>
                              {managerReplacementCandidates.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                  {employee.firstName} {employee.lastName} ({employee.role})
                                </option>
                              ))}
                            </select>
                            {!canTransferManagerRole && (
                              <p className="text-sm text-destructive">
                                Only the current manager can transfer manager responsibilities.
                              </p>
                            )}
                            {managerTransferBlocked && (
                              <p className="text-sm text-destructive">
                                You cannot update this manager because there is no other employee in this hotel.
                              </p>
                            )}
                          </div>
                        )}
                        {modalMode === 'create' && (
                          <>
                            <div className="space-y-2">
                              <Label>Chain ID</Label>
                              <select
                                value={employeeForm.chainId}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, chainId: e.target.value })}
                                required
                                className={selectClassName}
                              >
                                {managedChainOptions.length === 0 && <option value="">No available chains</option>}
                                {managedChainOptions.map((chainId) => (
                                  <option key={chainId} value={chainId}>{chainId}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Hotel Name</Label>
                              <select
                                value={employeeForm.hotelName}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, hotelName: e.target.value })}
                                required
                                className={selectClassName}
                                disabled={managedHotelsForSelectedChain.length === 0}
                              >
                                {managedHotelsForSelectedChain.length === 0 && <option value="">No available hotels</option>}
                                {managedHotelsForSelectedChain.map((hotel) => (
                                  <option key={hotel.id} value={hotel.name}>{hotel.name}</option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                        <div className="space-y-2">
                          <Label>ID Type</Label>
                          <select
                            value={employeeForm.idType}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, idType: e.target.value as IDType })}
                            required
                            className={selectClassName}
                          >
                            <option value="SSN">SSN</option>
                            <option value="SIN">SIN</option>
                            <option value="Driver License">Driver License</option>
                            <option value="Passport">Passport</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>ID Number</Label>
                          <Input
                            value={employeeForm.idNumber}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, idNumber: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Street</Label>
                          <Input
                            value={employeeForm.street}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, street: e.target.value })}
                            placeholder="123 Laurier Ave E"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={employeeForm.city}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, city: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>State/Province</Label>
                          <Input
                            value={employeeForm.stateProvince}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, stateProvince: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ZIP/Postal Code</Label>
                          <Input
                            value={employeeForm.zipCode}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, zipCode: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input
                            value={employeeForm.country}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, country: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      {modalMode === 'create' && (
                        <p className="text-sm text-muted-foreground">
                          Select an existing chain and hotel to assign this employee.
                        </p>
                      )}
                      {isEditingManager && (
                        <p className="text-sm text-muted-foreground">
                          To change the current manager role, choose a new role and assign another employee in the same hotel as manager.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={managerTransferBlocked || (isEditingManager && !canTransferManagerRole)}
                        >
                          {modalMode === 'create' ? 'Create Employee' : 'Update Employee'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setModalMode(null);
                            setSelectedEmployee(null);
                            setReplacementManagerEmployeeId('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {employees.map((employee) => {
                  const hotelName = hotels.find((h) => h.id === employee.hotelId)?.name;
                  console.log('Employee:', employee.firstName, 'hotelId:', employee.hotelId, 'hotelName:', hotelName, 'hotels available:', hotels.map(h => h.id));
                  return (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{employee.firstName} {employee.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{employee.role}</Badge>
                            {hotelName && <Badge variant="outline">{hotelName}</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setModalMode('edit');
                            setSelectedEmployee(employee);
                            setReplacementManagerEmployeeId('');
                            setEmployeeForm({
                              firstName: employee.firstName,
                              lastName: employee.lastName,
                              email: employee.email,
                              password: '',
                              role: employee.role,
                              chainId: employee.chainId || '',
                              hotelName: employee.hotel?.name || '',
                              street: employee.address.street,
                              city: employee.address.city,
                              stateProvince: employee.address.stateProvince,
                              zipCode: employee.address.zipCode,
                              country: employee.address.country,
                              idType: 'SSN' as IDType,
                              idNumber: employee.ssnSin,
                            });
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteEmployee(employee.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
                })}
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

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Hotel Analytics</h2>
                <p className="text-muted-foreground">Real-time views of your hotel network capacity and availability</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Hotel Capacity by Hotel</CardTitle>
                  <CardDescription>Total room capacity aggregated by hotel and chain</CardDescription>
                </CardHeader>
                <CardContent>
                  <HotelCapacityView />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-lg border-destructive/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-foreground/90">
                Careful: deleting {deleteConfirmation.name} will cause all information related to the {deleteConfirmation.type === 'chain' ? `hotel chain ${deleteConfirmation.name}` : `hotel ${deleteConfirmation.name}`} to be deleted, including this admin profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmation(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
