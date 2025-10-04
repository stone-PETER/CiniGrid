import PotentialLocation from '../models/PotentialLocation.js';
import FinalizedLocation from '../models/FinalizedLocation.js';

// Add note to potential location
export const addNoteToPotential = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note text is required.'
      });
    }

    const location = await PotentialLocation.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Potential location not found.'
      });
    }

    const note = {
      author: req.user._id,
      text: text.trim(),
      role: req.user.role,
      createdAt: new Date()
    };

    location.notes.push(note);
    await location.save();

    await location.populate('notes.author', 'username role');

    res.status(201).json({
      success: true,
      data: { 
        note: location.notes[location.notes.length - 1],
        location: location
      }
    });
  } catch (error) {
    console.error('Add note to potential error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while adding note.'
    });
  }
};

// Add note to finalized location
export const addNoteToFinalized = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Note text is required.'
      });
    }

    const location = await FinalizedLocation.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Finalized location not found.'
      });
    }

    const note = {
      author: req.user._id,
      text: text.trim(),
      role: req.user.role,
      createdAt: new Date()
    };

    location.notes.push(note);
    await location.save();

    await location.populate('notes.author', 'username role');

    res.status(201).json({
      success: true,
      data: { 
        note: location.notes[location.notes.length - 1],
        location: location
      }
    });
  } catch (error) {
    console.error('Add note to finalized error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while adding note.'
    });
  }
};

// Add approval to potential location
export const addApprovalToPotential = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, comment } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Approved field is required and must be a boolean.'
      });
    }

    const location = await PotentialLocation.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Potential location not found.'
      });
    }

    // Check if user has already provided approval
    const existingApproval = location.approvals.find(
      approval => approval.userId.toString() === req.user._id.toString()
    );

    if (existingApproval) {
      // Update existing approval
      existingApproval.approved = approved;
      existingApproval.comment = comment || '';
      existingApproval.createdAt = new Date();
    } else {
      // Add new approval
      const approval = {
        userId: req.user._id,
        role: req.user.role,
        approved,
        comment: comment || '',
        createdAt: new Date()
      };
      location.approvals.push(approval);
    }

    await location.save();
    await location.populate('approvals.userId', 'username role');

    const addedOrUpdatedApproval = existingApproval || location.approvals[location.approvals.length - 1];

    res.status(201).json({
      success: true,
      data: { 
        approval: addedOrUpdatedApproval,
        location: location
      }
    });
  } catch (error) {
    console.error('Add approval to potential error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while adding approval.'
    });
  }
};