'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getRoom, createBooking, convertBookingToRenting } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Room } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate, calculateNights } from '@/lib/utils';

export default function BookingConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const roomId = searchParams.get('roomId');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!roomId) {
      router.push('/search');
      return;
    }

    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const roomData = await getRoom(roomId!);
      setRoom(roomData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not load room details',
        variant: 'destructive',
      });
      router.push('/search');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to make a booking',
        variant: 'destructive',
      });
      router.push(`/login?redirect=/booking/confirm?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`);
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: 'Terms required',
        description: 'Please accept the terms and conditions',
        variant: 'destructive',
      });
      return;
    }

    setIsBooking(true);

    try {
      const booking = await createBooking({
        roomId: roomId!,
        customerId: user.id,
        checkInDate: checkIn!,
        checkOutDate: checkOut!,
      });

      toast({
        title: 'Booking successful!',
        description: `Your booking ID is ${booking.id}`,
      });

      router.push(`/profile?tab=bookings`);
    } catch (error) {
      toast({
        title: 'Booking failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!room || !checkIn || !checkOut) {
    return null;
  }

  const nights = calculateNights(checkIn, checkOut);
  const subtotal = room.price * nights;
  const serviceFee = subtotal * 0.1;
  const taxes = subtotal * 0.13; // 13% tax
  const total = subtotal + serviceFee + taxes;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href={`/rooms/${roomId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Room
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Confirm Your Booking</CardTitle>
              <CardDescription>Review your booking details before confirming</CardDescription>
            </CardHeader>
          </Card>

          {/* Guest Information */}
          <Card>
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input value={user.firstName} disabled />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input value={user.lastName} disabled />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user.email} disabled />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={user.phone || user.email || 'Not provided'} disabled />
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">Please log in to complete your booking</p>
                  <Button asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Cancellation policy: Free cancellation up to 48 hours before check-in</p>
                  <p>• Check-in time: 3:00 PM</p>
                  <p>• Check-out time: 11:00 AM</p>
                  <p>• Valid ID required at check-in</p>
                  <p>• No smoking policy</p>
                  <p>• Damage deposit may be required at check-in</p>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    I agree to the terms and conditions and the hotel's cancellation policy
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room Details */}
              <div>
                <h4 className="font-semibold mb-1">Room #{room.roomNumber}</h4>
                <p className="text-sm text-muted-foreground">{room.hotel?.name || 'Hotel'}</p>
              </div>

              {/* Dates */}
              <div className="space-y-2 pb-4 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium">{formatDate(checkIn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">{formatDate(checkOut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total nights</span>
                  <span className="font-medium">{nights}</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 pb-4 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(room.price)} × {nights} nights
                  </span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service fee</span>
                  <span className="font-medium">{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxes (13%)</span>
                  <span className="font-medium">{formatCurrency(taxes)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>

              {/* Booking Button */}
              <Button 
                className="w-full" 
                onClick={handleBooking}
                disabled={isBooking || !acceptedTerms || !user}
              >
                {isBooking ? 'Processing...' : 'Confirm Booking'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your card will be charged at check-in
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
