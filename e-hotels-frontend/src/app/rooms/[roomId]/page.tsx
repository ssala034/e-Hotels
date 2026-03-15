'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoom, getHotel } from '@/lib/api';
import { Room, Hotel } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { ArrowLeft, MapPin, Star, Users, Eye, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoomDetails();
  }, [roomId]);

  const loadRoomDetails = async () => {
    try {
      const roomData = await getRoom(roomId);
      if (!roomData) {
        throw new Error('Room not found');
      }
      setRoom(roomData);
      if (roomData.hotel) {
        setHotel(roomData.hotel as Hotel);
      } else {
        const hotelData = await getHotel(roomData.hotelId).catch(() => null);
        setHotel(hotelData);
      }
    } catch (error) {
      toast({
        title: 'Error loading room',
        description: 'Could not load room details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Room not found</h3>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/search">Back to Search</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const issues = room.issues && room.issues.length > 0
    ? room.issues
    : room.problems
    ? [room.problems]
    : [];
  const amenitiesText = room.amenities && room.amenities.length > 0
    ? room.amenities.join(', ')
    : 'Empty';
  const issuesText = issues.length > 0 ? issues.join(', ') : 'Empty';
  const extendableWithText = room.extendableWith && room.extendableWith.length > 0
    ? room.extendableWith.join(', ')
    : 'Empty';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/search">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-24 h-24 text-primary/40" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-md flex items-center justify-center">
                    <Eye className="w-8 h-8 text-primary/30" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Room Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Room #{room.roomNumber}</CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {hotel?.name || room.hotel?.name || 'Hotel'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(room.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">per night</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {hotel && (
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {hotel.category} Star Hotel
                  </Badge>
                )}
                <Badge variant="secondary">
                  <Users className="w-3 h-3 mr-1" />
                  {room.capacity}
                </Badge>
                {room.viewType && (
                  <Badge variant="secondary">
                    <Eye className="w-3 h-3 mr-1" />
                    {room.viewType}
                  </Badge>
                )}
                {room.isExtendable && (
                  <Badge variant="default">Extendable</Badge>
                )}
                {issues.length > 0 && (
                  <Badge variant="destructive">Has Issues</Badge>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Room Description</h3>
                <p className="text-muted-foreground">
                  Experience comfort and luxury in this {room.roomType} room. Perfect for {room.capacity} capacity, 
                  this beautifully appointed room features modern amenities and stunning {room.viewType || 'views'}.
                </p>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                <p className="text-muted-foreground">{amenitiesText}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Room Status</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    Extendable With: {room.isExtendable ? extendableWithText : 'Empty'}
                  </p>
                  <p>Issues: {issuesText}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hotel Information */}
          {hotel && (
            <Card>
              <CardHeader>
                <CardTitle>Hotel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-1">{hotel.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {hotel.address.street}, {hotel.address.city}, {hotel.address.stateProvince}
                  </p>
                </div>
                <div>
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {hotel.category} Star Hotel
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{hotel.contactEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{hotel.contactPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Book This Room</CardTitle>
              <CardDescription>Select your dates to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-in</label>
                <input
                  type="date"
                  id="checkIn"
                  min={new Date().toISOString().split('T')[0]}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-out</label>
                <input
                  type="date"
                  id="checkOut"
                  min={new Date().toISOString().split('T')[0]}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Price per night</span>
                  <span className="font-semibold">{formatCurrency(room.price)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-muted-foreground">Service fee</span>
                  <span className="font-semibold">{formatCurrency(room.price * 0.1)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(room.price * 1.1)}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                disabled={!!room.problems}
                onClick={() => {
                  const checkIn = (document.getElementById('checkIn') as HTMLInputElement)?.value;
                  const checkOut = (document.getElementById('checkOut') as HTMLInputElement)?.value;
                  
                  if (!checkIn || !checkOut) {
                    toast({
                      title: 'Missing dates',
                      description: 'Please select check-in and check-out dates',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  router.push(`/booking/confirm?roomId=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}`);
                }}
              >
                {room.problems ? 'Room Not Available' : 'Reserve Now'}
              </Button>

              {!room.problems && (
                <p className="text-xs text-center text-muted-foreground">
                  You won't be charged yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
