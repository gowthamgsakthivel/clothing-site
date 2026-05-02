import mongoose from 'mongoose';

const codeCounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
  },
  { versionKey: false }
);

const CodeCounter = mongoose.models.CodeCounter || mongoose.model('CodeCounter', codeCounterSchema, 'code_counters');

export default CodeCounter;