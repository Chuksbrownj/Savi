export const GEOCODING_SERVICE = Symbol('GEOCODING_SERVICE');

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface IGeocodingService {
  getCoordinates(address: string): Promise<Coordinates | null>;
}
