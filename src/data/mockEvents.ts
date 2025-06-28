import { CityEvent } from '../types';

export const mockEvents: CityEvent[] = [
  {
    id: '1',
    title: 'Heavy Traffic on Highway 101',
    description: 'Major congestion due to construction work causing delays up to 30 minutes',
    category: 'traffic',
    severity: 'high',
    location: {
      name: 'Highway 101 & Market St',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    timestamp: new Date(Date.now() - 15 * 60000),
    status: 'active'
  },
  {
    id: '2',
    title: 'Street Art Festival',
    description: 'Annual street art festival bringing together local artists and community',
    category: 'celebration',
    severity: 'low',
    location: {
      name: 'Mission District',
      coordinates: { lat: 37.7599, lng: -122.4148 }
    },
    timestamp: new Date(Date.now() - 45 * 60000),
    status: 'active'
  },
  {
    id: '3',
    title: 'Water Main Break',
    description: 'Emergency repair work causing road closure and water service disruption',
    category: 'civic',
    severity: 'high',
    location: {
      name: '3rd & Mission St',
      coordinates: { lat: 37.7853, lng: -122.4005 }
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    status: 'monitoring'
  },
  {
    id: '4',
    title: 'Food Truck Rally',
    description: 'Weekly food truck gathering featuring local vendors and live music',
    category: 'celebration',
    severity: 'low',
    location: {
      name: 'Golden Gate Park',
      coordinates: { lat: 37.7694, lng: -122.4862 }
    },
    timestamp: new Date(Date.now() - 30 * 60000),
    status: 'active'
  },
  {
    id: '5',
    title: 'Multi-Vehicle Accident',
    description: 'Traffic incident involving 3 vehicles, emergency services on scene',
    category: 'traffic',
    severity: 'medium',
    location: {
      name: 'Bay Bridge Approach',
      coordinates: { lat: 37.7983, lng: -122.3778 }
    },
    timestamp: new Date(Date.now() - 20 * 60000),
    status: 'active'
  },
  {
    id: '6',
    title: 'Scheduled Road Maintenance',
    description: 'Planned infrastructure maintenance causing lane restrictions',
    category: 'civic',
    severity: 'medium',
    location: {
      name: 'Van Ness Avenue',
      coordinates: { lat: 37.7849, lng: -122.4194 }
    },
    timestamp: new Date(Date.now() - 60 * 60000),
    status: 'monitoring'
  }
];