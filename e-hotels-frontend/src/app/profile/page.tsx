'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCustomerBookings,
  getCustomerRentings, 
  getAllCustomers,
  updateCustomer,
  cancelBooking,
  deleteCustomer,
} from '@/lib/api';
import { Booking, Renting, Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { User, Calendar, Settings, MapPin, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

type TabType = 'bookings' | 'rentings' | 'profile' | 'settings';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rentings, setRentings] = useState<Renting[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRentingForPayment, setSelectedRentingForPayment] = useState<Renting | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Credit Card' | 'Debit Card' | 'Cash'>('Credit Card');
  const [localPaidByRentingId, setLocalPaidByRentingId] = useState<Record<string, number>>({});
  
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    stateProvince: user?.address?.stateProvince || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [bookingsData, rentingsData, customersData] = await Promise.all([
        getCustomerBookings(user.id),
        getCustomerRentings(user.id),
        getAllCustomers(),
      ]);
      setBookings(bookingsData);
      setRentings(rentingsData);
      setCustomers(customersData);
    } catch (error) {
      toast({
        title: 'Error loading data',
        description: 'Could not load your bookings and rentings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await cancelBooking(bookingId);
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been successfully cancelled',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Cancellation failed',
        description: error instanceof Error ? error.message : 'Could not cancel booking',
        variant: 'destructive',
      });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const existingCustomer = customers.find(c => c.id === user.id);
      const updatedCustomer = await updateCustomer(user.id, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: existingCustomer?.phone || user.phone || '',
        address: {
          street: profileForm.street,
          city: profileForm.city,
          stateProvince: profileForm.stateProvince,
          zipCode: profileForm.zipCode,
          country: profileForm.country,
        },
        idType: existingCustomer?.idType || 'SSN',
        idNumber: existingCustomer?.idNumber || '',
      });
      
      // Update user state
      const updatedUserData: any = {
        ...user,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        address: updatedCustomer.address,
      };
      setUser(updatedUserData);
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not update your profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);
    try {
      await deleteCustomer(user.id);

      // Ensure local session is cleared even if backend token is now invalid after account deletion.
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });

      router.push('/');
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Could not delete your account',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const getEffectiveAmountPaid = (renting: Renting) => {
    const locallyUpdatedAmount = localPaidByRentingId[renting.id];
    const paid = locallyUpdatedAmount ?? renting.amountPaid;
    return Math.min(renting.totalAmount, Math.max(0, paid));
  };

  const getRemainingAmount = (renting: Renting) => {
    return Math.max(0, renting.totalAmount - getEffectiveAmountPaid(renting));
  };

  const openPaymentModal = (renting: Renting) => {
    const remaining = getRemainingAmount(renting);
    setSelectedRentingForPayment(renting);
    setPaymentMethod('Credit Card');
    setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
    setIsPaymentModalOpen(true);
  };

  const handleMockPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRentingForPayment) return;

    const amount = Number(paymentAmount);
    const remaining = getRemainingAmount(selectedRentingForPayment);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter an amount greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (amount > remaining) {
      toast({
        title: 'Amount too high',
        description: `Payment cannot exceed remaining balance of ${formatCurrency(remaining)}.`,
        variant: 'destructive',
      });
      return;
    }

    const nextPaid = Math.min(
      selectedRentingForPayment.totalAmount,
      getEffectiveAmountPaid(selectedRentingForPayment) + amount,
    );

    setLocalPaidByRentingId((prev) => ({
      ...prev,
      [selectedRentingForPayment.id]: nextPaid,
    }));

    toast({
      title: 'Payment recorded',
      description: `${formatCurrency(amount)} paid via ${paymentMethod}.`,
    });

    setIsPaymentModalOpen(false);
    setSelectedRentingForPayment(null);
    setPaymentAmount('');
  };

  const tabs = [
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    { id: 'rentings', label: 'My Stays', icon: MapPin },
    { id: 'profile', label: 'Personal Info', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Account</h1>
        <p className="text-muted-foreground">Manage your bookings and account settings</p>
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
          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">Start by searching for available rooms</p>
                    <Button onClick={() => router.push('/search')}>Browse Rooms</Button>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Room #{booking.room?.roomNumber || 'N/A'}</CardTitle>
                          <CardDescription>{booking.room?.hotel?.name || 'Hotel'}</CardDescription>
                        </div>
                        <Badge variant={booking.status === 'Confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Check-in</p>
                          <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Check-out</p>
                          <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Booking ID</p>
                          <p className="font-medium">{booking.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Booked on</p>
                          <p className="font-medium">{formatDate(booking.bookingDate)}</p>
                        </div>
                      </div>
                      {booking.status === 'Confirmed' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Rentings Tab */}
          {activeTab === 'rentings' && (
            <div className="space-y-4">
              {rentings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No stays yet</h3>
                    <p className="text-muted-foreground">Your active stays will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                rentings.map((renting) => (
                  <Card key={renting.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Room #{renting.room?.roomNumber || 'N/A'}</CardTitle>
                          <CardDescription>{renting.room?.hotel?.name || 'Hotel'}</CardDescription>
                        </div>
                        <Badge variant={getEffectiveAmountPaid(renting) >= renting.totalAmount ? 'default' : 'destructive'}>
                          {getEffectiveAmountPaid(renting) >= renting.totalAmount
                            ? 'Paid'
                            : `Unpaid: ${formatCurrency(getRemainingAmount(renting))}`}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Check-in</p>
                          <p className="font-medium">{formatDate(renting.checkInDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Check-out</p>
                          <p className="font-medium">{formatDate(renting.checkOutDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="font-medium">{formatCurrency(renting.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount Paid</p>
                          <p className="font-medium">{formatCurrency(getEffectiveAmountPaid(renting))}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Renting ID</p>
                          <p className="font-medium">{renting.id}</p>
                        </div>
                      </div>
                      {getRemainingAmount(renting) > 0 && (
                        <Button onClick={() => openPaymentModal(renting)}>
                          Pay Balance
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={profileForm.street}
                      onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stateProvince">State/Province</Label>
                      <Input
                        id="stateProvince"
                        value={profileForm.stateProvince}
                        onChange={(e) => setProfileForm({ ...profileForm, stateProvince: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={profileForm.zipCode}
                        onChange={(e) => setProfileForm({ ...profileForm, zipCode: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profileForm.country}
                        onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive booking confirmations and updates</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Marketing Emails</h4>
                      <p className="text-sm text-muted-foreground">Receive special offers and promotions</p>
                    </div>
                    <input type="checkbox" className="rounded" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline">Change Password</Button>
                  <Button variant="outline">Enable Two-Factor Authentication</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={isDeletingAccount}
                  >
                    Delete Account
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    This action is permanent and cannot be undone
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <Card className="w-full max-w-lg border-destructive/40 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Confirm Account Deletion
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-foreground/90">
                    Careful: deleting your account will remove your profile and all related customer information permanently.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      disabled={isDeletingAccount}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isPaymentModalOpen && selectedRentingForPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <Card className="w-full max-w-lg shadow-2xl">
                <CardHeader>
                  <CardTitle>Pay For Current Stay</CardTitle>
                  <CardDescription>
                    Renting {selectedRentingForPayment.id} - remaining balance {formatCurrency(getRemainingAmount(selectedRentingForPayment))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMockPayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentAmount">Amount</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={getRemainingAmount(selectedRentingForPayment).toFixed(2)}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <select
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'Credit Card' | 'Debit Card' | 'Cash')}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsPaymentModalOpen(false);
                          setSelectedRentingForPayment(null);
                          setPaymentAmount('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Pay Now</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
