export interface CityEvent {
  id: string;
  title: string;
  description: string;
  category: 'traffic' | 'civic' | 'celebration';
  severity: 'low' | 'medium' | 'high';
  location: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  timestamp: Date;
  status: 'active' | 'resolved' | 'monitoring';
}

export interface FilterOptions {
  category: string;
  severity: string;
  timeRange: string;
}