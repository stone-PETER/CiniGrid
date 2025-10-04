import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const approvalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  approved: {
    type: Boolean,
    required: true
  },
  comment: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const permitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  required: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  },
  estimatedCost: {
    type: String,
    default: ''
  },
  processingTime: {
    type: String,
    default: ''
  },
  authority: {
    type: String,
    default: ''
  }
}, { _id: false });

const finalizedLocationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  reason: {
    type: String
  },
  address: {
    type: String
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  region: {
    type: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 10
  },
  permits: [permitSchema],
  filmingDetails: {
    accessibility: String,
    parking: String,
    powerAccess: String,
    bestTimeToFilm: String,
    crowdLevel: String,
    weatherConsiderations: String
  },
  estimatedCost: {
    type: String
  },
  images: [{
    type: String  // URLs to images
  }],
  photos: [{
    url: String,
    width: Number,
    height: Number,
    photoReference: String
  }],
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  verified: {
    type: Boolean,
    default: false
  },
  placeId: {
    type: String
  },
  mapsLink: {
    type: String
  },
  googleTypes: [{
    type: String
  }],
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: [noteSchema],
  approvals: [approvalSchema],
  tags: [{
    type: String
  }],
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  finalizedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('FinalizedLocation', finalizedLocationSchema);