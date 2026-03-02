import {
  User, AuthResponse, RegisterData, LoginData, SearchCriteria, Room, Booking,
  BookingData, Renting, RentingData, Payment, PaymentData, HotelChain, ChainData,
  Hotel, HotelData, RoomData, Employee, EmployeeData, Customer, CustomerData,
  HotelFilters, RoomFilters, EmployeeFilters, CustomerFilters, AreaAvailability,
  HotelCapacity
} from '@/types';
import {
  mockHotelChains, mockHotels, mockRooms, mockEmployees, mockCustomers,
  mockBookings, mockRentings, mockPayments
} from './mockData';

// Simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage for demo (in real app, this would be backend state)
let hotels = [...mockHotels];
let rooms = [...mockRooms];
let chains = [...mockHotelChains];
let employees = [...mockEmployees];
let customers = [...mockCustomers];
let bookings = [...mockBookings];
let rentings = [...mockRentings];
let payments = [...mockPayments];

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export async function registerCustomer(data: RegisterData): Promise<User> {
  await delay();
  
  // Check if email already exists
  if (customers.find(c => c.email === data.email)) {
    throw new Error('Email already registered');
  }
  
  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    address: {
      street: data.street,
      city: data.city,
      stateProvince: data.stateProvince,
      zipCode: data.zipCode,
      country: data.country,
    },
    idType: data.idType,
    idNumber: data.idNumber,
    registrationDate: new Date().toISOString().split('T')[0],
  };
  
  customers.push(newCustomer);
  
  return {
    id: newCustomer.id,
    email: newCustomer.email,
    role: 'Customer',
    firstName: newCustomer.firstName,
    lastName: newCustomer.lastName,
    customerId: newCustomer.id,
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  await delay();
  
  // Check if admin (hardcoded for demo)
  if (email === 'admin@ehotels.com' && password === 'admin123') {
    return {
      user: {
        id: 'admin-1',
        email: 'admin@ehotels.com',
        role: 'Admin',
        firstName: 'Admin',
        lastName: 'User',
      },
      token: 'mock-jwt-token-admin',
    };
  }
  
  // Check employees
  const employee = employees.find(e => e.email === email);
  if (employee) {
    return {
      user: {
        id: employee.id,
        email: employee.email,
        role: 'Employee',
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.id,
      },
      token: `mock-jwt-token-${employee.id}`,
    };
  }
  
  // Check customers
  const customer = customers.find(c => c.email === email);
  if (customer) {
    return {
      user: {
        id: customer.id,
        email: customer.email,
        role: 'Customer',
        firstName: customer.firstName,
        lastName: customer.lastName,
        customerId: customer.id,
      },
      token: `mock-jwt-token-${customer.id}`,
    };
  }
  
  throw new Error('Invalid credentials');
}

export async function logout(): Promise<void> {
  await delay(100);
  // In real app, would invalidate token on backend
}

// ============================================================================
// SEARCH & AVAILABILITY API
// ============================================================================

