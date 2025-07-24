-- Add missing columns to customer_notes table if they don't exist
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist (for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_notes' AND column_name = 'user_id') THEN
        ALTER TABLE public.customer_notes ADD COLUMN user_id UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- Create function to get customer notes with user information
CREATE OR REPLACE FUNCTION public.get_customer_notes_with_users(customer_uuid UUID)
RETURNS TABLE(
    id UUID,
    customer_id UUID,
    note_text TEXT,
    is_important BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    user_first_name TEXT,
    user_last_name TEXT,
    user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cn.id,
        cn.customer_id,
        cn.note_text,
        cn.is_important,
        cn.created_at,
        cn.updated_at,
        cn.created_by,
        p.first_name as user_first_name,
        p.last_name as user_last_name,
        p.email as user_email
    FROM public.customer_notes cn
    LEFT JOIN public.profiles p ON cn.created_by = p.id
    WHERE cn.customer_id = customer_uuid
    ORDER BY cn.created_at DESC;
END;
$$;