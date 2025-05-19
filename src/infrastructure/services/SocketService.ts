import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import logger from '@/utils/logger';

interface SocketData {
  userId?: string;
  role?: string;
  developerId?: string;
}

export class SocketService {
  private static instance: SocketService | null = null; 
  private io: SocketServer;
  private userSockets: Map<string, Set<string>> = new Map();
  private developerSockets: Map<string, Set<string>> = new Map();
  private webRTCRooms: Map<string, Set<string>> = new Map();

  private constructor(server: Server, io: SocketServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
}

  public static getInstance(server?: Server, io?: SocketServer): SocketService {
    if (!SocketService.instance && server && io) {
        SocketService.instance = new SocketService(server, io);
    }
    if (!SocketService.instance) {
        throw new Error('SocketService not initialized');
    }
    return SocketService.instance;
}

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication error');
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
          userId: string;
          role?: string;
          developerId?: string;
        };

        socket.data = {
          userId: decoded.userId,
          role: decoded.role,
          developerId: decoded.developerId
        };

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const { userId, role, developerId } = socket.data;
      logger.info(`Socket connected: ${socket.id} - Role: ${role}`);
      logger.info(`Current connections - Users: ${this.countUserSockets()}, Developers: ${this.countDeveloperSockets()}`);

      if (role === 'developer' && userId) {
        this.addSocket(this.developerSockets, userId, socket.id);
        this.handleDeveloperEvents(socket);
      } else if (userId) {
        this.addSocket(this.userSockets, userId, socket.id);
        this.handleUserEvents(socket);
      }

      socket.on('notification:mark-read', async (notificationId: string) => {
        try {
          if (socket.data.userId) {
            this.io.to(socket.id).emit('notification:marked-read', {
              id: notificationId,
              success: true
            });
          }
        } catch (error) {
          logger.error('Error marking notification as read:', error);
        }
      });

      socket.on('notification:mark-all-read', async () => {
        try {
          if (socket.data.userId) {
            this.io.to(socket.id).emit('notification:all-marked-read', {
              success: true
            });
          }
        } catch (error) {
          logger.error('Error marking all notifications as read:', error);
        }
      });

      this.handleCommonEvents(socket);

      if (role === 'developer' && developerId) {
        this.io.emit('developer:online', { developerId });
      } else if (userId) {
        this.io.emit('user:online', { userId });
      }

      socket.on('check:online', (data) => {
        try {
          if (data.developerId) {
            const isOnline = this.isDeveloperOnline(data.developerId);
            console.log(`Developer ${data.developerId} online status: ${isOnline}`);
            socket.emit('developer:online', { 
              developerId: data.developerId, 
              isOnline: isOnline 
            });
          }
          
          if (data.userId) {
            const isOnline = this.isUserOnline(data.userId);
            console.log(`User ${data.userId} online status: ${isOnline}`);
            socket.emit('user:online', { 
              userId: data.userId, 
              isOnline: isOnline 
            });
          }
        } catch (error) {
          console.error('Error checking online status:', error);

          if (data.developerId) {
            socket.emit('developer:online', { 
              developerId: data.developerId, 
              isOnline: false 
            });
          } else if (data.userId) {
            socket.emit('user:online', { 
              userId: data.userId, 
              isOnline: false 
            });
          }
        }
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
        
        if (role === 'developer' && developerId) {
          this.io.emit('developer:offline', { developerId });
        } else if (userId) {
          this.io.emit('user:offline', { userId });
        }
      });

      socket.on('user:set-offline', (data) => {
        if (data.userId) {
          this.io.emit('user:offline', { userId: data.userId });
          logger.info(`User ${data.userId} set offline manually`);
        }
      });

      socket.on('developer:set-offline', (data) => {
        if (data.developerId) {
          this.io.emit('developer:offline', { developerId: data.developerId });
          logger.info(`Developer ${data.developerId} set offline manually`);
        }
      });

      socket.on('user:set-online', (data) => {
        if (data.userId) {
          this.io.emit('user:online', { userId: data.userId, isOnline: true });
          logger.info(`User ${data.userId} set online manually`);
        }
      });

      socket.on('developer:set-online', (data) => {
        if (data.developerId) {
          this.io.emit('developer:online', { developerId: data.developerId, isOnline: true });
          logger.info(`Developer ${data.developerId} set online manually`);
        }
      });

      this.setupWebRTCHandlers(socket);
    });
  }

  private setupWebRTCHandlers(socket: any) {
    const { userId, role, developerId } = socket.data;
    const participantId = role === 'developer' ? developerId : userId;

    socket.on('webrtc:join-room', (data: { roomId: string, userId: string, role: string }) => {
      try {
        const { roomId } = data;
        
        if (!roomId || !participantId) {
          logger.error('Invalid room ID or participant ID for WebRTC room join');
          return;
        }
        
        const roomName = `webrtc:${roomId}`;
        socket.join(roomName);
        logger.info(`User ${participantId} joined WebRTC room ${roomId}`);
        
        if (!this.webRTCRooms.has(roomId)) {
          this.webRTCRooms.set(roomId, new Set());
        }
        
        this.webRTCRooms.get(roomId)!.add(participantId);
        
        const participants = Array.from(this.webRTCRooms.get(roomId) || []).map(id => {
          return {
            userId: id,
            role: role === 'developer' ? 'developer' : 'user'
          };
        });
        
        socket.emit('webrtc:session-info', {
          roomId,
          participants
        });
        
        socket.to(roomName).emit('webrtc:user-joined', {
          userId: participantId,
          role: role,
          roomId
        });
      } catch (error) {
        logger.error('Error in webrtc:join-room:', error);
      }
    });
    
    socket.on('webrtc:leave-room', (data: { roomId: string, userId: string, role: string }) => {
      try {
        const { roomId } = data;
        
        if (!roomId || !participantId) {
          logger.error('Invalid room ID or participant ID for WebRTC room leave');
          return;
        }
        
        const roomName = `webrtc:${roomId}`;
        socket.leave(roomName);
        logger.info(`User ${participantId} left WebRTC room ${roomId}`);
        
        const room = this.webRTCRooms.get(roomId);
        if (room) {
          room.delete(participantId);
          
          if (room.size === 0) {
            this.webRTCRooms.delete(roomId);
          }
        }
        
        socket.to(roomName).emit('webrtc:user-disconnected', {
          userId: participantId,
          roomId
        });
      } catch (error) {
        logger.error('Error in webrtc:leave-room:', error);
      }
    });
    
    socket.on('webrtc:offer', (data: { sdp: any, to: string, from: string, sessionId: string }) => {
      try {
        const { to, sessionId } = data;
        
        if (!to || !sessionId) {
          logger.error('Invalid WebRTC offer data');
          return;
        }
        
        logger.info(`Relaying WebRTC offer from ${participantId} to ${to} in room ${sessionId}`);

        this.relayWebRTCMessage(to, 'webrtc:offer', data);
      } catch (error) {
        logger.error('Error in webrtc:offer:', error);
      }
    });
    
    socket.on('webrtc:answer', (data: { sdp: any, to: string, from: string, sessionId: string }) => {
      try {
        const { to, sessionId } = data;
        
        if (!to || !sessionId) {
          logger.error('Invalid WebRTC answer data');
          return;
        }
        
        logger.info(`Relaying WebRTC answer from ${participantId} to ${to} in room ${sessionId}`);
        
        this.relayWebRTCMessage(to, 'webrtc:answer', data);
      } catch (error) {
        logger.error('Error in webrtc:answer:', error);
      }
    });

    socket.on('webrtc:ice-candidate', (data: { candidate: any, to: string, from: string }) => {
      try {
        const { to } = data;
        
        if (!to) {
          logger.error('Invalid ICE candidate data');
          return;
        }
        
        logger.info(`Relaying ICE candidate from ${participantId} to ${to}`);
        
        this.relayWebRTCMessage(to, 'webrtc:ice-candidate', data);
      } catch (error) {
        logger.error('Error in webrtc:ice-candidate:', error);
      }
    });

    socket.on('webrtc:screen-sharing-started', (data: { roomId: string, userId: string }) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          logger.error('Invalid screen sharing data');
          return;
        }
        
        const roomName = `webrtc:${roomId}`;
        logger.info(`User ${participantId} started screen sharing in room ${roomId}`);
        
        socket.to(roomName).emit('webrtc:screen-sharing-started', {
          userId: participantId,
          roomId
        });
      } catch (error) {
        logger.error('Error in webrtc:screen-sharing-started:', error);
      }
    });
    
    socket.on('webrtc:screen-sharing-stopped', (data: { roomId: string, userId: string }) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          logger.error('Invalid screen sharing data');
          return;
        }
        
        const roomName = `webrtc:${roomId}`;
        logger.info(`User ${participantId} stopped screen sharing in room ${roomId}`);
        
        socket.to(roomName).emit('webrtc:screen-sharing-stopped', {
          userId: participantId,
          roomId
        });
      } catch (error) {
        logger.error('Error in webrtc:screen-sharing-stopped:', error);
      }
    });
  }


  private relayWebRTCMessage(targetUserId: string, event: string, data: any) {
    let targetSockets = this.userSockets.get(targetUserId);
    
    if (!targetSockets || targetSockets.size === 0) {
      targetSockets = this.developerSockets.get(targetUserId);
    }
    
    if (targetSockets && targetSockets.size > 0) {
      targetSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    } else {
      logger.warn(`Could not find target user ${targetUserId} for WebRTC signal relay`);
    }
  }

  private addSocket(map: Map<string, Set<string>>, id: string, socketId: string) {
    if (!map.has(id)) {
      map.set(id, new Set());
    }
    map.get(id)!.add(socketId);
  }

  private handleUserEvents(socket: any) {
    socket.on('user:join-chat', (chatId: string) => { 
      socket.join(`chat:${chatId}`);
      
      const roomName = `chat:${chatId}`;
      const room = this.io.sockets.adapter.rooms.get(roomName);

    });

    socket.on('user:leave-chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      logger.info(`User ${socket.data.userId} left chat ${chatId}`);
    });

    socket.on('user:join-video', (sessionId: string) => { 
      socket.join(`video:${sessionId}`);
      logger.info(`User ${socket.data.userId} joined video room ${sessionId}`);
    });

    socket.on('user:leave-video', (sessionId: string) => {
      socket.leave(`video:${sessionId}`);
      logger.info(`User ${socket.data.userId} left video room ${sessionId}`);
    });
  }

  private handleDeveloperEvents(socket: any) {
    socket.on('developer:join-chat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      logger.info(`Developer ${socket.data.developerId} joined chat ${chatId}`);
    });

    socket.on('developer:leave-chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      logger.info(`Developer ${socket.data.developerId} left chat ${chatId}`);
    });

    socket.on('developer:join-video', (sessionId: string) => {
      socket.join(`video:${sessionId}`);
      logger.info(`Developer ${socket.data.developerId} joined video room ${sessionId}`);
    });

    socket.on('developer:leave-video', (sessionId: string) => {
      socket.leave(`video:${sessionId}`);
      logger.info(`Developer ${socket.data.developerId} left video room ${sessionId}`);
    });
  }

  private handleCommonEvents(socket: any) {
    socket.on('typing:start', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('typing:start', {
        chatId,
        userId: socket.data.userId,
        developerId: socket.data.developerId
      });
    });

    socket.on('typing:stop', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', {
        chatId,
        userId: socket.data.userId,
        developerId: socket.data.developerId
      });
    });

    socket.on('ping', (data: any) => {
      console.log('🏓 RECEIVED PING', { 
        socketId: socket.id,
        userId: socket.data.userId,
        data
      });
      
      socket.emit('pong', { 
        time: new Date().toISOString(),
        received: data
      });
    });
  }

  private handleDisconnect(socket: any) {
    const { userId, role, developerId } = socket.data;
    const participantId = role === 'developer' ? developerId : userId;
    
    logger.info(`Socket disconnected: ${socket.id} - Role: ${role}`);

    if (role === 'developer' && developerId) {
      const sockets = this.developerSockets.get(developerId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.developerSockets.delete(developerId);
        }
      }
    } else if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    this.webRTCRooms.forEach((participants, roomId) => {
      if (participants.has(participantId)) {
        participants.delete(participantId);
        
        const roomName = `webrtc:${roomId}`;
        socket.to(roomName).emit('webrtc:user-disconnected', {
          userId: participantId,
          roomId
        });
        
        if (participants.size === 0) {
          this.webRTCRooms.delete(roomId);
        }
      }
    });
  }

  public emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public emitToDeveloper(developerId: string, event: string, data: any) {
    const sockets = this.developerSockets.get(developerId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public emitToChat(chatId: string, event: string, data: any) { 
    const roomName = `chat:${chatId}`;
    const room = this.io.sockets.adapter.rooms.get(roomName);
    
    if (room && room.size > 0) {
      this.io.to(roomName).emit(event, data);
    } else {
      console.warn(`⚠️ NO SOCKETS IN ROOM: ${roomName}`);
    }
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public isDeveloperOnline(developerId: string): boolean {
    return this.developerSockets.has(developerId);
  }

  public emitUserBlocked(userId: string) {
    try {
        const sockets = this.userSockets.get(userId);
        
        if (sockets && sockets.size > 0) {
            
            sockets.forEach(socketId => {
                
                this.io.to(socketId).emit('user:blocked', null, (error: any) => {
                    if (error) {
                        console.error(`[SocketService] Failed to emit to socket ${socketId}:`, error);
                    } else {
                        console.log(`[SocketService] Successfully emitted to socket ${socketId}`);
                    }
                });
                
                setTimeout(() => {
                    const socket = this.io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.disconnect(true);
                    }
                }, 1000);
            });
        } 
    } catch (error) {
        console.error('[SocketService] Error in emitUserBlocked:', error);
    }
  }
  
  private countUserSockets(): number {
    let count = 0;
    this.userSockets.forEach(sockets => {
        count += sockets.size;
    });
    return count;
  }

  private countDeveloperSockets(): number {
    let count = 0;
    this.developerSockets.forEach(sockets => {
        count += sockets.size;
    });
    return count;
  }

  public emitNewNotification(userId: string, notification: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.size > 0) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:new', { notification });
      });
    }

    const developerSockets = this.developerSockets.get(userId);
    if (developerSockets && developerSockets.size > 0) {
      developerSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:new', { notification });
      });
    }
  }

  public emitNotificationRead(userId: string, notificationId: string) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.size > 0) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:marked-read', {
          id: notificationId,
          success: true
        });
      });
    }

    const developerSockets = this.developerSockets.get(userId);
    if (developerSockets && developerSockets.size > 0) {
      developerSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:marked-read', {
          id: notificationId,
          success: true
        });
      });
    }
  }

  public emitAllNotificationsRead(userId: string) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.size > 0) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:all-marked-read', {
          success: true
        });
      });
    }

    const developerSockets = this.developerSockets.get(userId);
    if (developerSockets && developerSockets.size > 0) {
      developerSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:all-marked-read', {
          success: true
        });
      });
    }
  }

  public emitUnreadNotificationCount(userId: string, count: number) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets && userSockets.size > 0) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:unread-count', { count });
      });
    }

    const developerSockets = this.developerSockets.get(userId);
    if (developerSockets && developerSockets.size > 0) {
      developerSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:unread-count', { count });
      });
    }
  }
}