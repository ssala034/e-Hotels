import { Room } from '@/types';

// Helper function to generate rooms for a hotel
const generateRoomsForHotel = (hotelId: string, basePrice: number, startNum: number): Room[] => {
  const rooms: Room[] = [];
  const amenitiesOptions = [
    ['TV', 'AC', 'WiFi', 'Minibar'],
    ['TV', 'AC', 'WiFi', 'Safe', 'Coffee Maker'],
    ['TV', 'AC', 'WiFi', 'Fridge', 'Minibar', 'Safe'],
    ['TV', 'AC', 'WiFi', 'Fridge', 'Minibar', 'Safe', 'Balcony'],
    ['TV', 'AC', 'WiFi', 'Fridge', 'Minibar', 'Safe', 'Balcony', 'Jacuzzi'],
  ];

  const viewTypes: Array<'Sea View' | 'Mountain View' | 'City View' | 'Garden View' | 'No View'> = ['City View', 'Sea View', 'Mountain View', 'Garden View', 'No View'];
  const capacities: Array<'Single' | 'Double' | 'Triple' | 'Suite' | 'Family' | 'Studio'> = ['Single', 'Double', 'Triple', 'Suite', 'Family'];

  for (let i = 0; i < 5; i++) {
    const capacity = capacities[i];
    const priceMultiplier = i === 0 ? 1 : i === 1 ? 1.3 : i === 2 ? 1.6 : i === 3 ? 2.2 : 2.8;
    
    rooms.push({
      id: `room-${startNum + i}`,
      hotelId,
      roomNumber: `${(i + 1) * 100}`,
      roomType: capacity === 'Single' ? 'Standard Room' : 
                capacity === 'Double' ? 'Deluxe Room' :
                capacity === 'Triple' ? 'Family Room' :
                capacity === 'Suite' ? 'Executive Suite' : 'Presidential Suite',
      price: Math.round(basePrice * priceMultiplier),
      amenities: amenitiesOptions[i],
      capacity,
      viewType: viewTypes[i % viewTypes.length],
      isExtendable: i >= 2,
      problems: i === 4 && startNum % 20 === 0 ? 'AC unit needs maintenance' : undefined,
      images: [`/images/rooms/room-${(startNum + i) % 10}.jpg`],
    });
  }
  
  return rooms;
};

export const mockRooms: Room[] = [
  // Generate 5 rooms per hotel (40 hotels × 5 rooms = 200 rooms)
  ...generateRoomsForHotel('hotel-1', 250, 1),    // Marriott Miami Beach (5-star)
  ...generateRoomsForHotel('hotel-2', 200, 6),    // Marriott Chicago (4-star)
  ...generateRoomsForHotel('hotel-3', 280, 11),   // Marriott Times Square (5-star)
  ...generateRoomsForHotel('hotel-4', 220, 16),   // Marriott San Francisco (4-star)
  ...generateRoomsForHotel('hotel-5', 150, 21),   // Marriott Boston (3-star)
  ...generateRoomsForHotel('hotel-6', 190, 26),   // Marriott Las Vegas (4-star)
  ...generateRoomsForHotel('hotel-7', 140, 31),   // Marriott Seattle (3-star)
  ...generateRoomsForHotel('hotel-8', 180, 36),   // Marriott Toronto (4-star)
  
  ...generateRoomsForHotel('hotel-9', 195, 41),   // Hilton Miami (4-star)
  ...generateRoomsForHotel('hotel-10', 260, 46),  // Hilton Chicago (5-star)
  ...generateRoomsForHotel('hotel-11', 210, 51),  // Hilton NYC Midtown (4-star)
  ...generateRoomsForHotel('hotel-12', 270, 56),  // Hilton San Francisco (5-star)
  ...generateRoomsForHotel('hotel-13', 200, 61),  // Hilton Boston (4-star)
  ...generateRoomsForHotel('hotel-14', 130, 66),  // Hilton Las Vegas (3-star)
  ...generateRoomsForHotel('hotel-15', 120, 71),  // Hilton Seattle Airport (3-star)
  ...generateRoomsForHotel('hotel-16', 185, 76),  // Hilton Toronto (4-star)
  
  ...generateRoomsForHotel('hotel-17', 205, 81),  // Hyatt Miami (4-star)
  ...generateRoomsForHotel('hotel-18', 275, 86),  // Hyatt Chicago (5-star)
  ...generateRoomsForHotel('hotel-19', 215, 91),  // Hyatt NYC Grand Central (4-star)
  ...generateRoomsForHotel('hotel-20', 285, 96),  // Hyatt San Francisco (5-star)
  ...generateRoomsForHotel('hotel-21', 195, 101), // Hyatt Boston (4-star)
  ...generateRoomsForHotel('hotel-22', 180, 106), // Hyatt Lake Las Vegas (4-star)
  ...generateRoomsForHotel('hotel-23', 145, 111), // Hyatt Seattle (3-star)
  ...generateRoomsForHotel('hotel-24', 190, 116), // Hyatt Toronto (4-star)
  
  ...generateRoomsForHotel('hotel-25', 290, 121), // InterContinental Miami (5-star)
  ...generateRoomsForHotel('hotel-26', 300, 126), // InterContinental Chicago (5-star)
  ...generateRoomsForHotel('hotel-27', 310, 131), // InterContinental NYC Times Square (5-star)
  ...generateRoomsForHotel('hotel-28', 295, 136), // InterContinental San Francisco (5-star)
  ...generateRoomsForHotel('hotel-29', 210, 141), // InterContinental Boston (4-star)
  ...generateRoomsForHotel('hotel-30', 160, 146), // InterContinental Las Vegas (3-star)
  ...generateRoomsForHotel('hotel-31', 200, 151), // InterContinental Seattle (4-star)
  ...generateRoomsForHotel('hotel-32', 280, 156), // InterContinental Toronto (5-star)
  
  ...generateRoomsForHotel('hotel-33', 350, 161), // Four Seasons Miami (5-star)
  ...generateRoomsForHotel('hotel-34', 380, 166), // Four Seasons Chicago (5-star)
  ...generateRoomsForHotel('hotel-35', 400, 171), // Four Seasons NYC Downtown (5-star)
  ...generateRoomsForHotel('hotel-36', 360, 176), // Four Seasons Silicon Valley (5-star)
  ...generateRoomsForHotel('hotel-37', 370, 181), // Four Seasons Boston (5-star)
  ...generateRoomsForHotel('hotel-38', 340, 186), // Four Seasons Las Vegas (5-star)
  ...generateRoomsForHotel('hotel-39', 330, 191), // Four Seasons Seattle (5-star)
  ...generateRoomsForHotel('hotel-40', 365, 196), // Four Seasons Toronto (5-star)
];
