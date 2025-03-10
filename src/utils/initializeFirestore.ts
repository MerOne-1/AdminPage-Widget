import { collection, getDocs, addDoc, query, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const sampleCategories = [
  {
    name: 'Hair Care',
    description: 'All hair related services',
    active: true,
    order: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'Skin Care',
    description: 'Facial and skin treatments',
    active: true,
    order: 1,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
];

const sampleServices = [
  {
    name: 'Haircut',
    description: 'Basic haircut service',
    duration: 30,
    price: 30,
    categoryId: '', // Will be set after category creation
    active: true,
    order: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'Basic Facial',
    description: 'Cleansing and moisturizing facial',
    duration: 45,
    price: 50,
    categoryId: '', // Will be set after category creation
    active: true,
    order: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
];

const sampleEmployees = [
  {
    name: 'John Smith',
    role: 'Hairstylist',
    active: true,
    services: [], // Will be filled after services are created
    schedule: {
      '0': { start: '09:00', end: '17:00' }, // Sunday
      '1': { start: '09:00', end: '17:00' }, // Monday
      '2': { start: '09:00', end: '17:00' }, // Tuesday
      '3': { start: '09:00', end: '17:00' }, // Wednesday
      '4': { start: '09:00', end: '17:00' }, // Thursday
      '5': { start: '09:00', end: '17:00' }, // Friday
      '6': { start: '10:00', end: '15:00' }, // Saturday
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    name: 'Sarah Johnson',
    role: 'Esthetician',
    active: true,
    services: [], // Will be filled after services are created
    schedule: {
      '0': { start: '09:00', end: '17:00' }, // Sunday
      '1': { start: '10:00', end: '18:00' }, // Monday
      '2': { start: '10:00', end: '18:00' }, // Tuesday
      '3': { start: '10:00', end: '18:00' }, // Wednesday
      '4': { start: '10:00', end: '18:00' }, // Thursday
      '5': { start: '10:00', end: '18:00' }, // Friday
      '6': { start: '10:00', end: '15:00' }, // Saturday
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
];

export async function initializeCollections() {
  try {
    const collections = ['serviceCategories', 'services', 'employees', 'bookings', 'clients'];
    const existingCollections = new Set();

    console.log('Starting collection initialization...');
    // Check which collections exist
    for (const collectionName of collections) {
      console.log(`Checking collection: ${collectionName}`);
      try {
        const snapshot = await getDocs(query(collection(db, collectionName), limit(1)));
        console.log(`Successfully queried ${collectionName}`);
        if (!snapshot.empty) {
          existingCollections.add(collectionName);
        }
      } catch (error) {
        console.error(`Error checking collection ${collectionName}:`, error);
        throw error;
      }
    }

    console.log('Existing collections:', Array.from(existingCollections));
    console.log('Missing collections:', collections.filter(c => !existingCollections.has(c)));

    // Create categories if they don't exist
    if (!existingCollections.has('serviceCategories')) {
      console.log('Creating categories...');
      const categoryRefs = await Promise.all(
        sampleCategories.map(category => addDoc(collection(db, 'serviceCategories'), category))
      );

      // Create services if they don't exist
      if (!existingCollections.has('services')) {
        console.log('Creating services...');
        const updatedServices = [
          { ...sampleServices[0], categoryId: categoryRefs[0].id },
          { ...sampleServices[1], categoryId: categoryRefs[1].id }
        ];
        
        const serviceRefs = await Promise.all(
          updatedServices.map(service => addDoc(collection(db, 'services'), service))
        );

        // Create employees if they don't exist
        if (!existingCollections.has('employees')) {
          console.log('Creating employees...');
          const updatedEmployees = [
            { ...sampleEmployees[0], serviceIds: [serviceRefs[0].id] }, // John does haircuts
            { ...sampleEmployees[1], serviceIds: [serviceRefs[1].id] }  // Sarah does facials
          ];

          await Promise.all(
            updatedEmployees.map(employee => addDoc(collection(db, 'employees'), employee))
          );
        }
      }
    }

    // Create empty collections for bookings and clients if they don't exist
    if (!existingCollections.has('bookings')) {
      console.log('Creating bookings collection...');
      await getDocs(collection(db, 'bookings'));
    }

    if (!existingCollections.has('clients')) {
      console.log('Creating clients collection...');
      await getDocs(collection(db, 'clients'));
    }

    console.log('Initialization complete!');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
}
