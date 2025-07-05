import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IDeveloperSlot extends Document {
  developerId: ObjectId;
  date: Date;
  unavailableSlots: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DeveloperSlotSchema: Schema = new Schema(
  {
    developerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Developer', 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    unavailableSlots: [{ 
      type: String, 
      required: true 
    }],
  },
  {
    timestamps: true,
  }
);

DeveloperSlotSchema.index({ developerId: 1, date: 1 }, { unique: true });

const DeveloperSlot = mongoose.model<IDeveloperSlot>(
  'DeveloperSlot',
  DeveloperSlotSchema
);

export default DeveloperSlot;
