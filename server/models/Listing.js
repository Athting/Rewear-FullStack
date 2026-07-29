import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a clothing title'],
    trim: true,
    index: 'text' // for basic text search queries
  },
  description: {
    type: String,
    required: [true, 'Please add a clothing description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    index: true
  },
  brand: {
    type: String,
    required: [true, 'Please select a brand'],
    index: true
  },
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex'],
    required: [true, 'Please specify gender target']
  },
  size: {
    type: String,
    required: [true, 'Please specify size'],
    index: true
  },
  condition: {
    type: String,
    enum: ['New with Tags', 'Like New', 'Good', 'Fair'],
    required: [true, 'Please select item condition'],
    index: true
  },
  color: {
    type: String,
    required: [true, 'Please specify color']
  },
  material: {
    type: String,
    required: [true, 'Please specify material']
  },
  swapValue: {
    type: Number,
    required: [true, 'Please specify estimated EcoPoints swap value'],
    min: 0,
    index: true
  },
  locationName: {
    type: String,
    required: [true, 'Please specify general location']
  },
  locationCoordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  images: [{
    type: String,
    required: true
  }],
  availability: {
    type: String,
    enum: ['available', 'pending', 'swapped', 'unavailable'],
    default: 'available',
    index: true
  },
  tags: [{
    type: String,
    index: true
  }],
  favoritesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Setup 2dsphere index for geospatial queries (distance filters on items)
ListingSchema.index({ locationCoordinates: '2dsphere' });

const Listing = mongoose.model('Listing', ListingSchema);
export default Listing;
