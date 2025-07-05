import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  username: string;
  role: string;
  bio: string | null;
  profilePicture: string | null;
  socialLinks: {
     github: string | null;
     linkedIn: string | null;
     portfolio: string | null;
     twitter: string | null;
  };
  location: string | null;
  googleId: string | null;
  linkedinId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean | null;
  contact: number;
  skills: string[] | null;
  verificationExpires: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true },
  password: { 
    type: String, 
    required: function(this: IUser) { 
      return !this.googleId && !this.linkedinId; 
    },
  },
  
  username: { type: String, required: true },
  role: { type: String, required: true, enum: [ 'user', 'developer' ] },
  bio: { type: String },
  profilePicture: { type: String },
  socialLinks: {
     github: { type: String },
     linkedIn: { type: String },
     portfolio: { type: String },
     twitter: { type: String },
  },
  location: { type: String },
  googleId: { type: String },
  linkedinId: { type: String },
  status: { type: String, required: true, enum: [ 'active', 'blocked' ], default:'active' },
  isVerified: { type: Boolean, default: false, required: true },
  verificationExpires:{type: Date, default: ()=> new Date(Date.now() + 24 * 60 * 60 * 1000)},
  contact: { type: Number, required: true },
  skills: [{ type: String,  }],
},
{
  timestamps: true,
},
);

export const User = mongoose.model<IUser>('User', UserSchema);


