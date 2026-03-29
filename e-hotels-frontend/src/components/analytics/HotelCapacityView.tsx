'use client';

import { useEffect, useState } from 'react';
import { HotelCapacity } from '@/types';
import { getHotelCapacityView } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function HotelCapacityView() {
  const [data, setData] = useState<HotelCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const result = await getHotelCapacityView();
      setData(result);
      // Set first chain as selected if available
      if (result.length > 0) {
        setSelectedChain(result[0].chainName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  const normalizedData = data.map((hotel, index) => {
    const raw = hotel as HotelCapacity & {
      aggregateCapacity?: number;
      totalCapacity?: number;
      totalRooms?: number;
      averageCapacityPerRoom?: number;
      chainName?: string;
      hotelName?: string;
      hotelId?: string;
    };

    const totalCapacity = Number(raw.totalCapacity ?? raw.aggregateCapacity ?? 0);
    const totalRooms = Number(raw.totalRooms ?? 0);
    const averageCapacityPerRoom = Number.isFinite(raw.averageCapacityPerRoom)
      ? Number(raw.averageCapacityPerRoom)
      : totalRooms > 0
      ? totalCapacity / totalRooms
      : 0;

    return {
      hotelId: raw.hotelId ?? `unknown-${index}`,
      hotelName: raw.hotelName ?? 'Unknown Hotel',
      chainName: raw.chainName ?? 'Unknown',
      totalRooms,
      totalCapacity,
      averageCapacityPerRoom,
    };
  });

  // Group hotels by chain
  const chainGroups = normalizedData.reduce(
    (acc, hotel) => {
      if (!acc[hotel.chainName]) {
        acc[hotel.chainName] = [];
      }
      acc[hotel.chainName].push(hotel);
      return acc;
    },
    {} as Record<string, typeof normalizedData>
  );

  const filteredHotels = selectedChain ? chainGroups[selectedChain] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading capacity data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
        Error loading hotel capacity: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chain Filter */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Filter by Chain</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(chainGroups).map((chain) => (
            <Badge
              key={chain}
              variant={selectedChain === chain ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-2"
              onClick={() => setSelectedChain(chain)}
            >
              {chain} ({chainGroups[chain].length})
            </Badge>
          ))}
        </div>
      </div>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHotels.map((hotel) => (
          <Card key={hotel.hotelId} className="p-4 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{hotel.hotelName}</h3>
                <p className="text-xs text-muted-foreground">{hotel.chainName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Rooms</p>
                  <p className="font-semibold text-lg">{hotel.totalRooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Capacity</p>
                  <p className="font-semibold text-lg text-blue-600">{hotel.totalCapacity}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Avg Capacity per Room</p>
                <p className="font-semibold text-lg">
                  {hotel.averageCapacityPerRoom.toFixed(1)} guests/room
                </p>
              </div>

              {/* Capacity Indicator */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Capacity Ratio</span>
                  <span className="font-medium">{hotel.totalCapacity} / {hotel.totalRooms * 2}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (hotel.totalCapacity / (hotel.totalRooms * 2)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredHotels.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hotels available for this chain
        </div>
      )}
    </div>
  );
}
