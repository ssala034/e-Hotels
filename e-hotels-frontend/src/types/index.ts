// Core entity types

export interface HotelChain {
  id: string;
  name: string;
  centralOfficeAddress: Address;
  totalHotels: number;
  contactEmails: string[];
  phoneNumbers: string[];
}

export interface Hotel {
  id: string;
  name: string;
  chainId: string;
  chain?: HotelChain;
  category: 1 | 2 | 3 | 4 | 5;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  numberOfRooms: number;
  managerId: string;
  manager?: Employee;
}

export interface Room {
  id: string;
  hotelId: string;
  hotel?: Hotel;
  roomNumber: string;
  roomType: string;
  price: number;
  amenities: string[];
  capacity: RoomCapacity;
  viewType: ViewType;
  status?: string;
  isExtendable: boolean;
  extendableWith?: string[];
  issues?: string[];
  problems?: string;
  images?: string[];
}

export type RoomCapacity = 'Single' | 'Double' | 'Triple' | 'Suite' | 'Family' | 'Studio';
export type ViewType = 'Sea View' | 'Mountain View' | 'City View' | 'Garden View' | 'No View';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  idType: IDType;
  idNumber: string;
  registrationDate: string;
}

export type IDType = 'SSN' | 'SIN' | 'Driver License' | 'Passport';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: Address;
  ssnSin: string;
  role: EmployeeRole;
  hotelId: string;
  hotel?: Hotel;
}

export type EmployeeRole = 'Manager' | 'Receptionist' | 'Housekeeping' | 'Maintenance' | 'Concierge';

export interface Booking {
  id: string;
  customerId: string;
  customer?: Customer;
  roomId: string;
  room?: Room;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  bookingDate: string;
  specialRequests?: string;
  totalPrice: number;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Converted' | 'Completed';

export interface Renting {
  id: string;
  customerId: string;
  customer?: Customer;
  roomId: string;
  room?: Room;
  checkInDate: string;
  checkOutDate: string;
  status: RentingStatus;
  employeeId: string;
  employee?: Employee;
  bookingId?: string;
  createdAt: string;
  totalAmount: number;
  amountPaid: number;
}

export type RentingStatus = 'Active' | 'Completed' | 'Checked Out';

export interface Payment {
  id: string;
  rentingId: string;
  renting?: Renting;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  employeeId: string;
  employee?: Employee;
  notes?: string;
}

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer';

export interface Address {
  street: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
}

// Search criteria
export interface SearchCriteria {
  checkInDate: string;
  checkOutDate: string;
  area?: string[];
  chainId?: string[];
  category?: number[];
  capacity?: RoomCapacity[];
  minPrice?: number;
  maxPrice?: number;
  minHotelRooms?: number;
  maxHotelRooms?: number;
  amenities?: string[];
  viewType?: ViewType[];
  extendableOnly?: boolean;
  excludeDamaged?: boolean;
}

// SQL View types
export interface AreaAvailability {
  area: string;
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number;
}

export interface HotelCapacity {
  hotelId: string;
  hotelName: string;
  chainName: string;
  totalRooms: number;
  totalCapacity: number;
  averageCapacityPerRoom: number;
}

// Auth types
export interface User {
  id: string;
  email: string;
  role: 'Customer' | 'Employee' | 'Admin';
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Address;
  customerId?: string;
  employeeId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Form data types
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  street: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
  idType: IDType;
  idNumber: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface BookingData {
  roomId: string;
  customerId: string;
  checkInDate: string;
  checkOutDate: string;
  specialRequests?: string;
}

export interface RentingData {
  customerId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  employeeId: string;
  bookingId?: string;
}

export interface PaymentData {
  rentingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  employeeId: string;
  notes?: string;
}

export interface ChainData {
  name: string;
  centralOfficeAddress: Address;
  contactEmails: string[];
  phoneNumbers: string[];
}

export interface HotelData {
  name: string;
  chainId: string;
  category: 1 | 2 | 3 | 4 | 5;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  managerId: string;
}

export interface RoomData {
  hotelId: string;
  roomNumber: string;
  roomType: string;
  price: number;
  amenities: string[];
  capacity: RoomCapacity;
  viewType: ViewType;
  isExtendable: boolean;
  problems?: string;
}

export interface EmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: Address;
  ssnSin: string;
  role: EmployeeRole;
  hotelId: string;
}

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  idType: IDType;
  idNumber: string;
}

// Filter types
export interface HotelFilters {
  chainId?: string;
  category?: number;
  city?: string;
}

export interface RoomFilters {
  hotelId?: string;
  capacity?: RoomCapacity;
  minPrice?: number;
  maxPrice?: number;
}

export interface EmployeeFilters {
  hotelId?: string;
  role?: EmployeeRole;
}

export interface CustomerFilters {
  searchTerm?: string;
}
