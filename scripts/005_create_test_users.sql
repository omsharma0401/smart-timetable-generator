-- Create test users for development
-- Note: This script creates profiles that will be linked when users sign up with these emails

-- Insert test departments first (if not exists)
INSERT INTO public.departments (name, code) VALUES
('Computer Science and Engineering', 'CSE'),
('Electronics and Communication Engineering', 'ECE'),
('Mechanical Engineering', 'ME'),
('Civil Engineering', 'CE'),
('Information Technology', 'IT')
ON CONFLICT (code) DO NOTHING;

-- Get department IDs for reference
DO $$
DECLARE
    cse_dept_id UUID;
    ece_dept_id UUID;
BEGIN
    SELECT id INTO cse_dept_id FROM public.departments WHERE code = 'CSE';
    SELECT id INTO ece_dept_id FROM public.departments WHERE code = 'ECE';
    
    -- Note: These profiles will be created automatically when users sign up
    -- This script just ensures the departments exist for the test users
    
    -- Insert sample classrooms
    INSERT INTO public.classrooms (name, capacity, type, department_id, equipment) VALUES
    ('Room 101', 60, 'lecture_hall', cse_dept_id, ARRAY['projector', 'whiteboard', 'ac']),
    ('Lab 201', 30, 'laboratory', cse_dept_id, ARRAY['computers', 'projector', 'ac']),
    ('Room 102', 80, 'lecture_hall', ece_dept_id, ARRAY['projector', 'whiteboard', 'ac']),
    ('Seminar Hall', 100, 'auditorium', NULL, ARRAY['projector', 'sound_system', 'ac'])
    ON CONFLICT DO NOTHING;
    
    -- Insert sample subjects
    INSERT INTO public.subjects (name, code, credits, semester, department_id, subject_type, classes_per_week) VALUES
    ('Data Structures and Algorithms', 'CS301', 4, 3, cse_dept_id, 'core', 4),
    ('Database Management Systems', 'CS302', 3, 3, cse_dept_id, 'core', 3),
    ('Computer Networks', 'CS401', 3, 4, cse_dept_id, 'core', 3),
    ('Digital Signal Processing', 'EC301', 4, 3, ece_dept_id, 'core', 4),
    ('Microprocessors', 'EC302', 3, 3, ece_dept_id, 'core', 3)
    ON CONFLICT (code) DO NOTHING;
    
    -- Insert sample batches
    INSERT INTO public.batches (name, year, semester, department_id, student_count, program) VALUES
    ('CSE-A-2024', 2024, 3, cse_dept_id, 60, 'UG'),
    ('CSE-B-2024', 2024, 3, cse_dept_id, 58, 'UG'),
    ('ECE-A-2024', 2024, 3, ece_dept_id, 55, 'UG')
    ON CONFLICT DO NOTHING;
    
END $$;
