-- Queue Intelligence System : Oracle SQL script (DDL, DML and queries)

CREATE TABLE Location (
    Location_ID    NUMBER PRIMARY KEY,
    Location_Name  VARCHAR2(20),
    Location_Type  VARCHAR2(15),
    Status         VARCHAR2(10),
    Peak_Hours     VARCHAR2(11)
);

CREATE TABLE Counter (
    Counter_ID     NUMBER PRIMARY KEY,
    Counter_Name   VARCHAR2(20),
    Service_Type   VARCHAR2(15),
    Open_Time      VARCHAR2(5),
    Close_Time     VARCHAR2(5),
    Queue_Limit    NUMBER,
    Location_ID    NUMBER REFERENCES Location(Location_ID)
);

CREATE TABLE Visitor (
    Visitor_ID     NUMBER PRIMARY KEY,
    First_Name     VARCHAR2(10),
    Last_Name      VARCHAR2(10),
    Department     VARCHAR2(5),
    ID_Number      VARCHAR2(8),
    Visitor_Type   VARCHAR2(10),
    Entry_ID       NUMBER
);

CREATE TABLE Queue_Entry (
    Entry_ID       NUMBER PRIMARY KEY,
    Visitor_ID     NUMBER REFERENCES Visitor(Visitor_ID),
    Counter_ID     NUMBER REFERENCES Counter(Counter_ID),
    Entry_Date     DATE,
    Arrival_Time   VARCHAR2(5),
    Status         VARCHAR2(10),
    Wait_Minutes   NUMBER
);

CREATE TABLE Prediction (
    Prediction_ID    NUMBER PRIMARY KEY,
    Entry_ID         NUMBER REFERENCES Queue_Entry(Entry_ID),
    Prediction_Date  DATE,
    Predicted_Wait   NUMBER,
    Best_Slot        VARCHAR2(11)
);

INSERT INTO Location VALUES (1, 'Main Canteen', 'Canteen', 'Active', '12:30-14:00');
INSERT INTO Location VALUES (2, 'Block A Xerox Shop', 'Photocopy Shop', 'Active', '13:00-14:00');
INSERT INTO Location VALUES (3, 'Computer Lab 2', 'Lab', 'Active', '14:00-15:30');
INSERT INTO Location VALUES (4, 'Admin Office', 'Office', 'Active', '11:00-13:00');
INSERT INTO Location VALUES (5, 'Old Canteen', 'Canteen', 'Inactive', '12:30-14:00');

INSERT INTO Counter VALUES (101, 'Billing Counter 1', 'Food Billing', '08:00', '17:00', 40, 1);
INSERT INTO Counter VALUES (102, 'Xerox Counter A', 'Photocopy', '09:00', '17:30', 25, 2);
INSERT INTO Counter VALUES (103, 'Snacks Pickup', 'Food Pickup', '08:00', '17:00', 30, 1);
INSERT INTO Counter VALUES (104, 'Lab Issue Desk', 'Equipment Issue', '09:00', '16:30', 20, 3);
INSERT INTO Counter VALUES (105, 'Fee Counter', 'Fee Payment', '10:00', '16:00', 35, 4);

INSERT INTO Visitor VALUES (1, 'Ravi', 'Kumar', 'IT', 'ID1001', 'Student', 2001);
INSERT INTO Visitor VALUES (2, 'Neha', 'Reddy', 'CSE', 'ID1002', 'Student', 2002);
INSERT INTO Visitor VALUES (3, 'Amit', 'Sharma', 'ECE', 'ID1003', 'Faculty', 2003);
INSERT INTO Visitor VALUES (4, 'Sita', 'Patel', 'IT', 'ID1004', 'Student', 2004);
INSERT INTO Visitor VALUES (5, 'Arjun', 'Mehta', 'EEE', 'ID1005', 'Student', 2005);
INSERT INTO Visitor VALUES (6, 'Priya', 'Das', 'CSE', 'ID1006', 'Student', 2006);
INSERT INTO Visitor VALUES (7, 'Rahul', 'Nair', 'ME', 'ID1007', 'Student', 2007);
INSERT INTO Visitor VALUES (8, 'Anjali', 'Verma', 'IT', 'ID1008', 'Student', 2008);
INSERT INTO Visitor VALUES (9, 'Karan', 'Singh', 'CE', 'ID1009', 'Student', 2009);
INSERT INTO Visitor VALUES (10, 'Meena', 'Iyer', 'ECE', 'ID1010', 'Staff', 2010);
INSERT INTO Visitor VALUES (11, 'Deepak', 'Joshi', 'CSE', 'ID1011', 'Student', 2011);
INSERT INTO Visitor VALUES (12, 'Sneha', 'Rao', 'IT', 'ID1012', 'Student', 2012);
INSERT INTO Visitor VALUES (13, 'Vikram', 'Chauhan', 'EEE', 'ID1013', 'Student', 2013);
INSERT INTO Visitor VALUES (14, 'Lakshmi', 'Menon', 'ME', 'ID1014', 'Faculty', 2014);
INSERT INTO Visitor VALUES (15, 'Rohit', 'Patnaik', 'CSE', 'ID1015', 'Student', 2015);

