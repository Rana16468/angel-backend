export const VenueFacilityConstant = [
  "washroom",
  "handwashstation",
  "smokingzone",
  "foorcount",
  "restarea",
] as const;
export const EventCategoryConstant = [
  "Parties",
  "Foot Festivals",
  "Neighborhood Events",
  "Family-Friendly",
  "Sports",
  "Concerts",
  "Custom",
] as const ;

export const EventFeaturesConstant = [
  "Pet Friendly",
  "ASL Interpreter", 
  "Wheelchair Accessible",
  "Indoor",
  "Outdoor",
] as const ;

export const ticketPriceConstant = ["free", "paid"] as const ;
export const visibilityConstant=["Private", "Public"] as const;

export const searching_event=['event_title','event_category','event_features'];

export interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}
