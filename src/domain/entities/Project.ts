import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  _id: string;
  title: string;
  category: string;
  description: string;
  projectLink?: string;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true},
  coverImage: { type: String },
  projectLink: { type: String },
},
{
  timestamps: true,
},
);

export const Project = mongoose.model<IProject>('Project', ProjectSchema);


