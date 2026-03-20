import {
  User, AuthResponse, RegisterData, SearchCriteria, Room, Booking,
  BookingData, Renting, RentingData, Payment, PaymentData, HotelChain, ChainData,
  Hotel, HotelData, RoomData, Employee, EmployeeData, Customer, CustomerData,
  WalkInRentingData,
  HotelFilters, RoomFilters, EmployeeFilters, CustomerFilters, AreaAvailability,
  HotelCapacity, ArchivedReservation
} from '@/types';

// ============================================================================
// HTTP HELPER
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchApi<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(body.detail || 'Request failed');
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json();
}

function toQueryString(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export async function registerCustomer(data: RegisterData): Promise<User> {
  return fetchApi<User>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  return fetchApi<void>('/api/auth/logout', { method: 'POST' });
}

// ============================================================================
// SEARCH & AVAILABILITY API
// ============================================================================

export async function searchRooms(criteria: SearchCriteria): Promise<Room[]> {
  return fetchApi<Room[]>('/api/search/rooms', {
    method: 'POST',
    body: JSON.stringify(criteria),
  });
}

export async function checkRoomAvailability(
  roomId: string,
  dates: { checkInDate: string; checkOutDate: string }
): Promise<boolean> {
  const qs = toQueryString({ roomId, checkInDate: dates.checkInDate, checkOutDate: dates.checkOutDate });
  const result = await fetchApi<{ available: boolean }>(`/api/search/availability${qs}`);
  return result.available;
}

// ============================================================================
// BOOKING API
// ============================================================================

export async function createBooking(bookingData: BookingData): Promise<Booking> {
  return fetchApi<Booking>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
}

export async function getAllBookings(): Promise<Booking[]> {
  return fetchApi<Booking[]>('/api/bookings');
}

export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  return fetchApi<Booking[]>(`/api/bookings/customer/${encodeURIComponent(customerId)}`);
}

export async function getHotelBookings(hotelId: string): Promise<Booking[]> {
  return fetchApi<Booking[]>(`/api/bookings/hotel/${encodeURIComponent(hotelId)}`);
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  return fetchApi<Booking>(`/api/bookings/${encodeURIComponent(bookingId)}`);
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await fetchApi(`/api/bookings/${encodeURIComponent(bookingId)}`, { method: 'DELETE' });
}

export async function convertBookingToRenting(
  bookingId: string,
  employeeId: string
): Promise<Renting> {
  return fetchApi<Renting>(`/api/bookings/${encodeURIComponent(bookingId)}/convert`, {
    method: 'POST',
    body: JSON.stringify({ employeeId }),
  });
}

// ============================================================================
// RENTING API
// ============================================================================

export async function createDirectRenting(rentingData: RentingData): Promise<Renting> {
  return fetchApi<Renting>('/api/rentings', {
    method: 'POST',
    body: JSON.stringify(rentingData),
  });
}

export async function createWalkInRenting(data: WalkInRentingData): Promise<Renting> {
  return fetchApi<Renting>('/api/rentings/walk-in', {
    method: 'POST',
    body: JSON.stringify({
      room_id: data.roomId,
      check_in_date: data.checkInDate,
      check_out_date: data.checkOutDate,
      employee_id: data.employeeId,
      customer: {
        first_name: data.customer.firstName,
        last_name: data.customer.lastName,
        ssn_type: data.customer.idType,
        ssn_number: data.customer.idNumber,
        country: data.customer.country,
        city: data.customer.city,
        region: data.customer.stateProvince,
        street_name: data.customer.streetName,
        street_number: data.customer.streetNumber,
        postalcode: data.customer.zipCode,
        email: data.customer.email,
        password: data.customer.password,
      },
    }),
  });
}

export async function getAllRentings(): Promise<Renting[]> {
  return fetchApi<Renting[]>('/api/rentings');
}

export async function getCustomerRentings(customerId: string): Promise<Renting[]> {
  return fetchApi<Renting[]>(`/api/rentings/customer/${encodeURIComponent(customerId)}`);
}

export async function getHotelRentings(hotelId: string): Promise<Renting[]> {
  return fetchApi<Renting[]>(`/api/rentings/hotel/${encodeURIComponent(hotelId)}`);
}

export async function getRentingById(rentingId: string): Promise<Renting | null> {
  return fetchApi<Renting>(`/api/rentings/${encodeURIComponent(rentingId)}`);
}

// ============================================================================
// PAYMENT API
// ============================================================================

export async function processPayment(paymentData: PaymentData): Promise<Payment> {
  return fetchApi<Payment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
}

export async function getRentingPayments(rentingId: string): Promise<Payment[]> {
  return fetchApi<Payment[]>(`/api/payments/renting/${encodeURIComponent(rentingId)}`);
}

