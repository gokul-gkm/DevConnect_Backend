// ---------------------- External Dependencies ----------------------
import { Container } from "inversify";
import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { httpServer, io } from "@/app";

// ---------------------- Shared ----------------------
import { TYPES } from "@/types/types";

// ---------------------- Domain Interfaces ----------------------
import { IUserRepository } from "@/domain/interfaces/repositories/IUserRepository";
import { IOTPRepository } from "@/domain/interfaces/repositories/IOTPRepository";
import { IWalletRepository } from "@/domain/interfaces/repositories/IWalletRepository";
import { IMailService } from "@/domain/interfaces/services/IMailService";
import { IS3Service } from "@/domain/interfaces/services/IS3Service";
import { IDeveloperRepository } from "@/domain/interfaces/repositories/IDeveloperRepository";
import { IDeveloperSlotRepository } from "@/domain/interfaces/repositories/IDeveloperSlotRepository";
import { IProjectRepository } from "@/domain/interfaces/repositories/IProjectRepository";
import { ISessionRepository } from "@/domain/interfaces/repositories/ISessionRepository";
import { IRatingRepository } from "@/domain/interfaces/repositories/IRatingRepository";
import { INotificationService } from "@/domain/interfaces/services/INotificationService";
import { INotificationRepository } from "@/domain/interfaces/repositories/INotificationRepository";
import { ISocketService } from "@/domain/interfaces/services/ISocketService";
import { IChatRepository } from "@/domain/interfaces/repositories/IChatRepository";
import { IMessageRepository } from "@/domain/interfaces/repositories/IMessageRepository";
import { IPaymentService } from "@/domain/interfaces/services/IPaymentService";
import { IPaymentRepository } from "@/domain/interfaces/repositories/IPaymentRepository";
import { IVideoSessionRepository } from "@/domain/interfaces/repositories/IVideoSessionRepository";
import { IAdminRepository } from "@/domain/interfaces/repositories/IAdminRepository";

// ---------------------- Infrastructure Implementations ----------------------
import { UserRepository } from "../repositories/UserRepository";
import { OTPRepository } from "../repositories/OTPRepository";
import { WalletRepository } from "../repositories/WalletRepository";
import { MailService } from "../mail/MailService";
import { S3Service } from "../services/S3_Service";
import { DeveloperRepository } from "../repositories/DeveloperRepository";
import { DeveloperSlotRepository } from "../repositories/DeveloperSlotRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { SessionRepository } from "../repositories/SessionRepository";
import { RatingRepository } from "../repositories/RatingRepository";
import { NotificationService } from "../services/NotificationService";
import { NotificationRepository } from "../repositories/NotificationRepositoty";
import { SocketService } from "../services/SocketService";
import { ChatRepository } from "../repositories/ChatRepository";
import { MessageRepository } from "../repositories/MessageRepository";
import { StripeService } from "../services/StripeService";
import { PaymentRepository } from "../repositories/PaymentRepository";
import { VideoSessionRepository } from "../repositories/VideoSessionRepository";
import { AdminRepository } from "../repositories/AdminRepository";

// ---------------------- Use Case Interfaces ----------------------
// (Auth)
import { ILoginUserUseCase } from "@/application/useCases/interfaces/user/auth/ILoginUserUseCase";
import { IRegisterUserUseCase } from "@/application/useCases/interfaces/user/auth/IRegisterUserUseCase";
import { IVerifyOTPUseCase } from "@/application/useCases/interfaces/user/auth/IVerifyOTPUseCase";
import { IResendOTPUseCase } from "@/application/useCases/interfaces/user/auth/IResendOTPUseCase";
import { IForgotPasswordUseCase } from "@/application/useCases/interfaces/user/auth/IForgotPasswordUseCase";
import { IResetPasswordUseCase } from "@/application/useCases/interfaces/user/auth/IResetPasswordUseCase";
import { ISetNewTokenUseCase } from "@/application/useCases/interfaces/user/auth/ISetNewTokenUseCase";