INSERT INTO Queue_Entry VALUES (2001, 1, 101, TO_DATE('28-SEP-26','DD-MON-YY'), '12:40', 'Served', 18);
INSERT INTO Queue_Entry VALUES (2002, 2, 101, TO_DATE('28-SEP-26','DD-MON-YY'), '16:10', 'Served', 4);
INSERT INTO Queue_Entry VALUES (2003, 3, 102, TO_DATE('29-SEP-26','DD-MON-YY'), '13:05', 'Served', 9);
INSERT INTO Queue_Entry VALUES (2004, 4, 102, TO_DATE('29-SEP-26','DD-MON-YY'), '10:20', 'Served', 3);
INSERT INTO Queue_Entry VALUES (2005, 5, 103, TO_DATE('30-SEP-26','DD-MON-YY'), '12:55', 'Left', 25);
INSERT INTO Queue_Entry VALUES (2006, 6, 103, TO_DATE('30-SEP-26','DD-MON-YY'), '15:45', 'Served', 5);
INSERT INTO Queue_Entry VALUES (2007, 7, 104, TO_DATE('01-OCT-26','DD-MON-YY'), '14:10', 'Served', 22);
INSERT INTO Queue_Entry VALUES (2008, 8, 104, TO_DATE('01-OCT-26','DD-MON-YY'), '09:30', 'Served', 6);
INSERT INTO Queue_Entry VALUES (2009, 9, 105, TO_DATE('05-OCT-26','DD-MON-YY'), '11:00', 'Served', 15);
INSERT INTO Queue_Entry VALUES (2010, 10, 105, TO_DATE('05-OCT-26','DD-MON-YY'), '15:20', 'Served', 7);
INSERT INTO Queue_Entry VALUES (2011, 11, 102, TO_DATE('06-OCT-26','DD-MON-YY'), '13:15', 'Served', 14);
INSERT INTO Queue_Entry VALUES (2012, 12, 103, TO_DATE('06-OCT-26','DD-MON-YY'), '12:30', 'Served', 20);
INSERT INTO Queue_Entry VALUES (2013, 13, 104, TO_DATE('07-OCT-26','DD-MON-YY'), '14:40', 'Waiting', 17);
INSERT INTO Queue_Entry VALUES (2014, 14, 105, TO_DATE('07-OCT-26','DD-MON-YY'), '11:25', 'Waiting', 11);
INSERT INTO Queue_Entry VALUES (2015, 15, 101, TO_DATE('07-OCT-26','DD-MON-YY'), '12:50', 'Waiting', 16);

