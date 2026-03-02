import { HotelChain } from '@/types';

export const mockHotelChains: HotelChain[] = [
  {
    id: 'chain-1',
    name: 'Marriott International',
    centralOfficeAddress: {
      street: '10400 Fernwood Road',
      city: 'Bethesda',
      stateProvince: 'Maryland',
      zipCode: '20817',
      country: 'USA',
    },
    totalHotels: 8,
    contactEmails: ['info@marriott.com', 'support@marriott.com'],
    phoneNumbers: ['+1-301-380-3000', '+1-800-627-7468'],
  },
  {
    id: 'chain-2',
    name: 'Hilton Worldwide',
    centralOfficeAddress: {
      street: '7930 Jones Branch Drive',
      city: 'McLean',
      stateProvince: 'Virginia',
      zipCode: '22102',
      country: 'USA',
    },
    totalHotels: 8,
    contactEmails: ['contact@hilton.com', 'reservations@hilton.com'],
    phoneNumbers: ['+1-703-883-1000', '+1-800-445-8667'],
  },
  {
    id: 'chain-3',
    name: 'Hyatt Hotels',
    centralOfficeAddress: {
      street: '150 North Riverside Plaza',
      city: 'Chicago',
      stateProvince: 'Illinois',
      zipCode: '60606',
      country: 'USA',
    },
    totalHotels: 8,
    contactEmails: ['info@hyatt.com', 'guestservices@hyatt.com'],
    phoneNumbers: ['+1-312-750-1234', '+1-800-233-1234'],
  },
  {
    id: 'chain-4',
    name: 'InterContinental Hotels',
    centralOfficeAddress: {
      street: 'Broadwater Park',
      city: 'Denham',
      stateProvince: 'Buckinghamshire',
      zipCode: 'UB9 5HR',
      country: 'UK',
    },
    totalHotels: 8,
    contactEmails: ['contact@ihg.com', 'reservations@ihg.com'],
    phoneNumbers: ['+44-1895-512-000', '+1-877-424-2449'],
  },
  {
    id: 'chain-5',
    name: 'Four Seasons Hotels',
    centralOfficeAddress: {
      street: '1165 Leslie Street',
      city: 'Toronto',
      stateProvince: 'Ontario',
      zipCode: 'M3C 2K8',
      country: 'Canada',
    },
    totalHotels: 8,
    contactEmails: ['info@fourseasons.com', 'reservations@fourseasons.com'],
    phoneNumbers: ['+1-416-449-1750', '+1-800-819-5053'],
  },
];
