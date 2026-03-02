'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchRooms } from '@/lib/api';
import { Room, SearchCriteria } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { Search, MapPin, Users, Star, Wifi, Tv, Coffee, Wind, Eye, Info } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { mockHotelChains } from '@/lib/mockData';

const amenityIcons: Record<string, any> = {
  WiFi: Wifi,
  TV: Tv,
  'Mini Bar': Coffee,
  'Air Conditioning': Wind,
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchCriteria>({
    checkInDate: searchParams.get('checkIn') || '',
    checkOutDate: searchParams.get('checkOut') || '',
    area: searchParams.get('area') ? [searchParams.get('area')!] : [],
    chainId: searchParams.get('chainId') ? [searchParams.get('chainId')!] : [],
    category: [],
    capacity: [],
    minPrice: 0,
    maxPrice: 2000,
    amenities: [],
    viewType: [],
    extendableOnly: false,
    excludeDamaged: true,
  });

  const [showFilters, setShowFilters] = useState(true);

  // Category stars
  const categories = [1, 2, 3, 4, 5];

  // View types
  const viewTypes = ['Sea View', 'Mountain View', 'City View'];

  // Common amenities
  const commonAmenities = ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning', 'Safe', 'Coffee Maker'];

  // Cities (from mock data)
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Boston', 'Las Vegas', 'Seattle', 'Orlando', 'Houston', 'Austin', 'San Diego', 'Denver', 'Phoenix'];

  useEffect(() => {
    performSearch();
  }, []);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const results = await searchRooms(filters);
      setRooms(results);
      if (results.length === 0) {
        toast({
          title: 'No rooms found',
          description: 'Try adjusting your search criteria',
        });
      }
    } catch (error) {
      toast({
        title: 'Search failed',
        description: 'An error occurred while searching for rooms',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchCriteria, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleAreaToggle = (city: string) => {
    const currentAreas = filters.area || [];
    if (currentAreas.includes(city)) {
      handleFilterChange('area', currentAreas.filter(a => a !== city));
    } else {
      handleFilterChange('area', [...currentAreas, city]);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    if (currentAmenities.includes(amenity)) {
      handleFilterChange('amenities', currentAmenities.filter(a => a !== amenity));
    } else {
      handleFilterChange('amenities', [...currentAmenities, amenity]);
    }
  };

  const clearFilters = () => {
    setFilters({
      checkInDate: '',
      checkOutDate: '',
      area: [],
      chainId: [],
      category: [],
      capacity: [],
      minPrice: 0,
      maxPrice: 2000,
      amenities: [],
      viewType: [],
      extendableOnly: false,
      excludeDamaged: true,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Search Rooms</h1>
        <p className="text-muted-foreground">
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} available
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filters</span>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? 'Hide' : 'Show'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showFilters && (
              <CardContent className="space-y-6">
                {/* Dates */}
                <div className="space-y-2">
                  <Label>Check-in Date</Label>
                  <Input
                    type="date"
                    value={filters.checkInDate}
                    onChange={(e) => handleFilterChange('checkInDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Date</Label>
                  <Input
                    type="date"
                    value={filters.checkOutDate}
                    onChange={(e) => handleFilterChange('checkOutDate', e.target.value)}
                    min={filters.checkInDate || new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Areas */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cities.slice(0, 10).map((city) => (
                      <label key={city} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.area?.includes(city)}
                          onChange={() => handleAreaToggle(city)}
                          className="rounded"
                        />
                        <span>{city}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Hotel Chain */}
                <div className="space-y-2">
                  <Label>Hotel Chain</Label>
                  <select
                    value={filters.chainId?.[0] || ''}
                    onChange={(e) => handleFilterChange('chainId', e.target.value ? [e.target.value] : [])}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">All Chains</option>
                    {mockHotelChains.map((chain: any) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Category */}
                <div className="space-y-2">
                  <Label>Star Rating</Label>
                  <div className="flex gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          const currentCats = filters.category || [];
                          handleFilterChange('category', currentCats.includes(cat) ? currentCats.filter(c => c !== cat) : [...currentCats, cat]);
                        }}
                        className={`flex items-center justify-center w-10 h-10 rounded-md border transition-colors ${
                          filters.category?.includes(cat)
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <Label>Room Capacity</Label>
                  <select
                    multiple
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={filters.capacity || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(o => o.value as any);
                      handleFilterChange('capacity', selected);
                    }}
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                    <option value="Suite">Suite</option>
                    <option value="Family">Family</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange('minPrice', Number(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value) || 2000)}
                    />
                  </div>
                </div>

                {/* View Type */}
                <div className="space-y-2">
                  <Label>View Type</Label>
                  <select
                    value={filters.viewType?.[0] || ''}
                    onChange={(e) => handleFilterChange('viewType', e.target.value ? [e.target.value as any] : [])}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Any View</option>
                    {viewTypes.map((view) => (
                      <option key={view} value={view}>
                        {view}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amenities */}
                <div className="space-y-2">
                  <Label>Amenities</Label>
                  <div className="space-y-2">
                    {commonAmenities.map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={filters.amenities?.includes(amenity)}
                          onChange={() => handleAmenityToggle(amenity)}
                          className="rounded"
                        />
                        <span>{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.extendableOnly || false}
                      onChange={(e) => handleFilterChange('extendableOnly', e.target.checked)}
                      className="rounded"
                    />
                    <span>Extendable bookings only</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.excludeDamaged !== false}
                      onChange={(e) => handleFilterChange('excludeDamaged', e.target.checked)}
                      className="rounded"
                    />
                    <span>Hide damaged rooms</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button onClick={performSearch} className="w-full" disabled={isLoading}>
                    <Search className="w-4 h-4 mr-2" />
                    {isLoading ? 'Searching...' : 'Apply Filters'}
                  </Button>
                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    Clear All
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Searching for rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          ) : (
            rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Room Image Placeholder */}
                    <div className="md:col-span-1">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                        <Eye className="w-12 h-12 text-primary/40" />
                      </div>
                    </div>

                    {/* Room Details */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">Room #{room.roomNumber}</h3>
                          <p className="text-sm text-muted-foreground flex items-center mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {room.hotel?.name || 'Hotel'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(room.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">per night</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {room.hotel && (
                          <Badge variant="secondary">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            {room.hotel.category} Star Hotel
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
                        {room.problems && (
                          <Badge variant="destructive">Has Issues</Badge>
                        )}
                      </div>

                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.slice(0, 4).map((amenity) => {
                            const Icon = amenityIcons[amenity];
                            return (
                              <span key={amenity} className="text-sm text-muted-foreground flex items-center">
                                {Icon && <Icon className="w-4 h-4 mr-1" />}
                                {amenity}
                              </span>
                            );
                          })}
                          {room.amenities.length > 4 && (
                            <span className="text-sm text-muted-foreground">
                              +{room.amenities.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button asChild className="flex-1">
                          <Link href={`/rooms/${room.id}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                          <Link href={`/booking/confirm?roomId=${room.id}&checkIn=${filters.checkInDate}&checkOut=${filters.checkOutDate}`}>
                            Book Now
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