INSERT INTO Prediction VALUES (1, 2001, TO_DATE('28-SEP-26','DD-MON-YY'), 16, '15:30-16:30');
INSERT INTO Prediction VALUES (2, 2002, TO_DATE('28-SEP-26','DD-MON-YY'), 5, '15:30-16:30');
INSERT INTO Prediction VALUES (3, 2003, TO_DATE('29-SEP-26','DD-MON-YY'), 10, '15:00-16:00');
INSERT INTO Prediction VALUES (4, 2004, TO_DATE('29-SEP-26','DD-MON-YY'), 4, '10:00-11:00');
INSERT INTO Prediction VALUES (5, 2005, TO_DATE('30-SEP-26','DD-MON-YY'), 22, '15:30-16:30');
INSERT INTO Prediction VALUES (6, 2006, TO_DATE('30-SEP-26','DD-MON-YY'), 6, '15:30-16:30');
INSERT INTO Prediction VALUES (7, 2007, TO_DATE('01-OCT-26','DD-MON-YY'), 20, '16:00-17:00');
INSERT INTO Prediction VALUES (8, 2008, TO_DATE('01-OCT-26','DD-MON-YY'), 7, '09:00-10:00');
INSERT INTO Prediction VALUES (9, 2009, TO_DATE('05-OCT-26','DD-MON-YY'), 14, '15:00-16:00');
INSERT INTO Prediction VALUES (10, 2010, TO_DATE('05-OCT-26','DD-MON-YY'), 8, '15:00-16:00');
INSERT INTO Prediction VALUES (11, 2011, TO_DATE('06-OCT-26','DD-MON-YY'), 13, '15:00-16:00');
INSERT INTO Prediction VALUES (12, 2012, TO_DATE('06-OCT-26','DD-MON-YY'), 19, '15:30-16:30');
INSERT INTO Prediction VALUES (13, 2013, TO_DATE('07-OCT-26','DD-MON-YY'), 18, '16:00-17:00');
INSERT INTO Prediction VALUES (14, 2014, TO_DATE('07-OCT-26','DD-MON-YY'), 12, '15:00-16:00');
INSERT INTO Prediction VALUES (15, 2015, TO_DATE('07-OCT-26','DD-MON-YY'), 15, '15:30-16:30');

ALTER TABLE Visitor ADD CONSTRAINT fk_visitor_entry FOREIGN KEY (Entry_ID) REFERENCES Queue_Entry(Entry_ID);
COMMIT;

-- ------------------------- QUERIES -------------------------

-- 1. List all served queue entries
SELECT * FROM Queue_Entry
WHERE Status = 'Served';

-- 2. Show all counters with their location names
SELECT c.Counter_ID, c.Counter_Name, c.Service_Type, l.Location_ID, l.Location_Name
FROM Counter c
JOIN Location l ON c.Location_ID = l.Location_ID;

-- 3. Count how many visitors queued per counter
SELECT Counter_ID, COUNT(Visitor_ID) AS Total_Visitors
FROM Queue_Entry
GROUP BY Counter_ID;

-- 4. Find the average wait time
SELECT AVG(Wait_Minutes) AS Avg_Wait
FROM Queue_Entry;

-- 5. Show all visitors and their queue entry and counter details
SELECT v.First_Name, v.Last_Name, c.Counter_Name, c.Service_Type, q.Status
FROM Visitor v
JOIN Queue_Entry q ON v.Visitor_ID = q.Visitor_ID
JOIN Counter c ON q.Counter_ID = c.Counter_ID;

-- 6. Find visitors who waited more than 15 minutes, with the recommended best slot
SELECT v.First_Name, v.Last_Name, q.Wait_Minutes, p.Best_Slot
FROM Visitor v
JOIN Queue_Entry q ON v.Visitor_ID = q.Visitor_ID
JOIN Prediction p ON q.Entry_ID = p.Entry_ID
WHERE q.Wait_Minutes > 15;

-- 7. Display total wait time recorded per counter
SELECT Counter_ID, SUM(Wait_Minutes) AS Total_Wait
FROM Queue_Entry
GROUP BY Counter_ID;

-- 8. Find counters that belong to "Active" locations only
SELECT c.Counter_ID, c.Counter_Name, l.Location_Name, l.Status
FROM Counter c
JOIN Location l ON c.Location_ID = l.Location_ID
WHERE l.Status = 'Active';

-- 9. List all visitors who queued at the "Main Canteen"
SELECT v.First_Name, v.Last_Name, c.Counter_Name, l.Location_Name
FROM Visitor v
JOIN Queue_Entry q ON v.Visitor_ID = q.Visitor_ID
JOIN Counter c ON q.Counter_ID = c.Counter_ID
JOIN Location l ON c.Location_ID = l.Location_ID
WHERE l.Location_Name = 'Main Canteen';

-- 10. Find counters where total wait time exceeds 30 minutes
SELECT Counter_ID, SUM(Wait_Minutes) AS Total_Wait
FROM Queue_Entry
GROUP BY Counter_ID
HAVING SUM(Wait_Minutes) > 30;
