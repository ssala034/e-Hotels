import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const customerRegistrationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  stateProvince: z.string().min(2, 'State/Province is required'),
  zipCode: z.string().min(5, 'ZIP/Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  idType: z.enum(['SSN', 'SIN', 'Driver License', 'Passport']),
  idNumber: z.string().min(5, 'ID number is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const searchCriteriaSchema = z.object({
  checkInDate: z.string().refine((date) => new Date(date) >= new Date(), {
    message: 'Check-in date cannot be in the past',
  }),
  checkOutDate: z.string(),
  area: z.array(z.string()).optional(),
  chainId: z.array(z.string()).optional(),
  category: z.array(z.number().min(1).max(5)).optional(),
  capacity: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
}).refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
  message: 'Check-out date must be after check-in date',
  path: ['checkOutDate'],
});

export const bookingSchema = z.object({
  roomId: z.string().min(1, 'Room is required'),
  customerId: z.string().min(1, 'Customer is required'),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  specialRequests: z.string().max(500).optional(),
});

export const roomSchema = z.object({
  hotelId: z.string().min(1, 'Hotel is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  roomType: z.string().min(2, 'Room type is required'),
  price: z.number().min(0, 'Price must be positive'),
  amenities: z.array(z.string()),
  capacity: z.enum(['Single', 'Double', 'Triple', 'Suite', 'Family', 'Studio']),
  viewType: z.enum(['Sea View', 'Mountain View', 'City View', 'Garden View', 'No View']),
  isExtendable: z.boolean(),
  problems: z.string().max(500).optional(),
});

export const hotelSchema = z.object({
  name: z.string().min(3, 'Hotel name must be at least 3 characters'),
  chainId: z.string().min(1, 'Hotel chain is required'),
  category: z.number().min(1).max(5, 'Category must be between 1 and 5'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  stateProvince: z.string().min(2, 'State/Province is required'),
  zipCode: z.string().min(5, 'ZIP/Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
  managerId: z.string().min(1, 'Manager is required'),
});

export const chainSchema = z.object({
  name: z.string().min(3, 'Chain name must be at least 3 characters'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  stateProvince: z.string().min(2, 'State/Province is required'),
  zipCode: z.string().min(5, 'ZIP/Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  contactEmails: z.array(z.string().email('Invalid email address')).min(1, 'At least one email is required'),
  phoneNumbers: z.array(z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number')).min(1, 'At least one phone number is required'),
});

export const employeeSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  ssnSin: z.string().min(9, 'SSN/SIN must be at least 9 characters'),
  role: z.enum(['Manager', 'Receptionist', 'Housekeeping', 'Maintenance', 'Concierge']),
  hotelId: z.string().min(1, 'Hotel assignment is required'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  stateProvince: z.string().min(2, 'State/Province is required'),
  zipCode: z.string().min(5, 'ZIP/Postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

export const paymentSchema = z.object({
  rentingId: z.string().min(1, 'Renting is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer']),
  notes: z.string().max(500).optional(),
});

export const customerUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  stateProvince: z.string().min(2, 'State/Province is required'),
  zipCode: z.string().min(5, 'ZIP/Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  idType: z.enum(['SSN', 'SIN', 'Driver License', 'Passport']),
  idNumber: z.string().min(5, 'ID number is required'),
});
