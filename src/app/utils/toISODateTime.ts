
import status from "http-status";
import AppError from "../errors/AppError";

export const convertTo24Hour = (time: string) => {
  if (!time) throw new Error("Time is required");

  const match = time.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3].toUpperCase();

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes,
  };
};

/**
 * ⚡ সঠিক UTC ISO-তে রূপান্তর করার ফাংশন
 * @param dateStr "YYYY-MM-DD"
 * @param timeStr "05:21 AM"
 * @param timezoneOffset "Asia/Dhaka" বা "+06:00" (ডিফল্ট +06:00 রাখা হলো)
 */
export const toUTCISODateTime = (
  dateStr: string, 
  timeStr: string, 
  offsetStr: string = "+06:00" // বাংলাদেশ সময় অনুযায়ী +06:00, প্রয়োজনে ক্লায়েন্ট থেকে নিতে পারেন
): string => {
  if (!dateStr || !timeStr) {
    throw new Error("Date or time missing");
  }

  const { hours, minutes } = convertTo24Hour(timeStr);

  // ১. অফসেট সহ ISO স্ট্রিং গঠন (যেমন: 2026-07-21T05:21:00+06:00)
  const localISOWithOffset = `${dateStr}T${hours}:${minutes}:00${offsetStr}`;

  // ২. Date অবজেক্ট এটি পড়া মাত্রই সঠিকভাবে UTC সময় গণনা করবে
  const date = new Date(localISOWithOffset);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date generated: ${localISOWithOffset}`);
  }

  // ৩. আসল UTC স্ট্রিং প্রদান করবে (যেমন: 2026-07-20T23:21:00.000Z)
  return date.toISOString(); 
};

export const validateAndGetEventUTCInterval = (
  dateStr: string,
  startTimeStr: string,
  endTimeStr: string,
  offsetStr: string = "+06:00"
) => {
  const startUTC = toUTCISODateTime(dateStr, startTimeStr, offsetStr);
  const endUTC = toUTCISODateTime(dateStr, endTimeStr, offsetStr);

  const startDate = new Date(startUTC);
  const endDate = new Date(endUTC);

  if (endDate <= startDate) {
    throw new AppError(status.BAD_REQUEST, "Ending time must be after starting time");
  }

  return {
    startDateTime: startUTC,
    endDateTime: endUTC,
  };
};