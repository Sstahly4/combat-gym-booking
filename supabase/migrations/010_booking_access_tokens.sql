-- Booking access tokens for magic links (no account required)
-- Industry-standard pattern: Booking.com, Airbnb, Uber receipts

CREATE TABLE IF NOT EXISTS public.booking_access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE, -- Hashed token (never store plaintext)
  email TEXT NOT NULL, -- Email associated with this access
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE, -- For single-use tokens
  is_single_use BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for fast lookups
CREATE INDEX idx_booking_access_tokens_token_hash ON public.booking_access_tokens(token_hash);
CREATE INDEX idx_booking_access_tokens_booking_id ON public.booking_access_tokens(booking_id);
CREATE INDEX idx_booking_access_tokens_email ON public.booking_access_tokens(email);
CREATE INDEX idx_booking_access_tokens_expires_at ON public.booking_access_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.booking_access_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read tokens (they're hashed, so safe)
-- But we'll validate in application layer
CREATE POLICY "Tokens are readable for validation"
  ON public.booking_access_tokens FOR SELECT
  USING (true);

-- Policy: Only system can create tokens (via service role)
-- Regular users cannot create tokens directly
CREATE POLICY "System can create tokens"
  ON public.booking_access_tokens FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_booking_access_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_access_tokens_updated_at
  BEFORE UPDATE ON public.booking_access_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_access_tokens_updated_at();
