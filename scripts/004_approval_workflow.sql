-- Create approval workflow tables

-- Create approval workflow table
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id UUID REFERENCES public.timetables(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('single_department', 'multi_department', 'institution_wide')),
  current_step INTEGER NOT NULL DEFAULT 1,
  total_steps INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create approval steps table
CREATE TABLE IF NOT EXISTS public.approval_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_role TEXT NOT NULL CHECK (approver_role IN ('coordinator', 'head', 'admin')),
  department_id UUID REFERENCES public.departments(id),
  approver_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')) DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, step_number)
);

-- Create timetable conflicts table for multi-department coordination
CREATE TABLE IF NOT EXISTS public.timetable_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timetable_id UUID REFERENCES public.timetables(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('faculty_overlap', 'classroom_overlap', 'resource_conflict')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  affected_departments UUID[],
  resolution_status TEXT NOT NULL CHECK (resolution_status IN ('unresolved', 'resolved', 'ignored')) DEFAULT 'unresolved',
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('approval_request', 'approval_granted', 'approval_rejected', 'conflict_detected', 'timetable_published')),
  related_id UUID, -- Can reference timetable_id, workflow_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval workflows
CREATE POLICY "Users can view workflows for their department" ON public.approval_workflows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.timetables t
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE t.id = timetable_id 
      AND (p.role = 'admin' OR t.department_id = p.department_id OR p.role = 'coordinator')
    )
  );

CREATE POLICY "Admins and coordinators can manage workflows" ON public.approval_workflows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

-- RLS policies for approval steps
CREATE POLICY "Users can view relevant approval steps" ON public.approval_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.id = approver_id OR p.department_id = department_id)
    )
  );

CREATE POLICY "Approvers can update their steps" ON public.approval_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR id = approver_id)
    )
  );

-- RLS policies for conflicts
CREATE POLICY "Users can view conflicts for their department" ON public.timetable_conflicts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.department_id = ANY(affected_departments))
    )
  );

CREATE POLICY "Admins and coordinators can manage conflicts" ON public.timetable_conflicts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coordinator')
    )
  );

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create function to automatically create approval workflow
CREATE OR REPLACE FUNCTION create_approval_workflow(timetable_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workflow_id UUID;
  timetable_record RECORD;
  workflow_type TEXT;
  total_steps INTEGER := 0;
BEGIN
  -- Get timetable information
  SELECT * INTO timetable_record FROM public.timetables WHERE id = timetable_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timetable not found';
  END IF;
  
  -- Determine workflow type
  IF timetable_record.department_id IS NOT NULL THEN
    workflow_type := 'single_department';
    total_steps := 2; -- Coordinator -> Admin
  ELSE
    workflow_type := 'institution_wide';
    total_steps := 3; -- Multiple coordinators -> Head -> Admin
  END IF;
  
  -- Create workflow
  INSERT INTO public.approval_workflows (timetable_id, workflow_type, total_steps)
  VALUES (timetable_id, workflow_type, total_steps)
  RETURNING id INTO workflow_id;
  
  -- Create approval steps based on workflow type
  IF workflow_type = 'single_department' THEN
    -- Step 1: Department Coordinator
    INSERT INTO public.approval_steps (workflow_id, step_number, approver_role, department_id)
    VALUES (workflow_id, 1, 'coordinator', timetable_record.department_id);
    
    -- Step 2: Admin
    INSERT INTO public.approval_steps (workflow_id, step_number, approver_role)
    VALUES (workflow_id, 2, 'admin');
  ELSE
    -- Institution-wide workflow (simplified for demo)
    INSERT INTO public.approval_steps (workflow_id, step_number, approver_role)
    VALUES (workflow_id, 1, 'coordinator');
    
    INSERT INTO public.approval_steps (workflow_id, step_number, approver_role)
    VALUES (workflow_id, 2, 'head');
    
    INSERT INTO public.approval_steps (workflow_id, step_number, approver_role)
    VALUES (workflow_id, 3, 'admin');
  END IF;
  
  RETURN workflow_id;
END;
$$;

-- Create function to advance workflow
CREATE OR REPLACE FUNCTION advance_approval_workflow(workflow_id UUID, step_id UUID, action TEXT, comments TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workflow_record RECORD;
  step_record RECORD;
  next_step INTEGER;
BEGIN
  -- Get workflow and step information
  SELECT * INTO workflow_record FROM public.approval_workflows WHERE id = workflow_id;
  SELECT * INTO step_record FROM public.approval_steps WHERE id = step_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow or step not found';
  END IF;
  
  -- Update the current step
  UPDATE public.approval_steps 
  SET status = action, 
      comments = advance_approval_workflow.comments,
      approved_at = CASE WHEN action = 'approved' THEN NOW() ELSE NULL END,
      approver_id = auth.uid()
  WHERE id = step_id;
  
  IF action = 'rejected' THEN
    -- Reject the entire workflow
    UPDATE public.approval_workflows 
    SET status = 'rejected', updated_at = NOW()
    WHERE id = workflow_id;
    
    -- Update timetable status
    UPDATE public.timetables 
    SET status = 'draft'
    WHERE id = workflow_record.timetable_id;
    
    RETURN TRUE;
  ELSIF action = 'approved' THEN
    -- Check if this was the last step
    IF step_record.step_number >= workflow_record.total_steps THEN
      -- Approve the entire workflow
      UPDATE public.approval_workflows 
      SET status = 'approved', updated_at = NOW()
      WHERE id = workflow_id;
      
      -- Update timetable status
      UPDATE public.timetables 
      SET status = 'approved', 
          approved_by = auth.uid(),
          approved_at = NOW()
      WHERE id = workflow_record.timetable_id;
    ELSE
      -- Advance to next step
      next_step := step_record.step_number + 1;
      UPDATE public.approval_workflows 
      SET current_step = next_step, updated_at = NOW()
      WHERE id = workflow_id;
    END IF;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create trigger to automatically create workflow when timetable is submitted for approval
CREATE OR REPLACE FUNCTION trigger_create_approval_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'pending_approval' AND OLD.status != 'pending_approval' THEN
    PERFORM create_approval_workflow(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER timetable_approval_trigger
  AFTER UPDATE ON public.timetables
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_approval_workflow();
