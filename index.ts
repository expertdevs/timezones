import { getTimeZones } from "@vvo/tzdb";
import express, { Request, Response } from "express";
import Fuse from "fuse.js";
import moment from "moment-timezone";

const app = express();
app.use(express.json());
// Endpoint to get the list of timezones
app.get("/timezones", (_req, res) => {
  const timezones = getTimeZones();
  res.json(timezones);
});

// Endpoint to get the list of timezones according to search query.
app.get("/timezones-autocomplete", (req, res) => {
  const fuseOptions = {
    keys: [
      "name",
      "alternativeName",
      "countryName",
      "countryCode",
      "abbreviation",
    ],
    threshold: 0.6, // Adjust the threshold to control fuzziness
  };
  const timezones = getTimeZones();
  // Create a Fuse instance with the timezones data and options
  const fuse = new Fuse(timezones, fuseOptions);
  const searchQuery = req.query.q as string;
  const results = fuse.search(searchQuery);
  res.json(results);
});

//Endpoint to convert current UTC time to specified timezones
app.post("/convert-time", (req, res) => {
  const { timezone } = req.body;
  const utcMoment = moment.utc();
  const convertedTimes = Array.isArray(timezone)
    ? timezone.map((tz) => {
        const convertedTime = utcMoment.tz(tz).format("YYYY-MM-DD HH:mm:ss");
        return { tz, convertedTime };
      })
    : [
        {
          tz: timezone,
          convertedTime: utcMoment.tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
        },
      ];

  res.json({ convertedTimes });
});

//Endpoint to convert current UTC time to specified timezones
app.post("/convert-time", (req: Request, res: Response) => {
  const { timezone, addDays, addHours, addMinutes } = req.body;
  const utcMoment = moment.utc();

  let convertedTimes: { tz: any; convertedTime: string }[];
  if (Array.isArray(timezone)) {
    convertedTimes = timezone.map((tz) => {
      let convertedTime = utcMoment.tz(tz);
      if (addDays) convertedTime.add(addDays, "days");
      if (addHours) convertedTime.add(addHours, "hours");
      if (addMinutes) convertedTime.add(addMinutes, "minutes");
      return { tz, convertedTime: convertedTime.format("YYYY-MM-DD HH:mm:ss") };
    });
  } else {
    convertedTimes = [
      {
        tz: timezone,
        convertedTime: utcMoment
          .tz(timezone)
          .add(addDays || 0, "days")
          .add(addHours || 0, "hours")
          .add(addMinutes || 0, "minutes")
          .format("YYYY-MM-DD HH:mm:ss"),
      },
    ];
  }

  res.json({ convertedTimes });
});

// Start the server
app.listen(4005, () => {
  console.log("Server is running on port 4005");
});
