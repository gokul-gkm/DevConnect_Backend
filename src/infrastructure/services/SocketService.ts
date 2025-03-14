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
    console.log('SocketService initialized')
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
        console.log('Socket auth token:', token ? 'Present' : 'Missing');
        if (!token) {
          throw new Error('Authentication error');
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
          userId: string;
          role?: string;
          developerId?: string;
        };
        console.log('Socket auth decoded:', decoded);

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

      if (role === 'developer' && developerId) {
        this.addSocket(this.developerSockets, developerId, socket.id);
        this.handleDeveloperEvents(socket);
      } else if (userId) {
        this.addSocket(this.userSockets, userId, socket.id);
        this.handleUserEvents(socket);
      }

      this.handleCommonEvents(socket);

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
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
      logger.info(`User ${socket.data.userId} joined chat ${chatId}`);
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
    console.log("socket in emit to user : ", sockets);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public emitToDeveloper(developerId: string, event: string, data: any) {
    const sockets = this.developerSockets.get(developerId);
    console.log("sockets in emit to dev : ", sockets);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public emitToChat(chatId: string, event: string, data: any) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public isDeveloperOnline(developerId: string): boolean {
    return this.developerSockets.has(developerId);
  }

  public emitUserBlocked(userId: string) {
    try {
        console.log(`[SocketService] Attempting to emit block event to user: ${userId}`);
        const sockets = this.userSockets.get(userId);
        
        if (sockets && sockets.size > 0) {
            console.log(`[SocketService] Found ${sockets.size} active connections for user ${userId}`);
            
            sockets.forEach(socketId => {
                console.log(`[SocketService] Emitting block event to socket: ${socketId}`);
                
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
                        console.log(`[SocketService] Forcing disconnect for socket: ${socketId}`);
                        socket.disconnect(true);
                    }
                }, 1000);
            });
        } else {
            console.log(`[SocketService] No active sockets found for user: ${userId}`);
        }
    } catch (error) {
        console.error('[SocketService] Error in emitUserBlocked:', error);
    }
  }
}