export async function searchRooms(criteria: SearchCriteria): Promise<Room[]> {
  await delay(500);
  
  let results = [...rooms];
  
  // Filter by dates (check availability)
  results = results.filter(room => {
    const roomBookings = bookings.filter(b => 
      b.roomId === room.id && 
      (b.status === 'Confirmed' || b.status === 'Pending')
    );
    
    const roomRentings = rentings.filter(r => 
      r.roomId === room.id && 
      r.status === 'Active'
    );
    
    // Check for conflicts
    const hasConflict = [...roomBookings, ...roomRentings].some(reservation => {
      const resCheckIn = new Date(reservation.checkInDate);
      const resCheckOut = new Date(reservation.checkOutDate);
      const searchCheckIn = new Date(criteria.checkInDate);
      const searchCheckOut = new Date(criteria.checkOutDate);
      
      return (searchCheckIn < resCheckOut && searchCheckOut > resCheckIn);
    });
    
    return !hasConflict;
  });
  
  // Filter by area
  if (criteria.area && criteria.area.length > 0) {
    results = results.filter(room => {
      const hotel = hotels.find(h => h.id === room.hotelId);
      return hotel && criteria.area!.includes(hotel.address.city);
    });
  }
  
  // Filter by chain
  if (criteria.chainId && criteria.chainId.length > 0) {
    results = results.filter(room => {
      const hotel = hotels.find(h => h.id === room.hotelId);
      return hotel && criteria.chainId!.includes(hotel.chainId);
    });
  }
  
  // Filter by category
  if (criteria.category && criteria.category.length > 0) {
    results = results.filter(room => {
      const hotel = hotels.find(h => h.id === room.hotelId);
      return hotel && criteria.category!.includes(hotel.category);
    });
  }
  
  // Filter by capacity
  if (criteria.capacity && criteria.capacity.length > 0) {
    results = results.filter(room => criteria.capacity!.includes(room.capacity));
  }
  
  // Filter by price range
  if (criteria.minPrice !== undefined) {
    results = results.filter(room => room.price >= criteria.minPrice!);
  }
  if (criteria.maxPrice !== undefined) {
    results = results.filter(room => room.price <= criteria.maxPrice!);
  }
  
  // Filter by hotel room count
  if (criteria.minHotelRooms !== undefined || criteria.maxHotelRooms !== undefined) {
    results = results.filter(room => {
      const hotel = hotels.find(h => h.id === room.hotelId);
      if (!hotel) return false;
      
      if (criteria.minHotelRooms && hotel.numberOfRooms < criteria.minHotelRooms) return false;
      if (criteria.maxHotelRooms && hotel.numberOfRooms > criteria.maxHotelRooms) return false;
      
      return true;
    });
  }
  
  // Filter by amenities
  if (criteria.amenities && criteria.amenities.length > 0) {
    results = results.filter(room => 
      criteria.amenities!.every(amenity => room.amenities.includes(amenity))
    );
  }
  
  // Filter by view type
  if (criteria.viewType && criteria.viewType.length > 0) {
    results = results.filter(room => criteria.viewType!.includes(room.viewType));
  }
  
  // Filter extendable only
  if (criteria.extendableOnly) {
    results = results.filter(room => room.isExtendable);
  }
  
  // Exclude damaged rooms
  if (criteria.excludeDamaged) {
    results = results.filter(room => !room.problems);
  }
  
  // Populate hotel and chain data
  results = results.map(room => {
    const hotel = hotels.find(h => h.id === room.hotelId);
    if (hotel) {
      const chain = chains.find(c => c.id === hotel.chainId);
      return {
        ...room,
        hotel: chain ? { ...hotel, chain } : hotel,
      };
    }
    return room;
  });
  
  return results;
}

export async function checkRoomAvailability(
  roomId: string,
  dates: { checkInDate: string; checkOutDate: string }
): Promise<boolean> {
  await delay(200);
  
  const searchCheckIn = new Date(dates.checkInDate);
  const searchCheckOut = new Date(dates.checkOutDate);
  
  const conflicts = [...bookings, ...rentings].filter(reservation => {
    if (reservation.roomId !== roomId) return false;
    if ('status' in reservation && reservation.status !== 'Confirmed' && reservation.status !== 'Pending' && reservation.status !== 'Active') return false;
    
    const resCheckIn = new Date(reservation.checkInDate);
    const resCheckOut = new Date(reservation.checkOutDate);
    
    return (searchCheckIn < resCheckOut && searchCheckOut > resCheckIn);
  });
  
  return conflicts.length === 0;
}

// ============================================================================
// BOOKING API
// ============================================================================

