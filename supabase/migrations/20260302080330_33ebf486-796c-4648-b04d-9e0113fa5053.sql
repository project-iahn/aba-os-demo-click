
-- Add VB-MAPP structure columns to programs table
ALTER TABLE public.programs 
  ADD COLUMN vbmapp_level integer DEFAULT 1,
  ADD COLUMN domain text,
  ADD COLUMN objective_type text NOT NULL DEFAULT 'STO',
  ADD COLUMN parent_program_id uuid REFERENCES public.programs(id);

-- Add index for parent-child relationship
CREATE INDEX idx_programs_parent ON public.programs(parent_program_id);

-- Add index for level/domain filtering
CREATE INDEX idx_programs_level_domain ON public.programs(vbmapp_level, domain);

-- Comment for documentation
COMMENT ON COLUMN public.programs.vbmapp_level IS 'VB-MAPP developmental level: 1, 2, or 3';
COMMENT ON COLUMN public.programs.domain IS 'VB-MAPP domain e.g. Mand, Tact, Listener, etc.';
COMMENT ON COLUMN public.programs.objective_type IS 'LTO (Long-Term Objective) or STO (Short-Term Objective)';
COMMENT ON COLUMN public.programs.parent_program_id IS 'Reference to parent LTO program for STO programs';
