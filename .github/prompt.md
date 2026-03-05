# e-Hotels Web Application - Frontend Development Prompt

## Project Overview
Build a comprehensive hotel booking and management system for 5 major hotel chains operating across 14+ North American locations. The application serves customers searching for and booking rooms, and hotel employees managing bookings, rentings, and payments. The frontend will be built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS, with placeholder API calls for a Golang backend.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API + React Query (TanStack Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Backend API**: Placeholder functions for Golang REST API (to be implemented)

---

## Database Context

### Core Entities
Understanding the data model is crucial for building appropriate interfaces:

1. **Hotel Chains** (5 chains)
   - Central offices address
   - Total number of hotels
   - Contact emails and phone numbers

2. **Hotels** (8+ per chain, 3+ categories: 1-star to 5-star)
   - Number of rooms
   - Full address
   - Contact information
   - Belonging to a specific chain

3. **Rooms** (5+ per hotel, various capacities)
   - Price per night
   - Amenities (TV, AC, fridge, WiFi, etc.)
   - Capacity (single, double, triple, suite, etc.)
   - View type (sea view, mountain view, city view, no view)
   - Extendable (can add extra bed)
   - Current problems/damages
   - Availability status

4. **Customers**
   - Full name (first, last)
   - Full address
   - ID type and number (SSN/SIN/Driver's License)
   - Registration date
   - Contact information

5. **Employees**
   - Full name
   - Full address
   - SSN/SIN
   - Role/position (Manager, Receptionist, Housekeeping, etc.)
   - Assigned hotel
   - Note: Every hotel must have a manager

6. **Bookings**
   - Customer
   - Room
   - Check-in and check-out dates
   - Status (pending, confirmed, cancelled, converted to renting)
   - Booking date/time
   - *Archived bookings retained even if customer/room deleted*

7. **Rentings**
   - Customer
   - Room
   - Check-in and check-out dates
   - Employee who processed check-in
   - Status (active, completed, checked-out)
   - Created from booking or walk-in
   - *Archived rentings retained even if customer/room deleted*

8. **Payments**
   - Renting reference
   - Amount
   - Payment date
   - Payment method
   - Processed by employee
   - *No historical archive required*

---

## User Roles & Authentication

### 1. Customer Role
**Access**: Public users who can self-register
- Search and view available rooms
- Create bookings for future dates
- View their booking history
- View their profile and update personal information

### 2. Employee Role
**Access**: Hotel staff with credentials
- All customer capabilities
- Convert bookings to rentings (check-in process)
- Create direct rentings for walk-in customers (no prior booking)
- Process payments for rentings
- View bookings and rentings for their hotel
- Limited management of their assigned hotel's data

### 3. Admin Role (Implicit in requirements)
**Access**: System administrators
- Full CRUD operations on:
  - Hotel chains
  - Hotels
  - Rooms
  - Employees
  - Customers
- View system-wide analytics
- Access to both SQL views

### Authentication Requirements
- Role-based access control (RBAC)
- Protected routes with middleware
- Session management (placeholder: assume JWT tokens from backend)
- Login/Register pages
- Password recovery flow (basic UI)

---

## Core Features & Pages

### 1. Landing/Home Page (`/`)
**Purpose**: Entry point for all users

**Components**:
- Hero section with hotel imagery
- Quick search bar (dates, location, guests)
- Featured hotels carousel
- Value propositions (real-time availability, 5 major chains, 14+ locations)
- Call-to-action buttons (Search Rooms, Sign In, Register)

**Navigation Bar**:
- Logo
- Links: Home, Search Rooms, About, Contact
- User menu: Sign In / Register (or Profile/Logout if authenticated)
- Role indicator badge if logged in

---

### 2. Room Search & Booking Page (`/search`)
**Purpose**: Primary customer interface for finding and booking rooms

#### Search Criteria Panel (Left Sidebar or Top Filters)
Implement multi-criteria filtering with real-time updates:

1. **Dates** (Required)
   - Check-in date (date picker)
   - Check-out date (date picker)
   - Validation: Check-out must be after check-in, dates cannot be in the past

2. **Location/Area** (Dropdown/Multi-select)
   - Display all unique areas where hotels exist
   - Multi-select capability
   - Show count of available rooms per area

3. **Hotel Chain** (Dropdown/Multi-select)
   - List all 5 hotel chains
   - Show brand logos if available
   - Filter by one or multiple chains

4. **Hotel Category** (Checkbox group or Star rating selector)
   - 1-star through 5-star
   - Visual star representation
   - Allow range selection (e.g., 3-5 stars)

5. **Room Capacity** (Checkbox group)
   - Single, Double, Triple, Suite, Family, etc.
   - Show icons for each capacity type
   - Multi-select

6. **Price Range** (Dual slider)
   - Min and max price inputs
   - Display current range dynamically
   - Show price per night

7. **Total Rooms in Hotel** (Number range or slider)
   - Filter hotels by their size (e.g., small boutique hotels vs large resorts)
   - Range selector: e.g., "5-50 rooms", "50-100 rooms", "100+ rooms"

8. **Additional Filters** (Expandable/Advanced)
   - Amenities (checkboxes: TV, AC, WiFi, Fridge, etc.)
   - View type (sea view, mountain view, city view, no view)
   - Extendable rooms only (toggle)
   - Exclude rooms with damages (toggle, default ON)

#### Search Results Display (Main Content Area)
**Requirements**:
- Real-time updates as filters change (debounced API calls)
- Loading states with skeletons
- Empty states with helpful messages

**Result Card Layout** (for each available room):
```
┌─────────────────────────────────────────────────┐
│ [Room Image]              │ Room Type: Deluxe   │
│   Gallery                 │ Capacity: Double    │
│                           │ Hotel: Grand Plaza  │
│                           │ Chain: Marriott     │
│                           │ Location: Miami, FL │
│                           │ Category: ★★★★☆     │
│                           │                     │
│ Amenities: [TV] [AC] [WiFi] [Safe] [Minibar]  │
│ View: Ocean View    Extendable: Yes           │
│                                                 │
│ $245/night          [View Details] [Book Now]  │
└─────────────────────────────────────────────────┘
```

**Details**:
- Room thumbnail/gallery
- Room type and capacity
- Hotel name and chain
- Location and star rating
- Key amenities (icons)
- Price per night (calculate total for selected dates)
- View type indicator
- Quick action buttons
- "Fully booked" badge for unavailable rooms (if showing all results)

#### Sorting Options
- Price: Low to High / High to Low
- Rating: Highest first
- Number of rooms in hotel
- Proximity (if location services enabled)

#### Pagination or Infinite Scroll
- Show 20-30 results per page
- Display total results count
- "Load More" button or auto-scroll

---

### 3. Room Details Page (`/rooms/[roomId]`)
**Purpose**: Detailed view of a specific room before booking

**Content**:
- Full image gallery (carousel with thumbnails)
- Room name and type
- Full description
- Complete amenities list with icons
- Hotel information section:
  - Hotel name with link to hotel page
  - Hotel address (with map placeholder)
  - Hotel contact (phone, email)
  - Hotel category (stars)
  - Total rooms in hotel
- Pricing information:
  - Price per night
  - Total price for selected dates
  - Breakdown (nights × rate)
- Availability calendar (visual date picker showing booked dates crossed out)
- Problems/damages notice (if any, prominently displayed)
- Extendable option (with additional cost if applicable)

**Booking Panel** (Sticky sidebar or bottom):
- Date selection (pre-filled from search or empty)
- Guest information form (if logged in, pre-filled)
- Special requests textarea
- Total price summary
- "Book Now" button → redirects to confirmation
- "Book as Employee" button (if employee role)

---

### 4. Booking Confirmation Page (`/booking/confirm`)
**Purpose**: Review and finalize booking

**Content**:
- Booking summary:
  - Room details recap
  - Dates and number of nights
  - Guest information (editable)
  - Total price
- Terms and conditions checkbox
- Cancellation policy display
- "Confirm Booking" button
- "Go Back" to modify

**On Success**:
- Show booking confirmation with booking ID
- Email notification (placeholder)
- Option to view booking in profile

---

### 5. Customer Profile/Dashboard (`/profile` or `/customer/dashboard`)
**Purpose**: Customer account management

**Sections**:

#### My Bookings Tab
- List of all bookings (upcoming, past, cancelled)
- Filters: Status, Date range
- Each booking card shows:
  - Hotel and room info
  - Dates
  - Status badge (confirmed, pending, cancelled, checked-in)
  - Actions: View details, Cancel (if allowed), Print confirmation

#### My Rentings Tab
- List of all rentings (active, completed)
- Each renting card shows:
  - Hotel and room info
  - Check-in/out dates
  - Employee who processed check-in
  - Payment status
  - Actions: View details, View receipt

#### Personal Information Tab
- Editable form:
  - Full name
  - Email
  - Phone
  - Address
  - ID type and number
- "Save Changes" button
- "Change Password" link

#### Account Settings Tab
- Email preferences
- Notification settings
- Delete account (with confirmation dialog)

---

### 6. Employee Dashboard (`/employee/dashboard`)
**Purpose**: Hotel staff operations interface

**Access Control**: Only accessible to users with Employee role

**Main Sections**:

#### Today's Check-ins Tab
- Filter by hotel (if employee works across multiple hotels)
- List of bookings scheduled for check-in today
- Search by customer name or booking ID
- Each booking card:
  - Customer name and contact
  - Room number/type
  - Booking dates
  - Booking ID
  - **"Check-In" button** → Opens modal/form:
    - Confirm customer ID
    - Verify payment status
    - Add notes
    - "Convert to Renting" action
    - Creates renting record in database
    - Updates booking status

#### Walk-in Rentals Tab
- **"New Walk-in Customer" form**:
  - Search existing customer (by name, ID, email)
  - OR "Create New Customer" quick form:
    - Full name
    - ID type and number
    - Contact info
  - Room selection:
    - View available rooms in employee's hotel
    - Filter by criteria
    - Select room
  - Date selection (check-in and check-out)
  - Create direct renting (no booking record)
  - **"Process Rental" button**

#### Process Payment Tab
- Search for active rentings:
  - By customer name
  - By room number
  - By renting ID
- Display renting details:
  - Customer info
  - Room and hotel
  - Dates and duration
  - Total amount due
  - Payments already made (if any)
- **Payment Form**:
  - Amount (pre-filled with balance due)
  - Payment method dropdown (Cash, Credit Card, Debit Card, etc.)
  - Payment notes
  - **"Submit Payment" button**
- Receipt generation (printable, PDF download placeholder)

#### Bookings & Rentings Overview Tab
- List all bookings for employee's hotel
- List all active rentings
- Filters: Date range, status, customer name
- Export to CSV (placeholder)

---

### 7. Admin Dashboard (`/admin`)
**Purpose**: System administration and data management

**Access Control**: Only accessible to Admin users

**Navigation Sidebar**:
- Dashboard Home
- Hotel Chains
- Hotels  
- Rooms
- Employees
- Customers
- Bookings (view only)
- Rentings (view only)
- Analytics & Views

#### Dashboard Home
- Key metrics cards:
  - Total bookings (today, this week, this month)
  - Total rentings (active, completed this month)
  - Revenue (placeholder calculations)
  - Occupancy rate per hotel/chain
- Recent activity feed
- Quick actions buttons

#### Hotel Chains Management (`/admin/chains`)
- **List View**:
  - Table with columns: Name, Central Office Address, Number of Hotels, Contact Email, Phone, Actions
  - Search and filter
  - **"Add New Chain" button**
  
- **Create/Edit Form** (Modal or separate page):
  - Chain name
  - Central office address (multi-field: street, city, state/province, zip, country)
  - Number of hotels (calculated or manual)
  - Contact emails (list, can add multiple)
  - Phone numbers (list, can add multiple)
  - **"Save" button**, **"Cancel" button**
  
- **Delete Action**:
  - Confirmation dialog with warning about cascade deletion
  - Must delete all hotels in chain first (or warn about cascade)

#### Hotels Management (`/admin/hotels`)
- **List View**:
  - Table/card grid with: Hotel Name, Chain, Category (stars), Location, Number of Rooms, Contact, Actions
  - Filters: Chain, Category, Location
  - **"Add New Hotel" button**
  
- **Create/Edit Form**:
  - Hotel name
  - Hotel chain (dropdown, required)
  - Category (star rating selector)
  - Full address (multi-field)
  - Contact email and phone
  - Number of rooms (calculated from rooms table or manual)
  - Manager assignment (dropdown of employees with Manager role)
  - **"Save" button**
  
- **Delete Action**:
  - Confirmation with warning
  - Cannot delete if active bookings/rentings exist (or cascade with warning)

#### Rooms Management (`/admin/rooms`)
- **List View**:
  - Table with: Room Number/Name, Hotel, Capacity, Price, Amenities, View, Status, Actions
  - Filters: Hotel, Capacity, Price range, Availability
  - Search by room number
  - **"Add New Room" button**
  
- **Create/Edit Form** (Comprehensive):
  - Room number/identifier
  - Hotel (dropdown, required)
  - Room type/name (e.g., "Deluxe Ocean Suite")
  - Price per night (number input)
  - Capacity (dropdown: Single, Double, Triple, etc.)
  - Amenities (multi-select checkboxes):
    - TV, AC, WiFi, Fridge, Minibar, Safe, Coffee Maker, Balcony, Jacuzzi, etc.
  - View type (dropdown: Sea View, Mountain View, City View, Garden View, No View)
  - Extendable (checkbox)
  - Problems/Damages (textarea, optional)
  - Upload images (placeholder for image upload)
  - **"Save" button**
  
- **Delete Action**:
  - Confirmation dialog
  - Cannot delete if active bookings/rentings (or handle with warning)

#### Employees Management (`/admin/employees`)
- **List View**:
  - Table: Name, Hotel, Role/Position, SSN/SIN (masked), Contact, Actions
  - Filters: Hotel, Role
  - **"Add New Employee" button**
  
- **Create/Edit Form**:
  - Full name (first, last)
  - SSN/SIN (masked input)
  - Full address
  - Contact information
  - Role/Position (dropdown: Manager, Receptionist, Maintenance, Housekeeping, etc.)
  - Assigned hotel (dropdown)
  - Email and password for login (create user account)
  - **"Save" button**
  
- **Delete Action**:
  - Confirmation
  - Handle orphaned rentings (employee reference kept in archives)
  - Validation: Cannot delete if hotel would have no manager

#### Customers Management (`/admin/customers`)
- **List View**:
  - Table: Name, Email, ID Type, ID Number (masked), Registration Date, Actions
  - Search by name, email, ID
  - **"Add New Customer" button** (usually created via registration)
  
- **Create/Edit Form**:
  - Full name
  - Email (unique)
  - Phone
  - Full address
  - ID type (dropdown: SSN, SIN, Driver's License, Passport)
  - ID number
  - Registration date (auto-filled for creation)
  - **"Save" button**
  
- **Delete Action**:
  - Confirmation
  - Note: Historical bookings/rentings preserved (archives)

#### Analytics & SQL Views (`/admin/views`)
- **View 1: Available Rooms Per Area**
  - Title: "Room Availability by Location"
  - Table or chart showing:
    - Area/Location name
    - Total rooms
    - Available rooms (not currently booked/rented)
    - Occupancy percentage
  - Refresh button to update data
  - Export to CSV (placeholder)
  
- **View 2: Aggregated Capacity by Hotel**
  - Title: "Total Capacity by Hotel"
  - Table showing:
    - Hotel name
    - Hotel chain
    - Total rooms
    - Total capacity (sum of all room capacities, e.g., 10 single + 20 double = 40 guests)
    - Average capacity per room
  - Filter by chain or location
  - Sortable columns
  - Export to CSV (placeholder)

---

## Additional Pages

### Registration Page (`/register`)
- Customer registration form:
  - Full name
  - Email (unique, validated)
  - Password (with strength indicator)
  - Confirm password
  - Phone number
  - Address fields
  - ID type and number
  - Terms acceptance checkbox
- "Sign Up" button
- Link to login page
- Note: Employees registered by admin

### Login Page (`/login`)
- Email/username field
- Password field
- "Remember me" checkbox
- "Forgot password?" link
- "Login" button
- Link to registration page
- Role-based redirect after login (customer → /search, employee → /employee/dashboard, admin → /admin)

### About Page (`/about`)
- Information about the 5 hotel chains
- Mission and values
- Locations map (placeholder)

### Contact Page (`/contact`)
- Contact form (placeholder submission)
- FAQ section (expandable/collapsible)

---

## Component Architecture

### Shared Components (`/components/shared/`)
1. **Navbar**
   - Responsive navigation
   - User authentication state
   - Role-based menu items
   - Mobile hamburger menu

2. **Footer**
   - Links to pages
   - Social media icons
   - Contact info
   - Copyright notice

3. **SearchBar**
   - Quick search input
   - Date pickers
   - Guest count selector
   - Location autocomplete

4. **RoomCard**
   - Reusable room display card
   - Props: room data, onClick handler, showBookButton
   - Variants: compact, detailed

5. **HotelCard**
   - Hotel display with info
   - Props: hotel data, onClick handler

6. **FilterPanel**
   - Reusable filter sidebar
   - Props: filterOptions, onFilterChange

7. **DateRangePicker**
   - Check-in and check-out selection
   - Date range validation
   - Disable past dates

8. **StarRating**
   - Display star rating (1-5)
   - Props: rating, size, readonly

9. **StatusBadge**
   - For booking/renting status
   - Color-coded (pending: yellow, confirmed: green, cancelled: red, active: blue)

10. **ConfirmationDialog**
    - Reusable modal for confirmations
    - Props: title, message, onConfirm, onCancel

11. **LoadingSpinner / Skeleton**
    - Loading states for async operations

12. **EmptyState**
    - For empty lists/no results
    - Props: icon, message, action button

13. **DataTable**
    - Reusable table with sorting, filtering, pagination
    - Props: columns, data, actions

14. **FormInput / FormSelect / FormTextarea**
    - Styled form elements
    - Integrated with React Hook Form
    - Error display

---

### Feature-Specific Components

#### For Search Page (`/components/search/`)
- `SearchFilters.tsx` - Complete filter panel
- `RoomResultsList.tsx` - Results display
- `AdvancedFilters.tsx` - Expandable additional filters

#### For Employee Dashboard (`/components/employee/`)
- `CheckInModal.tsx` - Convert booking to renting
- `WalkInForm.tsx` - New rental without booking
- `PaymentForm.tsx` - Process payment interface
- `CustomerSearch.tsx` - Find existing customer

#### For Admin Dashboard (`/components/admin/`)
- `ChainForm.tsx` - Create/edit hotel chains
- `HotelForm.tsx` - Create/edit hotels
- `RoomForm.tsx` - Create/edit rooms
- `EmployeeForm.tsx` - Create/edit employees
- `CustomerForm.tsx` - Create/edit customers
- `DeleteConfirmation.tsx` - Specialized for cascading deletes
- `ViewsDisplay.tsx` - Render SQL views

---

## API Integration (Placeholder Functions)

Create an `/lib/api.ts` file with placeholder functions that will be replaced with actual Golang backend calls:

### Authentication API
```typescript
// POST /api/auth/register
export async function registerCustomer(data: RegisterData): Promise<User> {
  // Placeholder: Return mock user object
}

// POST /api/auth/login
export async function login(email: string, password: string): Promise<AuthResponse> {
  // Placeholder: Return mock token and user role
}

// POST /api/auth/logout
export async function logout(): Promise<void> {}
```

### Search & Availability API
```typescript
// GET /api/rooms/search?checkIn=...&checkOut=...&area=...&chain=...&category=...&capacity=...&minPrice=...&maxPrice=...
export async function searchRooms(criteria: SearchCriteria): Promise<Room[]> {
  // Placeholder: Return mock rooms based on criteria
}

// GET /api/rooms/:id/availability?checkIn=...&checkOut=...
export async function checkRoomAvailability(roomId: string, dates: DateRange): Promise<boolean> {
  // Placeholder: Return availability status
}
```

### Booking API
```typescript
// POST /api/bookings
export async function createBooking(bookingData: BookingData): Promise<Booking> {
  // Placeholder: Return created booking with ID
}

// GET /api/bookings/customer/:customerId
export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  // Placeholder: Return mock bookings
}

// PUT /api/bookings/:id/cancel
export async function cancelBooking(bookingId: string): Promise<void> {}

// POST /api/bookings/:id/convert-to-renting
export async function convertBookingToRenting(bookingId: string, employeeId: string): Promise<Renting> {
  // Placeholder: Return created renting
}
```

### Renting API
```typescript
// POST /api/rentings (for walk-ins)
export async function createDirectRenting(rentingData: RentingData): Promise<Renting> {
  // Placeholder: Return created renting
}

// GET /api/rentings/customer/:customerId
export async function getCustomerRentings(customerId: string): Promise<Renting[]> {
  // Placeholder: Return mock rentings
}

// GET /api/rentings/hotel/:hotelId
export async function getHotelRentings(hotelId: string): Promise<Renting[]> {
  // Placeholder: Return rentings for hotel
}
```

### Payment API
```typescript
// POST /api/payments
export async function processPayment(paymentData: PaymentData): Promise<Payment> {
  // Placeholder: Return payment confirmation
}
```

### Admin APIs

#### Hotel Chains
```typescript
// GET /api/admin/chains
export async function getAllChains(): Promise<HotelChain[]> {}

// POST /api/admin/chains
export async function createChain(data: ChainData): Promise<HotelChain> {}

// PUT /api/admin/chains/:id
export async function updateChain(id: string, data: ChainData): Promise<HotelChain> {}

// DELETE /api/admin/chains/:id
export async function deleteChain(id: string): Promise<void> {}
```

#### Hotels
```typescript
// GET /api/admin/hotels
export async function getAllHotels(filters?: HotelFilters): Promise<Hotel[]> {}

// GET /api/admin/hotels/:id
export async function getHotel(id: string): Promise<Hotel> {}

// POST /api/admin/hotels
export async function createHotel(data: HotelData): Promise<Hotel> {}

// PUT /api/admin/hotels/:id
export async function updateHotel(id: string, data: HotelData): Promise<Hotel> {}

// DELETE /api/admin/hotels/:id
export async function deleteHotel(id: string): Promise<void> {}
```

#### Rooms
```typescript
// GET /api/admin/rooms
export async function getAllRooms(filters?: RoomFilters): Promise<Room[]> {}

// GET /api/admin/rooms/:id
export async function getRoom(id: string): Promise<Room> {}

// POST /api/admin/rooms
export async function createRoom(data: RoomData): Promise<Room> {}

// PUT /api/admin/rooms/:id
export async function updateRoom(id: string, data: RoomData): Promise<Room> {}

// DELETE /api/admin/rooms/:id
export async function deleteRoom(id: string): Promise<void> {}
```

#### Employees
```typescript
// GET /api/admin/employees
export async function getAllEmployees(filters?: EmployeeFilters): Promise<Employee[]> {}

// POST /api/admin/employees
export async function createEmployee(data: EmployeeData): Promise<Employee> {}

// PUT /api/admin/employees/:id
export async function updateEmployee(id: string, data: EmployeeData): Promise<Employee> {}

// DELETE /api/admin/employees/:id
export async function deleteEmployee(id: string): Promise<void> {}
```

#### Customers
```typescript
// GET /api/admin/customers
export async function getAllCustomers(filters?: CustomerFilters): Promise<Customer[]> {}

// GET /api/admin/customers/:id
export async function getCustomer(id: string): Promise<Customer> {}

// POST /api/admin/customers
export async function createCustomer(data: CustomerData): Promise<Customer> {}

// PUT /api/admin/customers/:id
export async function updateCustomer(id: string, data: CustomerData): Promise<Customer> {}

// DELETE /api/admin/customers/:id
export async function deleteCustomer(id: string): Promise<void> {}
```

#### Views
```typescript
// GET /api/admin/views/available-rooms-per-area
export async function getAvailableRoomsPerArea(): Promise<AreaAvailability[]> {}

// GET /api/admin/views/hotel-capacity
export async function getHotelCapacityView(): Promise<HotelCapacity[]> {}
```

---

## TypeScript Type Definitions

Create comprehensive types in `/types/index.ts`:

```typescript
// Core entities
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
  chain?: HotelChain; // Populated in joins
  category: 1 | 2 | 3 | 4 | 5; // Star rating
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
  roomType: string; // "Deluxe Suite", "Standard Room", etc.
  price: number; // Per night
  amenities: string[]; // ["TV", "AC", "WiFi", ...]
  capacity: RoomCapacity;
  viewType: ViewType;
  isExtendable: boolean;
  problems?: string; // Current damages/issues
  images?: string[]; // URLs
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
  registrationDate: string; // ISO date
}

export type IDType = 'SSN' | 'SIN' | 'Driver License' | 'Passport';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: Address;
  ssnSin: string; // Masked in display
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
  checkInDate: string; // ISO date
  checkOutDate: string; // ISO date
  status: BookingStatus;
  bookingDate: string; // ISO timestamp
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
  employeeId: string; // Who processed
  employee?: Employee;
  bookingId?: string; // Null if walk-in
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
  paymentDate: string; // ISO timestamp
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
  category?: number[]; // [3, 4, 5]
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
  occupancyRate: number; // Percentage
}

export interface HotelCapacity {
  hotelId: string;
  hotelName: string;
  chainName: string;
  totalRooms: number;
  totalCapacity: number; // Sum of guest capacity
  averageCapacityPerRoom: number;
}

// Auth types
export interface User {
  id: string;
  email: string;
  role: 'Customer' | 'Employee' | 'Admin';
  firstName: string;
  lastName: string;
  customerId?: string; // If customer
  employeeId?: string; // If employee
}

export interface AuthResponse {
  user: User;
  token: string;
}
```

---

## Form Validation Schemas (Zod)

Create validation schemas in `/lib/validations.ts`:

```typescript
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

export const paymentSchema = z.object({
  rentingId: z.string().min(1, 'Renting is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer']),
  notes: z.string().max(500).optional(),
});
```

---

## State Management Strategy

### React Context for Global State
Create contexts in `/contexts/`:

1. **AuthContext** (`/contexts/AuthContext.tsx`)
   - Current user
   - User role
   - Login/logout functions
   - Token management
   - Protected route wrapper

2. **SearchContext** (`/contexts/SearchContext.tsx`)
   - Current search criteria
   - Search results
   - Filter state persistence
   - Update functions

### React Query for Server State
Configure in `/lib/react-query.ts`:
- Cache management for API calls
- Automatic refetching
- Optimistic updates
- Query invalidation strategies

Example query hooks in `/hooks/`:
```typescript
// /hooks/useRooms.ts
export function useSearchRooms(criteria: SearchCriteria) {
  return useQuery({
    queryKey: ['rooms', 'search', criteria],
    queryFn: () => searchRooms(criteria),
    enabled: !!criteria.checkInDate && !!criteria.checkOutDate,
  });
}

// /hooks/useBookings.ts
export function useCustomerBookings(customerId: string) {
  return useQuery({
    queryKey: ['bookings', 'customer', customerId],
    queryFn: () => getCustomerBookings(customerId),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
```

---

## UI/UX Requirements

### Design System
- **Colors**:
  - Primary: Professional blue (#2563EB)
  - Secondary: Warm accent (#F59E0B)
  - Success: #10B981
  - Danger: #EF4444
  - Warning: #F59E0B
  - Neutral: Tailwind gray scale

- **Typography**:
  - Headings: Inter or similar modern sans-serif
  - Body: System fonts for performance
  - Size scale: text-sm, text-base, text-lg, text-xl, text-2xl, etc.

- **Spacing**:
  - Consistent use of Tailwind spacing scale
  - Generous whitespace
  - Comfortable padding for interactive elements

### Responsive Design
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

- **Mobile-First Approach**:
  - Stack layouts vertically on mobile
  - Collapsible filters (drawer or modal)
  - Touch-friendly button sizes (min 44px)
  - Hamburger menu for navigation

- **Desktop Optimizations**:
  - Side-by-side layouts
  - Hover states
  - Multi-column forms
  - Persistent filter sidebar

### Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Color contrast ratios (4.5:1 for normal text)

### Loading States
- Skeleton loaders for content
- Spinner for actions
- Progress indicators for multi-step processes
- Disabled states for buttons during submission

### Error Handling
- Inline form validation errors
- Toast notifications for actions (success/error)
- Error boundaries for component failures
- Graceful degradation
- User-friendly error messages (no technical jargon)

### Feedback & Notifications
- Toast/Snackbar component for temporary messages
- Confirmation dialogs for destructive actions
- Success messages after CRUD operations
- Loading indicators for async operations

---

## Routing Structure (Next.js App Router)

```
/app
  ├── layout.tsx                    # Root layout with providers
  ├── page.tsx                      # Home page
  ├── (auth)
  │   ├── layout.tsx                # Auth layout (if needed)
  │   ├── login
  │   │   └── page.tsx              # Login page
  │   └── register
  │       └── page.tsx              # Registration page
  ├── search
  │   └── page.tsx                  # Room search page
  ├── rooms
  │   └── [roomId]
  │       └── page.tsx              # Room details page
  ├── booking
  │   └── confirm
  │       └── page.tsx              # Booking confirmation page
  ├── profile
  │   └── page.tsx                  # Customer profile
  ├── employee
  │   ├── layout.tsx                # Employee layout (protected)
  │   └── dashboard
  │       └── page.tsx              # Employee dashboard
  ├── admin
  │   ├── layout.tsx                # Admin layout (protected)
  │   ├── page.tsx                  # Admin dashboard home
  │   ├── chains
  │   │   └── page.tsx              # Hotel chains management
  │   ├── hotels
  │   │   └── page.tsx              # Hotels management
  │   ├── rooms
  │   │   └── page.tsx              # Rooms management
  │   ├── employees
  │   │   └── page.tsx              # Employees management
  │   ├── customers
  │   │   └── page.tsx              # Customers management
  │   └── views
  │       └── page.tsx              # SQL views display
  ├── about
  │   └── page.tsx                  # About page
  └── contact
      └── page.tsx                  # Contact page
```

### Middleware (`/middleware.ts`)
- Role-based route protection
- Redirect unauthenticated users
- Verify JWT tokens (placeholder)

---

## Mock Data Strategy

Since the backend is not yet implemented, create comprehensive mock data:

### Mock Data Files (`/lib/mockData/`)

1. **`hotelChains.ts`**: Array of 5 hotel chains with full details
2. **`hotels.ts`**: Array of 40+ hotels (8 per chain, various categories and locations)
3. **`rooms.ts`**: Array of 200+ rooms (5+ per hotel, various capacities and prices)
4. **`customers.ts`**: Array of 50+ sample customers
5. **`employees.ts`**: Array of 40+ employees (managers, receptionists, etc.)
6. **`bookings.ts`**: Array of sample bookings (upcoming, past, cancelled)
7. **`rentings.ts`**: Array of sample rentings (active, completed)
8. **`payments.ts`**: Array of sample payments

### Mock API Implementation
In `/lib/api.ts`, implement functions that:
- Use mock data from files
- Simulate API delays with `setTimeout` (200-500ms)
- Perform client-side filtering for search
- Maintain state in localStorage for persistence (optional)
- Return properly typed data

Example:
```typescript
export async function searchRooms(criteria: SearchCriteria): Promise<Room[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Filter mock rooms based on criteria
  let results = mockRooms.filter(room => {
    // Apply filters
    if (criteria.area && criteria.area.length > 0) {
      const hotel = mockHotels.find(h => h.id === room.hotelId);
      if (!hotel || !criteria.area.includes(hotel.address.city)) return false;
    }
    
    if (criteria.minPrice && room.price < criteria.minPrice) return false;
    if (criteria.maxPrice && room.price > criteria.maxPrice) return false;
    
    // ... more filters
    
    return true;
  });
  
  return results;
}
```

---

## Implementation Steps

### Phase 1: Project Setup
1. Initialize Next.js project with TypeScript
2. Install dependencies:
   - `npm install tailwindcss postcss autoprefixer`
   - `npm install @tanstack/react-query`
   - `npm install react-hook-form zod @hookform/resolvers`
   - `npm install date-fns lucide-react`
   - `npm install shadcn/ui` (or equivalent component library)
3. Configure Tailwind CSS
4. Set up folder structure
5. Create base layout and navigation

### Phase 2: Authentication & Core Infrastructure
1. Create type definitions (`/types/index.ts`)
2. Implement AuthContext
3. Create login and registration pages
4. Build protected route middleware
5. Create mock data files
6. Implement placeholder API functions

### Phase 3: Customer Features
1. Build home/landing page
2. Implement room search page:
   - Filter panel with all criteria
   - Results display with real-time updates
   - Pagination/infinite scroll
3. Create room details page
4. Build booking flow (confirmation page)
5. Implement customer profile/dashboard:
   - My Bookings tab
   - My Rentings tab
   - Personal info editor

### Phase 4: Employee Features
1. Create employee dashboard layout
2. Implement "Today's Check-ins" tab with conversion flow
3. Build "Walk-in Rentals" tab with customer search and direct renting
4. Create "Process Payment" tab with payment form
5. Add overview tab for bookings/rentings

### Phase 5: Admin Features
1. Build admin dashboard layout with sidebar navigation
2. Implement Hotel Chains CRUD
3. Implement Hotels CRUD
4. Implement Rooms CRUD (comprehensive form)
5. Implement Employees CRUD
6. Implement Customers CRUD
7. Create Analytics & Views page with SQL view displays

### Phase 6: Polish & Testing
1. Add loading states and skeletons
2. Implement error handling and toast notifications
3. Enhance responsive design
4. Add animations and transitions
5. Test all user flows
6. Optimize performance
7. Accessibility audit

### Phase 7: Documentation
1. Create README with setup instructions
2. Document component props
3. API integration guide for backend team
4. Deployment instructions

---

## Best Practices

1. **Code Organization**:
   - Follow feature-based folder structure
   - Keep components small and focused
   - Separate business logic from UI

2. **Performance**:
   - Use React.lazy() for code splitting
   - Optimize images (Next.js Image component)
   - Memoize expensive calculations
   - Debounce search inputs

3. **Type Safety**:
   - No `any` types
   - Strict TypeScript configuration
   - Validate API responses

4. **Testing** (optional for this phase):
   - Unit tests for utility functions
   - Integration tests for forms
   - E2E tests for critical flows

5. **Git Workflow**:
   - Feature branches
   - Meaningful commit messages
   - Pull requests for review

6. **Comments**:
   - Add TODO comments for backend integration points
   - Document complex logic
   - Explain non-obvious decisions

---

## Backend Integration Notes

When the Golang backend is ready, update the following:

1. **API Functions** (`/lib/api.ts`):
   - Replace mock implementations with actual fetch/axios calls
   - Update base URL configuration
   - Handle authentication headers (JWT)

2. **Environment Variables** (`.env.local`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_API_TIMEOUT=10000
   ```

3. **Error Handling**:
   - Map backend error codes to user-friendly messages
   - Handle network errors gracefully

4. **Data Validation**:
   - Validate API responses match TypeScript types
   - Handle unexpected data gracefully

5. **Authentication**:
   - Implement token refresh logic
   - Store tokens securely (httpOnly cookies or secure localStorage)
   - Handle 401 responses (logout user)

---

## Additional Features (Nice-to-Have)

If time permits, consider adding:

1. **Advanced Search**:
   - Saved searches
   - Search history
   - Comparison tool (compare multiple rooms side-by-side)

2. **Customer Features**:
   - Favorite rooms/hotels
   - Review and rating system
   - Loyalty program display

3. **Employee Features**:
   - Shift scheduling
   - Task management
   - Guest communication tools

4. **Admin Features**:
   - Advanced analytics dashboards
   - Revenue reports
   - Occupancy forecasting
   - Bulk operations (import/export CSV)

5. **General**:
   - Dark mode toggle
   - Multi-language support (i18n)
   - Print-friendly views
   - Mobile app (React Native with shared components)
   - Push notifications for booking confirmations
   - Email templates preview

---

## Success Criteria

The application should:
1. ✅ Allow customers to search for rooms using multiple criteria with real-time filtering
2. ✅ Enable customers to book rooms for specific dates
3. ✅ Provide employees with check-in functionality (booking → renting conversion)
4. ✅ Support direct rentals for walk-in customers
5. ✅ Allow employees to process payments
6. ✅ Provide admin with full CRUD capabilities for all entities
7. ✅ Display both required SQL views in an accessible manner
8. ✅ Enforce referential integrity (at least at UI level until backend is ready)
9. ✅ Be responsive and work on mobile, tablet, and desktop
10. ✅ Have a user-friendly interface that doesn't require SQL knowledge
11. ✅ Use appropriate form elements (dropdowns, radio buttons, checkboxes, date pickers)
12. ✅ Handle edge cases gracefully (no available rooms, invalid dates, etc.)
13. ✅ Preserve booking/renting archives conceptually (even if customer/room deleted)

---

## Questions to Consider During Development

1. Should cancelled bookings be editable or permanently cancelled?
2. How far in advance can customers book (e.g., maximum 1 year)?
3. Can customers book multiple rooms in one transaction?
4. Should employees be able to work at multiple hotels?
5. What's the maximum number of consecutive nights for a booking?
6. Should the system support partial payments?
7. How should overbooking be handled (if at all)?
8. Should rooms have different prices for different seasons?
9. What happens when a customer tries to delete their account with active bookings?

---

## Deliverables

At the end of development, you should have:

1. ✅ Fully functional Next.js application
2. ✅ Comprehensive component library
3. ✅ Mock data simulating real database
4. ✅ Placeholder API functions ready for backend integration
5. ✅ TypeScript type definitions for all entities
6. ✅ Form validation schemas
7. ✅ Responsive UI working across devices
8. ✅ Role-based access control
9. ✅ README documentation
10. ✅ Code ready for production deployment

---

## Final Notes

- **Focus on User Experience**: The interface should be intuitive. Customers should find rooms easily, employees should process check-ins quickly, and admins should manage data efficiently.

- **Modular Design**: Build components that can be reused. For example, the same form input components should work in customer registration, employee creation, and hotel editing.

- **Think About Scale**: While mocking data, structure the application as if it will handle thousands of hotels and millions of bookings. Use pagination, lazy loading, and efficient filtering.

- **Placeholder Integration**: Every API call should have a clear comment indicating what the backend endpoint should be and what data format it expects/returns.

- **Consistency**: Maintain consistent patterns throughout the application—same button styles, same form layouts, same error handling approach, same navigation structure.

---

## Getting Started Command

Once the prompt is used to generate the project:

```bash
npx create-next-app@latest e-hotels-frontend --typescript --tailwind --app
cd e-hotels-frontend
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers date-fns lucide-react
npm run dev
```

Then begin implementing features following the phases outlined above.

---

**End of Prompt**

This prompt provides a complete blueprint for building the e-Hotels web application frontend. It covers all requirements from the assignment, provides technical specifications, and offers guidance for future backend integration. Use this as a comprehensive guide for development.
