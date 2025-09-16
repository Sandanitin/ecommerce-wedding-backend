import express from 'express';
import Product from '../models/Product.js';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/products';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Strict image validation
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    console.warn('Invalid file type attempted:', file.mimetype, file.originalname);
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 4 // Maximum 4 files
  },
  fileFilter: fileFilter
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    // Build query
    let query = {};
    if (category && category !== 'all-wedding-items') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
});

// @desc    Create new product
// Input validation middleware
const validateProductInput = (req, res, next) => {
  console.log('Validation middleware - req.body:', req.body);
  console.log('Validation middleware - req.files:', req.files);
  
  const { name, description, price, category, stock, size, color, material, rating } = req.body;
  
  // Debug individual fields
  console.log('Field validation:', {
    name: { value: name, type: typeof name, empty: !name },
    description: { value: description, type: typeof description, empty: !description },
    price: { value: price, type: typeof price, empty: !price },
    category: { value: category, type: typeof category, empty: !category },
    stock: { value: stock, type: typeof stock, empty: !stock }
  });
  
  // Required field validation
  if (!name || !description || !price || !category || !stock) {
    console.error('Validation failed - missing required fields');
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: name, description, price, category, and stock are required'
    });
  }
  
  // Type validation
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Name must be a non-empty string'
    });
  }
  
  if (typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Description must be a non-empty string'
    });
  }
  
  if (isNaN(price) || parseFloat(price) <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Price must be a positive number'
    });
  }
  
  if (isNaN(stock) || parseInt(stock) < 0) {
    return res.status(400).json({
      success: false,
      message: 'Stock must be a non-negative number'
    });
  }
  
  // Category validation
  const validCategories = [
    'Bride - Photo Shoot Outfits', 'Bride - Wedding Dresses', 'Bride - Sangeet Wear',
    'Bride - Voni Function Outfits', 'Bride - Haldi Outfits', 'Bride - Shoes',
    'Bride - Sunglasses', 'Bride - Jewelry', 'Groom - Photo Shoot Outfits',
    'Groom - Wedding Dresses / Sherwanis / Suits', 'Groom - Sangeet Wear',
    'Groom - Haldi Outfits', 'Groom - Shoes', 'Groom - Sunglasses', 'Groom - Jewelry',
    'Combos - Pre-Wedding Photo Shoot Sets', 'Combos - Wedding Day Combos',
    'Combos - Sangeet/Haldi Twin Themes'
  ];
  
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category. Must be one of the predefined categories'
    });
  }
  
  next();
};

// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.array('images', 4), validateProductInput, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      size,
      rating,
      discount,
      isDiscountActive,
      discountStartDate,
      discountEndDate,
      offerPrice,
      offerStartDate,
      offerEndDate,
      isOfferActive,
      isAvailable,
    } = req.body;

    // Handle uploaded images
    const images = req.files ? req.files.map(file => file.path) : [];
    console.log('Uploaded images for new product:', images);

    const productData = {
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      size,
      rating: rating ? parseFloat(rating) : 4.5,
      images,
      discount: parseFloat(discount) || 0,
      isDiscountActive: isDiscountActive === 'true',
      discountStartDate: (isDiscountActive === 'true' && discountStartDate) ? discountStartDate : undefined,
      discountEndDate: (isDiscountActive === 'true' && discountEndDate) ? discountEndDate : undefined,
      offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
      offerStartDate: offerStartDate || undefined,
      offerEndDate: offerEndDate || undefined,
      isOfferActive: isOfferActive === 'true',
      isAvailable: isAvailable === 'true',
      createdBy: req.user.id
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    // Clean up uploaded files if product creation fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating product'
    });
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), upload.array('images', 4), validateProductInput, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      description,
      price,
      category,
      stock,
      size,
      rating,
      discount,
      isDiscountActive,
      discountStartDate,
      discountEndDate,
      offerPrice,
      offerStartDate,
      offerEndDate,
      isOfferActive,
      isAvailable,
      existingImages,
    } = req.body;

    // Handle new uploaded images
    const newImages = req.files ? req.files.map(file => file.path) : [];
    console.log('New uploaded images:', newImages);
    
    // Handle existing images from frontend
    let existingImagesArray = [];
    if (existingImages) {
      try {
        existingImagesArray = JSON.parse(existingImages);
        console.log('Existing images from frontend:', existingImagesArray);
      } catch (error) {
        console.error('Error parsing existing images:', error);
        existingImagesArray = [];
      }
    }
    
    // Combine existing images with new ones
    const allImages = [...existingImagesArray, ...newImages];
    console.log('Final combined images:', allImages);

    const updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      size,
      rating: rating ? parseFloat(rating) : 4.5,
      images: allImages,
      discount: parseFloat(discount) || 0,
      isDiscountActive: isDiscountActive === 'true',
      discountStartDate: (isDiscountActive === 'true' && discountStartDate) ? discountStartDate : undefined,
      discountEndDate: (isDiscountActive === 'true' && discountEndDate) ? discountEndDate : undefined,
      offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
      offerStartDate: offerStartDate || undefined,
      offerEndDate: offerEndDate || undefined,
      isOfferActive: isOfferActive === 'true',
      isAvailable: isAvailable === 'true'
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    // Clean up uploaded files if update fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating product'
    });
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated image files
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
});

export default router;