export async function createBooking(bookingData: BookingData): Promise<Booking> {
  await delay();
  
  const room = rooms.find(r => r.id === bookingData.roomId);
  if (!room) throw new Error('Room not found');
  
  // Check availability
  const isAvailable = await checkRoomAvailability(bookingData.roomId, {
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
  });
  
  if (!isAvailable) throw new Error('Room not available for selected dates');
  
  const nights = Math.ceil(
    (new Date(bookingData.checkOutDate).getTime() - new Date(bookingData.checkInDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );
  
  const newBooking: Booking = {
    id: `book-${Date.now()}`,
    customerId: bookingData.customerId,
    roomId: bookingData.roomId,
    checkInDate: bookingData.checkInDate,
    checkOutDate: bookingData.checkOutDate,
    status: 'Confirmed',
    bookingDate: new Date().toISOString(),
    specialRequests: bookingData.specialRequests,
    totalPrice: room.price * nights,
  };
  
  bookings.push(newBooking);
  return newBooking;
}

export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  await delay();
  
  return bookings
    .filter(b => b.customerId === customerId)
    .map(booking => {
      const room = rooms.find(r => r.id === booking.roomId);
      if (room) {
        const hotel = hotels.find(h => h.id === room.hotelId);
        return {
          ...booking,
          room: hotel ? { ...room, hotel } : room,
        };
      }
      return booking;
    })
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
}

export async function getBookingById(bookingId: string): Promise<Booking | null> {
  await delay();
  
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return null;
  
  const room = rooms.find(r => r.id === booking.roomId);
  const customer = customers.find(c => c.id === booking.customerId);
  
  return {
    ...booking,
    room: room,
    customer: customer,
  };
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await delay();
  
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) throw new Error('Booking not found');
  
  if (booking.status === 'Converted' || booking.status === 'Completed') {
    throw new Error('Cannot cancel completed or converted booking');
  }
  
  booking.status = 'Cancelled';
}

export async function convertBookingToRenting(
  bookingId: string,
  employeeId: string
): Promise<Renting> {
  await delay();
  
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) throw new Error('Booking not found');
  
  if (booking.status !== 'Confirmed') {
    throw new Error('Only confirmed bookings can be converted');
  }
  
  const newRenting: Renting = {
    id: `rent-${Date.now()}`,
    customerId: booking.customerId,
    roomId: booking.roomId,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    status: 'Active',
    employeeId,
    bookingId: booking.id,
    createdAt: new Date().toISOString(),
    totalAmount: booking.totalPrice,
    amountPaid: 0,
  };
  
  rentings.push(newRenting);
  booking.status = 'Converted';
  
  return newRenting;
}

export async function getHotelBookings(hotelId: string): Promise<Booking[]> {
  await delay();
  
  const hotelRoomIds = rooms.filter(r => r.hotelId === hotelId).map(r => r.id);
  
  return bookings
    .filter(b => hotelRoomIds.includes(b.roomId))
    .map(booking => {
      const room = rooms.find(r => r.id === booking.roomId);
      const customer = customers.find(c => c.id === booking.customerId);
      return {
        ...booking,
        room,
        customer,
      };
    })
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
}

export async function getAllBookings(): Promise<Booking[]> {
  await delay();
  
  return bookings.map(booking => {
    const room = rooms.find(r => r.id === booking.roomId);
    const customer = customers.find(c => c.id === booking.customerId);
    const hotel = room ? hotels.find(h => h.id === room.hotelId) : undefined;
    return {
      ...booking,
      room: (hotel ? { ...room, hotel } : room) as Room | undefined,
      customer,
    } as Booking;
  }).sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
}

// ============================================================================
// RENTING API
// ============================================================================

