from pydantic import BaseModel
from typing import Optional, List

'''
Double check this code as we may NOT BE ALLOWED THIS CAUSE 
IT IS MIMICING AN ORM BUT NO ORM LIBRARY
'''

# ============================================================================
# Shared
# ============================================================================

class Address(BaseModel):
    street: str
    city: str
    stateProvince: str
    zipCode: str
    country: str


# ============================================================================
# Auth
# ============================================================================

class RegisterData(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    confirmPassword: str
    streetName: str
    streetNumber: str
    city: str
    stateProvince: str
    zipCode: str
    country: str
    idType: str
    idNumber: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ============================================================================
# Search
# ============================================================================

class SearchCriteria(BaseModel):
    checkInDate: Optional[str] = None
    checkOutDate: Optional[str] = None
    area: Optional[List[str]] = None
    chainId: Optional[List[str]] = None
    category: Optional[List[int]] = None
    capacity: Optional[List[str]] = None
    minPrice: Optional[float] = None
    maxPrice: Optional[float] = None
    minHotelRooms: Optional[int] = None
    maxHotelRooms: Optional[int] = None
    amenities: Optional[List[str]] = None
    viewType: Optional[List[str]] = None
    extendableOnly: Optional[bool] = None
    excludeDamaged: Optional[bool] = None


# ============================================================================
# Bookings / Rentings / Payments
# ============================================================================

class BookingData(BaseModel):
    roomId: str
    customerId: str
    checkInDate: str
    checkOutDate: str
    specialRequests: Optional[str] = None


class ConvertBookingRequest(BaseModel):
    employeeId: str


class RentingData(BaseModel):
    customerId: str
    roomId: str
    checkInDate: str
    checkOutDate: str
    employeeId: str
    bookingId: Optional[str] = None


class WalkInCustomerData(BaseModel):
    first_name: str
    last_name: str
    ssn_type: str
    ssn_number: str
    country: str
    city: str
    region: str
    street_name: str
    street_number: str
    postalcode: str
    email: str
    password: str


class WalkInRentingData(BaseModel):
    room_id: str
    check_in_date: str
    check_out_date: str
    employee_id: str
    customer: WalkInCustomerData


class PaymentData(BaseModel):
    rentingId: str
    amount: float
    paymentMethod: str
    employeeId: str
    notes: Optional[str] = None


# ============================================================================
# Admin - Chains
# ============================================================================

class ChainData(BaseModel):
    name: str
    centralOfficeAddress: Address
    contactEmails: List[str]
    phoneNumbers: List[str]


# ============================================================================
# Admin - Hotels
# ============================================================================

class HotelData(BaseModel):
    name: str
    chainId: str
    category: int
    address: Address
    contactEmail: str
    contactPhone: str
    managerId: str


# ============================================================================
# Admin - Rooms
# ============================================================================

class RoomData(BaseModel):
    hotelId: str
    roomNumber: str
    roomType: str
    price: float
    amenities: List[str]
    capacity: str
    viewType: str
    isExtendable: bool
    problems: Optional[str] = None


# ============================================================================
# Admin - Employees
# ============================================================================

class EmployeeData(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    address: Address
    ssnSin: str
    idType: Optional[str] = "SSN"
    role: str
    hotelId: Optional[str] = None
    chainId: Optional[str] = None


# ============================================================================
# Admin - Customers
# ============================================================================

class CustomerData(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    address: Address
    idType: str
    idNumber: str
