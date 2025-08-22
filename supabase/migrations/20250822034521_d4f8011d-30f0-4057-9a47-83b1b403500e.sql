-- First, let's clean up the orphaned profiles
-- Delete profiles that have temp clerk_user_ids but no corresponding roles
DELETE FROM profiles 
WHERE clerk_user_id LIKE 'temp_%' 
  AND id NOT IN (
    SELECT DISTINCT p.id 
    FROM profiles p 
    INNER JOIN user_roles ur ON p.clerk_user_id = ur.user_id
  );

-- Clean up any duplicate Driver One entries (keep the one with a real clerk_user_id)
DELETE FROM profiles 
WHERE first_name = 'Driver' 
  AND last_name = 'One' 
  AND clerk_user_id LIKE 'temp_%';

-- Clean up any orphaned user_roles that reference non-existent profiles
DELETE FROM user_roles 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Also clean up any roles that reference temp clerk_user_ids
DELETE FROM user_roles 
WHERE user_id LIKE 'temp_%' 
  AND user_id NOT IN (SELECT clerk_user_id FROM profiles);