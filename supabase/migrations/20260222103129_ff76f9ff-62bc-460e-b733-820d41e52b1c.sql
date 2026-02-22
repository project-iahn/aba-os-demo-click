
-- Centers table
CREATE TABLE public.centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  representative_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  business_number TEXT,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view centers (for therapist signup)
CREATE POLICY "Authenticated users can view centers"
  ON public.centers FOR SELECT TO authenticated
  USING (true);

-- Center owner can update
CREATE POLICY "Owner can update center"
  ON public.centers FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

-- Authenticated users can insert (during signup)
CREATE POLICY "Authenticated users can insert centers"
  ON public.centers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Add center_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  ADD COLUMN specialization TEXT,
  ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;

-- Admins (center owners) can view profiles in their center
CREATE POLICY "Center owners can view center profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    center_id IN (SELECT id FROM public.centers WHERE owner_id = auth.uid())
  );

-- Center owners can update approval status of their center members
CREATE POLICY "Center owners can update center member approval"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    center_id IN (SELECT id FROM public.centers WHERE owner_id = auth.uid())
  );

-- Trigger for centers updated_at
CREATE TRIGGER update_centers_updated_at
  BEFORE UPDATE ON public.centers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
