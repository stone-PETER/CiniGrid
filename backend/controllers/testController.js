// Simple test version to identify the issue
import PotentialLocation from '../models/PotentialLocation.js';

export const testAddToPotential = async (req, res) => {
  try {
    console.log('TEST: Simple add to potential endpoint hit');
    console.log('TEST: Request body:', req.body);
    console.log('TEST: User:', req.user ? req.user.username : 'No user');

    const testLocation = {
      title: 'Test Location',
      description: 'Test Description',
      coordinates: { lat: 10.0, lng: 76.0 },
      region: 'Test Region',
      permits: [],
      images: [],
      tags: [],
      addedBy: req.user._id
    };

    console.log('TEST: Creating location with data:', testLocation);

    const location = new PotentialLocation(testLocation);
    await location.save();

    console.log('TEST: Successfully saved location');

    res.json({
      success: true,
      data: { location }
    });
  } catch (error) {
    console.error('TEST ERROR:', error.message);
    console.error('TEST ERROR STACK:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};