// (Developer)
import { IRegisterDevUseCase } from "@/application/useCases/interfaces/developer/auth/IRegisterDevUseCase";
import { IDevRequestUseCase } from "@/application/useCases/interfaces/developer/auth/IDevRequestUseCase";
import { IDevLoginUseCase } from "@/application/useCases/interfaces/developer/auth/IDevLoginUseCase";
import { IGetDeveloperProfileUseCase } from "@/application/useCases/interfaces/developer/profile/IGetDeveloperProfileUseCase";
import { IUpdateDeveloperProfileUseCase } from "@/application/useCases/interfaces/developer/profile/IUpdateDeveloperProfileUseCase";
import { IAddProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IAddProjectUseCase";
import { IGetDeveloperProjectsUseCase } from "@/application/useCases/interfaces/developer/profile/IGetDeveloperProjectsUseCase";
import { IGetDeveloperProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IGetDeveloperProjectUseCase";
import { IUpdateProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IUpdateProjectUseCase";
import { IDeleteProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IDeleteProjectUseCase";
import { IManageDeveloperUnavailabilityUseCase } from "@/application/useCases/interfaces/developer/availability/IManageDeveloperUnavailabilityUseCase";
import { IManageDefaultSlotsUseCase } from "@/application/useCases/interfaces/developer/availability/IManageDefaultSlotsUseCase";
import { IGetDeveloperReviewsUseCase } from "@/application/useCases/interfaces/developer/reviews/IGetDeveloperReviewsUseCase";
import { IGetDeveloperMonthlyStatsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperMonthlyStatsUseCase";
import { IGetDeveloperUpcomingSessionsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperUpcomingSessionsUseCase";

// (User)
import { IGetUserProfileUseCase } from "@/application/useCases/interfaces/user/profile/IGetUserProfileUseCase";
import { IUpdateUserProfileUseCase } from "@/application/useCases/interfaces/user/profile/IUpdateUserProfileUseCase";
import { ISearchDevelopersUseCase } from "@/application/useCases/interfaces/user/developers/ISearchDevelopersUseCase";
import { IGetPublicProfileUseCase } from "@/application/useCases/interfaces/user/developers/IGetPublicProfileUseCase";
import { IChangeUserPasswordUseCase } from "@/application/useCases/interfaces/user/profile/IChangeUserPasswordUseCase";

// (Session & Rating)
import { ICreateSessionUseCase } from "@/application/useCases/interfaces/user/session/ICreateSessionUseCase";
import { IGetUserSessionsUseCase } from "@/application/useCases/interfaces/user/session/IGetUserSessionsUseCase";
import { IGetUpcomingSessionsUseCase } from "@/application/useCases/interfaces/user/session/IGetUpcomingSessionsUseCase";
import { IGetSessionDetailsUseCase } from "@/application/useCases/interfaces/user/session/IGetSessionDetailsUseCase";
import { IGetSessionHistoryUseCase } from "@/application/useCases/interfaces/user/session/IGetSessionHistoryUseCase";
import { ICancelSessionUseCase } from "@/application/useCases/interfaces/user/session/ICancelSessionUseCase";
import { IGetBookedSlotsUseCase } from "@/application/useCases/interfaces/user/session/IGetBookedSlotsUseCase";
import { IRateSessionUseCase } from "@/application/useCases/interfaces/user/rating/IRateSessionUseCase";


// (Developer Sessions)
import { IGetSessionRequestsUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetSessionRequestsUseCase";
import { IAcceptSessionRequestUseCase } from "@/application/useCases/interfaces/developer/sessions/IAcceptSessionRequestUseCase";
import { IRejectSessionRequestUseCase } from "@/application/useCases/interfaces/developer/sessions/IRejectSessionRequestUseCase";
import { IGetSessionRequestDetailsUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetSessionRequestDetailsUseCase";
import { IGetScheduledSessionsUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetScheduledSessionsUseCase";
import { IGetScheduledSessionDetailsUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetScheduledSessionDetailsUseCase";
import { IGetDeveloperUnavailableSlotsUseCase } from "@/application/useCases/interfaces/user/availability/IGetDeveloperUnavailableSlotsUseCase";
import { IGetDeveloperSessionHistoryUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetDeveloperSessionHistoryUseCase";
import { IGetDeveloperSessionHistoryDetailsUseCase } from "@/application/useCases/interfaces/developer/sessions/IGetDeveloperSessionHistoryDetailsUseCase";
import { IStartSessionUseCase } from "@/application/useCases/interfaces/developer/sessions/IStartSessionUseCase";

// (Video)
import { IInitVideoSessionUseCase } from "@/application/useCases/interfaces/video/IInitVideoSessionUseCase";
import { IJoinVideoSessionUseCase } from "@/application/useCases/interfaces/video/IJoinVideoSessionUseCase";
import { IEndVideoSessionUseCase } from "@/application/useCases/interfaces/video/IEndVideoSessionUseCase";
import { ILeaveVideoSessionUseCase } from "@/application/useCases/interfaces/video/ILeaveVideoSessionUseCase";
import { IGetVideoSessionUseCase } from "@/application/useCases/interfaces/video/IGetVideoSessionUseCase";

// (Admin)
import { IAdminLoginUseCase } from "@/application/useCases/interfaces/admin/auth/IAdminLoginUseCase";
import { IGetUsersUseCase } from "@/application/useCases/interfaces/admin/users/IGetUsersUseCase";
import { IToggleUserStatusUseCase } from "@/application/useCases/interfaces/admin/users/IToggleUserStatusUseCase";
import { IGetUserDetailsUseCase } from "@/application/useCases/interfaces/admin/users/IGetUserDetailsUseCase";
import { IGetDevelopersUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDevelopersUseCase";
import { IManageDeveloperRequestsUseCase } from "@/application/useCases/interfaces/admin/developers/IManageDeveloperRequestsUseCase";
import { IGetDeveloperDetailsUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDeveloperDetailsUseCase";
import { IGetDeveloperRequestDetailsUseCase } from "@/application/useCases/interfaces/admin/developers/IGetDeveloperRequestDetailsUseCase";
import { IGetDashboardStatsUseCase } from "@/application/useCases/interfaces/admin/dashboard/IGetDashboardStatsUseCase";
import { IGetRevenueStatsUseCase } from "@/application/useCases/interfaces/admin/revenue/IGetRevenueStatsUseCase";
import { IGetAdminSessionsUseCase } from "@/application/useCases/interfaces/admin/sessions/IGetAdminSessionsUseCase";
import { IGetDeveloperLeaderboardUseCase } from "@/application/useCases/interfaces/admin/leaderboard/IGetDeveloperLeaderboardUseCase";

// (Notifications)
import { ICreateNotificationUseCase } from "@/application/useCases/interfaces/notification/ICreateNotificationUseCase";
import { IGetNotificationsUseCase } from "@/application/useCases/interfaces/notification/IGetNotificationsUseCase";
import { IMarkNotificationAsReadUseCase } from "@/application/useCases/interfaces/notification/IMarkNotificationAsReadUseCase";
import { IMarkAllNotificationsAsReadUseCase } from "@/application/useCases/interfaces/notification/IMarkAllNotificationsAsReadUseCase";
import { IDeleteNotificationUseCase } from "@/application/useCases/interfaces/notification/IDeleteNotificationUseCase";
import { IGetUnreadCountUseCase } from "@/application/useCases/interfaces/notification/IGetUnreadCountUseCase";

// (Chat)
import { ICreateChatUseCase } from "@/application/useCases/interfaces/chat/ICreateChatUseCase";
import { IGetUserChatsUseCase } from "@/application/useCases/interfaces/chat/IGetUserChatsUseCase";
import { IGetDeveloperChatsUseCase } from "@/application/useCases/interfaces/chat/IGetDeveloperChatsUseCase";
import { IGetChatMessagesUseCase } from "@/application/useCases/interfaces/chat/IGetChatMessagesUseCase";
import { ISendMessageUseCase } from "@/application/useCases/interfaces/chat/ISendMessageUseCase";
import { IMarkMessagesAsReadUseCase } from "@/application/useCases/interfaces/chat/IMarkMessagesAsReadUseCase";
import { IGetChatByIdUseCase } from "@/application/useCases/interfaces/chat/IGetChatByIdUseCase";

// (Payment)
import { ICreatePaymentSessionUseCase } from "@/application/useCases/interfaces/user/payment/ICreatePaymentSessionUseCase";
import { IProcessPaymentWebhookUseCase } from "@/application/useCases/interfaces/user/payment/IProcessPaymentWebhookUseCase";
import { ITransferToDevWalletUseCase } from "@/application/useCases/interfaces/user/payment/ITransferToDevWalletUseCase";
import { IGetWalletDetailsUseCase } from "@/application/useCases/interfaces/user/payment/IGetWalletDetailsUseCase";
import { IGetAdminWalletDetailsUseCase } from "@/application/useCases/interfaces/user/payment/IGetAdminWalletDetailsUseCase";

// (Google Auth)
import { IGoogleLoginUseCase } from "@/application/useCases/interfaces/googleAuth/IGoogleLoginUseCase";

// ---------------------- Use Case Implementations ----------------------
import { LoginUserUseCase } from "@/application/useCases/implements/user/auth/LoginUserUseCase";
import { RegisterUserUseCase } from "@/application/useCases/implements/user/auth/RegisterUserUseCase";
import { VerifyOTPUseCase } from "@/application/useCases/implements/user/auth/VerifyOTPUseCase";
import { ResendOTPUseCase } from "@/application/useCases/implements/user/auth/ResendOTPUseCase";
import { ForgotPasswordUseCase } from "@/application/useCases/implements/user/auth/ForgotPasswordUseCase";
import { ResetPasswordUseCase } from "@/application/useCases/implements/user/auth/ResetPasswordUseCase";
import { SetNewTokenUseCase } from "@/application/useCases/implements/user/auth/SetNewTokenUseCase";

import { RegisterDevUseCase } from "@/application/useCases/implements/developer/auth/RegisterDevUseCase";
import { DevRequestUseCase } from "@/application/useCases/implements/developer/auth/DevRequestUseCase";
import { DevLoginUseCase } from "@/application/useCases/implements/developer/auth/DevLoginUseCase";

import { GetDeveloperProfileUseCase } from "@/application/useCases/implements/developer/profile/GetDeveloperProfileUseCase";
import { UpdateDeveloperProfileUseCase } from "@/application/useCases/implements/developer/profile/UpdateDeveloperProfileUseCase";
import { AddProjectUseCase } from "@/application/useCases/implements/developer/profile/AddProjectUseCase";
import { GetDeveloperProjectsUseCase } from "@/application/useCases/implements/developer/profile/GetDeveloperProjectsUseCase";
import { GetDeveloperProjectUseCase } from "@/application/useCases/implements/developer/profile/GetDeveloperProjectUseCase";
import { UpdateProjectUseCase } from "@/application/useCases/implements/developer/profile/UpdateProjectUseCase";
import { DeleteProjectUseCase } from "@/application/useCases/implements/developer/profile/DeleteProjectUseCase";
import { ManageDeveloperUnavailabilityUseCase } from "@/application/useCases/implements/developer/availability/ManageDeveloperUnavailabilityUseCase";
import { ManageDefaultSlotsUseCase } from "@/application/useCases/implements/developer/availability/ManageDefaultSlotsUseCase";
import { GetDeveloperReviewsUseCase } from "@/application/useCases/implements/developer/reviews/GetDeveloperReviewsUseCase";
import { GetDeveloperMonthlyStatsUseCase } from "@/application/useCases/implements/developer/dashboard/GetDeveloperMonthlyStatsUseCase";
import { GetDeveloperUpcomingSessionsUseCase } from "@/application/useCases/implements/developer/dashboard/GetDeveloperUpcomingSessionsUseCase";

import { GetUserProfileUseCase } from "@/application/useCases/implements/user/profile/GetUserProfileUseCase";
import { UpdateUserProfileUseCase } from "@/application/useCases/implements/user/profile/UpdateUserProfileUseCase";
import { SearchDevelopersUseCase } from "@/application/useCases/implements/user/developers/SearchDevelopersUseCase";
import { GetPublicProfileUseCase } from "@/application/useCases/implements/user/developers/GetPublicProfileUseCase";
import { ChangeUserPasswordUseCase } from "@/application/useCases/implements/user/profile/ChangeUserPasswordUseCase";

import { CreateSessionUseCase } from "@/application/useCases/implements/user/session/CreateSessionUseCase";
import { GetUserSessionsUseCase } from "@/application/useCases/implements/user/session/GetUserSessionsUseCase";
import { GetUpcomingSessionsUseCase } from "@/application/useCases/implements/user/session/GetUpcomingSessionsUseCase";
import { GetSessionDetailsUseCase } from "@/application/useCases/implements/user/session/GetSessionDetailsUseCase";
import { GetSessionHistoryUseCase } from "@/application/useCases/implements/user/session/GetSessionHistoryUseCase";
import { CancelSessionUseCase } from "@/application/useCases/implements/user/session/CancelSessionUseCase";
import { GetBookedSlotsUseCase } from "@/application/useCases/implements/user/session/GetBookedSlotsUseCase";
import { RateSessionUseCase } from "@/application/useCases/implements/user/rating/RateSessionUseCase";

import { GetSessionRequestsUseCase } from "@/application/useCases/implements/developer/sessions/GetSessionRequestsUseCase";
import { AcceptSessionRequestUseCase } from "@/application/useCases/implements/developer/sessions/AcceptSessionRequestUseCase";
import { RejectSessionRequestUseCase } from "@/application/useCases/implements/developer/sessions/RejectSessionRequestUseCase";
import { GetSessionRequestDetailsUseCase } from "@/application/useCases/implements/developer/sessions/GetSessionRequestDetailsUseCase";
import { GetScheduledSessionsUseCase } from "@/application/useCases/implements/developer/sessions/GetScheduledSessionsUseCase";
import { GetScheduledSessionDetailsUseCase } from "@/application/useCases/implements/developer/sessions/GetScheduledSessionDetailsUseCase";
import { GetDeveloperUnavailableSlotsUseCase } from "@/application/useCases/implements/user/availability/GetDeveloperUnavailableSlotsUseCase";
import { GetDeveloperSessionHistoryUseCase } from "@/application/useCases/implements/developer/sessions/GetDeveloperSessionHistoryUseCase";
import { GetDeveloperSessionHistoryDetailsUseCase } from "@/application/useCases/implements/developer/sessions/GetDeveloperSessionHistoryDetailsUseCase";
import { StartSessionUseCase } from "@/application/useCases/implements/developer/sessions/StartSessionUseCase";

import { InitVideoSessionUseCase } from "@/application/useCases/implements/video/InitVideoSessionUseCase";
import { JoinVideoSessionUseCase } from "@/application/useCases/implements/video/JoinVideoSessionUseCase";
import { EndVideoSessionUseCase } from "@/application/useCases/implements/video/EndVideoSessionUseCase";
import { LeaveVideoSessionUseCase } from "@/application/useCases/implements/video/LeaveVideoSessionUseCase";
import { GetVideoSessionUseCase } from "@/application/useCases/implements/video/GetVideoSessionUsecase";

import { CreateNotificationUseCase } from "@/application/useCases/implements/notification/CreateNotificationUseCase";
import { GetNotificationsUseCase } from "@/application/useCases/implements/notification/GetNotificationsUseCase";
import { MarkNotificationAsReadUseCase } from "@/application/useCases/implements/notification/MarkNotificationAsReadUseCase";
import { MarkAllNotificationsAsReadUseCase } from "@/application/useCases/implements/notification/MarkAllNotificationsAsReadUseCase";
import { DeleteNotificationUseCase } from "@/application/useCases/implements/notification/DeleteNotificationUseCase";
import { GetUnreadCountUseCase } from "@/application/useCases/implements/notification/GetUnreadCountUseCase";

import { CreateChatUseCase } from "@/application/useCases/implements/chat/CreateChatUseCase";
import { GetUserChatsUseCase } from "@/application/useCases/implements/chat/GetUserChatsUseCase";
import { GetDeveloperChatsUseCase } from "@/application/useCases/implements/chat/GetDeveloperChatsUseCase";
import { GetChatMessagesUseCase } from "@/application/useCases/implements/chat/GetChatMessagesUseCase";
import { SendMessageUseCase } from "@/application/useCases/implements/chat/SendMessageUseCase";
import { MarkMessagesAsReadUseCase } from "@/application/useCases/implements/chat/MarkMessagesAsReadUseCase";
import { GetChatByIdUseCase } from "@/application/useCases/implements/chat/GetChatByIdUseCase";

import { CreatePaymentSessionUseCase } from "@/application/useCases/implements/user/payment/CreatePaymentSessionUseCase";
import { ProcessPaymentWebhookUseCase } from "@/application/useCases/implements/user/payment/ProcessPaymentWebhookUseCase";
import { TransferToDevWalletUseCase } from "@/application/useCases/implements/user/payment/TransferToDevWalletUseCase";
import { GetWalletDetailsUseCase } from "@/application/useCases/implements/user/payment/GetWalletDetailsUseCase";
import { GetAdminWalletDetailsUseCase } from "@/application/useCases/implements/user/payment/GetAdminWalletDetailsUseCase";

import { AdminLoginUseCase } from "@/application/useCases/implements/admin/auth/AdminLoginUseCase";
import { GetUsersUseCase } from "@/application/useCases/implements/admin/users/GetUsersUseCase";
import { ToggleUserStatusUseCase } from "@/application/useCases/implements/admin/users/ToggleUserStatusUseCase";
import { GetUserDetailsUseCase } from "@/application/useCases/implements/admin/users/GetUserDetailsUseCase";
import { GetDevelopersUseCase } from "@/application/useCases/implements/admin/developers/GetDevelopersUseCase";
import { ManageDeveloperRequestsUseCase } from "@/application/useCases/implements/admin/developers/ManageDeveloperRequestsUseCase";
import { GetDeveloperDetailsUseCase } from "@/application/useCases/implements/admin/developers/GetDeveloperDetailsUseCase";
import { GetDeveloperRequestDetailsUseCase } from "@/application/useCases/implements/admin/developers/GetDeveloperRequestDetails";
import { GetDashboardStatsUseCase } from "@/application/useCases/implements/admin/dashboard/GetDashboardStatsUseCase";
import { GetRevenueStatsUseCase } from "@/application/useCases/implements/admin/revenue/GetRevenueStatsUseCase";
import { GetAdminSessionsUseCase } from "@/application/useCases/implements/admin/sessions/GetAdminSessionsUseCase";
import { GetDeveloperLeaderboardUseCase } from "@/application/useCases/implements/admin/leaderboard/GetDeveloperLeaderboardUseCase";

import { GoogleLoginUseCase } from "@/application/useCases/implements/googleAuth/GoogleLoginUseCase";

// ---------------------- Controllers ----------------------
import { UserController } from "@/presentation/controllers/UserController";
import { DevController } from "@/presentation/controllers/DevController";
import { DevAuthController } from "@/presentation/controllers/DevAuthController";
import { SessionController } from "@/presentation/controllers/SessionController";
import { NotificationController } from "@/presentation/controllers/NotificationController";
import { ChatController } from "@/presentation/controllers/ChatController";
import { PaymentController } from "@/presentation/controllers/PaymentController";
import { AdminController } from "@/presentation/controllers/AdminController";
import { AuthController } from "@/presentation/controllers/AuthController";
import { GoogleAuthController } from "@/presentation/controllers/GoogleAuthController";
import { VideoSessionController } from "@/presentation/controllers/VideoSessionController";

const container = new Container();

// Bind the server instance
container.bind<HttpServer>('HttpServer').toConstantValue(httpServer);
container.bind<SocketServer>('SocketServer').toConstantValue(io);

//Repositories
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository).inSingletonScope();
container.bind<IAdminRepository>(TYPES.IAdminRepository).to(AdminRepository).inSingletonScope();
container.bind<IOTPRepository>(TYPES.IOTPRepository).to(OTPRepository).inSingletonScope();
container.bind<IWalletRepository>(TYPES.IWalletRepository).to(WalletRepository).inSingletonScope();
container.bind<IDeveloperRepository>(TYPES.IDeveloperRepository).to(DeveloperRepository).inSingletonScope();
container.bind<IDeveloperSlotRepository>(TYPES.IDeveloperSlotRepository).to(DeveloperSlotRepository).inSingletonScope();
container.bind<IProjectRepository>(TYPES.IProjectRepository).to(ProjectRepository).inSingletonScope();
container.bind<ISessionRepository>(TYPES.ISessionRepository).to(SessionRepository).inSingletonScope();
container.bind<IRatingRepository>(TYPES.IRatingRepository).to(RatingRepository).inSingletonScope();
container.bind<INotificationRepository>(TYPES.INotificationRepository).to(NotificationRepository).inSingletonScope();
container.bind<IChatRepository>(TYPES.IChatRepository).to(ChatRepository).inSingletonScope();
container.bind<IMessageRepository>(TYPES.IMessageRepository).to(MessageRepository).inSingletonScope();
container.bind<IPaymentRepository>(TYPES.IPaymentRepository).to(PaymentRepository).inSingletonScope();
container.bind<IVideoSessionRepository>(TYPES.IVideoSessionRepository).to(VideoSessionRepository).inSingletonScope();

container.bind<IMailService>(TYPES.IMailService).to(MailService);
container.bind<IS3Service>(TYPES.IS3Service).to(S3Service);
container.bind<ISocketService>(TYPES.ISocketService).to(SocketService).inSingletonScope();
container.bind<INotificationService>(TYPES.INotificationService).to(NotificationService).inSingletonScope();
container.bind<IPaymentService>(TYPES.IPaymentService).to(StripeService);

//User Auth Usecase
container.bind<IRegisterUserUseCase>(TYPES.IRegisterUserUseCase).to(RegisterUserUseCase);
container.bind<IVerifyOTPUseCase>(TYPES.IVerifyOTPUseCase).to(VerifyOTPUseCase);
container.bind<IResendOTPUseCase>(TYPES.IResendOTPUseCase).to(ResendOTPUseCase);
container.bind<ILoginUserUseCase>(TYPES.ILoginUserUseCase).to(LoginUserUseCase);
container.bind<IForgotPasswordUseCase>(TYPES.IForgotPasswordUseCase).to(ForgotPasswordUseCase);
container.bind<IResetPasswordUseCase>(TYPES.IResetPasswordUseCase).to(ResetPasswordUseCase);
container.bind<ISetNewTokenUseCase>(TYPES.ISetNewTokenUseCase).to(SetNewTokenUseCase);

//Google Auth Usecase
container.bind<IGoogleLoginUseCase>(TYPES.IGoogleLoginUseCase).to(GoogleLoginUseCase);

//User Usecase
container.bind<IGetUserProfileUseCase>(TYPES.IGetUserProfileUseCase).to(GetUserProfileUseCase);
container.bind<IUpdateUserProfileUseCase>(TYPES.IUpdateUserProfileUseCase).to(UpdateUserProfileUseCase);
container.bind<ISearchDevelopersUseCase>(TYPES.ISearchDevelopersUseCase).to(SearchDevelopersUseCase);
container.bind<IGetPublicProfileUseCase>(TYPES.IGetPublicProfileUseCase).to(GetPublicProfileUseCase);
container.bind<IChangeUserPasswordUseCase>(TYPES.IChangeUserPasswordUseCase).to(ChangeUserPasswordUseCase);

//Developer Auth Usecase
container.bind<IRegisterDevUseCase>(TYPES.IRegisterDevUseCase).to(RegisterDevUseCase);
container.bind<IDevRequestUseCase>(TYPES.IDevRequestUseCase).to(DevRequestUseCase);
container.bind<IDevLoginUseCase>(TYPES.IDevLoginUseCase).to(DevLoginUseCase);

// Developer UseCase 
container.bind<IGetDeveloperProfileUseCase>(TYPES.IGetDeveloperProfileUseCase).to(GetDeveloperProfileUseCase);
container.bind<IUpdateDeveloperProfileUseCase>(TYPES.IUpdateDeveloperProfileUseCase).to(UpdateDeveloperProfileUseCase);
container.bind<IAddProjectUseCase>(TYPES.IAddProjectUseCase).to(AddProjectUseCase);
container.bind<IGetDeveloperProjectsUseCase>(TYPES.IGetDeveloperProjectsUseCase).to(GetDeveloperProjectsUseCase);
container.bind<IGetDeveloperProjectUseCase>(TYPES.IGetDeveloperProjectUseCase).to(GetDeveloperProjectUseCase);
container.bind<IUpdateProjectUseCase>(TYPES.IUpdateProjectUseCase).to(UpdateProjectUseCase);
container.bind<IDeleteProjectUseCase>(TYPES.IDeleteProjectUseCase).to(DeleteProjectUseCase);
container.bind<IManageDeveloperUnavailabilityUseCase>(TYPES.IManageDeveloperUnavailabilityUseCase).to(ManageDeveloperUnavailabilityUseCase);
container.bind<IManageDefaultSlotsUseCase>(TYPES.IManageDefaultSlotsUseCase).to(ManageDefaultSlotsUseCase);
container.bind<IGetDeveloperReviewsUseCase>(TYPES.IGetDeveloperReviewsUseCase).to(GetDeveloperReviewsUseCase);
container.bind<IGetDeveloperMonthlyStatsUseCase>(TYPES.IGetDeveloperMonthlyStatsUseCase).to(GetDeveloperMonthlyStatsUseCase);
container.bind<IGetDeveloperUpcomingSessionsUseCase>(TYPES.IGetDeveloperUpcomingSessionsUseCase).to(GetDeveloperUpcomingSessionsUseCase);

//Session Usecases
container.bind<ICreateSessionUseCase>(TYPES.ICreateSessionUseCase).to(CreateSessionUseCase);
container.bind<IGetUserSessionsUseCase>(TYPES.IGetUserSessionsUseCase).to(GetUserSessionsUseCase);
container.bind<IGetUpcomingSessionsUseCase>(TYPES.IGetUpcomingSessionsUseCase).to(GetUpcomingSessionsUseCase);
container.bind<IGetSessionRequestsUseCase>(TYPES.IGetSessionRequestsUseCase).to(GetSessionRequestsUseCase);
container.bind<IAcceptSessionRequestUseCase>(TYPES.IAcceptSessionRequestUseCase).to(AcceptSessionRequestUseCase);
container.bind<IRejectSessionRequestUseCase>(TYPES.IRejectSessionRequestUseCase).to(RejectSessionRequestUseCase);
container.bind<IGetSessionDetailsUseCase>(TYPES.IGetSessionDetailsUseCase).to(GetSessionDetailsUseCase);
container.bind<IGetSessionRequestDetailsUseCase>(TYPES.IGetSessionRequestDetailsUseCase).to(GetSessionRequestDetailsUseCase);
container.bind<IGetScheduledSessionsUseCase>(TYPES.IGetScheduledSessionsUseCase).to(GetScheduledSessionsUseCase);
container.bind<IGetScheduledSessionDetailsUseCase>(TYPES.IGetScheduledSessionDetailsUseCase).to(GetScheduledSessionDetailsUseCase);
container.bind<IGetDeveloperUnavailableSlotsUseCase>(TYPES.IGetDeveloperUnavailableSlotsUseCase).to(GetDeveloperUnavailableSlotsUseCase);
container.bind<IGetSessionHistoryUseCase>(TYPES.IGetSessionHistoryUseCase).to(GetSessionHistoryUseCase);
container.bind<IRateSessionUseCase>(TYPES.IRateSessionUseCase).to(RateSessionUseCase);
container.bind<IGetDeveloperSessionHistoryUseCase>(TYPES.IGetDeveloperSessionHistoryUseCase).to(GetDeveloperSessionHistoryUseCase);
container.bind<IGetDeveloperSessionHistoryDetailsUseCase>(TYPES.IGetDeveloperSessionHistoryDetailsUseCase).to(GetDeveloperSessionHistoryDetailsUseCase);
container.bind<IStartSessionUseCase>(TYPES.IStartSessionUseCase).to(StartSessionUseCase);
container.bind<ICancelSessionUseCase>(TYPES.ICancelSessionUseCase).to(CancelSessionUseCase);
container.bind<IGetBookedSlotsUseCase>(TYPES.IGetBookedSlotsUseCase).to(GetBookedSlotsUseCase);

//Notification usecase
container.bind<ICreateNotificationUseCase>(TYPES.ICreateNotificationUseCase).to(CreateNotificationUseCase);
container.bind<IGetNotificationsUseCase>(TYPES.IGetNotificationsUseCase).to(GetNotificationsUseCase);
container.bind<IMarkNotificationAsReadUseCase>(TYPES.IMarkNotificationAsReadUseCase).to(MarkNotificationAsReadUseCase);
container.bind<IMarkAllNotificationsAsReadUseCase>(TYPES.IMarkAllNotificationsAsReadUseCase).to(MarkAllNotificationsAsReadUseCase);
container.bind<IDeleteNotificationUseCase>(TYPES.IDeleteNotificationUseCase).to(DeleteNotificationUseCase);
container.bind<IGetUnreadCountUseCase>(TYPES.IGetUnreadCountUseCase).to(GetUnreadCountUseCase);

//Chat usecase
container.bind<ICreateChatUseCase>(TYPES.ICreateChatUseCase).to(CreateChatUseCase);
container.bind<IGetUserChatsUseCase>(TYPES.IGetUserChatsUseCase).to(GetUserChatsUseCase);
container.bind<IGetDeveloperChatsUseCase>(TYPES.IGetDeveloperChatsUseCase).to(GetDeveloperChatsUseCase);
container.bind<IGetChatMessagesUseCase>(TYPES.IGetChatMessagesUseCase).to(GetChatMessagesUseCase);
container.bind<ISendMessageUseCase>(TYPES.ISendMessageUseCase).to(SendMessageUseCase);
container.bind<IMarkMessagesAsReadUseCase>(TYPES.IMarkMessagesAsReadUseCase).to(MarkMessagesAsReadUseCase);
container.bind<IGetChatByIdUseCase>(TYPES.IGetChatByIdUseCase).to(GetChatByIdUseCase);

//Payment usecase
container.bind<ICreatePaymentSessionUseCase>(TYPES.ICreatePaymentSessionUseCase).to(CreatePaymentSessionUseCase);
container.bind<IProcessPaymentWebhookUseCase>(TYPES.IProcessPaymentWebhookUseCase).to(ProcessPaymentWebhookUseCase);
container.bind<ITransferToDevWalletUseCase>(TYPES.ITransferToDevWalletUseCase).to(TransferToDevWalletUseCase);
container.bind<IGetWalletDetailsUseCase>(TYPES.IGetWalletDetailsUseCase).to(GetWalletDetailsUseCase);
container.bind<IGetAdminWalletDetailsUseCase>(TYPES.IGetAdminWalletDetailsUseCase).to(GetAdminWalletDetailsUseCase);

//VideoChat usecase
container.bind<IInitVideoSessionUseCase>(TYPES.IInitVideoSessionUseCase).to(InitVideoSessionUseCase);
container.bind<IJoinVideoSessionUseCase>(TYPES.IJoinVideoSessionUseCase).to(JoinVideoSessionUseCase);
container.bind<IEndVideoSessionUseCase>(TYPES.IEndVideoSessionUseCase).to(EndVideoSessionUseCase);
container.bind<ILeaveVideoSessionUseCase>(TYPES.ILeaveVideoSessionUseCase).to(LeaveVideoSessionUseCase);
container.bind<IGetVideoSessionUseCase>(TYPES.IGetVideoSessionUseCase).to(GetVideoSessionUseCase);

//Admin usecase
container.bind<IAdminLoginUseCase>(TYPES.IAdminLoginUseCase).to(AdminLoginUseCase);
container.bind<IGetUsersUseCase>(TYPES.IGetUsersUseCase).to(GetUsersUseCase);
container.bind<IToggleUserStatusUseCase>(TYPES.IToggleUserStatusUseCase).to(ToggleUserStatusUseCase);
container.bind<IGetUserDetailsUseCase>(TYPES.IGetUserDetailsUseCase).to(GetUserDetailsUseCase);
container.bind<IGetDevelopersUseCase>(TYPES.IGetDevelopersUseCase).to(GetDevelopersUseCase);
container.bind<IManageDeveloperRequestsUseCase>(TYPES.IManageDeveloperRequestsUseCase).to(ManageDeveloperRequestsUseCase);
container.bind<IGetDeveloperDetailsUseCase>(TYPES.IGetDeveloperDetailsUseCase).to(GetDeveloperDetailsUseCase);
container.bind<IGetDeveloperRequestDetailsUseCase>(TYPES.IGetDeveloperRequestDetailsUseCase).to(GetDeveloperRequestDetailsUseCase);
container.bind<IGetDashboardStatsUseCase>(TYPES.IGetDashboardStatsUseCase).to(GetDashboardStatsUseCase);
container.bind<IGetRevenueStatsUseCase>(TYPES.IGetRevenueStatsUseCase).to(GetRevenueStatsUseCase);
container.bind<IGetAdminSessionsUseCase>(TYPES.IGetAdminSessionsUseCase).to(GetAdminSessionsUseCase);
container.bind<IGetDeveloperLeaderboardUseCase>(TYPES.IGetDeveloperLeaderboardUseCase).to(GetDeveloperLeaderboardUseCase);

//Controllers
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<GoogleAuthController>(TYPES.GoogleAuthController).to(GoogleAuthController);
container.bind<DevAuthController>(TYPES.DevAuthController).to(DevAuthController);
container.bind<DevController>(TYPES.DevController).to(DevController);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<SessionController>(TYPES.SessionController).to(SessionController);
container.bind<NotificationController>(TYPES.NotificationController).to(NotificationController);
container.bind<ChatController>(TYPES.ChatController).to(ChatController);
container.bind<PaymentController>(TYPES.PaymentController).to(PaymentController);
container.bind<VideoSessionController>(TYPES.VideoSessionController).to(VideoSessionController);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);


export { container };