// ============================================================================
// ADMIN API - HOTEL CHAINS
// ============================================================================

export async function getAllChains(): Promise<HotelChain[]> {
  return fetchApi<HotelChain[]>('/api/chains');
}

export async function getChainById(id: string): Promise<HotelChain | null> {
  return fetchApi<HotelChain>(`/api/chains/${encodeURIComponent(id)}`);
}

export async function createChain(data: ChainData): Promise<HotelChain> {
  return fetchApi<HotelChain>('/api/chains', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateChain(id: string, data: ChainData): Promise<HotelChain> {
  return fetchApi<HotelChain>(`/api/chains/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteChain(id: string): Promise<void> {
  await fetchApi(`/api/chains/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ============================================================================
// ADMIN API - HOTELS
// ============================================================================

export async function getAllHotels(filters?: HotelFilters): Promise<Hotel[]> {
  const qs = toQueryString({
    chainId: filters?.chainId,
    category: filters?.category,
    city: filters?.city,
    managerId: filters?.managerId,
  });
  return fetchApi<Hotel[]>(`/api/hotels${qs}`);
}

export async function getHotel(id: string): Promise<Hotel | null> {
  return fetchApi<Hotel>(`/api/hotels/${encodeURIComponent(id)}`);
}

export async function createHotel(data: HotelData): Promise<Hotel> {
  return fetchApi<Hotel>('/api/hotels', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHotel(id: string, data: HotelData): Promise<Hotel> {
  return fetchApi<Hotel>(`/api/hotels/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteHotel(id: string): Promise<void> {
  await fetchApi(`/api/hotels/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ============================================================================
// ADMIN API - ROOMS
// ============================================================================

export async function getAllRooms(filters?: RoomFilters): Promise<Room[]> {
  const qs = toQueryString({
    hotelId: filters?.hotelId,
    capacity: filters?.capacity,
    minPrice: filters?.minPrice,
    maxPrice: filters?.maxPrice,
  });
  return fetchApi<Room[]>(`/api/rooms${qs}`);
}

export async function getRoom(id: string): Promise<Room | null> {
  return fetchApi<Room>(`/api/rooms/${encodeURIComponent(id)}`);
}

export async function createRoom(data: RoomData): Promise<Room> {
  return fetchApi<Room>('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoom(id: string, data: RoomData): Promise<Room> {
  return fetchApi<Room>(`/api/rooms/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRoom(id: string): Promise<void> {
  await fetchApi(`/api/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ============================================================================
// ADMIN API - EMPLOYEES
// ============================================================================

export async function getAllEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  const qs = toQueryString({
    hotelId: filters?.hotelId,
    role: filters?.role,
  });
  return fetchApi<Employee[]>(`/api/employees${qs}`);
}

export async function getEmployee(id: string): Promise<Employee | null> {
  return fetchApi<Employee>(`/api/employees/${encodeURIComponent(id)}`);
}

export async function createEmployee(data: EmployeeData, managerPersonId: number): Promise<Employee> {
  const qs = toQueryString({ managerPersonId });
  return fetchApi<Employee>(`/api/employees${qs}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEmployee(id: string, data: EmployeeData): Promise<Employee> {
  return fetchApi<Employee>(`/api/employees/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteEmployee(id: string): Promise<void> {
  await fetchApi(`/api/employees/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ============================================================================
// ADMIN API - CUSTOMERS
// ============================================================================

export async function getAllCustomers(filters?: CustomerFilters): Promise<Customer[]> {
  const qs = toQueryString({
    searchTerm: filters?.searchTerm,
    chainId: filters?.chainId,
    hotelId: filters?.hotelId,
  });
  return fetchApi<Customer[]>(`/api/customers${qs}`);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return fetchApi<Customer>(`/api/customers/${encodeURIComponent(id)}`);
}

export async function createCustomer(data: CustomerData): Promise<Customer> {
  return fetchApi<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: string, data: CustomerData): Promise<Customer> {
  return fetchApi<Customer>(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await fetchApi(`/api/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ============================================================================
// ADMIN API - ANALYTICS & VIEWS
// ============================================================================

export async function getAvailableRoomsPerArea(): Promise<AreaAvailability[]> {
  return fetchApi<AreaAvailability[]>('/api/analytics/rooms-per-area');
}

export async function getHotelCapacityView(): Promise<HotelCapacity[]> {
  return fetchApi<HotelCapacity[]>('/api/analytics/hotel-capacity');
}

export async function getArchivedReservations(filters?: { chainId?: string; hotelId?: string }): Promise<ArchivedReservation[]> {
  const qs = toQueryString({
    chainId: filters?.chainId,
    hotelId: filters?.hotelId,
  });
  return fetchApi(`/api/archived-reservations${qs}`);
}
