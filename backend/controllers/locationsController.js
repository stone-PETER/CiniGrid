import PotentialLocation from '../models/PotentialLocation.js';
import FinalizedLocation from '../models/FinalizedLocation.js';
import mockAiService from '../services/mockAiService.js';

// Add location to potential list (from AI suggestion or manual data)
export const addToPotential = async (req, res) => {
  try {
    console.log('=== ADD TO POTENTIAL REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user ? { id: req.user._id, username: req.user.username, role: req.user.role } : 'No user');
    
    const { suggestionId, manualData } = req.body;

    let locationData;

    if (suggestionId) {
      // For this mock implementation, we'll get the suggestion data from the AI service
      // In a real app, you might store suggestions temporarily or fetch from a suggestions collection
      const suggestions = await mockAiService.searchLocations("dummy prompt");
      const suggestion = suggestions.find((_, index) => index.toString() === suggestionId);
      
      if (!suggestion) {
        return res.status(404).json({
          success: false,
          error: 'Suggestion not found.'
        });
      }

      locationData = {
        title: suggestion.title,
        description: suggestion.description,
        coordinates: suggestion.coordinates,
        region: suggestion.region,
        permits: suggestion.permits,
        images: suggestion.images || [],
        tags: suggestion.tags || [],
        addedBy: req.user._id
      };
    } else if (manualData) {
      // Validate manual data
      const { title, description, coordinates, region } = manualData;
      if (!title || !description || !coordinates || !region) {
        return res.status(400).json({
          success: false,
          error: 'Title, description, coordinates, and region are required.'
        });
      }

      // Transform permits array - handle both string array and object array formats
      let transformedPermits = [];
      if (manualData.permits && Array.isArray(manualData.permits)) {
        transformedPermits = manualData.permits.map(permit => {
          if (typeof permit === 'string') {
            // Transform string to permit object
            return {
              name: permit,
              required: true,
              notes: ''
            };
          } else if (permit && typeof permit === 'object' && permit.name) {
            // Already in correct format
            return {
              name: permit.name,
              required: permit.required !== undefined ? permit.required : true,
              notes: permit.notes || ''
            };
          } else {
            // Invalid permit format, skip
            console.warn('Invalid permit format:', permit);
            return null;
          }
        }).filter(permit => permit !== null);
      }

      console.log('Transformed permits:', transformedPermits);

      locationData = {
        title: manualData.title,
        description: manualData.description,
        coordinates: manualData.coordinates,
        region: manualData.region,
        permits: transformedPermits,
        images: manualData.images || [],
        tags: manualData.tags || [],
        addedBy: req.user._id
      };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either suggestionId or manualData is required.'
      });
    }

    console.log('Final location data to save:', JSON.stringify(locationData, null, 2));

    const potentialLocation = new PotentialLocation(locationData);
    console.log('Created PotentialLocation instance');
    
    await potentialLocation.save();
    console.log('Successfully saved to database');
    
    await potentialLocation.populate('addedBy', 'username role');
    console.log('Successfully populated addedBy field');

    res.status(201).json({
      success: true,
      data: { location: potentialLocation }
    });
  } catch (error) {
    console.error('=== ADD TO POTENTIAL ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.error('Validation errors:', validationErrors);
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate location already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while adding to potential locations.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all potential locations
export const getPotentialLocations = async (req, res) => {
  try {
    const locations = await PotentialLocation.find()
      .populate('addedBy', 'username role')
      .populate('notes.author', 'username role')
      .populate('approvals.userId', 'username role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { 
        locations,
        count: locations.length
      }
    });
  } catch (error) {
    console.error('Get potential locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching potential locations.'
    });
  }
};

// Get single potential location
export const getPotentialLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await PotentialLocation.findById(id)
      .populate('addedBy', 'username role')
      .populate('notes.author', 'username role')
      .populate('approvals.userId', 'username role');

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Potential location not found.'
      });
    }

    res.json({
      success: true,
      data: { location }
    });
  } catch (error) {
    console.error('Get potential location error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching potential location.'
    });
  }
};

