const developerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertise: [{
    type: String
  }],
  hourlyRate: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  education: {
    degree: String,
    institution: String,
    year: Number
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  portfolio: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  languages: [{
    type: String
  }],
  resume: String,
  workingExperience: {
    jobTitle: String,
    companyName: String,
    experience: Number
  }
}, {
  timestamps: true
}); 