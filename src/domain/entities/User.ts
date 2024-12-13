import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
  _id: ObjectId;
  email: String;
  password: String;
  username: String;
  role: String;
  bio: String | null;
  profilePicture: String | null;
  socialLinks: {
     github: String | null;
     linkedIn: String | null;
     portfolio: String | null;
     twitter: String | null;
  };
  location: String | null;
  status: String;
  createdAt: Date;
  updatedAt: Date;
  isVerified: Boolean | null;
  contact: Number;
  skills: String[] | null;
  verificationExpires: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
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
  status: { type: String, required: true, enum: [ 'active', 'suspended', ' blocked' ], default:'active' },
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


