const connectDB = require('./src/config/db');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const placeService = require('./src/services/place.service');

async function run() {
  try {
    await connectDB();
    console.log('--- Connected to Database ---');

    console.log('\n1. Testing "Ngũ Hành Sơn" (Popular Static Dict + Seed Caching):');
    const place1 = await placeService.getPlaceDetails('Ngũ Hành Sơn');
    console.log('Result:', {
      name: place1.name,
      category: place1.category,
      rating: place1.rating,
      address: place1.address,
      coordinates: place1.coordinates,
      imageUrl: place1.imageUrl
    });

    console.log('\n2. Testing "Chùa Linh Ứng" (Popular Static Dict + Seed Caching):');
    const place2 = await placeService.getPlaceDetails('Chùa Linh Ứng');
    console.log('Result:', {
      name: place2.name,
      category: place2.category,
      rating: place2.rating,
      address: place2.address,
      coordinates: place2.coordinates
    });

    console.log('\n3. Testing MongoDB Database Retrieval (should load from cache):');
    const place1Cache = await placeService.getPlaceDetails('Ngũ Hành Sơn');
    console.log('Cache Hit Success:', place1Cache._id.toString() === place1._id.toString());

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n--- Database Connection Closed ---');
    process.exit(0);
  }
}

run();
