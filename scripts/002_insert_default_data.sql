-- Insert default time slots for morning shift
INSERT INTO public.time_slots (start_time, end_time, day_of_week, slot_number, shift) VALUES
-- Monday
('09:00', '10:00', 1, 1, 'morning'),
('10:00', '11:00', 1, 2, 'morning'),
('11:00', '11:15', 1, 3, 'morning'), -- Break
('11:15', '12:15', 1, 4, 'morning'),
('12:15', '13:15', 1, 5, 'morning'),
('13:15', '14:15', 1, 6, 'morning'), -- Lunch break
('14:15', '15:15', 1, 7, 'morning'),
('15:15', '16:15', 1, 8, 'morning'),

-- Tuesday
('09:00', '10:00', 2, 1, 'morning'),
('10:00', '11:00', 2, 2, 'morning'),
('11:00', '11:15', 2, 3, 'morning'), -- Break
('11:15', '12:15', 2, 4, 'morning'),
('12:15', '13:15', 2, 5, 'morning'),
('13:15', '14:15', 2, 6, 'morning'), -- Lunch break
('14:15', '15:15', 2, 7, 'morning'),
('15:15', '16:15', 2, 8, 'morning'),

-- Wednesday
('09:00', '10:00', 3, 1, 'morning'),
('10:00', '11:00', 3, 2, 'morning'),
('11:00', '11:15', 3, 3, 'morning'), -- Break
('11:15', '12:15', 3, 4, 'morning'),
('12:15', '13:15', 3, 5, 'morning'),
('13:15', '14:15', 3, 6, 'morning'), -- Lunch break
('14:15', '15:15', 3, 7, 'morning'),
('15:15', '16:15', 3, 8, 'morning'),

-- Thursday
('09:00', '10:00', 4, 1, 'morning'),
('10:00', '11:00', 4, 2, 'morning'),
('11:00', '11:15', 4, 3, 'morning'), -- Break
('11:15', '12:15', 4, 4, 'morning'),
('12:15', '13:15', 4, 5, 'morning'),
('13:15', '14:15', 4, 6, 'morning'), -- Lunch break
('14:15', '15:15', 4, 7, 'morning'),
('15:15', '16:15', 4, 8, 'morning'),

-- Friday
('09:00', '10:00', 5, 1, 'morning'),
('10:00', '11:00', 5, 2, 'morning'),
('11:00', '11:15', 5, 3, 'morning'), -- Break
('11:15', '12:15', 5, 4, 'morning'),
('12:15', '13:15', 5, 5, 'morning'),
('13:15', '14:15', 5, 6, 'morning'), -- Lunch break
('14:15', '15:15', 5, 7, 'morning'),
('15:15', '16:15', 5, 8, 'morning');

-- Mark break slots
UPDATE public.time_slots SET is_break = TRUE 
WHERE slot_number = 3 OR slot_number = 6;

-- Insert default scheduling constraints
INSERT INTO public.scheduling_constraints (name, type, description, weight) VALUES
('No Faculty Double Booking', 'hard', 'A faculty member cannot be assigned to multiple classes at the same time', 10),
('No Classroom Double Booking', 'hard', 'A classroom cannot be assigned to multiple classes at the same time', 10),
('No Batch Double Booking', 'hard', 'A batch cannot have multiple classes at the same time', 10),
('Faculty Workload Limit', 'hard', 'Faculty should not exceed maximum classes per day/week', 8),
('Classroom Capacity', 'hard', 'Batch size should not exceed classroom capacity', 9),
('Subject-Faculty Matching', 'hard', 'Only qualified faculty can teach specific subjects', 10),
('Consecutive Classes Preference', 'soft', 'Prefer consecutive classes for the same subject', 5),
('Faculty Preference Hours', 'soft', 'Consider faculty preferred time slots', 3),
('Minimize Classroom Changes', 'soft', 'Minimize classroom changes for the same batch', 4),
('Balanced Daily Schedule', 'soft', 'Distribute classes evenly across days', 6);

-- Insert sample departments
INSERT INTO public.departments (name, code) VALUES
('Computer Science and Engineering', 'CSE'),
('Electronics and Communication Engineering', 'ECE'),
('Mechanical Engineering', 'ME'),
('Civil Engineering', 'CE'),
('Information Technology', 'IT');
