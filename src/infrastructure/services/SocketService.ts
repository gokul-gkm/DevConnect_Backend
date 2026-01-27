import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt, { SignOptions }  from "jsonwebtoken";
import * as cookie from "cookie";
import { injectable, inject } from "inversify";
import logger from "@/utils/logger";
import type { StringValue } from "ms";


interface SocketUserData {
  userId: string;
  role: "user" | "developer";
  developerId?: string;
}

@injectable()
export class SocketService {
  private io!: SocketServer;

  // Presence tracking (industry standard)
  private onlineCount = new Map<string, number>();

  private onlineUsers = new Map<string, number>();
  private onlineDevelopers = new Map<string, number>();


  // constructor(
  //   @inject("HttpServer") private server: HttpServer,
  //   @inject("SocketServer") io: SocketServer
  // ) {
  //   this.io = io;
  // }

  public initialize(io: SocketServer): void {
  this.io = io;                
  this.setupAuthMiddleware();
  this.setupConnectionHandler();
  logger.info("✅ SocketService initialized");
}

  // ------------------------------------------------------------------
  // AUTH MIDDLEWARE
  // ------------------------------------------------------------------
  private setupAuthMiddleware() {
    this.io.use((socket, next) => {
      try {
        const req = socket.request as any;
        const cookies = req.headers.cookie
          ? cookie.parse(req.headers.cookie)
          : {};

        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("No access token"));

        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET!
          ) as SocketUserData;

          socket.data = decoded;
          return next();
        } catch (err: any) {
          if (err.name !== "TokenExpiredError") throw err;

          const refreshToken = cookies.refreshToken;
          if (!refreshToken) return next(new Error("No refresh token"));

          const decodedRefresh = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET!
          ) as SocketUserData;

          const signOptions: SignOptions = {
            expiresIn: process.env.ACCESS_EXPIRES_IN  as StringValue,
          };
          const newAccessToken = jwt.sign(
            decodedRefresh as object,
            process.env.JWT_ACCESS_SECRET as string,
            signOptions
          );


          socket.emit("newAccessToken", newAccessToken);
          socket.data = decodedRefresh;
          return next();
        }
      } catch (err) {
        logger.error("Socket auth error", err);
        return next(new Error("Authentication failed"));
      }
    });
  }

  // ------------------------------------------------------------------
  // CONNECTION HANDLER
  // ------------------------------------------------------------------
  private setupConnectionHandler() {
    this.io.on("connection", (socket: Socket) => {

      this.debug("CONNECTED", {
        socketId: socket.id,
        userId: socket.data?.userId,
        role: socket.data?.role,
      });
      

      const { userId, role, developerId } = socket.data as SocketUserData;

      logger.info(`🟢 Connected ${socket.id} (${role}:${userId})`);

      // ---- Personal rooms  ----
      socket.join(`user:${userId}`);
      console.log("💫Role in socket connection handler : ", role);
      if (role === "developer" && developerId) {
        socket.join(`developer:${developerId}`);
      }

      // ---- Presence ----
      this.handleOnline(userId, role);

      // ---- Feature handlers ----
      this.registerChatHandlers(socket);
      this.registerNotificationHandlers(socket);
      this.registerWebRTCHandlers(socket);
      this.registerCommonHandlers(socket);

      socket.on("disconnect", (reason) => {
        this.debug("DISCONNECTED", {
          socketId: socket.id,
          reason,
        });
        logger.info(`🔴 Disconnected ${socket.id}`);
        this.handleOffline(userId, role);
      });
    });
  }

  // ------------------------------------------------------------------
  // PRESENCE 
  // ------------------------------------------------------------------
  private handleOnline(userId: string, role: "user" | "developer") {
  const store = role === "user"
    ? this.onlineUsers
    : this.onlineDevelopers;

  const count = (store.get(userId) || 0) + 1;
  store.set(userId, count);

  if (count === 1) {
    this.io.emit(`${role}:online`, {
      [`${role}Id`]: userId,
      isOnline: true
    });
  }
}


