import Developer from '@/domain/entities/Developer';
import { Session, ISession } from '@/domain/entities/Session';
import { AppError } from '@/domain/errors/AppError';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { SessionDetails, SessionDocument, UserInfo } from '@/domain/types/session';
import { startOfDay, endOfDay } from 'date-fns';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import DeveloperSlot from '@/domain/entities/Slot';

interface PopulatedUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
}

interface PopulatedDeveloper {
  _id: Types.ObjectId;
  expertise: string[];
  hourlyRate: number;
  workingExperience?: {
    experience: number;
  };
  userId: PopulatedUser;
}



export class SessionRepository implements ISessionRepository  {
  async createSession(sessionData: Partial<ISession>): Promise<ISession> {
    try {
      const session = new Session(sessionData);
      await session.save();
      return session;
    } catch (error) {
      throw new AppError('Failed to create session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getBookedSlots(developerId: string, date: Date) {
    try {
      
      const result = 
       await Session.find({
        developerId: new mongoose.Types.ObjectId(developerId),
        status: { $in: ['approved', 'scheduled'] },
        sessionDate: {
          $gte: startOfDay(date),
          $lte: endOfDay(date)
        }
       }).select('startTime duration');
      return result
    } catch (error) {
      throw new AppError('Failed to fetch booked slots', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  
  async checkSlotAvailability(
    developerId: string,
    sessionDate: Date | string,
    startTime: Date | string,
    duration: number
  ): Promise<boolean> {
    try {
      const sessionDateObj = new Date(sessionDate);
      const startTimeObj = new Date(startTime);
      const endTimeObj = new Date(startTimeObj.getTime() + (duration * 60000));
      
      // Check for conflicting sessions first
      const conflictingSessions = await Session.find({
        developerId: new mongoose.Types.ObjectId(developerId),
        status: { $in: ['approved', 'awaiting_payment', 'pending'] },
        sessionDate: {
          $gte: startOfDay(sessionDateObj),
          $lte: endOfDay(sessionDateObj)
        },
        $or: [
          {
            startTime: { 
              $gte: startTimeObj, 
              $lt: endTimeObj 
            }
          },
          {
            $expr: {
              $and: [
                { $lt: ['$startTime', endTimeObj] },
                { 
                  $gt: [
                    { $add: ['$startTime', { $multiply: ['$duration', 60000] }] },
                    startTimeObj
                  ] 
                }
              ]
            }
          }
        ]
      });
      
      if (conflictingSessions.length > 0) {
        return false;
      }
      
      // Now check developer unavailability records
      const formattedTime = startTimeObj.getHours().toString().padStart(2, '0') + 
                           ':' + 
                           startTimeObj.getMinutes().toString().padStart(2, '0');
      
      const unavailabilityRecord = await DeveloperSlot.findOne({
        developerId: new mongoose.Types.ObjectId(developerId),
        date: {
          $gte: startOfDay(sessionDateObj),
          $lte: endOfDay(sessionDateObj)
        },
        unavailableSlots: formattedTime
      });
      
      return !unavailabilityRecord;
    } catch (error) {
      console.error('Check slot availability error:', error);
      throw new AppError('Failed to check slot availability', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  
  async getUserSessions(userId: string): Promise<ISession[]> {
    try {
      const sessions = await Session.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: 'developers',
            localField: 'developerId',
            foreignField: 'userId',
            as: 'developer'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'developer.userId',
            foreignField: '_id',
            as: 'developerUser'
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            topics: 1,
            sessionDate: 1,
            startTime: 1,
            duration: 1,
            price: 1,
            status: 1,
            paymentStatus: 1,
            rejectionReason: 1,
            createdAt: 1,
            updatedAt: 1,
            developer: {
              $first: '$developer'
            },
            developerUser: {
              $first: '$developerUser'
            }
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            topics: 1,
            sessionDate: 1,
            startTime: 1,
            duration: 1,
            price: 1,
            status: 1,
            paymentStatus: 1,
            rejectionReason: 1,
            createdAt: 1,
            updatedAt: 1,
            'developer._id': 1,
            'developer.expertise': 1,
            'developer.hourlyRate': 1,
            'developerUser.username': 1,
            'developerUser.email': 1
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]);

      return sessions;
    } catch (error) {
      console.error('Get user sessions repository error:', error);
      throw new AppError('Failed to fetch user sessions', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getDeveloperSessions(developerId: string): Promise<ISession[]> {
    try {
      return await Session.find({ 
        developerId: new mongoose.Types.ObjectId(developerId) 
      })
      .populate('userId', 'username email profilePicture')
      .sort({ sessionDate: 1 });
    } catch (error) {
      throw new AppError('Failed to fetch developer sessions', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const session = await Session.findById(sessionId);
      
      if (!session) {
        throw new AppError('Session not found', StatusCodes.NOT_FOUND);
      }

      if (session.status !== 'pending') {
        throw new AppError('Only pending sessions can be cancelled', StatusCodes.BAD_REQUEST);
      }

      await session.deleteOne();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getUpcomingSessions(userId: string, currentDate: Date) {
    try {
      const sessions = await Session.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            sessionDate: { $gte: currentDate },
            status: { 
              $nin: ['cancelled', 'rejected', 'completed'] 
            }
          }
        },
        {
          $lookup: {
            from: 'developers',
            localField: 'developerId',
            foreignField: 'userId',
            as: 'developer'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'developer.userId',
            foreignField: '_id',
            as: 'developerUser'
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            topics: 1,
            sessionDate: 1,
            startTime: 1,
            duration: 1,
            price: 1,
            status: 1,
            paymentStatus: 1,
            rejectionReason: 1,
            'developer': { $first: '$developer' },
            'developerUser': {
              $first: {
                $map: {
                  input: '$developerUser',
                  as: 'user',
                  in: {
                    _id: '$$user._id',
                    username: '$$user.username',
                    email: '$$user.email',
                    profilePicture: '$$user.profilePicture',                   
                  }
                }
              }
            }
          }
        },
        {
          $sort: { 
            sessionDate: 1,
            startTime: 1 
          }
        }
      ]);
  
      return sessions;
    } catch (error) {
      console.error('Get upcoming sessions repository error:', error);
      throw new AppError('Failed to fetch upcoming sessions', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }


  async getSessionRequests(developerId: Types.ObjectId, page: number = 1, limit: number = 5) {
    try {
      const skip = (page - 1) * limit;

      const statusCounts = await Session.aggregate([
        { $match: { developerId } },
        { $group: { 
            _id: "$status", 
            count: { $sum: 1 } 
          } 
        }
      ]);

      const statusCountMap = statusCounts.reduce((acc: Record<string, number>, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      const totalCount = await Session.countDocuments({ developerId });
      const totalPages = Math.ceil(totalCount / limit);
      
      const sessions = await Session.find({
        developerId,
      })
      .populate('userId', 'username email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      return {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit
        },
        stats: {
          total: totalCount,
          pending: statusCountMap['pending'] || 0,
          approved: statusCountMap['approved'] || 0,
          rejected: statusCountMap['rejected'] || 0,
          scheduled: statusCountMap['scheduled'] || 0
        }
      };
    } catch (error) {
      console.error('Get session requests repository error:', error);
      throw new AppError('Failed to fetch session requests', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getSessionById(sessionId: Types.ObjectId) {
    try {
      const session = await Session.findById(sessionId);
      return session;
    } catch (error) {
      console.error('Get session by ID repository error:', error);
      throw new AppError('Failed to fetch session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  
  async getSessionBySessionId(sessionId: Types.ObjectId): Promise<SessionDetails> {
    try {
      const session = await Session.findById(sessionId)
        .populate<{ userId: UserInfo }>('userId', 'username email profilePicture role skills bio')
        .lean<SessionDocument>();
  
      if (!session) {
        throw new AppError('Session not found', StatusCodes.NOT_FOUND);
      }
  
      const rawDeveloperProfile = await Developer.findOne({ 
        userId: session.developerId
      })
      .populate<{ userId: PopulatedUser }>('userId', 'username email profilePicture bio')
      .lean();
  
      if (!rawDeveloperProfile) {
        throw new AppError('Developer profile not found', StatusCodes.NOT_FOUND);
      }
       
      const developerProfile = rawDeveloperProfile as unknown as PopulatedDeveloper;
  
      if (!developerProfile.userId) {
        throw new AppError('Developer user information not found', StatusCodes.NOT_FOUND);
      }
  
      const skills: string[] = developerProfile.expertise 
        ? developerProfile.expertise.map(String)
        : [];
      
      const developerInfo: UserInfo = {
        _id: new Types.ObjectId(developerProfile.userId._id),
        username: developerProfile.userId.username,
        email: developerProfile.userId.email,
        profilePicture: developerProfile.userId.profilePicture,
        developerProfile: {
          hourlyRate: developerProfile.hourlyRate || 0, 
          experience: developerProfile.workingExperience?.experience || 0,
          skills: skills,
          bio: developerProfile.userId.bio || ''
        }
      };
  
      const sessionDetails: SessionDetails = {
        _id: session._id,
        title: session.title,
        description: session.description,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        duration: session.duration,
        price: session.price,
        status: session.status,
        paymentStatus: session.paymentStatus,
        topics: session.topics,
        userId: session.userId as UserInfo,
        developerId: developerInfo,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
  
      return sessionDetails;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in getSessionBySessionId:', error);
      throw new AppError('Failed to fetch session details', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }



  async updateSessionStatus(sessionId: Types.ObjectId, status: string) {
    try {
      const session = await Session.findByIdAndUpdate(
        sessionId,
        { status },
        { new: true }
      ).populate('userId', 'username email');

      return session;
    } catch (error) {
      console.error('Update session status repository error:', error);
      throw new AppError('Failed to update session status', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async rejectSession(sessionId: Types.ObjectId, rejectionReason: string) {
    try {
    
      const session = await Session.findByIdAndUpdate(
        sessionId,
        {
          status: 'rejected',
          rejectionReason
        },
        { new: true }
      ).populate('userId', 'username email');

      return session;
    } catch (error) {
      console.error('Reject session repository error:', error);
      throw new AppError('Failed to reject session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePaymentStatus(sessionId: Types.ObjectId, status: string): Promise<void> {
    try {
      await Session.findByIdAndUpdate(sessionId, {
        paymentStatus: status
      });
    } catch (error) {
      throw new AppError('Failed to update payment status', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePaymentTransferStatus(sessionId: Types.ObjectId, status: string): Promise<void> {
    try {
      await Session.findByIdAndUpdate(sessionId, {
        paymentTransferStatus: status
      });
    } catch (error) {
      throw new AppError('Failed to update payment transfer status', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async countCompletedSessions(): Promise<number> {
    try {
      return await Session.countDocuments({ 
        status: 'completed',
        paymentStatus: 'completed'
      });
    } catch (error) {
      console.error('Error counting completed sessions:', error);
      throw new AppError('Failed to count sessions', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getDeveloperScheduledSessions(developerId: Types.ObjectId, page: number = 1, limit: number = 5){
    try {
      const skip = (page - 1) * limit;

      const totalCount = await Session.countDocuments({ 
        developerId,
        status: 'scheduled'
      });
      
      const totalPages = Math.ceil(totalCount / limit);
      
      const sessions = await Session.find({
        developerId,
        status: 'scheduled'
      })
      .populate({
        path: 'userId',
        select: 'username email profilePicture'
      })
      .sort({ sessionDate: 1, startTime: 1 })
      .skip(skip)
      .limit(limit);

      return {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit
        },
        stats: {
          total: totalCount,
          scheduled: totalCount
        }
      };
    } catch (error) {
      console.error('Get scheduled sessions repository error:', error);
      throw new AppError('Failed to fetch scheduled sessions', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getScheduledSessionById(sessionId: Types.ObjectId): Promise<any> {
    try {
      const session = await Session.findOne({
        _id: sessionId,
        status: 'scheduled'
      }).populate({
        path: 'userId',
        select: 'username email profilePicture'
      });

      if (!session) {
        throw new AppError('Scheduled session not found', StatusCodes.NOT_FOUND);
      }

      return session;
    } catch (error) {
      console.error('Get scheduled session by ID repository error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch scheduled session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}