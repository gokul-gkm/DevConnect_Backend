import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IDeveloper extends Document {
  _id: string;
  expertise: String[] | null;
  hourlyRate: number | null;
  rating: number | null;
  timezone: string | null;
  experience: number | null;
  schedule: {
    day: string | null;
    slots: {
      endTime: string | null;
      startTime: string | null;
    }[];
  }[];
  totalSessions: number | null;
  availability: Record<string, any>;
  portfolio: ObjectId[] | null;
  status: 'pending' | 'approved' | 'rejected';
  userId: ObjectId | null;
  languages: string[] | null;
  rejectionReason: string | null;
  resume: string | null;
  workingExperience: {
    companyName: string | null;
    experience: number | null;
    jobTitle: string | null;
  };
  education: {
    degree: string | null;
    institution: string | null;
    year: number | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DeveloperSchema: Schema = new Schema(
  {
    expertise: [{ type: String }],
    hourlyRate: { type: Number },
    rating: { type: Number },
    education: {
      degree: { type: String },
      institution: { type: String },
      year: { type: Number },
    },
    timezone: { type: String },
    experience: { type: Number },
    schedule: [
      {
        day: { type: String },
        slots: [
          {
            endTime: { type: String },
            startTime: { type: String },
          },
        ],
      },
    ],
    totalSessions: { type: Number },
    availability: { type: Schema.Types.Mixed },
    portfolio: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    languages: [{ type: String }],
    rejectionReason: { type: String },
    resume: { type: String },
    workingExperience: {
      companyName: { type: String },
      experience: { type: Number },
      jobTitle: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Developer = mongoose.model<IDeveloper>(
  'Developer',
  DeveloperSchema
);

export default Developer;
