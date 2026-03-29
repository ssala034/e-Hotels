'use client';

import { useEffect, useState } from 'react';
import { AreaAvailability } from '@/types';
import { getAvailableRoomsPerArea } from '@/lib/api';
import { Card } from '@/components/ui/card';

type DisplayArea = {
  area: string;
  availableRooms: number;
};

type RoomsPerAreaViewProps = {
  onAreaSelect?: (area: string) => void;
};

export function RoomsPerAreaView({ onAreaSelect }: RoomsPerAreaViewProps) {
  const [data, setData] = useState<AreaAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedData = data.map((item) => {
    const raw = item as AreaAvailability & {
      region?: string;
      chainName?: string;
      hotelName?: string;
      area?: string;
      availableRooms?: number;
    };

    const area = raw.area ?? raw.region ?? 'Unknown Area';
    const availableRooms = Number(raw.availableRooms ?? 0);

    return {
      area,
      availableRooms,
    };
  });

  const groupedByArea = normalizedData.reduce<Record<string, number>>((acc, row) => {
    acc[row.area] = (acc[row.area] ?? 0) + row.availableRooms;
    return acc;
  }, {});

  const displayData: DisplayArea[] = Object.entries(groupedByArea)
    .map(([area, availableRooms]) => ({ area, availableRooms }))
    .sort((a, b) => b.availableRooms - a.availableRooms);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const result = await getAvailableRoomsPerArea();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading availability data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
        Error loading room availability: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayData.map((area) => (
          <Card
            key={area.area}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onAreaSelect?.(area.area)}
          >
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{area.area}</h3>
              <p className="text-sm text-muted-foreground">Available Rooms</p>
              <p className="text-3xl font-bold">{area.availableRooms}</p>
              <p className="text-xs text-muted-foreground">Click to filter hotel chains in this area</p>
            </div>
          </Card>
        ))}
      </div>

      {displayData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No area availability data available
        </div>
      )}
    </div>
  );
}
