import { RtcTokenBuilder, RtcRole } from "agora-token";
import config from "../../config";

interface AgoraTokenResponse {
  token: string;
  channel: string;
  eventId: string;
}

const agoraAccessToken = (
  channelName: string,
  uid: string
): AgoraTokenResponse => {
  const role = RtcRole.PUBLISHER;
  const tokenExpire = 3600;
  const privilegeExpire = 3600;

  if (!config.agoraToken.appId || !config.agoraToken.app_certificate) {
    throw new Error("Missing Agora credentials: APP_ID or APP_CERTIFICATE is not defined.");
  }

  const token = RtcTokenBuilder.buildTokenWithUid(
    config.agoraToken.appId as string,
    config.agoraToken.app_certificate as string,
    channelName,
    0,
    role,
    tokenExpire,
    privilegeExpire
  );

  return {
    token,
    channel: channelName,
    eventId: uid,
  };
};



// const agoraAccessTokenIntoDb = async (eventId: string) => {
//   const appId = process.env.AGORA_APP_ID as string;
//   const appCertificate = process.env.AGORA_APP_CERTIFICATE as string;

//   // একটাই consistent channel name ব্যবহার করো
//   const channelName = `room-${eventId}`;

//   // token expiry (example: 1 hour)
//   const privilegeExpireTime = Math.floor(Date.now() / 1000) + 3600;

//   const token = RtcTokenBuilder.buildTokenWithUid(
//     appId,
//     appCertificate,
//     channelName,
//     0,
//     RtcRole.PUBLISHER,
//     privilegeExpireTime
//   );

//   return {
//     token,
//     channel: channelName,
//     eventId,
//   };
// };

export default agoraAccessToken;