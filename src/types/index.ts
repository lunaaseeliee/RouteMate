export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface VehicleInfo {
  make: string;
  model: string;
  year?: string;
  color: string;
  licensePlate: string;
  seats: number;
}

export interface UserPreferences {
  smokingAllowed: boolean;
  petsAllowed: boolean;
  musicAllowed: boolean;
  chatty: boolean;
  maxLuggage: 'small' | 'medium' | 'large';
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  rating: number;
  createdAt: string;
  accountStatus: UserStatus;
  onboardingComplete: boolean;

  // Compatibility and extended profile properties
  displayName?: string;
  profilePhoto?: string;
  photoURL?: string;
  status?: UserStatus;
  isSuspended?: boolean;
  isDriver?: boolean;
  vehicle?: VehicleInfo;
  preferences?: UserPreferences;
  totalRatingsCount?: number;
  totalRidesCreated?: number;
  totalRidesJoined?: number;
  bio?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  lastLoginAt?: string;
}

export interface LocationPoint {
  address: string;
  city: string;
  state?: string;
  lat: number;
  lng: number;
  landmark?: string;
}

export type RideStatus = 'active' | 'in_progress' | 'completed' | 'cancelled';
export type PassengerRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface PassengerBooking {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  seatsBooked: number;
  status: PassengerRequestStatus;
  requestedAt: string;
  pickupNote?: string;
  fareAmount: number;
}

export interface GoogleMapsPlace {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  displayName?: string;
  city?: string;
}

export interface CalculatedRouteInfo {
  distanceMeters: number;
  distanceKm: number;
  distanceText: string;
  durationSeconds: number;
  durationMinutes: number;
  durationText: string;
  encodedPolyline: string;
  polylinePath: { lat: number; lng: number }[];
  bounds?: {
    southwest: { lat: number; lng: number };
    northeast: { lat: number; lng: number };
  };
}

export interface Ride {
  id: string;
  userId?: string; // Currently authenticated Firebase UID
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorPhoto?: string;
  creatorPhone?: string;
  creatorRating?: number;
  isDriver: boolean;
  vehicle?: VehicleInfo;
  
  // Real Google Maps specific properties
  pickupPlaceId?: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  
  destinationPlaceId?: string;
  destinationAddress?: string;
  destinationLat?: number;
  destinationLng?: number;
  
  distanceMeters?: number;
  durationSeconds?: number;
  routePolyline?: string;

  // Compatibility location objects
  pickup: LocationPoint;
  destination: LocationPoint;
  
  departureTime: string; // ISO String
  estimatedDurationMinutes: number;
  distanceKm: number;
  
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  
  preferences?: UserPreferences;
  notes?: string;
  status: RideStatus;
  
  passengerIds: string[];
  passengers: PassengerBooking[];
  
  createdAt: string;
  updatedAt: string;
}

export interface RideSearchFilters {
  pickupCity?: string;
  destinationCity?: string;
  date?: string;
  seatsNeeded?: number;
  maxPrice?: number;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
}

export type NotificationType = 
  | 'ride_request'
  | 'ride_accepted'
  | 'ride_rejected'
  | 'ride_cancelled'
  | 'ride_started'
  | 'ride_completed'
  | 'system'
  | 'report_resolved';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  rideId?: string;
  createdAt: string;
}

export type ReportReason = 
  | 'inappropriate_behavior'
  | 'unsafe_driving'
  | 'no_show'
  | 'harassment'
  | 'scam'
  | 'vehicle_condition'
  | 'incorrect_vehicle'
  | 'payment_issue'
  | 'other';

export type ReportStatus = 'pending' | 'under_review' | 'investigating' | 'resolved' | 'dismissed';

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail?: string;
  reportedUserId: string;
  reportedUserName: string;
  rideId?: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export type SafetyReport = UserReport;

export interface SystemSettings {
  platformFeePercentage: number;
  minimumFare: number;
  maxAllowedSeats: number;
  supportPhone: string;
  supportEmail: string;
  maintenanceMode: boolean;
  requirePhoneVerification: boolean;
}

export interface AdminMetrics {
  totalUsers: number;
  activeRiders: number;
  activeDrivers: number;
  totalRides: number;
  activeRides: number;
  completedRides: number;
  cancelledRides: number;
  totalReports: number;
  pendingReports: number;
  suspendedUsers: number;
  totalVolumeKm: number;
  totalPlatformGMV?: number;
}
