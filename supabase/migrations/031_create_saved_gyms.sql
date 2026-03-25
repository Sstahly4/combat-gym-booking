CREATE TABLE public.saved_gyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, gym_id)
);

CREATE INDEX idx_saved_gyms_user_id ON public.saved_gyms (user_id);
CREATE INDEX idx_saved_gyms_gym_id ON public.saved_gyms (gym_id);

ALTER TABLE public.saved_gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved gyms"
  ON public.saved_gyms
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved gyms"
  ON public.saved_gyms
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved gyms"
  ON public.saved_gyms
  FOR DELETE
  USING (auth.uid() = user_id);
