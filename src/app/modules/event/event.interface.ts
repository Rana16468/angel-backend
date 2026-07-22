import  { Schema, Document, Model, Types } from "mongoose";

export interface VenueFacility {
  type:
    | "washroom"
    | "handwashstation"
    | "smokingzone"
    | "foorcount"
    | "restarea";
  available: boolean;
  description: string;
}

export type SocialMedia = Partial<{
  content: boolean;
  gallery: boolean;
  sharing: boolean;
  streaming: boolean;
}>;

export interface NotificationSettings {
  livechat?: boolean;
  push_notifications?: boolean;
  event_countdown?: boolean;
}

export interface PointSystem {
  people: number;
  point: number;
}

export interface EventLocation {
  lat: string;
  lon: string;
}

export interface AudienceSettingsPrivate {
  age: number | string;
  max_capacity: number;
  visibility: "Private";
  email: string;
  social_media?: SocialMedia;
  notification?: NotificationSettings;
  point_system: PointSystem;
  ticket_price: "free" | "paid";
  price?: number;
  event_location: EventLocation;
}

export interface AudienceSettingsPublic {
  age: number | string;
  max_capacity: number;
  visibility: "Public";
  email?: never;
  social_media?: SocialMedia;
  notification?: NotificationSettings;
  point_system: PointSystem;
  ticket_price: "free" | "paid";
  price?: number;
  event_location: EventLocation;
}

export type AudienceSettings = AudienceSettingsPrivate | AudienceSettingsPublic;

export interface BaseEvent extends Document {
  hostId: Types.ObjectId;
  event_title: string;
  description: string;
  photo?: string;
  date: string;
  starting_time: string;
  ending_time: string;
  venue_facilities: VenueFacility[];
  event_category:
    | "Parties"
    | "Foot Festivals"
    | "Neighborhood Events"
    | "Family-Friendly"
    | "Sports"
    | "Concerts"
    | "Custom";
  event_features:
    | "Pet Friendly"
    | "ASL Interpreter"
    | "Wheelchair Accessible"
    | "Indoor"
    | "Outdoor";
  audience_settings: AudienceSettings;
  emailList: string[];
  isDelete: boolean;
}

export interface EventModel extends Model<BaseEvent> {
  isEventCustomId(id: string): Promise<BaseEvent>;
}

export interface EventResponse {
  status: boolean;
  message: string;
}
