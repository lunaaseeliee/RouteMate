import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Ride, RideSearchFilters, PassengerBooking, UserProfile } from '../types';
import { createNotification } from './notificationService';
import { cleanForFirestore, handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const RIDES_COLLECTION = 'rides';

export interface CreateRideParams {
  driver: UserProfile;
  pickup: Ride['pickup'];
  destination: Ride['destination'];
  departureTime: string;
  totalSeats: number;
  pricePerSeat: number;
  distanceKm: number;
  durationMinutes: number;
  notes?: string;
  // Google Maps specific fields
  pickupPlaceId?: string;
  destinationPlaceId?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  routePolyline?: string;
}

export async function createRide(
  driver: UserProfile,
  pickup: Ride['pickup'],
  destination: Ride['destination'],
  departureTime: string,
  totalSeats: number,
  pricePerSeat: number,
  distanceKm: number,
  durationMinutes: number,
  notes?: string,
  googleMapsData?: {
    pickupPlaceId?: string;
    destinationPlaceId?: string;
    distanceMeters?: number;
    durationSeconds?: number;
    routePolyline?: string;
  }
): Promise<Ride> {
  const rideRef = doc(collection(db, RIDES_COLLECTION));
  const now = new Date().toISOString();

  const distMeters = googleMapsData?.distanceMeters ?? Math.round(distanceKm * 1000);
  const durSecs = googleMapsData?.durationSeconds ?? Math.round(durationMinutes * 60);

  const newRide: Ride = cleanForFirestore({
    id: rideRef.id,
    userId: driver.uid, // Required by RouteMate requirement
    creatorId: driver.uid,
    creatorName: driver.displayName || driver.name || 'RouteMate Driver',
    creatorEmail: driver.email || '',
    creatorPhoto: driver.photoURL || driver.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${driver.uid}`,
    creatorPhone: driver.phoneNumber || '',
    creatorRating: driver.rating || 5.0,
    isDriver: true,
    vehicle: driver.vehicle || {
      make: 'Standard',
      model: 'Sedan',
      color: 'Silver',
      licensePlate: 'RM-COMMUTER',
      seats: totalSeats
    },
    // Explicit Google Maps top-level fields
    pickupPlaceId: googleMapsData?.pickupPlaceId || '',
    pickupAddress: pickup.address,
    pickupLat: pickup.lat,
    pickupLng: pickup.lng,
    destinationPlaceId: googleMapsData?.destinationPlaceId || '',
    destinationAddress: destination.address,
    destinationLat: destination.lat,
    destinationLng: destination.lng,
    distanceMeters: distMeters,
    durationSeconds: durSecs,
    routePolyline: googleMapsData?.routePolyline || '',

    // Nested compatibility point objects
    pickup,
    destination,
    departureTime,
    estimatedDurationMinutes: Math.max(1, Math.round(durSecs / 60)),
    distanceKm: Math.round((distMeters / 1000) * 10) / 10,
    totalSeats,
    availableSeats: totalSeats,
    pricePerSeat,
    preferences: driver.preferences || {
      smokingAllowed: false,
      petsAllowed: true,
      musicAllowed: true,
      chatty: true,
      maxLuggage: 'medium'
    },
    notes: notes || '',
    status: 'active',
    passengerIds: [],
    passengers: [],
    createdAt: now,
    updatedAt: now,
  });

  try {
    await setDoc(rideRef, newRide);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${RIDES_COLLECTION}/${rideRef.id}`);
  }

  // Update user's ride stats
  try {
    const userRef = doc(db, 'users', driver.uid);
    await updateDoc(userRef, {
      totalRidesCreated: (driver.totalRidesCreated || 0) + 1
    });
  } catch (err) {
    console.warn('Could not update user ride count:', err);
  }

  return newRide;
}

export async function getRideById(rideId: string): Promise<Ride | null> {
  try {
    const snap = await getDoc(doc(db, RIDES_COLLECTION, rideId));
    if (snap.exists()) {
      return snap.data() as Ride;
    }
    return null;
  } catch (error) {
    console.error('Error fetching ride:', error);
    return null;
  }
}

export async function searchRides(filters: RideSearchFilters): Promise<Ride[]> {
  try {
    const ridesRef = collection(db, RIDES_COLLECTION);
    // Fetch all active rides and filter accurately in memory to allow flexible partial-text & date matching without requiring complex composite index
    const q = query(ridesRef, where('status', 'in', ['active', 'in_progress']));
    const snapshot = await getDocs(q);

    let rides: Ride[] = [];
    snapshot.forEach((docSnap) => {
      rides.push(docSnap.data() as Ride);
    });

    // Apply filter criteria
    if (filters.pickupCity && filters.pickupCity.trim()) {
      const pSearch = filters.pickupCity.toLowerCase().trim();
      rides = rides.filter(r => 
        r.pickup.city.toLowerCase().includes(pSearch) || 
        r.pickup.address.toLowerCase().includes(pSearch)
      );
    }

    if (filters.destinationCity && filters.destinationCity.trim()) {
      const dSearch = filters.destinationCity.toLowerCase().trim();
      rides = rides.filter(r => 
        r.destination.city.toLowerCase().includes(dSearch) || 
        r.destination.address.toLowerCase().includes(dSearch)
      );
    }

    if (filters.seatsNeeded && filters.seatsNeeded > 1) {
      rides = rides.filter(r => r.availableSeats >= filters.seatsNeeded!);
    } else {
      rides = rides.filter(r => r.availableSeats > 0);
    }

    if (filters.maxPrice && filters.maxPrice > 0) {
      rides = rides.filter(r => r.pricePerSeat <= filters.maxPrice!);
    }

    if (filters.date) {
      const filterDateStr = new Date(filters.date).toISOString().split('T')[0];
      rides = rides.filter(r => {
        const rideDateStr = new Date(r.departureTime).toISOString().split('T')[0];
        return rideDateStr === filterDateStr;
      });
    }

    // Sort by soonest departure time
    rides.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

    return rides;
  } catch (error) {
    console.error('Error querying rides from Firestore:', error);
    return [];
  }
}

export async function getAllRides(): Promise<Ride[]> {
  try {
    const ridesRef = collection(db, RIDES_COLLECTION);
    const snap = await getDocs(ridesRef);
    const rides: Ride[] = [];
    snap.forEach((d) => rides.push(d.data() as Ride));
    return rides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting all rides:', error);
    return [];
  }
}

export async function getMyRides(userId: string): Promise<{ asDriver: Ride[]; asPassenger: Ride[] }> {
  try {
    const all = await getAllRides();
    const asDriver = all.filter(r => r.creatorId === userId);
    const asPassenger = all.filter(r => 
      r.passengerIds.includes(userId) || 
      r.passengers.some(p => p.uid === userId)
    );
    return { asDriver, asPassenger };
  } catch (error) {
    console.error('Error fetching my rides:', error);
    return { asDriver: [], asPassenger: [] };
  }
}

export async function requestRide(
  rideId: string, 
  passenger: UserProfile, 
  seats: number, 
  pickupNote?: string
): Promise<Ride | null> {
  const ride = await getRideById(rideId);
  if (!ride) throw new Error('Ride not found');
  if (ride.availableSeats < seats) throw new Error('Not enough seats available');
  if (ride.creatorId === passenger.uid) throw new Error('You cannot join your own ride');

  const existingBooking = ride.passengers.find(p => p.uid === passenger.uid);
  if (existingBooking && existingBooking.status !== 'cancelled' && existingBooking.status !== 'rejected') {
    throw new Error('You already have an active request for this ride');
  }

  const newBooking: PassengerBooking = cleanForFirestore({
    uid: passenger.uid,
    name: passenger.displayName || 'RouteMate Passenger',
    email: passenger.email || '',
    photoURL: passenger.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${passenger.uid}`,
    seatsBooked: seats,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    pickupNote: pickupNote || '',
    fareAmount: Math.round(seats * ride.pricePerSeat * 100) / 100
  });

  const updatedPassengers = [...ride.passengers.filter(p => p.uid !== passenger.uid), newBooking];
  const updatedPassengerIds = Array.from(new Set([...ride.passengerIds, passenger.uid]));

  try {
    await updateDoc(doc(db, RIDES_COLLECTION, rideId), cleanForFirestore({
      passengers: updatedPassengers,
      passengerIds: updatedPassengerIds,
      updatedAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${RIDES_COLLECTION}/${rideId}`);
  }

  // Notify driver
  await createNotification({
    userId: ride.creatorId,
    title: 'New Ride Request',
    message: `${passenger.displayName} requested ${seats} seat(s) on your route to ${ride.destination.city}.`,
    type: 'ride_request',
    rideId: ride.id
  });

  return await getRideById(rideId);
}

export async function updatePassengerRequestStatus(
  rideId: string, 
  passengerUid: string, 
  status: 'accepted' | 'rejected' | 'cancelled'
): Promise<Ride | null> {
  const ride = await getRideById(rideId);
  if (!ride) throw new Error('Ride not found');

  let seatsDiff = 0;
  const updatedPassengers = ride.passengers.map(p => {
    if (p.uid === passengerUid) {
      if (status === 'accepted' && p.status !== 'accepted') {
        seatsDiff -= p.seatsBooked;
      } else if (status !== 'accepted' && p.status === 'accepted') {
        seatsDiff += p.seatsBooked;
      }
      return { ...p, status };
    }
    return p;
  });

  const newAvailableSeats = Math.max(0, ride.availableSeats + seatsDiff);

  await updateDoc(doc(db, RIDES_COLLECTION, rideId), {
    passengers: updatedPassengers,
    availableSeats: newAvailableSeats,
    updatedAt: new Date().toISOString()
  });

  // Notify passenger
  const passenger = ride.passengers.find(p => p.uid === passengerUid);
  if (passenger) {
    const title = status === 'accepted' ? 'Ride Request Accepted! 🎉' : status === 'rejected' ? 'Ride Request Declined' : 'Ride Request Cancelled';
    const msg = status === 'accepted' 
      ? `Your request for ${ride.destination.city} was accepted by ${ride.creatorName}.`
      : `Your request for ${ride.destination.city} was ${status}.`;
      
    await createNotification({
      userId: passengerUid,
      title,
      message: msg,
      type: status === 'accepted' ? 'ride_accepted' : 'ride_rejected',
      rideId
    });

    if (status === 'accepted') {
      try {
        const userRef = doc(db, 'users', passengerUid);
        const uSnap = await getDoc(userRef);
        if (uSnap.exists()) {
          const uData = uSnap.data() as UserProfile;
          await updateDoc(userRef, {
            totalRidesJoined: (uData.totalRidesJoined || 0) + 1
          });
        }
      } catch (e) {
        console.warn('Could not update passenger ride count:', e);
      }
    }
  }

  return await getRideById(rideId);
}

export async function updateRideStatus(rideId: string, status: Ride['status']): Promise<Ride | null> {
  const ride = await getRideById(rideId);
  if (!ride) throw new Error('Ride not found');

  await updateDoc(doc(db, RIDES_COLLECTION, rideId), {
    status,
    updatedAt: new Date().toISOString()
  });

  // Notify all accepted passengers
  const acceptedPassengers = ride.passengers.filter(p => p.status === 'accepted');
  for (const p of acceptedPassengers) {
    let title = 'Ride Update';
    let message = `Your ride with ${ride.creatorName} is now ${status.replace('_', ' ')}.`;
    let type: any = 'system';

    if (status === 'in_progress') {
      title = 'Ride Started! 🚗';
      message = `${ride.creatorName} has started the journey to ${ride.destination.city}.`;
      type = 'ride_started';
    } else if (status === 'completed') {
      title = 'Ride Completed! 🏁';
      message = `You have arrived at ${ride.destination.city}. Thank you for riding with RouteMate.`;
      type = 'ride_completed';
    } else if (status === 'cancelled') {
      title = 'Ride Cancelled ⚠️';
      message = `${ride.creatorName} had to cancel this trip.`;
      type = 'ride_cancelled';
    }

    await createNotification({
      userId: p.uid,
      title,
      message,
      type,
      rideId
    });
  }

  return await getRideById(rideId);
}
