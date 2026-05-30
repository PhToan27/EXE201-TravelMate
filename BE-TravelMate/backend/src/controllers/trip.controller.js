const Trip = require('../models/Trip');
const aiService = require('../services/ai.service');
const budgetService = require('../services/budget.service');

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

    let activities = [];
    let hotelRecommendation = undefined;
    let restaurantRecommendations = [];
    let budgetBreakdown = undefined;

    if (generateAiItinerary) {
      const generated = await aiService.generateItinerary(
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

      // Extract itinerary and recommendations
      const dayPlans = Array.isArray(generated) ? generated : (generated.itinerary || []);
      
      if (generated && !Array.isArray(generated)) {
        hotelRecommendation = generated.hotelRecommendation;
        restaurantRecommendations = generated.restaurantRecommendations || [];
        budgetBreakdown = generated.budgetBreakdown;
      }

      dayPlans.forEach(dayPlan => {
        if (dayPlan.activities) {
          dayPlan.activities.forEach(act => {
            activities.push({
              day: dayPlan.day,
              time: act.time,
              location: act.location || act.activityName || 'N/A',
              description: act.description || '',
              cost: act.cost || act.estimatedCost || 0,
              category: (act.category || 'OTHER').toUpperCase(),
              transport: act.transport ? act.transport.toUpperCase() : undefined,
              durationMinutes: act.durationMinutes || 60,
            });
          });
        }
      });
    }

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
      activities,
      hotelRecommendation,
      restaurantRecommendations,
      budgetBreakdown,
    });

    // Calculate budget statistics and save them
    const stats = budgetService.calculateBudgetStats(trip);
    trip.totalEstimatedCost = stats.totalExpenses;
    trip.remainingBudget = stats.remainingBudget;

    await trip.save();

    return res.status(201).json({ 
      success: true, 
      data: {
        ...trip.toObject(),
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
    
    // Add budget statistics to each trip
    const tripsWithStats = trips.map(trip => {
      const budgetStats = budgetService.calculateBudgetStats(trip);
      return {
        ...trip.toObject(),
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

    const budgetStats = budgetService.calculateBudgetStats(trip);

    return res.json({
      success: true,
      data: {
        ...trip.toObject(),
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
      'activities',
      'hotelRecommendation',
      'restaurantRecommendations',
      'isPublic'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        trip[update] = req.body[update];
      }
    });

    // Recalculate stats
    const stats = budgetService.calculateBudgetStats(trip);
    trip.totalEstimatedCost = stats.totalExpenses;
    trip.remainingBudget = stats.remainingBudget;

    await trip.save();

    return res.json({
      success: true,
      data: {
        ...trip.toObject(),
        budgetStats: stats,
      }
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

    if (!trip.shareCode) {
      // Generate a unique share code
      trip.shareCode = Math.random().toString(36).substring(2, 9).toUpperCase();
    }
    
    trip.isPublic = true;
    await trip.save();

    return res.json({
      success: true,
      data: {
        shareCode: trip.shareCode,
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
    
    const trip = await Trip.findOne({ shareCode: shareCode.toUpperCase(), isPublic: true });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Shared trip not found or is no longer public' });
    }

    const budgetStats = budgetService.calculateBudgetStats(trip);

    return res.json({
      success: true,
      data: {
        ...trip.toObject(),
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
  deleteTrip,
  shareTrip,
  getSharedTrip,
};
