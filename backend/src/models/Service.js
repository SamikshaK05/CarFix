import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'General Service',
        'Periodic Maintenance',
        'Repair',
        'AC Service',
        'Engine',
        'Brakes',
        'Tyres',
        'Electrical',
        'Other',
      ],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      min: 0,
      default: 0,
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Service', serviceSchema);
