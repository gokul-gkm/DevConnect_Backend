import Developer from '@/domain/entities/Developer';
import { Session, ISession } from '@/domain/entities/Session';
import { AppError } from '@/domain/errors/AppError';
import { ISessionRepository } from '@/domain/interfaces/ISessionRepository';
import { SessionDetails, SessionDocument, UserInfo } from '@/domain/types/session';
import { startOfDay, endOfDay } from 'date-fns';
import { StatusCodes } from 'http-status-codes';
import mongoose, { Types } from 'mongoose';
import DeveloperSlot from '@/domain/entities/Slot';
import { BaseRepository } from './BaseRepository';

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



export class SessionRepository extends BaseRepository<ISession> implements ISessionRepository  {

  constructor() {
    super(Session);
  }
  
  async save(session: ISession): Promise<ISession> {
    return await session.save()
  }

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

  async getUpcomingSessions(userId: string, currentDate: Date, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const today = new Date(currentDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const match = {
        userId: new Types.ObjectId(userId),
        $or: [
          { sessionDate: { $gt: today } },
          {
            sessionDate: { $gte: today, $lt: tomorrow },
            startTime: { $gte: currentDate }
          }
        ],
        status: { $nin: [ 'rejected', 'completed'] }
      };

      const totalItems = await Session.countDocuments(match);

      const sessions = await Session.aggregate([
        { $match: match },
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
          $sort: { sessionDate: 1, startTime: 1 }
        },
        { $skip: skip },
        { $limit: limit }
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit
        }
      };
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
        updatedAt: session.updatedAt,
        rejectionReason: session.rejectionReason
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalCount = await Session.countDocuments({ 
        developerId,
        status: 'scheduled',
        sessionDate: { $gte: today }
      });
      
      const totalPages = Math.ceil(totalCount / limit);
      
      const sessions = await Session.find({
        developerId,
        status: 'scheduled',
        sessionDate: { $gte: today }
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

  async getSessionHistory(userId: string, currentDate: Date, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const match = {
        userId: new Types.ObjectId(userId),
        sessionDate: { $lte: currentDate },
        status: { $in: ['cancelled', 'rejected', 'completed'] }
      };

      const totalItems = await Session.countDocuments(match);

      const sessions = await Session.aggregate([
        { $match: match },
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
        { $sort: { sessionDate: 1, startTime: 1 } },
        { $skip: skip },
        { $limit: limit }
      ]);
  
      const totalPages = Math.ceil(totalItems / limit);

      return {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('Get sessions history repository error:', error);
      throw new AppError('Failed to fetch session history', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getTopEarningDevelopers(page: number = 1, limit: number = 10): Promise<any> {
    try {
      const skip = (page - 1) * limit;
      
      const totalCount = await Session.aggregate([
        {
          $match: {
            status: 'completed',
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: '$developerId',
            count: { $sum: 1 }
          }
        }
      ]).then(results => results.length);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      const developers = await Session.aggregate([
        {
          $match: {
            status: 'completed',
            paymentStatus: 'completed'
          }
        },
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'sessionId',
            as: 'ratings'
          }
        },
        {
          $group: {
            _id: '$developerId',
            totalSessions: { $sum: 1 },
            totalEarnings: { $sum: '$price' },
            averageRating: { $avg: { $arrayElemAt: ['$ratings.rating', 0] } },
            ratings: { $push: { $arrayElemAt: ['$ratings.rating', 0] } }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $project: {
            id: '$_id',
            name: '$userInfo.username',
            email: '$userInfo.email',
            profilePicture: '$userInfo.profilePicture',
            sessions: '$totalSessions',
            averageRating: { $round: ['$averageRating', 1] },
            totalEarnings: { $round: ['$totalEarnings', 2] },
            ratings: {
              $filter: {
                input: '$ratings',
                as: 'rating',
                cond: { $ne: ['$$rating', null] }
              }
            }
          }
        },
        {
          $sort: { totalEarnings: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ]);
      
      return {
        developers,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount
        }
      };
    } catch (error) {
      console.error('Error getting top earning developers:', error);
      throw new AppError('Failed to fetch top earning developers', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getAdminSessionsList(status: string[], page: number = 1, limit: number = 10, search: string = ''): Promise<any> {
    try {
      const skip = (page - 1) * limit;
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); 

      let matchCondition: any = { status: { $in: status } };
      
    
      if (status.includes('pending') || status.includes('approved') || status.includes('scheduled')) {
   
        matchCondition.sessionDate = { $gte: currentDate };
      } else if (status.includes('completed') || status.includes('rejected') || status.includes('cancelled')) {
     
        matchCondition.sessionDate = { $lt: currentDate };
      }
      
      if (search) {
        matchCondition.$or = [
          { 'title': { $regex: search, $options: 'i' } },
          { 'description': { $regex: search, $options: 'i' } }
        ];
      }
      
     
      const totalCount = await Session.countDocuments(matchCondition);
      const totalPages = Math.ceil(totalCount / limit);
      
      const sessions = await Session.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'developerId',
            foreignField: '_id',
            as: 'developerInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $unwind: '$developerInfo'
        },
        {
          $match: matchCondition
        },
     
        ...(search ? [{
          $match: {
            $or: [
              { 'userInfo.username': { $regex: search, $options: 'i' } },
              { 'developerInfo.username': { $regex: search, $options: 'i' } }
            ]
          }
        }] : []),
        {
          $sort: { sessionDate: 1, startTime: 1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            sessionDate: 1,
            startTime: 1,
            duration: 1,
            price: 1,
            status: 1,
            paymentStatus: 1,
            "user": {
              _id: '$userInfo._id',
              username: '$userInfo.username',
              email: '$userInfo.email',
              profilePicture: '$userInfo.profilePicture'
            },
            "developer": {
              _id: '$developerInfo._id',
              username: '$developerInfo.username',
              email: '$developerInfo.email',
              profilePicture: '$developerInfo.profilePicture'
            }
          }
        }
      ]);
      
      return {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount
        }
      };
    } catch (error) {
      console.error('Error getting admin sessions:', error);
      throw new AppError('Failed to fetch sessions', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getDeveloperSessionHistory(
    developerId: string,
    currentDate: Date,
    page: number = 1,
    limit: number = 5,
    search: string = ''
  ) {
    try {
      const skip = (page - 1) * limit;
      const match: any = {
        developerId: new Types.ObjectId(developerId),
        sessionDate: { $lte: currentDate },
        status: { $in: ['cancelled', 'rejected', 'completed'] }
      };

      if (search) {
        match.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'user.username': { $regex: search, $options: 'i' } }
        ];
      }

      const sessions = await Session.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
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
            'user._id': 1,
            'user.username': 1,
            'user.email': 1,
            'user.profilePicture': 1
          }
        },
        { $sort: { sessionDate: -1, startTime: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      const countAgg = await Session.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $count: 'total' }
      ]);
      const total = countAgg[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      throw new AppError('Failed to fetch developer session history', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async getDeveloperSessionHistoryById(developerId: string, sessionId: string) {
    try {
      const session = await Session.aggregate([
        {
          $match: {
            _id: new Types.ObjectId(sessionId),
            developerId: new Types.ObjectId(developerId),
            status: { $in: ['cancelled', 'rejected', 'completed'] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'sessionId',
            as: 'rating'
          }
        },
        {
          $addFields: {
            rating: { $arrayElemAt: ['$rating', 0] }
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
            'user._id': 1,
            'user.username': 1,
            'user.email': 1,
            'user.profilePicture': 1,
            'rating.rating': 1,
            'rating.comment': 1
          }
        }
      ]);
      return session[0] || null;
    } catch (error) {
      throw new AppError('Failed to fetch session history details', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Get monthly revenue and session count for a developer
  async getDeveloperMonthlyStats(developerId: string, year: number) {
    const match = {
      developerId: new Types.ObjectId(developerId),
      status: { $in: ['completed'] },
      paymentStatus: 'completed',
      sessionDate: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    };

    const stats = await Session.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $month: "$sessionDate" },
          totalRevenue: { $sum: "$price" },
          sessionCount: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill missing months with 0
    const result = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalRevenue: 0,
      sessionCount: 0
    }));

    stats.forEach(s => {
      result[s._id - 1] = {
        month: s._id,
        totalRevenue: s.totalRevenue,
        sessionCount: s.sessionCount
      };
    });

    return result;
  }

  async getDeveloperUpcomingSessions(developerId: string, limit: number = 2): Promise<any> {
    const now = new Date();
    const sessions = await Session.find({
      developerId: new Types.ObjectId(developerId),
      sessionDate: { $gte: now },
      status: { $in: ['scheduled', 'approved', 'pending'] }
    })
      .populate('userId', 'username profilePicture')
      .sort({ sessionDate: 1, startTime: 1 })
      .limit(limit)
      .lean();

    return sessions;
  }

  async getTopicBasedRevenue(page: number = 1, limit: number = 10): Promise<{
    topics: Array<{
      topic: string;
      totalRevenue: number;
      sessionCount: number;
      averageRating: number;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const totalCount = await Session.aggregate([
        {
          $match: {
            status: 'completed',
            paymentStatus: 'completed'
          }
        },
        {
          $unwind: '$topics'
        },
        {
          $group: {
            _id: '$topics',
            count: { $sum: 1 }
          }
        }
      ]).then(results => results.length);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      const topics = await Session.aggregate([
        {
          $match: {
            status: 'completed',
            paymentStatus: 'completed'
          }
        },
        {
          $unwind: '$topics'
        },
        {
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'sessionId',
            as: 'rating'
          }
        },
        {
          $group: {
            _id: '$topics',
            totalRevenue: { $sum: '$price' },
            sessionCount: { $sum: 1 },
            averageRating: { $avg: { $arrayElemAt: ['$rating.rating', 0] } }
          }
        },
        {
          $project: {
            topic: '$_id',
            totalRevenue: 1,
            sessionCount: 1,
            averageRating: { $round: ['$averageRating', 1] }
          }
        },
        {
          $sort: { totalRevenue: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ]);
      
      return {
        topics,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount
        }
      };
    } catch (error) {
      console.error('Error getting topic based revenue:', error);
      throw new AppError('Failed to fetch topic based revenue', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async cancelSession(sessionId: string, reason: string): Promise<void> {
    try {
      const session = await Session.findById(sessionId);
      
      if (!session) {
        throw new AppError('Session not found', StatusCodes.NOT_FOUND);
      }
  
      session.status = 'cancelled';
      session.rejectionReason = reason;
      await session.save();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel session', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

}