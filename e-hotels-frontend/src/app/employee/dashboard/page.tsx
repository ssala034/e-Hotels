'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllBookings,
  getAllRentings,
  convertBookingToRenting,
  createWalkInRenting,
  processPayment,
} from '@/lib/api';
import { Booking, Renting, IDType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { ClipboardCheck, UserPlus, CreditCard, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

type TabType = 'checkin' | 'walkin' | 'payments';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

  const [activeTab, setActiveTab] = useState<TabType>('checkin');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rentings, setRentings] = useState<Renting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Walk-in form
  const [walkInForm, setWalkInForm] = useState({
    firstName: '',
    lastName: '',
    idType: 'SSN' as IDType,
    idNumber: '',
    country: 'Canada',
    city: '',
    stateProvince: '',
    streetName: '',
    streetNumber: '',
    zipCode: '',
    email: '',
    password: '',
    roomId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    rentingId: '',
    amount: '',
    paymentMethod: 'Credit Card' as 'Credit Card' | 'Debit Card' | 'Cash',
  });

  useEffect(() => {
    if (!user || (user.role !== 'Employee' && user.role !== 'Admin')) {
      router.push('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bookingsData, rentingsData] = await Promise.all([
        getAllBookings(),
        getAllRentings(),
      ]);
      setBookings(bookingsData);
      setRentings(rentingsData);
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

  const handleCheckIn = async (bookingId: string) => {
    if (!confirm('Confirm check-in for this booking?')) return;
    if (!user) return;

    const employeeId = user.employeeId || user.id;

    try {
      await convertBookingToRenting(bookingId, employeeId);
      toast({
        title: 'Check-in successful',
        description: 'The booking has been converted to a rental',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Check-in failed',
        description: error instanceof Error ? error.message : 'Could not complete check-in',
        variant: 'destructive',
      });
    }
  };

  const handleWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const employeeId = user.employeeId || user.id;

    try {
      await createWalkInRenting({
        employeeId,
        roomId: walkInForm.roomId,
        checkInDate: walkInForm.checkInDate,
        checkOutDate: walkInForm.checkOutDate,
        customer: {
          firstName: walkInForm.firstName,
          lastName: walkInForm.lastName,
          idType: walkInForm.idType,
          idNumber: walkInForm.idNumber,
          country: walkInForm.country,
          city: walkInForm.city,
          stateProvince: walkInForm.stateProvince,
          streetName: walkInForm.streetName,
          streetNumber: walkInForm.streetNumber,
          zipCode: walkInForm.zipCode,
          email: walkInForm.email,
          password: walkInForm.password,
        },
      });

      toast({
        title: 'Walk-in registered',
        description: 'Customer has been successfully checked in',
      });

      setWalkInForm({
        firstName: '',
        lastName: '',
        idType: 'SSN',
        idNumber: '',
        country: 'Canada',
        city: '',
        stateProvince: '',
        streetName: '',
        streetNumber: '',
        zipCode: '',
        email: '',
        password: '',
        roomId: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: '',
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Walk-in registration failed',
        description: error instanceof Error ? error.message : 'Could not register walk-in',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await processPayment({
        rentingId: paymentForm.rentingId,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        employeeId: user.id,
      });

      toast({
        title: 'Payment processed',
        description: 'Payment has been successfully recorded',
      });

      setPaymentForm({
        rentingId: '',
        amount: '',
        paymentMethod: 'Credit Card',
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'Could not process payment',
        variant: 'destructive',
      });
    }
  };

  const tabs = [
    { id: 'checkin', label: 'Check-In', icon: ClipboardCheck },
    { id: 'walkin', label: 'Walk-In', icon: UserPlus },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.status === 'Confirmed' &&
      (booking.room?.hotel?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const unpaidRentings = rentings.filter((r) => {
    // Check if total amount is greater than amount paid
    return r.amountPaid < r.totalAmount;
  });

  if (!user || (user.role !== 'Employee' && user.role !== 'Admin')) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Employee Dashboard</h1>
        <p className="text-muted-foreground">Manage check-ins, walk-ins, and payments</p>
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
          {/* Check-In Tab */}
          {activeTab === 'checkin' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Search Bookings</CardTitle>
                  <CardDescription>Find bookings ready for check-in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by booking ID or hotel name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="secondary">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                    <p className="text-muted-foreground">Try adjusting your search</p>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Room #{booking.room?.roomNumber || 'N/A'}</CardTitle>
                          <CardDescription>{booking.room?.hotel?.name || 'Hotel'}</CardDescription>
                        </div>
                        <Badge>{booking.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Booking ID</p>
                          <p className="font-medium">{booking.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Check-in</p>
                          <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Check-out</p>
                          <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                        </div>
                      </div>
                      <Button onClick={() => handleCheckIn(booking.id)}>
                        Check In Customer
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Walk-In Tab */}
          {activeTab === 'walkin' && (
            <Card>
              <CardHeader>
                <CardTitle>Register Walk-In Customer</CardTitle>
                <CardDescription>Create a new customer and check in immediately</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWalkIn} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={walkInForm.firstName}
                        onChange={(e) => setWalkInForm({ ...walkInForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={walkInForm.lastName}
                        onChange={(e) => setWalkInForm({ ...walkInForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idType">ID Type</Label>
                      <select
                        id="idType"
                        value={walkInForm.idType}
                        onChange={(e) => setWalkInForm({ ...walkInForm, idType: e.target.value as IDType })}
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
                      <Label htmlFor="idNumber">ID Number</Label>
                      <Input
                        id="idNumber"
                        value={walkInForm.idNumber}
                        onChange={(e) => setWalkInForm({ ...walkInForm, idNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={walkInForm.email}
                        onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        minLength={8}
                        value={walkInForm.password}
                        onChange={(e) => setWalkInForm({ ...walkInForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={walkInForm.country}
                        onChange={(e) => setWalkInForm({ ...walkInForm, country: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={walkInForm.city}
                        onChange={(e) => setWalkInForm({ ...walkInForm, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stateProvince">State/Province</Label>
                      <Input
                        id="stateProvince"
                        value={walkInForm.stateProvince}
                        onChange={(e) => setWalkInForm({ ...walkInForm, stateProvince: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="streetName">Street Name</Label>
                      <Input
                        id="streetName"
                        value={walkInForm.streetName}
                        onChange={(e) => setWalkInForm({ ...walkInForm, streetName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="streetNumber">Street Number</Label>
                      <Input
                        id="streetNumber"
                        value={walkInForm.streetNumber}
                        onChange={(e) => setWalkInForm({ ...walkInForm, streetNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={walkInForm.zipCode}
                        onChange={(e) => setWalkInForm({ ...walkInForm, zipCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomId">Room ID</Label>
                    <Input
                      id="roomId"
                      value={walkInForm.roomId}
                      onChange={(e) => setWalkInForm({ ...walkInForm, roomId: e.target.value })}
                      placeholder="Enter room ID"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="walkInCheckIn">Check-in Date</Label>
                      <Input
                        id="walkInCheckIn"
                        type="date"
                        value={walkInForm.checkInDate}
                        onChange={(e) => setWalkInForm({ ...walkInForm, checkInDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="walkInCheckOut">Check-out Date</Label>
                      <Input
                        id="walkInCheckOut"
                        type="date"
                        value={walkInForm.checkOutDate}
                        onChange={(e) => setWalkInForm({ ...walkInForm, checkOutDate: e.target.value })}
                        min={walkInForm.checkInDate}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Register Walk-In
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Process Payment</CardTitle>
                  <CardDescription>Record payments for active rentals</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rentingId">Renting</Label>
                      <select
                        id="rentingId"
                        value={paymentForm.rentingId}
                        onChange={(e) => {
                          const renting = rentings.find((r) => r.id === e.target.value);
                          setPaymentForm({ 
                            ...paymentForm, 
                            rentingId: e.target.value,
                            amount: renting?.totalAmount.toString() || '',
                          });
                        }}
                        required
                        className={selectClassName}
                      >
                        <option value="">Select a rental</option>
                        {unpaidRentings.map((renting) => (
                          <option key={renting.id} value={renting.id}>
                            {renting.id} - Room #{renting.room?.roomNumber} - {formatCurrency(renting.totalAmount)} (Paid: {formatCurrency(renting.amountPaid)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <select
                          id="paymentMethod"
                          value={paymentForm.paymentMethod}
                          onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                          required
                          className={selectClassName}
                        >
                          <option value="Credit Card">Credit Card</option>
                          <option value="Debit Card">Debit Card</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      Process Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Unpaid Rentings List */}
              <Card>
                <CardHeader>
                  <CardTitle>Unpaid Rentals ({unpaidRentings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {unpaidRentings.map((renting) => (
                      <div key={renting.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Room #{renting.room?.roomNumber}</p>
                          <p className="text-sm text-muted-foreground">{renting.room?.hotel?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(renting.totalAmount)}</p>
                          <Badge variant="destructive" className="mt-1">
                            Unpaid: {formatCurrency(renting.totalAmount - renting.amountPaid)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {unpaidRentings.length === 0 && (
                      <p className="text-center text-muted-foreground py-6">
                        All rentals are paid
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
