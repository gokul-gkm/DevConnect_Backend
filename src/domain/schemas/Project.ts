import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  projectLink: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Project = mongoose.model('Project', projectSchema); 