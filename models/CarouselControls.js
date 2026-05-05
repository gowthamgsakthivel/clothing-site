import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema(
  {
    id: { type: Number, default: 0 },
    image: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    badge: { type: String, default: '' },
    offer: { type: String, default: '' },
    buttonText1: { type: String, default: '' },
    buttonText2: { type: String, default: '' },
    link: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const carouselControlsSchema = new mongoose.Schema(
  {
    home: { type: [slideSchema], default: [] },
    sports: { type: [slideSchema], default: [] },
    devotional: { type: [slideSchema], default: [] },
    political: { type: [slideSchema], default: [] },
  },
  { timestamps: true }
);

const CarouselControls = mongoose.models.CarouselControls || mongoose.model('CarouselControls', carouselControlsSchema);

export default CarouselControls;