export async function createDirectRenting(rentingData: RentingData): Promise<Renting> {
  await delay();
  
  const room = rooms.find(r => r.id === rentingData.roomId);
  if (!room) throw new Error('Room not found');
  
  const isAvailable = await checkRoomAvailability(rentingData.roomId, {
    checkInDate: rentingData.checkInDate,
    checkOutDate: rentingData.checkOutDate,
  });
  
  if (!isAvailable) throw new Error('Room not available for selected dates');
  
  const nights = Math.ceil(
    (new Date(rentingData.checkOutDate).getTime() - new Date(rentingData.checkInDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );
  
  const newRenting: Renting = {
    id: `rent-${Date.now()}`,
    customerId: rentingData.customerId,
    roomId: rentingData.roomId,
    checkInDate: rentingData.checkInDate,
    checkOutDate: rentingData.checkOutDate,
    status: 'Active',
    employeeId: rentingData.employeeId,
    bookingId: rentingData.bookingId,
    createdAt: new Date().toISOString(),
    totalAmount: room.price * nights,
    amountPaid: 0,
  };
  
  rentings.push(newRenting);
  return newRenting;
}

export async function getCustomerRentings(customerId: string): Promise<Renting[]> {
  await delay();
  
  return rentings
    .filter(r => r.customerId === customerId)
    .map(renting => {
      const room = rooms.find(r => r.id === renting.roomId);
      const employee = employees.find(e => e.id === renting.employeeId);
      if (room) {
        const hotel = hotels.find(h => h.id === room.hotelId);
        return {
          ...renting,
          room: hotel ? { ...room, hotel } : room,
          employee,
        };
      }
      return renting;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getHotelRentings(hotelId: string): Promise<Renting[]> {
  await delay();
  
  const hotelRoomIds = rooms.filter(r => r.hotelId === hotelId).map(r => r.id);
  
  return rentings
    .filter(r => hotelRoomIds.includes(r.roomId))
    .map(renting => {
      const room = rooms.find(r => r.id === renting.roomId);
      const customer = customers.find(c => c.id === renting.customerId);
      const employee = employees.find(e => e.id === renting.employeeId);
      return {
        ...renting,
        room,
        customer,
        employee,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllRentings(): Promise<Renting[]> {
  await delay();
  
  return rentings.map(renting => {
    const room = rooms.find(r => r.id === renting.roomId);
    const customer = customers.find(c => c.id === renting.customerId);
    const employee = employees.find(e => e.id === renting.employeeId);
    const hotel = room ? hotels.find(h => h.id === room.hotelId) : undefined;
    return {
      ...renting,
      room: (hotel ? { ...room, hotel } : room) as Room | undefined,
      customer,
      employee,
    } as Renting;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRentingById(rentingId: string): Promise<Renting | null> {
  await delay();
  
  const renting = rentings.find(r => r.id === rentingId);
  if (!renting) return null;
  
  const room = rooms.find(r => r.id === renting.roomId);
  const customer = customers.find(c => c.id === renting.customerId);
  const employee = employees.find(e => e.id === renting.employeeId);
  
  return {
    ...renting,
    room,
    customer,
    employee,
  };
}

// ============================================================================
// PAYMENT API
// ============================================================================

export async function processPayment(paymentData: PaymentData): Promise<Payment> {
  await delay();
  
  const renting = rentings.find(r => r.id === paymentData.rentingId);
  if (!renting) throw new Error('Renting not found');
  
  const newPayment: Payment = {
    id: `pay-${Date.now()}`,
    rentingId: paymentData.rentingId,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    paymentDate: new Date().toISOString(),
    employeeId: paymentData.employeeId,
    notes: paymentData.notes,
  };
  
  payments.push(newPayment);
  renting.amountPaid += paymentData.amount;
  
  // If fully paid, mark as completed
  if (renting.amountPaid >= renting.totalAmount) {
    renting.status = 'Completed';
  }
  
  return newPayment;
}

export async function getRentingPayments(rentingId: string): Promise<Payment[]> {
  await delay();
  
  return payments
    .filter(p => p.rentingId === rentingId)
    .map(payment => {
      const employee = employees.find(e => e.id === payment.employeeId);
      return { ...payment, employee };
    })
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

// ============================================================================
// ADMIN API - HOTEL CHAINS
// ============================================================================

export async function getAllChains(): Promise<HotelChain[]> {
  await delay();
  return [...chains];
}

export async function getChainById(id: string): Promise<HotelChain | null> {
  await delay();
  return chains.find(c => c.id === id) || null;
}

export async function createChain(data: ChainData): Promise<HotelChain> {
  await delay();
  
  const newChain: HotelChain = {
    id: `chain-${Date.now()}`,
    name: data.name,
    centralOfficeAddress: data.centralOfficeAddress,
    totalHotels: 0,
    contactEmails: data.contactEmails,
    phoneNumbers: data.phoneNumbers,
  };
  
  chains.push(newChain);
  return newChain;
}

export async function updateChain(id: string, data: ChainData): Promise<HotelChain> {
  await delay();
  
  const index = chains.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Chain not found');
  
  chains[index] = {
    ...chains[index],
    name: data.name,
    centralOfficeAddress: data.centralOfficeAddress,
    contactEmails: data.contactEmails,
    phoneNumbers: data.phoneNumbers,
  };
  
  return chains[index];
}

export async function deleteChain(id: string): Promise<void> {
  await delay();
  
  const chainHotels = hotels.filter(h => h.chainId === id);
  if (chainHotels.length > 0) {
    throw new Error('Cannot delete chain with existing hotels');
  }
  
  chains = chains.filter(c => c.id !== id);
}

// ============================================================================
// ADMIN API - HOTELS
// ============================================================================

export async function getAllHotels(filters?: HotelFilters): Promise<Hotel[]> {
  await delay();
  
  let results = [...hotels];
  
  if (filters?.chainId) {
    results = results.filter(h => h.chainId === filters.chainId);
  }
  
  if (filters?.category) {
    results = results.filter(h => h.category === filters.category);
  }
  
  if (filters?.city) {
    results = results.filter(h => h.address.city === filters.city);
  }
  
  return results.map(hotel => {
    const chain = chains.find(c => c.id === hotel.chainId);
    const manager = employees.find(e => e.id === hotel.managerId);
    return { ...hotel, chain, manager };
  });
}

export async function getHotel(id: string): Promise<Hotel | null> {
  await delay();
  
  const hotel = hotels.find(h => h.id === id);
  if (!hotel) return null;
  
  const chain = chains.find(c => c.id === hotel.chainId);
  const manager = employees.find(e => e.id === hotel.managerId);
  
  return { ...hotel, chain, manager };
}

export async function createHotel(data: HotelData): Promise<Hotel> {
  await delay();
  
  const newHotel: Hotel = {
    id: `hotel-${Date.now()}`,
    name: data.name,
    chainId: data.chainId,
    category: data.category,
    address: data.address,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    numberOfRooms: 0,
    managerId: data.managerId,
  };
  
  hotels.push(newHotel);
  
  // Update chain's total hotels
  const chain = chains.find(c => c.id === data.chainId);
  if (chain) chain.totalHotels++;
  
  return newHotel;
}

export async function updateHotel(id: string, data: HotelData): Promise<Hotel> {
  await delay();
  
  const index = hotels.findIndex(h => h.id === id);
  if (index === -1) throw new Error('Hotel not found');
  
  hotels[index] = {
    ...hotels[index],
    name: data.name,
    chainId: data.chainId,
    category: data.category,
    address: data.address,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    managerId: data.managerId,
  };
  
  return hotels[index];
}

export async function deleteHotel(id: string): Promise<void> {
  await delay();
  
  const hotelRooms = rooms.filter(r => r.hotelId === id);
  if (hotelRooms.length > 0) {
    throw new Error('Cannot delete hotel with existing rooms');
  }
  
  const hotel = hotels.find(h => h.id === id);
  if (hotel) {
    const chain = chains.find(c => c.id === hotel.chainId);
    if (chain) chain.totalHotels--;
  }
  
  hotels = hotels.filter(h => h.id !== id);
}

// ============================================================================
// ADMIN API - ROOMS
// ============================================================================

export async function getAllRooms(filters?: RoomFilters): Promise<Room[]> {
  await delay();
  
  let results = [...rooms];
  
  if (filters?.hotelId) {
    results = results.filter(r => r.hotelId === filters.hotelId);
  }
  
  if (filters?.capacity) {
    results = results.filter(r => r.capacity === filters.capacity);
  }
  
  if (filters?.minPrice !== undefined) {
    results = results.filter(r => r.price >= filters.minPrice!);
  }
  
  if (filters?.maxPrice !== undefined) {
    results = results.filter(r => r.price <= filters.maxPrice!);
  }
  
  return results.map(room => {
    const hotel = hotels.find(h => h.id === room.hotelId);
    return { ...room, hotel };
  });
}

export async function getRoom(id: string): Promise<Room | null> {
  await delay();
  
  const room = rooms.find(r => r.id === id);
  if (!room) return null;
  
  const hotel = hotels.find(h => h.id === room.hotelId);
  return { ...room, hotel };
}

export async function createRoom(data: RoomData): Promise<Room> {
  await delay();
  
  const newRoom: Room = {
    id: `room-${Date.now()}`,
    hotelId: data.hotelId,
    roomNumber: data.roomNumber,
    roomType: data.roomType,
    price: data.price,
    amenities: data.amenities,
    capacity: data.capacity,
    viewType: data.viewType,
    isExtendable: data.isExtendable,
    problems: data.problems,
    images: [],
  };
  
  rooms.push(newRoom);
  
  // Update hotel's room count
  const hotel = hotels.find(h => h.id === data.hotelId);
  if (hotel) hotel.numberOfRooms++;
  
  return newRoom;
}

export async function updateRoom(id: string, data: RoomData): Promise<Room> {
  await delay();
  
  const index = rooms.findIndex(r => r.id === id);
  if (index === -1) throw new Error('Room not found');
  
  rooms[index] = {
    ...rooms[index],
    hotelId: data.hotelId,
    roomNumber: data.roomNumber,
    roomType: data.roomType,
    price: data.price,
    amenities: data.amenities,
    capacity: data.capacity,
    viewType: data.viewType,
    isExtendable: data.isExtendable,
    problems: data.problems,
  };
  
  return rooms[index];
}

export async function deleteRoom(id: string): Promise<void> {
  await delay();
  
  const roomBookings = bookings.filter(b => b.roomId === id && (b.status === 'Confirmed' || b.status === 'Pending'));
  const roomRentings = rentings.filter(r => r.roomId === id && r.status === 'Active');
  
  if (roomBookings.length > 0 || roomRentings.length > 0) {
    throw new Error('Cannot delete room with active bookings or rentings');
  }
  
  const room = rooms.find(r => r.id === id);
  if (room) {
    const hotel = hotels.find(h => h.id === room.hotelId);
    if (hotel) hotel.numberOfRooms--;
  }
  
  rooms = rooms.filter(r => r.id !== id);
}

// ============================================================================
// ADMIN API - EMPLOYEES
// ============================================================================

export async function getAllEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  await delay();
  
  let results = [...employees];
  
  if (filters?.hotelId) {
    results = results.filter(e => e.hotelId === filters.hotelId);
  }
  
  if (filters?.role) {
    results = results.filter(e => e.role === filters.role);
  }
  
  return results.map(employee => {
    const hotel = hotels.find(h => h.id === employee.hotelId);
    return { ...employee, hotel };
  });
}

export async function getEmployee(id: string): Promise<Employee | null> {
  await delay();
  
  const employee = employees.find(e => e.id === id);
  if (!employee) return null;
  
  const hotel = hotels.find(h => h.id === employee.hotelId);
  return { ...employee, hotel };
}

export async function createEmployee(data: EmployeeData): Promise<Employee> {
  await delay();
  
  if (employees.find(e => e.email === data.email)) {
    throw new Error('Email already exists');
  }
  
  const newEmployee: Employee = {
    id: `emp-${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    address: data.address,
    ssnSin: data.ssnSin,
    role: data.role,
    hotelId: data.hotelId,
  };
  
  employees.push(newEmployee);
  return newEmployee;
}

export async function updateEmployee(id: string, data: EmployeeData): Promise<Employee> {
  await delay();
  
  const index = employees.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Employee not found');
  
  const existingWithEmail = employees.find(e => e.email === data.email && e.id !== id);
  if (existingWithEmail) {
    throw new Error('Email already exists');
  }
  
  employees[index] = {
    ...employees[index],
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    address: data.address,
    ssnSin: data.ssnSin,
    role: data.role,
    hotelId: data.hotelId,
  };
  
  return employees[index];
}

export async function deleteEmployee(id: string): Promise<void> {
  await delay();
  
  const employee = employees.find(e => e.id === id);
  if (!employee) throw new Error('Employee not found');
  
  // Check if employee is a manager
  if (employee.role === 'Manager') {
    const isOnlyManager = employees.filter(e => e.hotelId === employee.hotelId && e.role === 'Manager').length === 1;
    if (isOnlyManager) {
      throw new Error('Cannot delete the only manager of a hotel');
    }
  }
  
  employees = employees.filter(e => e.id !== id);
}

// ============================================================================
// ADMIN API - CUSTOMERS
// ============================================================================

export async function getAllCustomers(filters?: CustomerFilters): Promise<Customer[]> {
  await delay();
  
  let results = [...customers];
  
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    results = results.filter(c =>
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.idNumber.toLowerCase().includes(term)
    );
  }
  
  return results;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  await delay();
  return customers.find(c => c.id === id) || null;
}

export async function createCustomer(data: CustomerData): Promise<Customer> {
  await delay();
  
  if (customers.find(c => c.email === data.email)) {
    throw new Error('Email already exists');
  }
  
  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    idType: data.idType,
    idNumber: data.idNumber,
    registrationDate: new Date().toISOString().split('T')[0],
  };
  
  customers.push(newCustomer);
  return newCustomer;
}

export async function updateCustomer(id: string, data: CustomerData): Promise<Customer> {
  await delay();
  
  const index = customers.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Customer not found');
  
  const existingWithEmail = customers.find(c => c.email === data.email && c.id !== id);
  if (existingWithEmail) {
    throw new Error('Email already exists');
  }
  
  customers[index] = {
    ...customers[index],
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    idType: data.idType,
    idNumber: data.idNumber,
  };
  
  return customers[index];
}

export async function deleteCustomer(id: string): Promise<void> {
  await delay();
  
  // Check for active bookings or rentings
  const activeBookings = bookings.filter(b => 
    b.customerId === id && 
    (b.status === 'Confirmed' || b.status === 'Pending')
  );
  const activeRentings = rentings.filter(r => 
    r.customerId === id && 
    r.status === 'Active'
  );
  
  if (activeBookings.length > 0 || activeRentings.length > 0) {
    throw new Error('Cannot delete customer with active bookings or rentings');
  }
  
  customers = customers.filter(c => c.id !== id);
}

// ============================================================================
// ADMIN API - ANALYTICS & VIEWS
// ============================================================================

export async function getAvailableRoomsPerArea(): Promise<AreaAvailability[]> {
  await delay();
  
  const areaData: { [key: string]: { total: number; available: number } } = {};
  
  // Get unique areas
  hotels.forEach(hotel => {
    if (!areaData[hotel.address.city]) {
      areaData[hotel.address.city] = { total: 0, available: 0 };
    }
  });
  
  // Count rooms per area
  rooms.forEach(room => {
    const hotel = hotels.find(h => h.id === room.hotelId);
    if (hotel) {
      const area = hotel.address.city;
      areaData[area].total++;
      
      // Check if room is currently available
      const hasActiveReservation = [...bookings, ...rentings].some(res => {
        if (res.roomId !== room.id) return false;
        
        const today = new Date();
        const checkIn = new Date(res.checkInDate);
        const checkOut = new Date(res.checkOutDate);
        
        return today >= checkIn && today <= checkOut;
      });
      
      if (!hasActiveReservation) {
        areaData[area].available++;
      }
    }
  });
  
  return Object.entries(areaData).map(([area, data]) => ({
    area,
    totalRooms: data.total,
    availableRooms: data.available,
    occupancyRate: data.total > 0 ? ((data.total - data.available) / data.total) * 100 : 0,
  }));
}

export async function getHotelCapacityView(): Promise<HotelCapacity[]> {
  await delay();
  
  return hotels.map(hotel => {
    const hotelRooms = rooms.filter(r => r.hotelId === hotel.id);
    const chain = chains.find(c => c.id === hotel.chainId);
    
    const capacityMap: { [key: string]: number } = {
      'Single': 1,
      'Double': 2,
      'Triple': 3,
      'Suite': 2,
      'Family': 4,
      'Studio': 2,
    };
    
    const totalCapacity = hotelRooms.reduce((sum, room) => sum + (capacityMap[room.capacity] || 2), 0);
    
    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      chainName: chain?.name || 'Unknown',
      totalRooms: hotelRooms.length,
      totalCapacity,
      averageCapacityPerRoom: hotelRooms.length > 0 ? totalCapacity / hotelRooms.length : 0,
    };
  });
}
