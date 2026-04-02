'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchRooms, getAllChains, getAllHotels, getAllRooms, getChainAveragePrices } from '@/lib/api';
import { Room, HotelChain, Hotel, RoomCapacity, ViewType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toaster';
import { RoomsPerAreaView } from '@/components/analytics/RoomsPerAreaView';
import {
  Home, ChevronRight, MapPin, Users, Star, Eye,
  Building2, Hotel as HotelIcon, DoorOpen, Info, Search, SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const viewTypes: ViewType[] = ['Sea View', 'Mountain View', 'City View', 'Garden View', 'No View'];
const capacities: RoomCapacity[] = ['Single', 'Double', 'Triple', 'Suite', 'Family'];

type BreadcrumbLevel = 'chains' | 'hotels' | 'rooms';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Data fetched from API ──
  const [allChains, setAllChains] = useState<HotelChain[]>([]);
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allAmenities, setAllAmenities] = useState<string[]>([]);
  const [hotelAveragePrices, setHotelAveragePrices] = useState<Record<number, number>>({});

  // ── Hierarchy state ──
  const [selectedChain, setSelectedChain] = useState<HotelChain | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Chain-level filters ──
  const [chainLocationFilter, setChainLocationFilter] = useState<string[]>([]);
  const [chainMinHotels, setChainMinHotels] = useState<number>(0);

  // ── Hotel-level filters ──
  const [hotelCityFilter, setHotelCityFilter] = useState<string[]>([]);
  const [hotelCategoryFilter, setHotelCategoryFilter] = useState<number[]>([]);
  const [hotelMinRooms, setHotelMinRooms] = useState<number>(0);

  // ── Room-level filters ──
  const [roomCheckIn, setRoomCheckIn] = useState(searchParams.get('checkIn') || '');
  const [roomCheckOut, setRoomCheckOut] = useState(searchParams.get('checkOut') || '');
  const [roomCapacityFilter, setRoomCapacityFilter] = useState<RoomCapacity[]>([]);
  const [roomMinPrice, setRoomMinPrice] = useState<number>(0);
  const [roomMaxPrice, setRoomMaxPrice] = useState<number>(2000);
  const [roomViewFilter, setRoomViewFilter] = useState<ViewType[]>([]);
  const [roomAmenityFilter, setRoomAmenityFilter] = useState<string[]>([]);
  const [roomExtendableOnly, setRoomExtendableOnly] = useState(false);
  const [roomExcludeDamaged, setRoomExcludeDamaged] = useState(false);
  const hasRoomDateRange = !roomCheckIn || !roomCheckOut || roomCheckIn < roomCheckOut;

  const [showFilters, setShowFilters] = useState(true);

  // ── Load chains, hotels, and derive cities/amenities on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const [chainsData, hotelsData, roomsData] = await Promise.all([
          getAllChains(),
          getAllHotels(),
          getAllRooms(),
        ]);
        setAllChains(chainsData);
        setAllHotels(hotelsData);
        setAllCities(Array.from(new Set(hotelsData.map((h) => h.address.city))).sort());
        setAllAmenities(Array.from(new Set(roomsData.flatMap((r) => r.amenities))).sort());
      } catch {
        toast({ title: 'Failed to load data', description: 'Could not fetch chains and hotels', variant: 'destructive' });
      }
    };
    load();
  }, []);

  const level: BreadcrumbLevel = selectedHotel
    ? 'rooms'
    : selectedChain
    ? 'hotels'
    : 'chains';

  // ── Derived: filtered chains ──
  const filteredChains = useMemo(() => {
    return allChains.filter((chain) => {
      const chainHotels = allHotels.filter((h) => h.chainId === chain.id);

      // Location filter: chain must have at least one hotel in any of the selected cities
      if (chainLocationFilter.length > 0) {
        const hasMatch = chainHotels.some((h) => chainLocationFilter.includes(h.address.city));
        if (!hasMatch) return false;
      }

      // Min hotels filter
      if (chainMinHotels > 0 && chainHotels.length < chainMinHotels) return false;

      return true;
    });
  }, [allChains, allHotels, chainLocationFilter, chainMinHotels]);

  // ── Derived: filtered hotels for selected chain ──
  const filteredHotels = useMemo(() => {
    if (!selectedChain) return [];
    return allHotels
      .filter((h) => h.chainId === selectedChain.id)
      .filter((hotel) => {
        if (hotelCityFilter.length > 0 && !hotelCityFilter.includes(hotel.address.city)) return false;
        if (hotelCategoryFilter.length > 0 && !hotelCategoryFilter.includes(hotel.category)) return false;
        if (hotelMinRooms > 0 && hotel.numberOfRooms < hotelMinRooms) return false;
        return true;
      });
  }, [allHotels, selectedChain, hotelCityFilter, hotelCategoryFilter, hotelMinRooms]);

  // Cities available for the selected chain (for hotel-level city filter)
  const chainCities = useMemo(() => {
    if (!selectedChain) return [];
    return Array.from(
      new Set(allHotels.filter((h) => h.chainId === selectedChain.id).map((h) => h.address.city)),
    ).sort();
  }, [allHotels, selectedChain]);

  const availableRoomCount = useMemo(
    () => rooms.filter((room) => String(room.status || '').toLowerCase() === 'available').length,
    [rooms],
  );

  // ── Fetch & filter rooms when hotel selected or room filters change ──
  useEffect(() => {
    if (!selectedHotel) return;
    const fetchRooms = async () => {
      if (roomCheckIn && roomCheckOut && roomCheckIn >= roomCheckOut) {
        setRooms([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchRooms({
          checkInDate: roomCheckIn,
          checkOutDate: roomCheckOut,
          chainId: [selectedHotel.chainId],
          capacity: roomCapacityFilter.length > 0 ? roomCapacityFilter : undefined,
          minPrice: roomMinPrice || undefined,
          maxPrice: roomMaxPrice < 2000 ? roomMaxPrice : undefined,
          viewType: roomViewFilter.length > 0 ? roomViewFilter : undefined,
          amenities: roomAmenityFilter.length > 0 ? roomAmenityFilter : undefined,
          extendableOnly: roomExtendableOnly,
          excludeDamaged: roomExcludeDamaged,
        });
        setRooms(results.filter((r) => r.hotelId === selectedHotel.id));
      } catch {
        toast({ title: 'Search failed', description: 'Could not load rooms', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [
    selectedHotel, roomCheckIn, roomCheckOut, roomCapacityFilter,
    roomMinPrice, roomMaxPrice, roomViewFilter, roomAmenityFilter,
    roomExtendableOnly, roomExcludeDamaged,
  ]);

  // ── Navigation helpers ──
  const goToChains = () => {
    setSelectedChain(null);
    setSelectedHotel(null);
    setRooms([]);
  };
  const goToHotels = (chain: HotelChain) => {
    setSelectedChain(chain);
    setSelectedHotel(null);
    setRooms([]);
    // Reset hotel filters
    setHotelCityFilter([]);
    setHotelCategoryFilter([]);
    setHotelMinRooms(0);
    
    // Fetch average prices for this chain
    const fetchAveragePrices = async () => {
      try {
        const result = await getChainAveragePrices(chain.id);
        const priceMap: Record<number, number> = {};
        result.hotels.forEach((hotel) => {
          priceMap[hotel.hotel_id] = hotel.average_room_price;
        });
        setHotelAveragePrices(priceMap);
      } catch (error) {
        // Silently fail - prices are optional
      }
    };
    fetchAveragePrices();
  };
  const goToRooms = (hotel: Hotel) => {
    setSelectedHotel(hotel);
  };

  const handleAreaSelect = (area: string) => {
    const citiesInArea = Array.from(
      new Set(
        allHotels
          .filter((hotel) => hotel.address?.stateProvince === area)
          .map((hotel) => hotel.address.city)
      )
    );

    setSelectedChain(null);
    setSelectedHotel(null);
    setRooms([]);
    setChainLocationFilter(citiesInArea);
    setChainMinHotels(0);
  };

  // ── Toggle helpers ──
  const toggle = <T,>(arr: T[], val: T) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  // ── Reusable filter sidebar wrapper ──
  const FilterSidebar = ({ children }: { children: React.ReactNode }) => (
    <div className="lg:col-span-1">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Hide' : 'Show'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showFilters && <CardContent className="space-y-5 pt-0">{children}</CardContent>}
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ── Breadcrumb Navigation ── */}
      <nav className="mb-8">
        <div className="inline-flex items-center rounded-full border bg-background shadow-sm px-4 py-2 gap-2 text-sm">
          <button
            onClick={goToChains}
            className={`flex items-center gap-1.5 transition-colors ${
              level === 'chains' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="w-4 h-4" />
            Hotel Chains
          </button>
          {selectedChain && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <button
                onClick={() => goToHotels(selectedChain)}
                className={`flex items-center gap-1.5 transition-colors truncate max-w-[200px] ${
                  level === 'hotels' ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {selectedChain.name}
              </button>
            </>
          )}
          {selectedHotel && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-primary font-semibold truncate max-w-[200px]">
                {selectedHotel.name}
              </span>
            </>
          )}
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════
          AVAILABILITY OVERVIEW
      ════════════════════════════════════════════════════════════════════ */}
      {level === 'chains' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Availability Overview by Region</h2>
          <RoomsPerAreaView onAreaSelect={handleAreaSelect} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          LEVEL 1 — HOTEL CHAINS
      ════════════════════════════════════════════════════════════════════ */}
      {level === 'chains' && (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">Select a Hotel Chain</h1>
            <p className="text-muted-foreground">
              {filteredChains.length} of {allChains.length} chains shown
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <FilterSidebar>
              {/* Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <p className="text-xs text-muted-foreground">Show chains with hotels in…</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {allCities.map((city) => (
                    <label key={city} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={chainLocationFilter.includes(city)}
                        onChange={() => setChainLocationFilter(toggle(chainLocationFilter, city))}
                        className="rounded"
                      />
                      <span>{city}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Min hotels */}
              <div className="space-y-2">
                <Label>Min. Hotels in Chain</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 5"
                  value={chainMinHotels || ''}
                  onChange={(e) => setChainMinHotels(Number(e.target.value) || 0)}
                />
              </div>

              {/* Reset */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setChainLocationFilter([]);
                  setChainMinHotels(0);
                }}
              >
                Clear Filters
              </Button>
            </FilterSidebar>

            {/* Chain cards */}
            <div className="lg:col-span-3">
              {filteredChains.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No chains match</h3>
                    <p className="text-muted-foreground">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredChains.map((chain) => {
                    const hotelCount = allHotels.filter((h) => h.chainId === chain.id).length;
                    return (
                      <Card
                        key={chain.id}
                        className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                        onClick={() => goToHotels(chain)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-primary/10 p-3">
                              <Building2 className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold truncate">{chain.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {hotelCount} {hotelCount === 1 ? 'hotel' : 'hotels'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {chain.centralOfficeAddress.city}, {chain.centralOfficeAddress.country}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          LEVEL 2 — HOTELS
      ════════════════════════════════════════════════════════════════════ */}
      {level === 'hotels' && selectedChain && (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">{selectedChain.name}</h1>
            <p className="text-muted-foreground">
              {filteredHotels.length} {filteredHotels.length === 1 ? 'hotel' : 'hotels'} shown
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <FilterSidebar>
              {/* City */}
              <div className="space-y-2">
                <Label>City</Label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {chainCities.map((city) => (
                    <label key={city} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={hotelCityFilter.includes(city)}
                        onChange={() => setHotelCityFilter(toggle(hotelCityFilter, city))}
                        className="rounded"
                      />
                      <span>{city}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <Label>Star Rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setHotelCategoryFilter(toggle(hotelCategoryFilter, cat))}
                      className={`flex items-center justify-center w-10 h-10 rounded-md border transition-colors ${
                        hotelCategoryFilter.includes(cat)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min rooms */}
              <div className="space-y-2">
                <Label>Min. Rooms in Hotel</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 3"
                  value={hotelMinRooms || ''}
                  onChange={(e) => setHotelMinRooms(Number(e.target.value) || 0)}
                />
              </div>

              {/* Reset */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setHotelCityFilter([]);
                  setHotelCategoryFilter([]);
                  setHotelMinRooms(0);
                }}
              >
                Clear Filters
              </Button>
            </FilterSidebar>

            {/* Hotel cards */}
            <div className="lg:col-span-3">
              {filteredHotels.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hotels match</h3>
                    <p className="text-muted-foreground">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredHotels.map((hotel) => (
                    <Card
                      key={hotel.id}
                      className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
                      onClick={() => goToRooms(hotel)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="rounded-lg bg-primary/10 p-3">
                            <HotelIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold truncate">{hotel.name}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: hotel.category }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {hotel.address.city}, {hotel.address.stateProvince}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {hotel.numberOfRooms} rooms
                              {hotelAveragePrices[parseInt(hotel.id.split('-')[1])] !== undefined && (
                                <span className="ml-2">
                                  - Avg price: {formatCurrency(hotelAveragePrices[parseInt(hotel.id.split('-')[1])])}
                                </span>
                              )}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          LEVEL 3 — ROOMS
      ════════════════════════════════════════════════════════════════════ */}
      {level === 'rooms' && selectedHotel && (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">{selectedHotel.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="flex items-center">
                {Array.from({ length: selectedHotel.category }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </span>
              <span>·</span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {selectedHotel.address.city}, {selectedHotel.address.stateProvince}
              </span>
              <span>·</span>
              <span>
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} shown ({availableRoomCount} available)
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <FilterSidebar>
              {/* Dates */}
              <div className="space-y-2">
                <Label>Check-in Date</Label>
                <Input
                  type="date"
                  value={roomCheckIn}
                  onChange={(e) => setRoomCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out Date</Label>
                <Input
                  type="date"
                  value={roomCheckOut}
                  onChange={(e) => setRoomCheckOut(e.target.value)}
                  min={roomCheckIn || new Date().toISOString().split('T')[0]}
                />
              </div>
              {!hasRoomDateRange && (
                <p className="text-sm text-destructive">Check-out date must be after check-in date.</p>
              )}

              {/* Capacity */}
              <div className="space-y-2">
                <Label>Room Capacity</Label>
                <div className="space-y-1.5">
                  {capacities.map((cap) => (
                    <label key={cap} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={roomCapacityFilter.includes(cap)}
                        onChange={() => setRoomCapacityFilter(toggle(roomCapacityFilter, cap))}
                        className="rounded"
                      />
                      <span>{cap}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={roomMinPrice || ''}
                    onChange={(e) => setRoomMinPrice(Number(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={roomMaxPrice < 2000 ? roomMaxPrice : ''}
                    onChange={(e) => setRoomMaxPrice(Number(e.target.value) || 2000)}
                  />
                </div>
              </div>

              {/* View Type */}
              <div className="space-y-2">
                <Label>View Type</Label>
                <div className="space-y-1.5">
                  {viewTypes.map((vt) => (
                    <label key={vt} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={roomViewFilter.includes(vt)}
                        onChange={() => setRoomViewFilter(toggle(roomViewFilter, vt))}
                        className="rounded"
                      />
                      <span>{vt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {allAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={roomAmenityFilter.includes(amenity)}
                        onChange={() => setRoomAmenityFilter(toggle(roomAmenityFilter, amenity))}
                        className="rounded"
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roomExtendableOnly}
                    onChange={(e) => setRoomExtendableOnly(e.target.checked)}
                    className="rounded"
                  />
                  <span>Extendable only</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roomExcludeDamaged}
                    onChange={(e) => setRoomExcludeDamaged(e.target.checked)}
                    className="rounded"
                  />
                  <span>Hide rooms with issues</span>
                </label>
              </div>

              {/* Reset */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setRoomCapacityFilter([]);
                  setRoomMinPrice(0);
                  setRoomMaxPrice(2000);
                  setRoomViewFilter([]);
                  setRoomAmenityFilter([]);
                  setRoomExtendableOnly(false);
                  setRoomExcludeDamaged(false);
                }}
              >
                Clear Filters
              </Button>
            </FilterSidebar>

            {/* Room results */}
            <div className="lg:col-span-3 space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">Loading rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters</p>
                    {roomExcludeDamaged && (
                      <p className="text-sm text-muted-foreground mt-2">
                        "Hide rooms with issues" is enabled and may be filtering all results.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                rooms.map((room) => {
                  const issues = room.issues && room.issues.length > 0
                    ? room.issues
                    : room.problems
                    ? [room.problems]
                    : [];
                  const amenitiesText = room.amenities && room.amenities.length > 0
                    ? room.amenities.join(', ')
                    : 'Empty';
                  const issuesText = issues.length > 0 ? issues.join(', ') : 'Empty';
                  const isAvailableStatus = String(room.status || '').toLowerCase() === 'available';

                  return (
                    <Card key={room.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Room Image Placeholder */}
                          <div className="md:col-span-1">
                            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                              <DoorOpen className="w-12 h-12 text-primary/40" />
                            </div>
                          </div>

                          {/* Room Details */}
                          <div className="md:col-span-2 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-semibold">
                                  Room #{room.roomNumber} — {room.roomType}
                                </h3>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {formatCurrency(room.price)}
                                </div>
                                <div className="text-sm text-muted-foreground">per night</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
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
                              {room.status && (
                                <Badge variant={isAvailableStatus ? 'secondary' : 'destructive'}>
                                  {room.status}
                                </Badge>
                              )}
                              {room.isExtendable && <Badge variant="default">Extendable</Badge>}
                              {issues.length > 0 && <Badge variant="destructive">Has Issues</Badge>}
                            </div>

                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>
                                  <span className="font-medium text-foreground/90">Amenities:</span> {amenitiesText}
                                </p>
                                <p>
                                  <span className="font-medium text-foreground/90">Issues:</span> {issuesText}
                                </p>
                              </div>

                            <div className="flex gap-2 pt-2">
                              <Button asChild className="flex-1">
                                <Link href={`/rooms/${room.id}`}>View Details</Link>
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  if (!roomCheckIn || !roomCheckOut) {
                                    toast({
                                      title: 'Missing dates',
                                      description: 'Please select check-in and check-out dates first',
                                      variant: 'destructive',
                                    });
                                    return;
                                  }

                                  if (roomCheckIn >= roomCheckOut) {
                                    toast({
                                      title: 'Invalid dates',
                                      description: 'Check-out date must be after check-in date',
                                      variant: 'destructive',
                                    });
                                    return;
                                  }

                                  router.push(`/booking/confirm?roomId=${room.id}&checkIn=${roomCheckIn}&checkOut=${roomCheckOut}`);
                                }}
                                disabled={!hasRoomDateRange}
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
