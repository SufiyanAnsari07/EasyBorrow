const Item = require('../models/Item');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');

/**
 * Retrieves items with advanced search, filtering, and pagination
 * @async
 * @function getItems
 * @param {Object} req - Express request object with query parameters for filtering
 * @param {Object} res - Express response object
 * @description Fetches items with comprehensive search and filter capabilities
 * Special features:
 * - Full-text search using MongoDB text indexes on title and description
 * - Category filtering with 'all' option
 * - Price range filtering (min/max daily price)
 * - Location-based filtering with case-insensitive city search
 * - Flexible sorting by any field with ascending/descending order
 * - Pagination with configurable page size and current page tracking
 * - Only returns active items (isActive: true)
 * - Populates owner information for display
 * - Calculates pagination metadata (current page, total pages, total count)
 * - Optimized query execution with proper indexing support
 */
const getItems = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      city,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    let query = { isActive: true, 'availability.isAvailable': true };

    // Text search
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.dailyPrice = {};
      if (minPrice) query.dailyPrice.$gte = Number(minPrice);
      if (maxPrice) query.dailyPrice.$lte = Number(maxPrice);
    }

    const requestedCity = city || location;
    const userCity = req.user?.address?.city?.trim();
    const userState = req.user?.address?.state?.trim();

    // Authenticated users only see items from their own region by default.
    if (userCity) {
      query['location.city'] = exactRegionRegExp(userCity);
      if (userState) {
        query['location.state'] = exactRegionRegExp(userState);
      }
    } else if (requestedCity) {
      query['location.city'] = new RegExp(requestedCity, 'i');
    }

    // Get items that are currently rented (have active bookings)
    const currentDate = new Date();
    const rentedItemIds = await Booking.distinct('item', {
      status: { $in: ['approved', 'active'] },
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    });

    // Exclude rented items from the query
    if (rentedItemIds.length > 0) {
      query._id = { $nin: rentedItemIds };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const items = await Item.find(query)
      .populate('owner', 'name rating profileImage')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching items'
    });
  }
};

/**
 * Retrieves a single item by ID with view tracking
 * @async
 * @function getItemById
 * @param {Object} req - Express request object with item ID parameter
 * @param {Object} res - Express response object
 * @description Fetches detailed item information and tracks view count
 * Special features:
 * - Populates complete owner information including contact details
 * - Automatically increments view count for analytics
 * - Returns comprehensive item details for display
 * - Handles item not found scenarios
 * - Tracks item popularity through view statistics
 * - Provides owner contact information for booking inquiries
 */
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'name email phone rating profileImage address');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Increment view count
    item.stats.views += 1;
    await item.save();

    res.json({
      success: true,
      data: { item }
    });

  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching item'
    });
  }
};

/**
 * Creates a new rental item with image uploads and validation
 * @async
 * @function createItem
 * @param {Object} req - Express request object with item data and uploaded images
 * @param {Object} res - Express response object
 * @description Creates a new rental item with comprehensive validation and file handling
 * Special features:
 * - Validates input using express-validator
 * - Requires at least one image upload for item listing
 * - Parses JSON fields (location, availability) if provided as strings
 * - Handles multiple image uploads (up to 5 images)
 * - Automatically sets owner to authenticated user
 * - Updates user statistics (itemsListed counter)
 * - Converts string numbers to proper numeric types
 * - Provides fallback for availability if parsing fails
 * - Returns populated item data with owner information
 * - Handles file upload errors and JSON parsing gracefully
 */
const createItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      dailyPrice,
      itemValue,
      depositPercentage,
      location,
      condition,
      availability
    } = req.body;

    // Check if images were uploadedzz
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    // Parse JSON fields if they're strings
    let parsedLocation = location;
    let parsedAvailability = availability;

    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location format'
        });
      }
    }
    if (!parsedLocation && (req.body['location[street]'] || req.body['location[city]'] || req.body['location[state]'] || req.body['location[zipCode]'])) {
      parsedLocation = {
        street: req.body['location[street]'],
        city: req.body['location[city]'],
        state: req.body['location[state]'],
        zipCode: req.body['location[zipCode]']
      };
    }

    if (typeof availability === 'string') {
      try {
        parsedAvailability = JSON.parse(availability);
      } catch (error) {
        parsedAvailability = { isAvailable: true };
      }
    }

    parsedLocation = normalizeLocation(parsedLocation);

    // Create item
    const item = await Item.create({
      title,
      description,
      category,
      dailyPrice: Number(dailyPrice),
      itemValue: Number(itemValue),
      depositPercentage: Number(depositPercentage),
      images: req.files.map(file => file.path),
      owner: req.user.id,
      location: parsedLocation,
      condition,
      availability: parsedAvailability
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.itemsListed': 1 }
    });

    const populatedItem = await Item.findById(item._id)
      .populate('owner', 'name rating profileImage');

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: { item: populatedItem }
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating item'
    });
  }
};

/**
 * Updates an existing item with ownership validation
 * @async
 * @function updateItem
 * @param {Object} req - Express request object with item data and optional new images
 * @param {Object} res - Express response object
 * @description Updates item information with authorization and file handling
 * Special features:
 * - Validates item ownership before allowing updates
 * - Supports partial updates (only provided fields are updated)
 * - Handles optional image replacement with new uploads
 * - Parses JSON fields (location, availability) if provided as strings
 * - Uses findByIdAndUpdate with validation enabled
 * - Returns updated item with populated owner information
 * - Prevents unauthorized users from modifying items
 * - Maintains data integrity with proper validation
 */
const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user owns the item
    if (item.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this item'
      });
    }

    const updateData = { ...req.body };

    // Handle new images
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    // Parse JSON fields
    if (updateData.location && typeof updateData.location === 'string') {
      updateData.location = JSON.parse(updateData.location);
    }
    if (!updateData.location && (updateData['location[street]'] || updateData['location[city]'] || updateData['location[state]'] || updateData['location[zipCode]'])) {
      updateData.location = normalizeLocation({
        street: updateData['location[street]'],
        city: updateData['location[city]'],
        state: updateData['location[state]'],
        zipCode: updateData['location[zipCode]']
      });
      delete updateData['location[street]'];
      delete updateData['location[city]'];
      delete updateData['location[state]'];
      delete updateData['location[zipCode]'];
    } else if (updateData.location) {
      updateData.location = normalizeLocation(updateData.location);
    }
    if (updateData.availability && typeof updateData.availability === 'string') {
      updateData.availability = JSON.parse(updateData.availability);
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name rating profileImage');

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: { item: updatedItem }
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating item'
    });
  }
};

/**
 * Deletes an item with ownership validation and statistics update
 * @async
 * @function deleteItem
 * @param {Object} req - Express request object with item ID parameter
 * @param {Object} res - Express response object
 * @description Deletes an item after validating ownership and updating user statistics
 * Special features:
 * - Validates item ownership before allowing deletion
 * - Updates user statistics (decrements itemsListed counter)
 * - Completely removes item from database
 * - Prevents unauthorized users from deleting items
 * - Handles item not found scenarios
 * - Maintains data consistency by updating user stats
 */
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if user owns the item
    if (item.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item'
      });
    }

    await Item.findByIdAndDelete(req.params.id);

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.itemsListed': -1 }
    });

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting item'
    });
  }
};

/**
 * Retrieves all items owned by the authenticated user with rental status
 * @async
 * @function getUserItems
 * @param {Object} req - Express request object with authenticated user data
 * @param {Object} res - Express response object
 * @description Fetches all items belonging to the authenticated user with current rental status
 * Special features:
 * - Returns items sorted by creation date (newest first)
 * - Includes current rental status and booking information
 * - Shows active bookings with borrower details
 * - Provides rental period information for management
 * - No pagination (returns all user's items)
 * - Enhanced with booking status for owner management
 */
