export const convertTo24Hour = (time: string) => {
  if (!time) throw new Error("Time is required");

  const match = time.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);

  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3].toUpperCase();

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return {
    hours: String(hours).padStart(2, "0"),
    minutes,
  };
};

/**
 * স্থানীয় তারিখ ও সময়কে সার্ভার/লোকাল টাইমজোন অনুযায়ী বাস্তব UTC ISO-তে কনভার্ট করবে
 */
export const toUTCISODateTime = (dateStr?: string, timeStr?: string): string => {
  if (!dateStr || !timeStr) {
    throw new Error("Date or time missing");
  }

  const { hours, minutes } = convertTo24Hour(timeStr);

  // ১. কোনো Z বা অফসেট ছাড়া লোকাল ISO স্ট্রিং তৈরি
  const localDateTimeString = `${dateStr}T${hours}:${minutes}:00`;

  // ২. Local Date Instance তৈরি (যা লোকাল সিস্টেমের টাইমজোনকে ধরে নেবে)
  const date = new Date(localDateTimeString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date generated: ${localDateTimeString}`);
  }

  // ৩. .toISOString() স্থানীয় সময়কে স্বয়ংক্রিয়ভাবে আসল UTC সময়ে পরিবর্তন করবে
  return date.toISOString(); 
};

/**
 * ইভেন্টের স্টার্ট ও এন্ড টাইম ভ্যালিডেশনের সাহায্যকারী ফাংশন
 */
export const validateAndGetEventUTCInterval = (
  dateStr: string,
  startTimeStr: string,
  endTimeStr: string
) => {
  const startUTC = toUTCISODateTime(dateStr, startTimeStr);
  const endUTC = toUTCISODateTime(dateStr, endTimeStr);

  const startDate = new Date(startUTC);
  const endDate = new Date(endUTC);

  // ইভেন্টের শেষ সময় শুরুর সময়ের পরে কিনা তা চেক করা
  if (endDate <= startDate) {
    throw new Error("End time must be after Start time");
  }

  return {
    startDateTime: startUTC,
    endDateTime: endUTC,
  };
};