// Finalize a potential location
export const finalizeLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const potentialLocation = await PotentialLocation.findById(id);
    if (!potentialLocation) {
      return res.status(404).json({
        success: false,
        error: 'Potential location not found.'
      });
    }

    // Create finalized location
    const finalizedLocationData = {
      title: potentialLocation.title,
      description: potentialLocation.description,
      coordinates: potentialLocation.coordinates,
      region: potentialLocation.region,
      permits: potentialLocation.permits,
      images: potentialLocation.images,
      addedBy: potentialLocation.addedBy,
      notes: potentialLocation.notes,
      approvals: potentialLocation.approvals,
      tags: potentialLocation.tags,
      finalizedBy: req.user._id,
      finalizedAt: new Date()
    };

    const finalizedLocation = new FinalizedLocation(finalizedLocationData);
    await finalizedLocation.save();

    // Remove from potential locations
    await PotentialLocation.findByIdAndDelete(id);

    await finalizedLocation.populate([
      { path: 'addedBy', select: 'username role' },
      { path: 'finalizedBy', select: 'username role' },
      { path: 'notes.author', select: 'username role' },
      { path: 'approvals.userId', select: 'username role' }
    ]);

    res.json({
      success: true,
      data: { location: finalizedLocation }
    });
  } catch (error) {
    console.error('Finalize location error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while finalizing location.'
    });
  }
};

// Get all finalized locations
export const getFinalizedLocations = async (req, res) => {
  try {
    const locations = await FinalizedLocation.find()
      .populate('addedBy', 'username role')
      .populate('finalizedBy', 'username role')
      .populate('notes.author', 'username role')
      .populate('approvals.userId', 'username role')
      .sort({ finalizedAt: -1 });

    res.json({
      success: true,
      data: { 
        locations,
        count: locations.length
      }
    });
  } catch (error) {
    console.error('Get finalized locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching finalized locations.'
    });
  }
};

// Direct add to potential locations
export const directAddToPotential = async (req, res) => {
  try {
    console.log('=== DIRECT ADD TO POTENTIAL REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { title, description, coordinates, region, permits, images, tags } = req.body;

    // Validation
    if (!title || !description || !coordinates || !region) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, coordinates, and region are required.'
      });
    }

    // Transform permits array - handle both string array and object array formats
    let transformedPermits = [];
    if (permits && Array.isArray(permits)) {
      transformedPermits = permits.map(permit => {
        if (typeof permit === 'string') {
          // Transform string to permit object
          return {
            name: permit,
            required: true,
            notes: ''
          };
        } else if (permit && typeof permit === 'object' && permit.name) {
          // Already in correct format
          return {
            name: permit.name,
            required: permit.required !== undefined ? permit.required : true,
            notes: permit.notes || ''
          };
        } else {
          // Invalid permit format, skip
          console.warn('Invalid permit format:', permit);
          return null;
        }
      }).filter(permit => permit !== null);
    }

    const locationData = {
      title,
      description,
      coordinates,
      region,
      permits: transformedPermits,
      images: images || [],
      tags: tags || [],
      addedBy: req.user._id
    };

    console.log('Location data to save:', JSON.stringify(locationData, null, 2));

    const potentialLocation = new PotentialLocation(locationData);
    await potentialLocation.save();
    
    await potentialLocation.populate('addedBy', 'username role');

    res.status(201).json({
      success: true,
      data: { location: potentialLocation }
    });
  } catch (error) {
    console.error('=== DIRECT ADD TO POTENTIAL ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while adding location directly to potential.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Direct add to finalized locations
export const directAddToFinalized = async (req, res) => {
  try {
    console.log('=== DIRECT ADD TO FINALIZED REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { title, description, coordinates, region, permits, images, tags } = req.body;

    // Validation
    if (!title || !description || !coordinates || !region) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, coordinates, and region are required.'
      });
    }

    // Transform permits array - handle both string array and object array formats
    let transformedPermits = [];
    if (permits && Array.isArray(permits)) {
      transformedPermits = permits.map(permit => {
        if (typeof permit === 'string') {
          // Transform string to permit object
          return {
            name: permit,
            required: true,
            notes: ''
          };
        } else if (permit && typeof permit === 'object' && permit.name) {
          // Already in correct format
          return {
            name: permit.name,
            required: permit.required !== undefined ? permit.required : true,
            notes: permit.notes || ''
          };
        } else {
          // Invalid permit format, skip
          console.warn('Invalid permit format:', permit);
          return null;
        }
      }).filter(permit => permit !== null);
    }

    const locationData = {
      title,
      description,
      coordinates,
      region,
      permits: transformedPermits,
      images: images || [],
      tags: tags || [],
      addedBy: req.user._id,
      finalizedBy: req.user._id,
      finalizedAt: new Date()
    };

    const finalizedLocation = new FinalizedLocation(locationData);
    await finalizedLocation.save();
    
    await finalizedLocation.populate([
      { path: 'addedBy', select: 'username role' },
      { path: 'finalizedBy', select: 'username role' }
    ]);

    res.status(201).json({
      success: true,
      data: { location: finalizedLocation }
    });
  } catch (error) {
    console.error('=== DIRECT ADD TO FINALIZED ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Handle specific mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error while adding location directly to finalized.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};