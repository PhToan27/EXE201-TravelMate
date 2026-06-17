const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const ItineraryDay = require('../models/ItineraryDay');
const Activity = require('../models/Activity');
const HotelSuggestion = require('../models/HotelSuggestion');
const RestaurantSuggestion = require('../models/RestaurantSuggestion');
const BudgetBreakdown = require('../models/BudgetBreakdown');
const ShareTrip = require('../models/ShareTrip');
const MapRoute = require('../models/MapRoute');
const AiLog = require('../models/AiLog');

const aiService = require('../services/ai.service');
const budgetService = require('../services/budget.service');

const normalizePackingList = (packingList = {}) => ({
  selectedModes: Array.isArray(packingList.selectedModes) ? packingList.selectedModes : [],
  checkedItems:
    packingList.checkedItems instanceof Map
      ? Object.fromEntries(packingList.checkedItems)
      : packingList.checkedItems || {},
  customItems: Array.isArray(packingList.customItems) ? packingList.customItems : [],
  updatedAt: packingList.updatedAt,
});

const sanitizePackingList = (packingList = {}) => ({
  selectedModes: Array.isArray(packingList.selectedModes)
    ? packingList.selectedModes.filter(Boolean).map(String)
    : [],
  checkedItems:
    packingList.checkedItems && typeof packingList.checkedItems === 'object'
      ? Object.fromEntries(
          Object.entries(packingList.checkedItems).map(([key, value]) => [key, Boolean(value)])
        )
      : {},
  customItems: Array.isArray(packingList.customItems)
    ? packingList.customItems
        .filter(item => item && item.name)
        .map(item => ({
          id: String(item.id || new mongoose.Types.ObjectId()),
          name: String(item.name).trim(),
        }))
    : [],
  updatedAt: new Date(),
});

const normalizeObjectId = (value) =>
  value && mongoose.Types.ObjectId.isValid(value) ? value : undefined;

/**
 * @desc    Create a new trip
 * @route   POST /api/trips
 * @access  Private
 */
