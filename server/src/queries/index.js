export const QUERIES = [
  {
    id: 1,
    title: 'All Served Queue Entries',
    description: 'List every queue entry that has been fully served.',
    sql: `SELECT *
FROM Queue_Entry
WHERE Status = 'Served'`,
  },
  {
    id: 2,
    title: 'Counters with Location Names',
    description: 'Show all counters joined with their parent location information.',
    sql: `SELECT c.Counter_ID, c.Counter_Name, c.Service_Type,
       l.Location_ID, l.Location_Name
FROM Counter c
JOIN Location l ON c.Location_ID = l.Location_ID`,
  },
  {
    id: 3,
    title: 'Visitors Per Counter',
    description: 'Count how many visitors queued at each counter.',
    sql: `SELECT Counter_ID, COUNT(Visitor_ID) AS Total_Visitors
FROM Queue_Entry
GROUP BY Counter_ID`,
  },
  {
    id: 4,
    title: 'Average Wait Time',
    description: 'Calculate the overall average wait time across all entries.',
    sql: `SELECT AVG(Wait_Minutes) AS Avg_Wait
FROM Queue_Entry`,
  },
  {
    id: 5,
    title: 'Visitors with Queue and Counter Details',
    description: 'Show all visitors together with their queue entry and the counter they visited.',
    sql: `SELECT v.First_Name, v.Last_Name, c.Counter_Name, c.Service_Type, q.Status
FROM Visitor v
JOIN Queue_Entry q ON v.Visitor_ID = q.Visitor_ID
JOIN Counter c ON q.Counter_ID = c.Counter_ID`,
  },
  {
    id: 6,
    title: 'Long Waiters with Best Slot',
    description: 'Find visitors who waited more than 15 minutes and show their recommended best slot.',
    sql: `SELECT v.First_Name, v.Last_Name, q.Wait_Minutes, p.Best_Slot
FROM Visitor v
JOIN Queue_Entry q ON v.Visitor_ID = q.Visitor_ID
JOIN Prediction p  ON q.Entry_ID   = p.Entry_ID
WHERE q.Wait_Minutes > 15`,
  },
  {
    id: 7,
    title: 'Total Wait Time Per Counter',
    description: 'Display the sum of all recorded wait minutes grouped by counter.',
    sql: `SELECT Counter_ID, SUM(Wait_Minutes) AS Total_Wait
FROM Queue_Entry
GROUP BY Counter_ID`,
  },
  {
    id: 8,
    title: 'Counters in Active Locations',
    description: 'Return only counters whose parent location is currently active.',
    sql: `SELECT c.Counter_ID, c.Counter_Name, l.Location_Name, l.Status
FROM Counter c
JOIN Location l ON c.Location_ID = l.Location_ID
WHERE l.Status = 'Active'`,
  },
  {
    id: 9,
    title: 'Visitors at Main Canteen',
    description: 'List all visitors who queued at the Main Canteen.',
    sql: `SELECT v.First_Name, v.Last_Name, c.Counter_Name, l.Location_Name
FROM Visitor v
JOIN Queue_Entry q ON v.Visitor_ID = q.Visitor_ID
JOIN Counter c     ON q.Counter_ID = c.Counter_ID
JOIN Location l    ON c.Location_ID = l.Location_ID
WHERE l.Location_Name = 'Main Canteen'`,
  },
  {
    id: 10,
    title: 'Counters Exceeding 30-Minute Total Wait',
    description: 'Highlight counters where the cumulative wait time is over 30 minutes.',
    sql: `SELECT Counter_ID, SUM(Wait_Minutes) AS Total_Wait
FROM Queue_Entry
GROUP BY Counter_ID
HAVING SUM(Wait_Minutes) > 30`,
  },
];
