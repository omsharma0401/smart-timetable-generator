-- Smart Classroom & Timetable Scheduler Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'coordinator')),
  department_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  head_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classrooms table
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lecture_hall', 'laboratory', 'seminar_room', 'auditorium')),
  equipment TEXT[], -- Array of available equipment
  department_id UUID REFERENCES public.departments(id),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  department_id UUID REFERENCES public.departments(id) NOT NULL,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('core', 'elective', 'practical', 'project')),
  classes_per_week INTEGER NOT NULL DEFAULT 3,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  requires_lab BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faculty table
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL UNIQUE,
  designation TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) NOT NULL,
  max_classes_per_day INTEGER DEFAULT 6,
  max_classes_per_week INTEGER DEFAULT 24,
  average_leaves_per_month INTEGER DEFAULT 2,
  specializations TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create batches table (student groups)
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  department_id UUID REFERENCES public.departments(id) NOT NULL,
  student_count INTEGER NOT NULL,
  program TEXT NOT NULL CHECK (program IN ('UG', 'PG', 'PhD')),
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon', 'evening')) DEFAULT 'morning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faculty_subjects mapping table
CREATE TABLE IF NOT EXISTS public.faculty_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(faculty_id, subject_id)
);

-- Create batch_subjects mapping table
CREATE TABLE IF NOT EXISTS public.batch_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, subject_id)
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  slot_number INTEGER NOT NULL,
  is_break BOOLEAN DEFAULT FALSE,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon', 'evening')) DEFAULT 'morning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_of_week, slot_number, shift)
);

-- Create timetables table
CREATE TABLE IF NOT EXISTS public.timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  semester INTEGER NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'active', 'archived')) DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timetable_entries table
CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id UUID REFERENCES public.timetables(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES public.time_slots(id) NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) NOT NULL,
  faculty_id UUID REFERENCES public.faculty(id) NOT NULL,
  classroom_id UUID REFERENCES public.classrooms(id) NOT NULL,
  batch_id UUID REFERENCES public.batches(id) NOT NULL,
  class_type TEXT NOT NULL CHECK (class_type IN ('lecture', 'practical', 'tutorial', 'seminar')) DEFAULT 'lecture',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(timetable_id, time_slot_id, classroom_id),
  UNIQUE(timetable_id, time_slot_id, faculty_id),
  UNIQUE(timetable_id, time_slot_id, batch_id)
);

-- Create constraints table for scheduling rules
CREATE TABLE IF NOT EXISTS public.scheduling_constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hard', 'soft')),
  description TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for department_id in profiles
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_department 
  FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_constraints ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for departments (admins and coordinators can manage)
CREATE POLICY "All authenticated users can view departments" ON public.departments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage departments" ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for other tables (similar pattern)
CREATE POLICY "Authenticated users can view classrooms" ON public.classrooms
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage classrooms" ON public.classrooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Authenticated users can view subjects" ON public.subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage subjects" ON public.subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Authenticated users can view faculty" ON public.faculty
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage faculty" ON public.faculty
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view batches" ON public.batches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage batches" ON public.batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Authenticated users can view faculty_subjects" ON public.faculty_subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage faculty_subjects" ON public.faculty_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view batch_subjects" ON public.batch_subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage batch_subjects" ON public.batch_subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Authenticated users can view time_slots" ON public.time_slots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage time_slots" ON public.time_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view timetables" ON public.timetables
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage timetables" ON public.timetables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Authenticated users can view timetable_entries" ON public.timetable_entries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and coordinators can manage timetable_entries" ON public.timetable_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

CREATE POLICY "Authenticated users can view scheduling_constraints" ON public.scheduling_constraints
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage scheduling_constraints" ON public.scheduling_constraints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
