// // Convert "4:14 AM"/"4:14 PM" to 24-hour ISO string without timezone conversion
// const convertTo24Hour = (timeStr: string) => {
//   const [time, modifier] = timeStr.split(" ");
//   let [hours, minutes] = time.split(":").map(Number);

//   if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
//   if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;

//   return {
//     hours: hours.toString().padStart(2, "0"),
//     minutes: minutes.toString().padStart(2, "0"),
//   };
// };

// export const toISODateTime = (dateStr?: string, timeStr?: string) => {
//   if (!dateStr || !timeStr) return null;

//   const [year, month, day] = dateStr.split("-"); // YYYY-MM-DD
//   const { hours, minutes } = convertTo24Hour(timeStr);

//   // Construct ISO string WITHOUT converting timezone
//   return `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`;
// };

// export const toISOEndDateTime = toISODateTime;


export const convertTo24Hour = (time: string) => {
  if (!time) throw new Error("Time is required");

  const match = time.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);

  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let hours = parseInt(match[1]);
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

  const dateTimeString = `${dateStr}T${hours}:${minutes}:00`;

  const date = new Date(dateTimeString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date generated: ${dateTimeString}`);
  }

  return date.toISOString();
};

export const toISOEndDateTime = toESTISODateTime;