private handleOffline(userId: string, role: "user" | "developer") {
  const store = role === "user"
    ? this.onlineUsers
    : this.onlineDevelopers;

  const count = (store.get(userId) || 1) - 1;

  if (count <= 0) {
    store.delete(userId);
    this.io.emit(`${role}:offline`, {
      [`${role}Id`]: userId,
      isOnline: false
    });
  } else {
    store.set(userId, count);
  }
}


  // ------------------------------------------------------------------
  // CHAT
  // ------------------------------------------------------------------
  private registerChatHandlers(socket: Socket) {
    socket.on("user:join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("user:leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });
  }

  public emitToChat(chatId: string, event: string, data: any) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }

  // ------------------------------------------------------------------
  // NOTIFICATIONS 
  // ------------------------------------------------------------------
  public emitNotification(userId: string, payload: any) {
    console.log(`👤 emit >>>  user:${userId} event -> notification:new `);
    
    this.logRoomState(userId)

    this.io.to(`user:${userId}`).emit("notification:new", payload, () => {
  logger.info("✅ Notification delivered to client");
});
  }

  public emitNotificationRead(userId: string, notificationId: string) {
    console.log(`👤 emit >>> user:${userId} event -> notification:marked-read`);
    this.io.to(`user:${userId}`).emit("notification:marked-read", {
      id: notificationId,
      success: true,
    });
  }

  public emitUnreadCount(userId: string, count: number) {
    this.io.to(`user:${userId}`).emit("notification:unread-count", { count });
  }

  private registerNotificationHandlers(socket: Socket) {
    socket.on("notification:mark-read", (id: string) => {
      socket.emit("notification:marked-read", { id, success: true });
    });

    socket.on("notification:mark-all-read", () => {
      socket.emit("notification:all-marked-read", { success: true });
    });
  }


  public emitToUser(userId: string, event: string, payload: any) {
  const room = `user:${userId}`;

  this.logRoomState(userId);

  logger.info("📡 SOCKET EMIT", {
    room,
    event,
    payload
  });

  this.io.to(room).emit(event, payload, () => {
    logger.info(`✅ ${event} delivered to client`);
  });
}


  // ------------------------------------------------------------------
  // WEBRTC 
  // ------------------------------------------------------------------
  private registerWebRTCHandlers(socket: Socket) {

    console.log("👂 [BACKEND] Registering WebRTC handlers for socket:", socket.id);

    socket.on("webrtc:join-room", ({ roomId }) => {

      this.debug("WEBRTC_JOIN", {
        socketId: socket.id,
        roomId,
      });

      console.log("🚪 [BACKEND] webrtc:join-room received", {
        socketId: socket.id,
        userId: socket.data?.userId,
        role: socket.data?.role,
        roomId
      });


  socket.join(`call:${roomId}`);
  console.log("✅ [BACKEND] Socket joined room:", `call:${roomId}`);

  const sockets = Array.from(
    this.io.sockets.adapter.rooms.get(`call:${roomId}`) || []
  );
      
    this.debug("ROOM_STATE_AFTER_JOIN", {
    roomId,
    sockets
    });
  
    console.log("👥 [BACKEND] Room participants:", {
      roomId,
      socketCount: sockets.length,
      socketIds: sockets
    });

  const participants = sockets.map(socketId => {
    const s = this.io.sockets.sockets.get(socketId);
    return {
      userId: s?.data?.userId,
      role: s?.data?.role
    };
  });
      
    this.debug("SESSION_INFO_EMIT", {
      roomId,
      participants,
    });
      
    console.log("📤 [BACKEND] Emitting webrtc:session-info", {
      roomId,
      participants,
      targetRoom: `call:${roomId}`
    });


  this.io.to(`call:${roomId}`).emit("webrtc:session-info", {
    roomId,
    participants
  });
  
  console.log("✅ [BACKEND] webrtc:session-info emitted");
  
  const targetSockets = Array.from(
    this.io.sockets.adapter.rooms.get(`call:${roomId}`) || []
  );
  console.log("🎯 [BACKEND] Session-info should reach sockets:", targetSockets);
  
});  


    socket.on("webrtc:leave-room", ({ roomId }) => {
      console.log("🚪 [BACKEND] webrtc:leave-room received", {
        socketId: socket.id,
        roomId
      });
      
      socket.leave(`call:${roomId}`);
      socket.to(`call:${roomId}`).emit("webrtc:user-left", {
        socketId: socket.id,
      });
    });

    socket.on("webrtc:reconnect", ({ roomId, userId, role }) => {

      console.log("🔄 [BACKEND] webrtc:reconnect received", {
        socketId: socket.id,
        userId,
        role,
        roomId
      });

      this.debug("WEBRTC_RECONNECT", {
        socketId: socket.id,
        userId,
        role,
        roomId
      });

      // Join the room first
      socket.join(`call:${roomId}`);
      console.log("✅ [BACKEND] Socket rejoined room:", `call:${roomId}`);
      setImmediate(() => {
      // Get current participants and send session info
        const sockets = Array.from(
          this.io.sockets.adapter.rooms.get(`call:${roomId}`) || []
        );
         
        console.log("👥 [BACKEND] Room sockets after reconnect:", {
          roomId,
          socketCount: sockets.length,
          socketIds: sockets
        });

        const participants = sockets.map(socketId => {
          const s = this.io.sockets.sockets.get(socketId);
          return {
            userId: s?.data?.userId,
            role: s?.data?.role
          };
        });

        console.log("📤 [BACKEND] Emitting webrtc:session-info for reconnect to ALL participants", {
          roomId,
          participants,
          targetRoom: `call:${roomId}`,
          willEmitTo: sockets.length
        });

        this.io.to(`call:${roomId}`).emit("webrtc:session-info", {
          roomId,
          participants
        });
        console.log("✅ [BACKEND] webrtc:session-info emitted to room");
      });
    });

    socket.on("webrtc:offer", (data) => {
      console.log("📥 [BACKEND] webrtc:offer received", {
        from: data.from,
        to: data.to,
        sessionId: data.sessionId,
        socketId: socket.id
      });
        this.debug("OFFER_RELAY", data);
      socket.to(`call:${data.sessionId}`).emit("webrtc:offer", data);
      console.log("📤 [BACKEND] webrtc:offer relayed");
    });

    socket.on("webrtc:answer", (data) => {
      console.log("📥 [BACKEND] webrtc:answer received", {
        from: data.from,
        to: data.to,
        sessionId: data.sessionId,
        socketId: socket.id
      });
        this.debug("ANSWER_RELAY", data);

      socket.to(`call:${data.sessionId}`).emit("webrtc:answer", data);
      console.log("📤 [BACKEND] webrtc:answer relayed");

    });

    socket.on("webrtc:ice-candidate", (data) => {

      console.log("🧊 [BACKEND] webrtc:ice-candidate received", {
        from: data.from,
        to: data.to,
        sessionId: data.sessionId,
        hasCandidate: !!data.candidate,
        socketId: socket.id
      });

       this.debug("ICE_RELAY", {
        from: data.from,
        candidate: !!data.candidate,
        sessionId: data.sessionId,
       });
      
      socket.to(`call:${data.sessionId}`).emit("webrtc:ice-candidate", data);
      console.log("📤 [BACKEND] webrtc:ice-candidate relayed");
    });

    

    socket.on("webrtc:screen-sharing-started", ({ roomId, userId }) => {
      console.log("🖥️ [BACKEND] Screen sharing started", {
        roomId,
        userId,
        socketId: socket.id
      });
      
      // Notify other participants 
      socket.to(`call:${roomId}`).emit("webrtc:screen-sharing-started", {
        userId,
        roomId
      });
    });

    socket.on("webrtc:screen-sharing-stopped", ({ roomId, userId }) => {
      console.log("🛑 [BACKEND] Screen sharing stopped", {
        roomId,
        userId,
        socketId: socket.id
      });
      
      // Notify other participants
      socket.to(`call:${roomId}`).emit("webrtc:screen-sharing-stopped", {
        userId,
        roomId
      });
    });


    console.log("✅ [BACKEND] WebRTC handlers registered");
  }


  

  // ------------------------------------------------------------------
  // COMMON
  // ------------------------------------------------------------------
  private registerCommonHandlers(socket: Socket) {
    socket.on("typing:start", (chatId: string) => {
      socket.to(`chat:${chatId}`).emit("typing:start", {
        userId: socket.data.userId,
      });
    });

    socket.on("typing:stop", (chatId: string) => {
      socket.to(`chat:${chatId}`).emit("typing:stop", {
        userId: socket.data.userId,
      });
    });

    socket.on("ping", () => {
      socket.emit("pong", { time: Date.now() });
    });
  }

//   public isOnline(userId: string): boolean {
//   return this.onlineCount.has(userId);
  // }
  
  public isOnline(userId: string): boolean {
  return (
    this.onlineUsers.has(userId) ||
    this.onlineDevelopers.has(userId)
  );  
  
  }
  
  private logRoomState(userId: string) {
  const room = `user:${userId}`;
  const sockets = this.io.sockets.adapter.rooms.get(room);

  logger.info("🧠 ROOM STATE", {
    room,
    sockets: sockets ? Array.from(sockets) : [],
    count: sockets?.size ?? 0
  });
  }
  
  private debug(event: string, payload?: any) {
  console.log(
    `%c[SOCKET][${event}]`,
    "color:#22c55e;font-weight:bold",
    payload ?? ""
  );
}




}
