-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create anchors table for storing custom AR anchors
CREATE TABLE public.anchors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  pattern_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anchors ENABLE ROW LEVEL SECURITY;

-- Create policies (allow anonymous access for now)
CREATE POLICY "Anyone can view anchors" 
ON public.anchors 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create anchors" 
ON public.anchors 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update anchors" 
ON public.anchors 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete anchors" 
ON public.anchors 
FOR DELETE 
USING (true);

-- Create storage bucket for anchor images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('anchors', 'anchors', true);

-- Create storage policies
CREATE POLICY "Anchor images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'anchors');

CREATE POLICY "Anyone can upload anchor images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'anchors');

CREATE POLICY "Anyone can update anchor images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'anchors');

CREATE POLICY "Anyone can delete anchor images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'anchors');

-- Create trigger for timestamps
CREATE TRIGGER update_anchors_updated_at
BEFORE UPDATE ON public.anchors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();