const getUserItems = async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user.id })
      .sort({ createdAt: -1 });

    // Get current active bookings for these items
    const currentDate = new Date();
    const activeBookings = await Booking.find({
      item: { $in: items.map(item => item._id) },
      status: { $in: ['approved', 'active'] },
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).populate('borrower', 'name email phone profileImage');

    // Create a map of item ID to active booking
    const bookingMap = {};
    activeBookings.forEach(booking => {
      bookingMap[booking.item.toString()] = booking;
    });

    // Add rental status to items
    const itemsWithStatus = items.map(item => {
      const activeBooking = bookingMap[item._id.toString()];
      return {
        ...item.toObject(),
        rentalStatus: activeBooking ? {
          isRented: true,
          currentBooking: activeBooking,
          rentedUntil: activeBooking.endDate
        } : {
          isRented: false,
          currentBooking: null,
          rentedUntil: null
        }
      };
    });

    res.json({
      success: true,
      data: { items: itemsWithStatus }
    });

  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user items'
    });
  }
};

/**
 * Extends rental period for an active booking
 * @async
 * @function extendRentalPeriod
 * @param {Object} req - Express request object with booking ID and new end date
 * @param {Object} res - Express response object
 * @description Extends the rental period for an active booking
 * Special features:
 * - Validates that the user owns the item
 * - Checks that the booking is currently active
 * - Updates the booking end date
 * - Recalculates pricing for the extended period
 * - Handles additional payment if required
 * - Updates timeline with extension details
 */
const extendRentalPeriod = async (req, res) => {
  try {
    const { bookingId, newEndDate } = req.body;

    // Find the booking and populate item details
    const booking = await Booking.findById(bookingId)
      .populate('item')
      .populate('borrower');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the item
    if (booking.item.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to extend this rental'
      });
    }

    // Check if booking is active
    if (!['approved', 'active'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only extend active bookings'
      });
    }

    // Validate new end date
    const newEnd = new Date(newEndDate);
    if (newEnd <= booking.startDate) {
      return res.status(400).json({
        success: false,
        message: 'New end date must be after start date'
      });
    }

    if (newEnd <= booking.endDate) {
      return res.status(400).json({
        success: false,
        message: 'New end date must be after current end date'
      });
    }

    // Calculate additional days and cost
    const additionalDays = Math.ceil((newEnd - booking.endDate) / (1000 * 60 * 60 * 24));
    const additionalCost = additionalDays * booking.pricing.dailyPrice;

    // Check if borrower has sufficient balance for extension
    if (booking.borrower.wallet.balance < additionalCost) {
      return res.status(400).json({
        success: false,
        message: 'Borrower has insufficient balance for extension'
      });
    }

    // Update booking
    booking.endDate = newEnd;
    booking.pricing.totalDays += additionalDays;
    booking.pricing.subtotal += additionalCost;
    booking.pricing.totalAmount += additionalCost;
    booking.pricing.lenderEarnings += additionalCost;

    // Deduct additional cost from borrower
    await User.findByIdAndUpdate(booking.borrower._id, {
      $inc: { 'wallet.balance': -additionalCost },
      $push: {
        'wallet.transactions': {
          type: 'debit',
          amount: additionalCost,
          description: `Extension payment for ${booking.item.title}`,
          bookingId: booking._id
        }
      }
    });

    booking.addTimelineEntry('extended', `Rental extended by ${additionalDays} days until ${newEnd.toDateString()}`);
    await booking.save();

    res.json({
      success: true,
      message: 'Rental period extended successfully',
      data: { booking }
    });

  } catch (error) {
    console.error('Extend rental period error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error extending rental period'
    });
  }
};

/**
 * Retrieves item categories with count statistics using aggregation
 * @async
 * @function getCategories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @description Fetches all categories with item counts for filtering and display
 * Special features:
 * - Uses MongoDB aggregation pipeline for efficient counting
 * - Only counts active items (isActive: true)
 * - Groups items by category and counts occurrences
 * - Sorts categories by item count (most popular first)
 * - Returns category names with their respective item counts
 * - Optimized for performance with database-level aggregation
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Item.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getUserItems,
  getCategories,
  extendRentalPeriod
};

const normalizeLocation = (location = {}) => ({
  ...location,
  street: location.street?.trim(),
  city: location.city?.trim(),
  state: location.state?.trim(),
  zipCode: location.zipCode?.trim()
});

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactRegionRegExp = (value) => new RegExp(`^\\s*${escapeRegExp(value.trim())}\\s*$`, 'i');
