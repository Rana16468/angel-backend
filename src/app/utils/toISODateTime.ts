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

export const toESTISODateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr || !timeStr) {
    throw new Error("Date or time missing");
  }

  const { hours, minutes } = convertTo24Hour(timeStr);

  // কোনো সময় পরিবর্তন না করে সরাসরি ISO UTC (Z) ফরম্যাটে কনভার্ট
  const dateTimeString = `${dateStr}T${hours}:${minutes}:00.000Z`;

  // তারিখটি ভ্যালিড কিনা চেক করা
  if (isNaN(new Date(dateTimeString).getTime())) {
    throw new Error(`Invalid date generated: ${dateTimeString}`);
  }

  return dateTimeString;
};

export const toISOEndDateTime = toESTISODateTime;