function calculateRatio(a: number, b: number) {
  return (a / b) * 100;
}

interface Downloads {
  day: string;
  downloads: number;
}

// Helper function to fetch downloads from NPM API for a longer date range
async function fetchDownloads(
  packageName: string,
  startDate: string,
  endDate: string
): Promise<Downloads[]> {
  const maxMonths = 18; // NPM API limit: max 18 months at a time
  const start = new Date(startDate);
  const end = new Date(endDate);
  let currentStart = new Date(start);
  let downloads: Downloads[] = [];

  while (currentStart < end) {
    // Calculate the chunk end date, ensuring it doesn't exceed the final end date or 18 months
    const currentEnd = new Date(currentStart);
    currentEnd.setMonth(currentEnd.getMonth() + maxMonths);
    if (currentEnd > end) currentEnd.setTime(end.getTime()); // Ensure it doesn't exceed the end date

    // Fetch data for the current range
    const response = await fetch(
      `https://api.npmjs.org/downloads/range/${formatDate(
        currentStart
      )}:${formatDate(currentEnd)}/${packageName}`
    );
    const data = await response.json();
    downloads = downloads.concat(data.downloads);

    // Move to the next chunk
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1); // Move to the next day after currentEnd
  }

  return downloads;
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

// Helper function to add days to a date
function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper function to group data by the specified period (in days)
function groupByPeriod(
  downloads: {
    day: string;
    downloadsNext: number;
    downloadsNextAuth: number;
  }[],
  startDate: string,
  periodDays: number
) {
  const result = [];
  let currentGroup = { date: startDate, next: 0, nextAuth: 0, ratio: 0 };
  let periodEndDate = new Date(startDate);
  periodEndDate = addDays(periodEndDate, periodDays);

  for (const day of downloads) {
    const dayDate = new Date(day.day);

    if (dayDate >= periodEndDate) {
      result.push(currentGroup);
      currentGroup = {
        date: formatDate(dayDate),
        next: 0,
        nextAuth: 0,
        ratio: 0,
      };
      periodEndDate = addDays(dayDate, periodDays);
    }

    currentGroup.next += day.downloadsNext || 0;
    currentGroup.nextAuth += day.downloadsNextAuth || 0;
    currentGroup.ratio = calculateRatio(
      currentGroup.nextAuth,
      currentGroup.next
    );
  }

  // Push the final group
  result.push(currentGroup);

  return result;
}

// Main function to fetch and process data based on grouping period
export async function getDownloads(groupingPeriodDays: number, years: number) {
  const today = new Date();
  const date = new Date();
  date.setFullYear(today.getFullYear() - years);

  const startDate = formatDate(date);
  const endDate = formatDate(today);

  // Fetch the data for the entire two-year range in one go
  const [nextDownloads, nextAuthDownloads] = await Promise.all([
    fetchDownloads("next", startDate, endDate),
    fetchDownloads("next-auth", startDate, endDate),
  ]);

  // Combine the downloads into a single array, with the same day from both packages
  const combinedDownloads = nextDownloads.map((day, index) => ({
    day: day.day,
    downloadsNext: day.downloads,
    downloadsNextAuth: nextAuthDownloads[index]?.downloads || 0,
  }));

  // Group the data based on the specified period (e.g., biweekly)
  const groupedData = groupByPeriod(
    combinedDownloads,
    startDate,
    groupingPeriodDays
  );

  return groupedData;
}
