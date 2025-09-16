import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [500, 'Product description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'Bride - Photo Shoot Outfits',
      'Bride - Wedding Dresses',
      'Bride - Sangeet Wear',
      'Bride - Voni Function Outfits',
      'Bride - Haldi Outfits',
      'Bride - Shoes',
      'Bride - Sunglasses',
      'Bride - Jewelry',
      'Groom - Photo Shoot Outfits',
      'Groom - Wedding Dresses / Sherwanis / Suits',
      'Groom - Sangeet Wear',
      'Groom - Haldi Outfits',
      'Groom - Shoes',
      'Groom - Sunglasses',
      'Groom - Jewelry',
      'Combos - Pre-Wedding Photo Shoot Sets',
      'Combos - Wedding Day Combos',
      'Combos - Sangeet/Haldi Twin Themes'
    ]
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative']
  },
  size: {
    type: String,
    required: [true, 'Product size is required'],
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom']
  },
  rating: {
    type: Number,
    required: false,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 4.5
  },
  images: [{
    type: String,
    required: false
  }],
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  isDiscountActive: {
    type: Boolean,
    default: false
  },
  discountStartDate: {
    type: Date,
    required: function() {
      return this.isDiscountActive;
    }
  },
  discountEndDate: {
    type: Date,
    required: function() {
      return this.isDiscountActive;
    }
  },
  offerPrice: {
    type: Number,
    min: [0, 'Offer price cannot be negative']
  },
  offerStartDate: {
    type: Date
  },
  offerEndDate: {
    type: Date
  },
  isOfferActive: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) {
    return this.price - (this.price * this.discount / 100);
  }
  return this.price;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Product', productSchema);
