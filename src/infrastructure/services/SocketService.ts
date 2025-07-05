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
    });
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