const createTrip = async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      budget,
      generateAiItinerary,
      people,
      travelStyle,
      interests,
      hotelArea,
    } = req.body;

    if (!destination || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Please add all required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

    // Parse interests to array if it is a comma-separated string
    const parsedInterests = Array.isArray(interests) 
      ? interests 
      : (interests ? interests.split(',').map(i => i.trim()).filter(Boolean) : []);

    const trip = new Trip({
      userId: req.user._id,
      destination,
      startDate,
      endDate,
      totalDays: durationDays,
      totalPeople: people || 1,
      budget: budget || 0,
      travelStyle: travelStyle || 'CHILL',
      interests: parsedInterests,
    });
    await trip.save();

    let hotelDoc = null;
    const restaurantDocs = [];
    let budgetDoc = null;
    const dayDocs = [];
    const activityDocs = [];

    if (generateAiItinerary) {
      let generated;
      try {
        generated = await aiService.generateItinerary(
          destination,
          durationDays,
          budget || 0,
          req.user.preferences || [],
          {
            startDate,
            people: people || 1,
            travelStyle: travelStyle || 'CHILL',
            interests: interests || '',
            hotelArea: hotelArea || '',
          }
        );
      } catch (aiErr) {
        console.error('Itinerary generation from places failed, logging error:', aiErr);
        await AiLog.create({
          userId: req.user._id,
          tripId: trip._id,
          input: {
            destination,
            startDate: start,
            totalDays: durationDays,
            totalPeople: people || 1,
            budget: budget || 0,
            travelStyle: travelStyle || 'CHILL',
            interests: parsedInterests,
          },
          status: 'FAILED',
          errorMessage: aiErr.message,
        });
        throw aiErr;
      }

      // Log success
      await AiLog.create({
        userId: req.user._id,
        tripId: trip._id,
        input: {
          destination,
          startDate: start,
          totalDays: durationDays,
          totalPeople: people || 1,
          budget: budget || 0,
          travelStyle: travelStyle || 'CHILL',
          interests: parsedInterests,
        },
        prompt: 'Generated from places collection',
        response: generated,
        status: 'SUCCESS',
      });

      // 1. Hotel recommendation
      if (generated && generated.hotelRecommendation) {
        hotelDoc = await HotelSuggestion.create({
          tripId: trip._id,
          name: generated.hotelRecommendation.name,
          address: generated.hotelRecommendation.address,
          area: generated.hotelRecommendation.area,
          pricePerNight: generated.hotelRecommendation.estimatedCostPerNight || 0,
          estimatedTotalPrice: (generated.hotelRecommendation.estimatedCostPerNight || 0) * durationDays,
          rating: generated.hotelRecommendation.rating || 0,
          note: generated.hotelRecommendation.description || '',
        });
      }

      // 2. Restaurant recommendations
      if (generated && generated.restaurantRecommendations && Array.isArray(generated.restaurantRecommendations)) {
        for (const rest of generated.restaurantRecommendations) {
          const rDoc = await RestaurantSuggestion.create({
            tripId: trip._id,
            name: rest.name,
            address: rest.address,
            cuisineType: rest.cuisineType,
            averagePricePerPerson: rest.averagePricePerPerson || 0,
            rating: rest.rating || 0,
            note: rest.description || '',
          });
          restaurantDocs.push(rDoc);
        }
      }

      // 3. Budget breakdown
      if (generated && generated.budgetBreakdown) {
        const totalBudget = budget || 1;
        budgetDoc = await BudgetBreakdown.create({
          tripId: trip._id,
          accommodation: {
            amount: generated.budgetBreakdown.accommodation || 0,
            percent: Math.round(((generated.budgetBreakdown.accommodation || 0) / totalBudget) * 100),
          },
          food: {
            amount: generated.budgetBreakdown.foodAndBeverage || 0,
            percent: Math.round(((generated.budgetBreakdown.foodAndBeverage || 0) / totalBudget) * 100),
          },
          transport: {
            amount: generated.budgetBreakdown.transportation || 0,
            percent: Math.round(((generated.budgetBreakdown.transportation || 0) / totalBudget) * 100),
          },
          activities: {
            amount: generated.budgetBreakdown.activitiesAndEntranceFees || 0,
            percent: Math.round(((generated.budgetBreakdown.activitiesAndEntranceFees || 0) / totalBudget) * 100),
          },
          other: {
            amount: generated.budgetBreakdown.unforeseenExpenses || 0,
            percent: Math.round(((generated.budgetBreakdown.unforeseenExpenses || 0) / totalBudget) * 100),
          },
        });
      }

      // 4. Days and Activities
      const dayPlans = Array.isArray(generated) ? generated : (generated.itinerary || []);
      for (const dayPlan of dayPlans) {
        const dayCost = dayPlan.activities
          ? dayPlan.activities.reduce((sum, act) => sum + (act.cost || act.estimatedCost || 0), 0)
          : 0;

        const dayDoc = await ItineraryDay.create({
          tripId: trip._id,
          dayNumber: dayPlan.day,
          date: dayPlan.date ? new Date(dayPlan.date) : new Date(start.getTime() + (dayPlan.day - 1) * 24 * 60 * 60 * 1000),
          title: dayPlan.theme || `Ngày ${dayPlan.day}`,
          totalDayCost: dayCost,
        });
        dayDocs.push(dayDoc);

        if (dayPlan.activities && Array.isArray(dayPlan.activities)) {
          for (const act of dayPlan.activities) {
            const actDoc = await Activity.create({
              tripId: trip._id,
              itineraryDayId: dayDoc._id,
              time: act.time,
              endTime: act.endTime || '',
              title: act.activityName || act.location || 'Hoạt động',
              description: act.description || '',
              placeId: normalizeObjectId(act.placeId),
              category: (act.category || 'OTHER').toUpperCase(),
              locationName: act.location || 'N/A',
              address: act.address || '',
              location: act.coordinates
                ? {
                    lat: act.coordinates.lat,
                    lng: act.coordinates.lng,
                  }
                : undefined,
              durationMinutes: act.durationMinutes || 60,
              transport: act.transport ? act.transport.toUpperCase() : undefined,
              estimatedCost: act.cost || act.estimatedCost || 0,
            });
            activityDocs.push(actDoc);
          }
        }
      }
    } else {
      // If we do not generate AI itinerary, still create empty ItineraryDay documents for durationDays
      for (let dayNum = 1; dayNum <= durationDays; dayNum++) {
        const dayDoc = await ItineraryDay.create({
          tripId: trip._id,
          dayNumber: dayNum,
          date: new Date(start.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000),
          title: `Ngày ${dayNum}`,
          totalDayCost: 0,
        });
        dayDocs.push(dayDoc);
      }
    }

    // Calculate budget statistics and update trip totalEstimatedCost & remainingBudget
    const stats = budgetService.calculateBudgetStats(trip, activityDocs, hotelDoc || {});
    trip.totalEstimatedCost = stats.totalExpenses;
    trip.remainingBudget = stats.remainingBudget;
    await trip.save();

    // Format response to match the old schema (backwards compatibility)
    const formattedActivities = activityDocs.map(act => {
      const parentDay = dayDocs.find(d => d._id.toString() === act.itineraryDayId.toString());
      return {
        _id: act._id,
        placeId: act.placeId,
        day: parentDay ? parentDay.dayNumber : 1,
        time: act.time,
        endTime: act.endTime || '',
        location: act.locationName || act.title || '',
        address: act.address || '',
        coordinates: act.location,
        description: act.description || '',
        cost: act.estimatedCost || 0,
        category: act.category,
        transport: act.transport,
        durationMinutes: act.durationMinutes,
      };
    });

    const formattedHotelRec = hotelDoc ? {
      name: hotelDoc.name,
      address: hotelDoc.address,
      description: hotelDoc.note,
      estimatedCostPerNight: hotelDoc.pricePerNight,
      rating: hotelDoc.rating,
      area: hotelDoc.area,
    } : undefined;

    const formattedRestaurants = restaurantDocs.map(rest => ({
      name: rest.name,
      address: rest.address,
      cuisineType: rest.cuisineType,
      averagePricePerPerson: rest.averagePricePerPerson,
      rating: rest.rating,
      description: rest.note,
    }));

    const formattedBudgetBreakdown = budgetDoc ? {
      accommodation: budgetDoc.accommodation?.amount || 0,
      foodAndBeverage: budgetDoc.food?.amount || 0,
      activitiesAndEntranceFees: budgetDoc.activities?.amount || 0,
      transportation: budgetDoc.transport?.amount || 0,
      unforeseenExpenses: budgetDoc.other?.amount || 0,
    } : undefined;

    return res.status(201).json({ 
      success: true, 
      data: {
        ...trip.toObject(),
        packingList: normalizePackingList(trip.packingList),
        activities: formattedActivities,
        hotelRecommendation: formattedHotelRec,
        restaurantRecommendations: formattedRestaurants,
        budgetBreakdown: formattedBudgetBreakdown,
        budgetStats: stats,
      } 
    });
  } catch (error) {
    console.error('Create trip error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get user's trips
 * @route   GET /api/trips
 * @access  Private
 */
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const tripIds = trips.map(t => t._id);

    // Fetch related docs in bulk to avoid N+1 query problems
    const hotels = await HotelSuggestion.find({ tripId: { $in: tripIds } });
    const activities = await Activity.find({ tripId: { $in: tripIds } });

    const hotelMap = {};
    hotels.forEach(h => {
      hotelMap[h.tripId.toString()] = h;
    });

    const activitiesMap = {};
    activities.forEach(act => {
      const tid = act.tripId.toString();
      if (!activitiesMap[tid]) activitiesMap[tid] = [];
      activitiesMap[tid].push(act);
    });

    const tripsWithStats = trips.map(trip => {
      const tid = trip._id.toString();
      const tripActs = activitiesMap[tid] || [];
      const tripHotel = hotelMap[tid] || {};
      
      const budgetStats = budgetService.calculateBudgetStats(trip, tripActs, tripHotel);
      return {
        ...trip.toObject(),
        packingList: normalizePackingList(trip.packingList),
        budgetStats,
      };
    });

    return res.json({ success: true, data: tripsWithStats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get trip by ID
 * @route   GET /api/trips/:id
 * @access  Private
 */
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const hotelDoc = await HotelSuggestion.findOne({ tripId: trip._id });
    const hotelRecommendation = hotelDoc ? {
      name: hotelDoc.name,
      address: hotelDoc.address,
      description: hotelDoc.note,
      estimatedCostPerNight: hotelDoc.pricePerNight,
      rating: hotelDoc.rating,
      area: hotelDoc.area,
    } : undefined;

    const restaurantDocs = await RestaurantSuggestion.find({ tripId: trip._id });
    const restaurantRecommendations = restaurantDocs.map(rest => ({
      name: rest.name,
      address: rest.address,
      cuisineType: rest.cuisineType,
      averagePricePerPerson: rest.averagePricePerPerson,
      rating: rest.rating,
      description: rest.note,
    }));

    const budgetDoc = await BudgetBreakdown.findOne({ tripId: trip._id });
    const budgetBreakdown = budgetDoc ? {
      accommodation: budgetDoc.accommodation?.amount || 0,
      foodAndBeverage: budgetDoc.food?.amount || 0,
      activitiesAndEntranceFees: budgetDoc.activities?.amount || 0,
      transportation: budgetDoc.transport?.amount || 0,
      unforeseenExpenses: budgetDoc.other?.amount || 0,
    } : undefined;

    const days = await ItineraryDay.find({ tripId: trip._id }).sort({ dayNumber: 1 });
    const dayMap = {};
    days.forEach(d => {
      dayMap[d._id.toString()] = d.dayNumber;
    });

    const dbActivities = await Activity.find({ tripId: trip._id });
    const activities = dbActivities.map(act => ({
      _id: act._id,
      placeId: act.placeId,
      day: dayMap[act.itineraryDayId?.toString()] || 1,
      time: act.time,
      endTime: act.endTime || '',
      location: act.locationName || act.title || '',
      address: act.address || '',
      coordinates: act.location,
      description: act.description || '',
      cost: act.estimatedCost || 0,
      category: act.category,
      transport: act.transport,
      durationMinutes: act.durationMinutes,
    })).sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (a.time || '').localeCompare(b.time || '');
    });

    const shareDoc = await ShareTrip.findOne({ tripId: trip._id, isActive: true });
    const shareCode = shareDoc ? shareDoc.shareCode : undefined;

    const budgetStats = budgetService.calculateBudgetStats(trip, dbActivities, hotelDoc || {});

    return res.json({
      success: true,
      data: {
        ...trip.toObject(),
        packingList: normalizePackingList(trip.packingList),
        activities,
        hotelRecommendation,
        restaurantRecommendations,
        budgetBreakdown,
        shareCode,
        budgetStats,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update a trip (includes modifying activities, settings)
 * @route   PUT /api/trips/:id
 * @access  Private
 */
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Apply updates
    const allowedUpdates = [
      'title',
      'destination',
      'startDate',
      'endDate',
      'budget',
      'totalPeople',
      'travelStyle',
      'interests',
      'status',
      'isPublic',
      'packingList'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        trip[update] = update === 'packingList'
          ? sanitizePackingList(req.body[update])
          : req.body[update];
      }
    });

    // Update totalDays if start/end dates changed
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
    trip.totalDays = durationDays;

    await trip.save();

    // 1. Update Hotel Suggestion if passed
    if (req.body.hotelRecommendation !== undefined) {
      const hotelData = req.body.hotelRecommendation;
      if (hotelData) {
        await HotelSuggestion.findOneAndUpdate(
          { tripId: trip._id },
          {
            name: hotelData.name,
            address: hotelData.address,
            area: hotelData.area,
            pricePerNight: hotelData.estimatedCostPerNight || 0,
            estimatedTotalPrice: (hotelData.estimatedCostPerNight || 0) * durationDays,
            rating: hotelData.rating || 0,
            note: hotelData.description || '',
          },
          { upsert: true, new: true }
        );
      } else {
        await HotelSuggestion.deleteOne({ tripId: trip._id });
      }
    }

    // 2. Update Restaurants if passed
    if (req.body.restaurantRecommendations !== undefined && Array.isArray(req.body.restaurantRecommendations)) {
      await RestaurantSuggestion.deleteMany({ tripId: trip._id });
      for (const rest of req.body.restaurantRecommendations) {
        await RestaurantSuggestion.create({
          tripId: trip._id,
          name: rest.name,
          address: rest.address,
          cuisineType: rest.cuisineType,
          averagePricePerPerson: rest.averagePricePerPerson || 0,
          rating: rest.rating || 0,
          note: rest.description || '',
        });
      }
    }

    // 3. Update Activities if passed
    if (req.body.activities !== undefined && Array.isArray(req.body.activities)) {
      // Ensure we have ItineraryDay documents for days 1 to durationDays
      const existingDays = await ItineraryDay.find({ tripId: trip._id });
      const dayDocsMap = {};
      
      for (let dayNum = 1; dayNum <= durationDays; dayNum++) {
        let dayDoc = existingDays.find(d => d.dayNumber === dayNum);
        if (!dayDoc) {
          dayDoc = await ItineraryDay.create({
            tripId: trip._id,
            dayNumber: dayNum,
            date: new Date(start.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000),
            title: `Ngày ${dayNum}`,
            totalDayCost: 0,
          });
        }
        dayDocsMap[dayNum] = dayDoc;
      }

      // Delete any ItineraryDays beyond durationDays
      await ItineraryDay.deleteMany({ tripId: trip._id, dayNumber: { $gt: durationDays } });

      const updatedActivityIds = [];
      for (const act of req.body.activities) {
        const dayNum = act.day || 1;
        const dayDoc = dayDocsMap[dayNum];
        if (!dayDoc) continue;

        let actDoc;
        if (act._id && mongoose.Types.ObjectId.isValid(act._id)) {
          actDoc = await Activity.findOneAndUpdate(
            { _id: act._id, tripId: trip._id },
            {
              itineraryDayId: dayDoc._id,
              time: act.time,
              endTime: act.endTime || '',
              title: act.location || act.title || 'Hoạt động',
              description: act.description || '',
              placeId: normalizeObjectId(act.placeId),
              category: (act.category || 'OTHER').toUpperCase(),
              address: act.address || '',
              location: act.coordinates || act.location,
              locationName: act.location || 'N/A',
              durationMinutes: act.durationMinutes || 60,
              transport: act.transport ? act.transport.toUpperCase() : undefined,
              estimatedCost: act.cost || act.estimatedCost || 0,
            },
            { new: true }
          );
        }

        if (!actDoc) {
          actDoc = await Activity.create({
            tripId: trip._id,
            itineraryDayId: dayDoc._id,
            time: act.time,
            endTime: act.endTime || '',
            title: act.location || act.title || 'Hoạt động',
            description: act.description || '',
            placeId: normalizeObjectId(act.placeId),
            category: (act.category || 'OTHER').toUpperCase(),
            address: act.address || '',
            location: act.coordinates || act.location,
            locationName: act.location || 'N/A',
            durationMinutes: act.durationMinutes || 60,
            transport: act.transport ? act.transport.toUpperCase() : undefined,
            estimatedCost: act.cost || act.estimatedCost || 0,
          });
        }
        updatedActivityIds.push(actDoc._id.toString());
      }

      // Delete any activities that were NOT included in the update list
      await Activity.deleteMany({ tripId: trip._id, _id: { $nin: updatedActivityIds } });

      // Update ItineraryDays total costs
      const newDays = await ItineraryDay.find({ tripId: trip._id });
      const newActivities = await Activity.find({ tripId: trip._id });
      for (const day of newDays) {
        const dayCost = newActivities
          .filter(a => a.itineraryDayId.toString() === day._id.toString())
          .reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
        day.totalDayCost = dayCost;
        await day.save();
      }
    }

    // Fetch updated data for recalculated stats
    const finalActivities = await Activity.find({ tripId: trip._id });
    const finalHotel = await HotelSuggestion.findOne({ tripId: trip._id }) || {};
    const finalRestaurants = await RestaurantSuggestion.find({ tripId: trip._id });
    const finalBudgetBreakdown = await BudgetBreakdown.findOne({ tripId: trip._id });

    // Recalculate stats
    const stats = budgetService.calculateBudgetStats(trip, finalActivities, finalHotel);
    trip.totalEstimatedCost = stats.totalExpenses;
    trip.remainingBudget = stats.remainingBudget;
    await trip.save();

    // Populate and format response for backwards compatibility
    const days = await ItineraryDay.find({ tripId: trip._id }).sort({ dayNumber: 1 });
    const dayMap = {};
    days.forEach(d => {
      dayMap[d._id.toString()] = d.dayNumber;
    });

    const formattedActivities = finalActivities.map(act => ({
      _id: act._id,
      placeId: act.placeId,
      day: dayMap[act.itineraryDayId?.toString()] || 1,
      time: act.time,
      endTime: act.endTime || '',
      location: act.locationName || act.title || '',
      address: act.address || '',
      coordinates: act.location,
      description: act.description || '',
      cost: act.estimatedCost || 0,
      category: act.category,
      transport: act.transport,
      durationMinutes: act.durationMinutes,
    })).sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (a.time || '').localeCompare(b.time || '');
    });

    const formattedHotelRec = finalHotel._id ? {
      name: finalHotel.name,
      address: finalHotel.address,
      description: finalHotel.note,
      estimatedCostPerNight: finalHotel.pricePerNight,
      rating: finalHotel.rating,
      area: finalHotel.area,
    } : undefined;

    const formattedRestaurants = finalRestaurants.map(rest => ({
      name: rest.name,
      address: rest.address,
      cuisineType: rest.cuisineType,
      averagePricePerPerson: rest.averagePricePerPerson,
      rating: rest.rating,
      description: rest.note,
    }));

    const formattedBudgetBreakdown = finalBudgetBreakdown ? {
      accommodation: finalBudgetBreakdown.accommodation?.amount || 0,
      foodAndBeverage: finalBudgetBreakdown.food?.amount || 0,
      activitiesAndEntranceFees: finalBudgetBreakdown.activities?.amount || 0,
      transportation: finalBudgetBreakdown.transport?.amount || 0,
      unforeseenExpenses: finalBudgetBreakdown.other?.amount || 0,
    } : undefined;

    const shareDoc = await ShareTrip.findOne({ tripId: trip._id, isActive: true });

    return res.json({
      success: true,
      data: {
        ...trip.toObject(),
        packingList: normalizePackingList(trip.packingList),
        activities: formattedActivities,
        hotelRecommendation: formattedHotelRec,
        restaurantRecommendations: formattedRestaurants,
        budgetBreakdown: formattedBudgetBreakdown,
        shareCode: shareDoc ? shareDoc.shareCode : undefined,
        budgetStats: stats,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get packing list for a trip
 * @route   GET /api/trips/:id/packing-list
 * @access  Private
 */
const getPackingList = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    return res.json({
      success: true,
      data: normalizePackingList(trip.packingList),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Save packing list for a trip
 * @route   PUT /api/trips/:id/packing-list
 * @access  Private
 */
const updatePackingList = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    trip.packingList = sanitizePackingList(req.body || {});
    await trip.save();

    return res.json({
      success: true,
      data: normalizePackingList(trip.packingList),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete a trip
 * @route   DELETE /api/trips/:id
 * @access  Private
 */
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Cascading deletes
    await Activity.deleteMany({ tripId: trip._id });
    await ItineraryDay.deleteMany({ tripId: trip._id });
    await HotelSuggestion.deleteMany({ tripId: trip._id });
    await RestaurantSuggestion.deleteMany({ tripId: trip._id });
    await BudgetBreakdown.deleteMany({ tripId: trip._id });
    await ShareTrip.deleteMany({ tripId: trip._id });
    await MapRoute.deleteMany({ tripId: trip._id });
    await AiLog.deleteMany({ tripId: trip._id });

    await trip.deleteOne();

    return res.json({ success: true, message: 'Trip removed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Share a trip (generate share code & make public)
 * @route   POST /api/trips/:id/share
 * @access  Private
 */
const shareTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    let shareDoc = await ShareTrip.findOne({ tripId: trip._id });
    if (!shareDoc) {
      const code = Math.random().toString(36).substring(2, 9).toUpperCase();
      shareDoc = await ShareTrip.create({
        tripId: trip._id,
        userId: req.user._id,
        shareCode: code,
        shareUrl: `/shared/${code}`,
        isActive: true,
      });
    } else {
      shareDoc.isActive = true;
      await shareDoc.save();
    }
    
    trip.isPublic = true;
    await trip.save();

    return res.json({
      success: true,
      data: {
        shareCode: shareDoc.shareCode,
        isPublic: trip.isPublic,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get shared trip by share code (Public)
 * @route   GET /api/trips/shared/:shareCode
 * @access  Public
 */
const getSharedTrip = async (req, res) => {
  try {
    const { shareCode } = req.params;
    
    const shareDoc = await ShareTrip.findOne({ shareCode: shareCode.toUpperCase(), isActive: true });

    if (!shareDoc) {
      return res.status(404).json({ success: false, message: 'Shared trip not found or is no longer public' });
    }

    const trip = await Trip.findById(shareDoc.tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Shared trip has no associated Trip document' });
    }

    const hotelDoc = await HotelSuggestion.findOne({ tripId: trip._id });
    const hotelRecommendation = hotelDoc ? {
      name: hotelDoc.name,
      address: hotelDoc.address,
      description: hotelDoc.note,
      estimatedCostPerNight: hotelDoc.pricePerNight,
      rating: hotelDoc.rating,
      area: hotelDoc.area,
    } : undefined;

    const restaurantDocs = await RestaurantSuggestion.find({ tripId: trip._id });
    const restaurantRecommendations = restaurantDocs.map(rest => ({
      name: rest.name,
      address: rest.address,
      cuisineType: rest.cuisineType,
      averagePricePerPerson: rest.averagePricePerPerson,
      rating: rest.rating,
      description: rest.note,
    }));

    const budgetDoc = await BudgetBreakdown.findOne({ tripId: trip._id });
    const budgetBreakdown = budgetDoc ? {
      accommodation: budgetDoc.accommodation?.amount || 0,
      foodAndBeverage: budgetDoc.food?.amount || 0,
      activitiesAndEntranceFees: budgetDoc.activities?.amount || 0,
      transportation: budgetDoc.transport?.amount || 0,
      unforeseenExpenses: budgetDoc.other?.amount || 0,
    } : undefined;

    const days = await ItineraryDay.find({ tripId: trip._id }).sort({ dayNumber: 1 });
    const dayMap = {};
    days.forEach(d => {
      dayMap[d._id.toString()] = d.dayNumber;
    });

    const dbActivities = await Activity.find({ tripId: trip._id });
    const activities = dbActivities.map(act => ({
      _id: act._id,
      placeId: act.placeId,
      day: dayMap[act.itineraryDayId?.toString()] || 1,
      time: act.time,
      endTime: act.endTime || '',
      location: act.locationName || act.title || '',
      address: act.address || '',
      coordinates: act.location,
      description: act.description || '',
      cost: act.estimatedCost || 0,
      category: act.category,
      transport: act.transport,
      durationMinutes: act.durationMinutes,
    })).sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (a.time || '').localeCompare(b.time || '');
    });

    const budgetStats = budgetService.calculateBudgetStats(trip, dbActivities, hotelDoc || {});

    // Increment view count asynchronously
    shareDoc.viewCount = (shareDoc.viewCount || 0) + 1;
    shareDoc.save().catch(err => console.error('Failed to increment viewCount:', err));

    return res.json({
      success: true,
      data: {
        ...trip.toObject(),
        packingList: normalizePackingList(trip.packingList),
        activities,
        hotelRecommendation,
        restaurantRecommendations,
        budgetBreakdown,
        shareCode: shareDoc.shareCode,
        budgetStats,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  getPackingList,
  updatePackingList,
  deleteTrip,
  shareTrip,
  getSharedTrip,
};
