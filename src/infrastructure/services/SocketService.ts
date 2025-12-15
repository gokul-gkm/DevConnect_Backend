import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from "http";
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import logger from '@/utils/logger';
import { ISocketService } from '@/domain/interfaces/services/ISocketService';
import { inject, injectable } from 'inversify';
import * as cookie from 'cookie';


@injectable()
export class SocketService implements ISocketService {
  private static instance: SocketService; 
  private io!: SocketServer;
  private userSockets: Map<string, Set<string>> = new Map();
  private developerSockets: Map<string, Set<string>> = new Map();
  private webRTCRooms: Map<string, Set<string>> = new Map();
  private connectionStates: Map<string, string> = new Map();

  private pendingDisconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private WEBRTC_DISCONNECT_GRACE_PERIOD = 8000;

  constructor(
    @inject('HttpServer') private server: HttpServer,
    @inject('SocketServer') io: SocketServer 
  ) {  }

  public initialize(server: HttpServer, io: SocketServer): void {
    this.io = io;
    console.log('🧩 SocketService initialized with IO');
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
        const req = socket.request as import('http').IncomingMessage & {
          headers: { cookie?: string };
        };

        const cookies = req.headers.cookie
          ? cookie.parse(req.headers.cookie)
          : {};
        

        const token = socket.handshake.auth?.token;
        const refreshToken = cookies.refreshToken;

        if (!token) {
          throw new Error('No access token provided');
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
            userId: string;
            role?: string;
            developerId?: string;
          };

          socket.data = {
            userId: decoded.userId,
            role: decoded.role,
            developerId: decoded.developerId,
          };

          return next();
        } catch (error: any) {
          if (error.name === 'TokenExpiredError') {
            if (!refreshToken) return next(new Error('No refresh token found'));

            const decodedRefresh = jwt.verify(
              refreshToken,
              process.env.JWT_REFRESH_SECRET!
            ) as { userId: string; role: string; developerId?: string };

            const newAccessToken = jwt.sign(
              {
                userId: decodedRefresh.userId,
                role: decodedRefresh.role,
                developerId: decodedRefresh.developerId,
              },
              process.env.JWT_ACCESS_SECRET!,
              { expiresIn: process.env.ACCESS_EXPIRES_IN }
            );

            socket.emit('newAccessToken', newAccessToken);

            socket.data = {
              userId: decodedRefresh.userId,
              role: decodedRefresh.role,
              developerId: decodedRefresh.developerId,
            };

            return next();
          }

          throw error;
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
        return next(new Error('Authentication error'));
      }
    });
  }
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {

      console.log('🟢 New socket connected:', socket.id);
      console.log('User data:', socket.data);

      const { userId, role, developerId } = socket.data;
      console.log("🔰 Role and userID : ", role, userId)
 
      if (role === 'developer' && userId) {
        console.log('💻 Developer socket ')
        this.developerSockets.delete(userId);
      } else if (role === 'user' && userId) {
        console.log('👤 User socket ')
        this.userSockets.delete(userId);
      }

      logger.info(`Socket connected: ${socket.id} - Role: ${role}`);

      if (role === 'developer' && userId) {
        this.addSocket(this.developerSockets, userId, socket.id);
        this.handleDeveloperEvents(socket);
      } else if (role === 'user' && userId) {
        this.addSocket(this.userSockets, userId, socket.id);
        this.handleUserEvents(socket);
      } else {
        logger.warn(`Invalid role or missing ID for socket ${socket.id}`);
        socket.disconnect();
        return;
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
        console.log("🔀 online", developerId)
        this.io.emit('developer:online', { developerId });
      } else if (userId) {
        this.io.emit('user:online', { userId });
      }

      socket.on('check:online', (data) => {
        try {
          if (data.developerId) {
            const isOnline = this.isDeveloperOnline(data.developerId);
            console.log(`🛜Developer ${data.developerId} online status: ${isOnline} ${isOnline ? '✅' : '❌'}`);
            socket.emit('developer:online', { 
              developerId: data.developerId, 
              isOnline: isOnline 
            });
          }
          
          if (data.userId) {
            const isOnline = this.isUserOnline(data.userId);
            console.log(`🛜User ${data.userId} online status: ${isOnline} ${isOnline ? '✅' : '❌'}`);
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
    const { userId, role } = socket.data;
    const participantId = userId;
    
    console.log(`[Backend:WebRTC Step 1] Setting up WebRTC handlers for ${participantId} (${role})`);

    if (role === 'developer' && userId) {
        this.addSocket(this.developerSockets, userId, socket.id);
    } else if (role === 'user' && userId) {
        this.addSocket(this.userSockets, userId, socket.id);
    }

    socket.on('webrtc:join-room', (data: { roomId: string, userId: string, role: string }) => {
      try {
        const { roomId } = data;
        const roomName = `webrtc:${roomId}`;
        
        if (this.webRTCRooms.get(roomId)?.has(participantId)) {
          console.log(`[Backend:WebRTC] User ${participantId} already in room ${roomId}`);
          return;
        }
        
        socket.join(roomName);
        
        if (!this.webRTCRooms.has(roomId)) {
          this.webRTCRooms.set(roomId, new Set());
        }
        
        this.webRTCRooms.get(roomId)!.add(participantId);
        
        const participants = Array.from(this.webRTCRooms.get(roomId) || []).map(id => {
            const isDeveloper = this.developerSockets.has(id);
          return {
            userId: id,
            role: isDeveloper ? 'developer' : 'user'
          };
        });
        
        console.log(`[Backend:WebRTC Step 6] Emitting session info to room ${roomId}:`, participants);
        this.io.to(roomName).emit('webrtc:session-info', {
          roomId,
          participants
        });
      } catch (error) {
        console.error('[Backend:WebRTC] Error in join-room handler:', error);
      }
    });

    socket.on('webrtc:reconnect', (data: { roomId: string, userId: string, role?: string, isHost?: boolean }) => {
      try {
        const { roomId, userId: reconnectingUserId } = data;
        if (!roomId || !reconnectingUserId) {
          console.log('[Backend:WebRTC] Invalid reconnect data, ignoring');
          return;
        }

        console.log(`[Backend:WebRTC] Reconnect attempt by ${reconnectingUserId} to room ${roomId}`);

        const roomName = `webrtc:${roomId}`;

        const pendingTimer = this.pendingDisconnectTimers.get(reconnectingUserId);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          this.pendingDisconnectTimers.delete(reconnectingUserId);
          console.log(`[Backend:WebRTC] Cleared pending disconnect timer for ${reconnectingUserId}`);
        }

        socket.join(roomName);

        if (!this.webRTCRooms.has(roomId)) {
          this.webRTCRooms.set(roomId, new Set());
        }

        const participantsSet = this.webRTCRooms.get(roomId)!;
        if (!participantsSet.has(reconnectingUserId)) {
          console.log(`[Backend:WebRTC] Participant ${reconnectingUserId} not found in room set, adding back`);
          participantsSet.add(reconnectingUserId);
        } else {
          console.log(`[Backend:WebRTC] Participant ${reconnectingUserId} already present in room set`);
        }

        if (socket.data?.role === 'developer' && reconnectingUserId) {
          this.addSocket(this.developerSockets, reconnectingUserId, socket.id);
        } else if (socket.data?.role === 'user' && reconnectingUserId) {
          this.addSocket(this.userSockets, reconnectingUserId, socket.id);
        }

        const participants = Array.from(this.webRTCRooms.get(roomId) || []).map(id => {
          const isDeveloper = this.developerSockets.has(id);
          return {
            userId: id,
            role: isDeveloper ? 'developer' : 'user'
          };
        });

        console.log(`[Backend:WebRTC] Emitting session-info after reconnect for room ${roomId}`);
        this.io.to(roomName).emit('webrtc:session-info', {
          roomId,
          participants
        });
      } catch (error) {
        console.error('[Backend:WebRTC] Error in webrtc:reconnect handler:', error);
      }
    });

    socket.on('webrtc:leave-room', (data: { roomId: string, userId: string, role: string }) => {
      try {
        const { roomId } = data;
        console.log(`[Backend:WebRTC Step 8] User ${participantId} leaving room ${roomId}`);
        
        if (!roomId || !participantId) {
          console.log('[Backend:WebRTC Step 8.1] Invalid room ID or participant ID for WebRTC room leave');
          return;
        }
        
        const roomName = `webrtc:${roomId}`;
        console.log(`[Backend:WebRTC Step 9] Leaving socket room ${roomName}`);
        socket.leave(roomName);
        
        const room = this.webRTCRooms.get(roomId);
        if (room) {
          console.log(`[Backend:WebRTC Step 10] Removing participant ${participantId} from room ${roomId}`);
          room.delete(participantId);
          
          if (room.size === 0) {
            console.log(`[Backend:WebRTC Step 11] Room ${roomId} is empty, removing it`);
            this.webRTCRooms.delete(roomId);
          }
        }

        const pendingTimer = this.pendingDisconnectTimers.get(participantId);
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          this.pendingDisconnectTimers.delete(participantId);
        }
        
        console.log(`[Backend:WebRTC Step 12] Notifying other participants about disconnection`);
        socket.to(roomName).emit('webrtc:user-disconnected', {
          userId: participantId,
          roomId
        });
      } catch (error) {
        console.error('[Backend:WebRTC Step 13] Error in webrtc:leave-room:', error);
      }
    });

    socket.on('webrtc:offer', (data: { sdp: any, to: string, from: string, sessionId: string }) => {
      try {
        const { to, sessionId } = data;
        if (to === participantId) {
          console.log('[Backend:WebRTC] Preventing self-signaling');
          return;
        }
        console.log(`[Backend:WebRTC Step 14] Relaying offer from ${participantId} to ${to} in room ${sessionId}`);
        
        if (!to || !sessionId) {
          console.log('[Backend:WebRTC Step 14.1] Invalid offer data');
          return;
        }
        
        console.log(`[Backend:WebRTC Step 15] Relaying WebRTC offer`);
        this.relayWebRTCMessage(to, 'webrtc:offer', data);
      } catch (error) {
        console.error('[Backend:WebRTC Step 16] Error in offer handler:', error);
      }
    });
    
    socket.on('webrtc:answer', (data: { sdp: any, to: string, from: string, sessionId: string }) => {
      try {
        const { to, sessionId } = data;
        console.log(`[Backend:WebRTC Step 17] Relaying answer from ${participantId} to ${to} in room ${sessionId}`);
        
        if (!to || !sessionId) {
          console.log('[Backend:WebRTC Step 17.1] Invalid WebRTC answer data');
          return;
        }
        
        console.log(`[Backend:WebRTC Step 18] Relaying WebRTC answer`);
        this.relayWebRTCMessage(to, 'webrtc:answer', data);
      } catch (error) {
        console.error('[Backend:WebRTC Step 19] Error in webrtc:answer:', error);
      }
    });

    socket.on('webrtc:ice-candidate', (data: { candidate: any, to: string, from: string }) => {
      try {
        const { to } = data;
        console.log(`[Backend:WebRTC Step 20] Relaying ICE candidate from ${participantId} to ${to}`);
        
        if (!to) {
          console.log('[Backend:WebRTC Step 20.1] Invalid ICE candidate data');
          return;
        }
        
        console.log(`[Backend:WebRTC Step 21] Relaying ICE candidate`);
        this.relayWebRTCMessage(to, 'webrtc:ice-candidate', data);
      } catch (error) {
        console.error('[Backend:WebRTC Step 22] Error in webrtc:ice-candidate:', error);
      }
    });

    socket.on('webrtc:screen-sharing-started', (data: { roomId: string, userId: string }) => {
      try {
        const { roomId } = data;
        console.log(`[Backend:WebRTC Step 23] User ${participantId} started screen sharing in room ${roomId}`);
        
        if (!roomId) {
          console.log('[Backend:WebRTC Step 23.1] Invalid screen sharing data');
          return;
        }
        
        const roomName = `webrtc:${roomId}`;
        console.log(`[Backend:WebRTC Step 24] Notifying room about screen sharing`);
        socket.to(roomName).emit('webrtc:screen-sharing-started', {
          userId: participantId,
          roomId
        });
      } catch (error) {
        console.error('[Backend:WebRTC Step 25] Error in webrtc:screen-sharing-started:', error);
      }
    });
    
    socket.on('webrtc:screen-sharing-stopped', (data: { roomId: string, userId: string }) => {
      try {
        const { roomId } = data;
        console.log(`[Backend:WebRTC Step 26] User ${participantId} stopped screen sharing in room ${roomId}`);
        
        if (!roomId) {
          console.log('[Backend:WebRTC Step 26.1] Invalid screen sharing data');
          return;
        }
        
        const roomName = `webrtc:${roomId}`;
        console.log(`[Backend:WebRTC Step 27] Notifying room about screen sharing stop`);
        socket.to(roomName).emit('webrtc:screen-sharing-stopped', {
          userId: participantId,
          roomId
        });
      } catch (error) {
        console.error('[Backend:WebRTC Step 28] Error in webrtc:screen-sharing-stopped:', error);
      }
    });

    socket.on('webrtc:connection-state-change', (data: { state: string, roomId: string }) => {
      const { state, roomId } = data;
      this.connectionStates.set(`${participantId}:${roomId}`, state);
      console.log(`[Backend:WebRTC] Connection state for ${participantId} in room ${roomId}: ${state}`);
    });
  }


  private relayWebRTCMessage(targetUserId: string, event: string, data: any) {
    console.log(`[Backend:WebRTC Step 29] Attempting to relay ${event} to ${targetUserId}`);
    
    let targetSockets = this.userSockets.get(targetUserId);
    
    if (!targetSockets || targetSockets.size === 0) {
        console.log(`[Backend:WebRTC Step 30] No user sockets found, checking developer sockets`);
      targetSockets = this.developerSockets.get(targetUserId);
    }
    
    if (targetSockets && targetSockets.size > 0) {
        console.log(`[Backend:WebRTC Step 31] Found ${targetSockets.size} sockets for target user`);
      targetSockets.forEach(socketId => {
            console.log(`[Backend:WebRTC Step 32] Emitting ${event} to socket ${socketId}`);
        this.io.to(socketId).emit(event, data);
      });
    } else {
        console.log(`[Backend:WebRTC Step 33] Could not find target user ${targetUserId} for WebRTC signal relay`);
    }
  }

  private addSocket(map: Map<string, Set<string>>, id: string, socketId: string) {
    if (!map.has(id)) {
      map.set(id, new Set());
    }
    const sockets = map.get(id)!;
    
    if (sockets.size >= 2) {
      const oldestSocket = Array.from(sockets)[0];
      this.io.sockets.sockets.get(oldestSocket)?.disconnect();
      sockets.delete(oldestSocket);
    }
    
    sockets.add(socketId);
    logger.info(`Added socket ${socketId} to ${map === this.userSockets ? 'user' : 'developer'} ${id}`);

    const connectedUserIds = Array.from(this.userSockets.keys());
    const connectedDeveloperIds = Array.from(this.developerSockets.keys());
    logger.info(
      `Current connections - Users: ${this.countUserSockets()} [${connectedUserIds.join(', ')}], ` +
      `Developers: ${this.countDeveloperSockets()} [${connectedDeveloperIds.join(', ')}]`
    );
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
    const { userId, role } = socket.data;

    if (role === 'developer' && userId) {
      const sockets = this.developerSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.developerSockets.delete(userId);
        }
      }
    } else if (role === 'user' && userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }

    this.webRTCRooms.forEach((participants, roomId) => {
      if (participants.has(userId)) {
        console.log(`[Backend:WebRTC] Detected participant ${userId} in room ${roomId} on socket disconnect.`);

        const existingTimer = this.pendingDisconnectTimers.get(userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          this.pendingDisconnectTimers.delete(userId);
        }
        const timer = setTimeout(() => {
          try {
            console.log(`[Backend:WebRTC] Grace period expired — removing participant ${userId} from room ${roomId}`);

            participants.delete(userId);

            const roomName = `webrtc:${roomId}`;
            socket.to(roomName).emit('webrtc:user-disconnected', {
              userId: userId,
              roomId
            });

            if (participants.size === 0) {
              console.log(`[Backend:WebRTC] Room ${roomId} empty after delayed removal; deleting room`);
              this.webRTCRooms.delete(roomId);
            }

            this.pendingDisconnectTimers.delete(userId);
          } catch (err) {
            console.error('[Backend:WebRTC] Error during delayed disconnect cleanup:', err);
          }
        }, this.WEBRTC_DISCONNECT_GRACE_PERIOD);

        this.pendingDisconnectTimers.set(userId, timer);
        console.log(`[Backend:WebRTC] Scheduled delayed removal for ${userId} in ${this.WEBRTC_DISCONNECT_GRACE_PERIOD}ms`);
      }
    });

    logger.info(`Socket disconnected: ${socket.id} - Role: ${role}`);
    const connectedUserIds = Array.from(this.userSockets.keys());
    const connectedDeveloperIds = Array.from(this.developerSockets.keys());
    logger.info(
      `Current connections - Users: ${this.countUserSockets()} [${connectedUserIds.join(', ')}], ` +
      `Developers: ${this.countDeveloperSockets()} [${connectedDeveloperIds.join(', ')}]`
    );
  }

  public emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      console.log(`Emitting ${event} to user ${userId} on sockets:`, Array.from(sockets));

      sockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public emitToDeveloper(developerId: string, event: string, data: any) {
    const sockets = this.developerSockets.get(developerId);
    if (sockets) {
      console.log(`Emitting ${event} to developer ${developerId} on sockets:`, Array.from(sockets));
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
    console.log("🌍User sockets : ",this.userSockets)
    return this.userSockets.has(userId);
  }

  public isDeveloperOnline(developerId: string): boolean {
    console.log("🌍Developer sockets : ",this.userSockets)
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
    console.log("👿👿👿👿👿👿 User sockets",userSockets)
    if (userSockets && userSockets.size > 0) {
      console.log("✈️ Emitting new notificaion to user")
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('notification:new', { notification });
      });
    }

    const developerSockets = this.developerSockets.get(userId);
    console.log("🤖🤖🤖🤖 Developer sockets",developerSockets)
    if (developerSockets && developerSockets.size > 0) {
      console.log("✈️ Emitting new notificaion to developer")
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
