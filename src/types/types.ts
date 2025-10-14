export const TYPES = {
    // ===== Repositories (Domain Layer) =====
    IUserRepository: Symbol.for("IUserRepository"),
    IOTPRepository: Symbol.for("IOTPRepository"),
    IWalletRepository: Symbol.for("IWalletRepository"),
    IDeveloperRepository: Symbol.for("IDeveloperRepository"),
    IDeveloperSlotRepository: Symbol.for("IDeveloperSlotRepository"),
    IProjectRepository: Symbol.for("IProjectRepository"),
    ISessionRepository: Symbol.for("ISessionRepository"),
    IRatingRepository: Symbol.for("IRatingRepository"),
    INotificationRepository: Symbol.for("INotificationRepository"),
    IChatRepository: Symbol.for("IChatRepository"),
    IMessageRepository: Symbol.for("IMessageRepository"),
    IPaymentRepository: Symbol.for("IPaymentRepository"),
    IVideoSessionRepository: Symbol.for("IVideoSessionRepository"),
    IAdminRepository: Symbol.for("IAdminRepository"),


    // ===== Services (Infrastructure Layer) =====
    IMailService: Symbol.for("IMailService"),
    IS3Service: Symbol.for("IS3Service"),
    ISocketService: Symbol.for("ISocketService"),
    INotificationService: Symbol.for("INotificationService"),
    IPaymentService: Symbol.for("IPaymentService"),
   

    // ===== Use Cases (Application Layer) =====
    // User Auth
    IRegisterUserUseCase: Symbol.for("IRegisterUserUseCase"),
    IVerifyOTPUseCase: Symbol.for("IVerifyOTPUseCase"),
    IResendOTPUseCase: Symbol.for("IResendOTPUseCase"),
    ILoginUserUseCase: Symbol.for("ILoginUserUseCase"),
    IForgotPasswordUseCase: Symbol.for("IForgotPasswordUseCase"),
    IResetPasswordUseCase: Symbol.for("IResetPasswordUseCase"),
    ISetNewTokenUseCase: Symbol.for("ISetNewTokenUseCase"),

    //Google Auth
    IGoogleLoginUseCase: Symbol.for("IGoogleLoginUseCase"),

    //User
    IGetUserProfileUseCase: Symbol.for("IGetUserProfileUseCase"),
    IUpdateUserProfileUseCase: Symbol.for("IUpdateUserProfileUseCase"),
    ISearchDevelopersUseCase: Symbol.for("ISearchDevelopersUseCase"),
    IGetPublicProfileUseCase: Symbol.for("IGetPublicProfileUseCase"),
    IChangeUserPasswordUseCase: Symbol.for("IChangeUserPasswordUseCase"),

    // Developer Auth
    IRegisterDevUseCase: Symbol.for("IRegisterDevUseCase"),
    IDevRequestUseCase: Symbol.for("IDevRequestUseCase"),
    IDevLoginUseCase: Symbol.for("IDevLoginUseCase"),

    // Developer Profile & Project
    IGetDeveloperProfileUseCase: Symbol.for("IGetDeveloperProfileUseCase"),
    IUpdateDeveloperProfileUseCase: Symbol.for("IUpdateDeveloperProfileUseCase"),
    IAddProjectUseCase: Symbol.for("IAddProjectUseCase"),
    IGetDeveloperProjectsUseCase: Symbol.for("IGetDeveloperProjectsUseCase"),
    IGetDeveloperProjectUseCase: Symbol.for("IGetDeveloperProjectUseCase"),
    IUpdateProjectUseCase: Symbol.for("IUpdateProjectUseCase"),
    IDeleteProjectUseCase: Symbol.for("IDeleteProjectUseCase"),
    IManageDeveloperUnavailabilityUseCase: Symbol.for("IManageDeveloperUnavailabilityUseCase"),
    IManageDefaultSlotsUseCase: Symbol.for("IManageDefaultSlotsUseCase"),
    IGetDeveloperReviewsUseCase: Symbol.for("IGetDeveloperReviewsUseCase"),
    IGetDeveloperMonthlyStatsUseCase: Symbol.for("IGetDeveloperMonthlyStatsUseCase"),
    IGetDeveloperUpcomingSessionsUseCase: Symbol.for("IGetDeveloperUpcomingSessionsUseCase"),

    // Session Use Cases
    ICreateSessionUseCase: Symbol.for("ICreateSessionUseCase"),
    IGetUserSessionsUseCase: Symbol.for("IGetUserSessionsUseCase"),
    IGetUpcomingSessionsUseCase: Symbol.for("IGetUpcomingSessionsUseCase"),
    IGetSessionRequestsUseCase: Symbol.for("IGetSessionRequestsUseCase"),
    IAcceptSessionRequestUseCase: Symbol.for("IAcceptSessionRequestUseCase"),
    IRejectSessionRequestUseCase: Symbol.for("IRejectSessionRequestUseCase"),
    IGetSessionDetailsUseCase: Symbol.for("IGetSessionDetailsUseCase"),
    IGetSessionRequestDetailsUseCase: Symbol.for("IGetSessionRequestDetailsUseCase"),
    IGetScheduledSessionsUseCase: Symbol.for("IGetScheduledSessionsUseCase"),
    IGetScheduledSessionDetailsUseCase: Symbol.for("IGetScheduledSessionDetailsUseCase"),
    IGetDeveloperUnavailableSlotsUseCase: Symbol.for("IGetDeveloperUnavailableSlotsUseCase"),
    IGetSessionHistoryUseCase: Symbol.for("IGetSessionHistoryUseCase"),
    IRateSessionUseCase: Symbol.for("IRateSessionUseCase"),
    IGetDeveloperSessionHistoryUseCase: Symbol.for("IGetDeveloperSessionHistoryUseCase"),
    IGetDeveloperSessionHistoryDetailsUseCase: Symbol.for("IGetDeveloperSessionHistoryDetailsUseCase"),
    IStartSessionUseCase: Symbol.for("IStartSessionUseCase"),
    ICancelSessionUseCase: Symbol.for("ICancelSessionUseCase"),
    IGetBookedSlotsUseCase: Symbol.for("IGetBookedSlotsUseCase"),

    //Notification usecase
    ICreateNotificationUseCase: Symbol.for("ICreateNotificationUseCase"),
    IGetNotificationsUseCase: Symbol.for("IGetNotificationsUseCase"),
    IMarkNotificationAsReadUseCase: Symbol.for("IMarkNotificationAsReadUseCase"),
    IMarkAllNotificationsAsReadUseCase: Symbol.for("IMarkAllNotificationsAsReadUseCase"),
    IDeleteNotificationUseCase: Symbol.for("IDeleteNotificationUseCase"),
    IGetUnreadCountUseCase: Symbol.for("IGetUnreadCountUseCase"),

    // Chat Usecases
    ICreateChatUseCase: Symbol.for("ICreateChatUseCase"),
    IGetUserChatsUseCase: Symbol.for("IGetUserChatsUseCase"),
    IGetDeveloperChatsUseCase: Symbol.for("IGetDeveloperChatsUseCase"),
    IGetChatMessagesUseCase: Symbol.for("IGetChatMessagesUseCase"),
    ISendMessageUseCase: Symbol.for("ISendMessageUseCase"),
    IMarkMessagesAsReadUseCase: Symbol.for("IMarkMessagesAsReadUseCase"),
    IGetChatByIdUseCase: Symbol.for("IGetChatByIdUseCase"),

    //Payment Usecases
    ICreatePaymentSessionUseCase: Symbol.for("ICreatePaymentSessionUseCase"),
    IProcessPaymentWebhookUseCase: Symbol.for("IProcessPaymentWebhookUseCase"),
    ITransferToDevWalletUseCase: Symbol.for("ITransferToDevWalletUseCase"),
    IGetWalletDetailsUseCase: Symbol.for("IGetWalletDetailsUseCase"),
    IGetAdminWalletDetailsUseCase: Symbol.for("IGetAdminWalletDetailsUseCase"),

    //Video Session Usecases
    IInitVideoSessionUseCase: Symbol.for("IInitVideoSessionUseCase"),
    IJoinVideoSessionUseCase: Symbol.for("IJoinVideoSessionUseCase"),
    IEndVideoSessionUseCase: Symbol.for("IEndVideoSessionUseCase"),
    ILeaveVideoSessionUseCase: Symbol.for("ILeaveVideoSessionUseCase"),
    IGetVideoSessionUseCase: Symbol.for("IGetVideoSessionUseCase"),

    //Admin UseCases
    IAdminLoginUseCase: Symbol.for("IAdminLoginUseCase"),
    IGetUsersUseCase: Symbol.for("IGetUsersUseCase"),
    IToggleUserStatusUseCase: Symbol.for("IToggleUserStatusUseCase"),
    IGetUserDetailsUseCase: Symbol.for("IGetUserDetailsUseCase"),
    IGetDevelopersUseCase: Symbol.for("IGetDevelopersUseCase"),
    IManageDeveloperRequestsUseCase: Symbol.for("IManageDeveloperRequestsUseCase"),
    IGetDeveloperDetailsUseCase: Symbol.for("IGetDeveloperDetailsUseCase"),
    IGetDeveloperRequestDetailsUseCase: Symbol.for("IGetDeveloperRequestDetailsUseCase"),
    IGetDashboardStatsUseCase: Symbol.for("IGetDashboardStatsUseCase"),
    IGetRevenueStatsUseCase: Symbol.for("IGetRevenueStatsUseCase"),
    IGetAdminSessionsUseCase: Symbol.for("IGetAdminSessionsUseCase"),
    IGetDeveloperLeaderboardUseCase: Symbol.for("IGetDeveloperLeaderboardUseCase"),



    // ===== Controllers (Presentation Layer) =====
    AuthController: Symbol.for("AuthController"),
    DevAuthController: Symbol.for("DevAuthController"),
    DevController: Symbol.for("DevController"),
    UserController: Symbol.for("UserController"),
    SessionController: Symbol.for("SessionController"),
    NotificationController: Symbol.for("NotificationController"),
    ChatController: Symbol.for("ChatController"),
    PaymentController: Symbol.for("PaymentController"),
    VideoSessionController: Symbol.for("VideoSessionController"),
    GoogleAuthController: Symbol.for("GoogleAuthController"),
    AdminController: Symbol.for("AdminController")
};
