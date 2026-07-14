import express from "express";
import UserRouters from "../modules/user/user.route";
import AuthRouter from "../modules/auth/auth.route";
import SettingsRoutes from "../settings/settings.routres";
import RoueEvents from "../modules/event/event.route";
import eventPosts from "../modules/event_post/event_post.route";
import joinEventGroupRoutes from "../modules/join_event_group/join_event_group.route";
import eventChatRoomRoutes from "../modules/event_chatroom/event_chatroom.route";
import eventSocialPost from "../modules/react_event_post/react_event_post.route";
import eventRepliersCommentRoute from "../modules/event_replies_comment/event_replies_comment.route";
import SocialFeedRoute from "../modules/social_feed/social_feed.route";
import FavoriteEventRoutes from "../modules/favorite_event/favorite_event.route";
import MemoriesEventRoutes from "../modules/upload_memories_event/upload_memories_event.route";
import ReportRoutes from "../modules/report/report.route";
import FollowupRouters from "../modules/followup/followup.route";
import paymentRoutes from "../modules/payment_gateway/payment_gateway.route";
import { conversationRoutes } from "../modules/conversation/conversation.route";
import NotificationRoutes from "../modules/notification/notification.route";
import messageRoutes from "../modules/message/message.routes";
import SocialFeedReportRoute from "../modules/socialfeedreport/socialfeedreport.route";
import PointSystemRouter from "../modules/pointsystem/pointsystem.route";
import RatingRouter from "../modules/rating/rating.route";
import SupportRouter from "../modules/support/support.route";
import storeReactRoute from "../modules/stote_react/stote_react.route";


const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRouters,
  },
  {
    path: "/auth",
    route: AuthRouter,
  },
  {
    path: "/event",
    route: RoueEvents,
  },
  {
    path: "/setting",
    route: SettingsRoutes,
  },
  {
    path: "/event_post",
    route: eventPosts,
  },
  {
    path: "/join_group",
    route: joinEventGroupRoutes,
  },
  {
    path: "/event_chat_room",
    route: eventChatRoomRoutes,
  },
  {
    path:"/event_social_post",
    route:eventSocialPost
  },
  {path:"/event_post_reply", route: eventRepliersCommentRoute},
  {
    path:"/social_feed_route", route:SocialFeedRoute
  },
  {
    path:"/favorite_event", route:FavoriteEventRoutes
  },
  {
    path:"/memories_event", route:  MemoriesEventRoutes
  },
  {
    path:"/reports", route: ReportRoutes
  },
  {
    path:"/followup", route: FollowupRouters

  },
  {
    path:"/payment", route: paymentRoutes
  },
  {
    path:"/conversation", route:  conversationRoutes
  },
  {
    path:"/notification", route:  NotificationRoutes
  },
  {
    path:"/message", route: messageRoutes
  },
  {
    path:"/social_feed_report", route: SocialFeedReportRoute
  },
  {
    path:"/point_system", route: PointSystemRouter
  },
  {
    path:"/rating", route:RatingRouter
  },
  {
    path:"/support", route : SupportRouter
  },
  {
    path:"/store_react", route: storeReactRoute
  }
    
  
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
