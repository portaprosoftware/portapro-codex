-- Enhance user_invitations table with additional fields needed for the invitation system
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'driver',
ADD COLUMN IF NOT EXISTS invitation_token text,
ADD COLUMN IF NOT EXISTS clerk_user_id text,
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS invitation_type text DEFAULT 'user_creation',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add unique constraint on invitation token
ALTER TABLE public.user_invitations 
ADD CONSTRAINT unique_invitation_token UNIQUE (invitation_token);

-- Create function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token() 
RETURNS text AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_invitations 
    WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Update the sync_clerk_profile function to handle invitation completion
CREATE OR REPLACE FUNCTION sync_clerk_profile(
    clerk_user_id_param text,
    email_param text,
    first_name_param text,
    last_name_param text,
    image_url_param text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    invitation_record RECORD;
BEGIN
    -- Check if there's a pending invitation for this email
    SELECT * INTO invitation_record 
    FROM public.user_invitations 
    WHERE email = email_param 
    AND status = 'pending' 
    AND clerk_user_id IS NOT NULL;
    
    -- Insert or update profile
    INSERT INTO public.profiles (
        clerk_user_id, 
        email, 
        first_name, 
        last_name, 
        image_url,
        created_at,
        updated_at
    ) VALUES (
        clerk_user_id_param,
        email_param,
        first_name_param,
        last_name_param,
        image_url_param,
        NOW(),
        NOW()
    )
    ON CONFLICT (clerk_user_id) 
    DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        image_url = COALESCE(EXCLUDED.image_url, profiles.image_url),
        updated_at = NOW();
    
    -- If there was a pending invitation, mark it as accepted and set up the user role
    IF invitation_record.id IS NOT NULL THEN
        -- Update invitation status
        UPDATE public.user_invitations 
        SET status = 'accepted',
            accepted_at = NOW(),
            clerk_user_id = clerk_user_id_param
        WHERE id = invitation_record.id;
        
        -- Create user role if specified in invitation
        IF invitation_record.role IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (clerk_user_id_param, invitation_record.role::app_role)
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
        
        -- Log the successful invitation acceptance
        INSERT INTO public.driver_activity_log (
            driver_id,
            action_type,
            action_details
        ) VALUES (
            clerk_user_id_param,
            'invitation_accepted',
            jsonb_build_object(
                'invitation_id', invitation_record.id,
                'email', email_param,
                'role', invitation_record.role
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;