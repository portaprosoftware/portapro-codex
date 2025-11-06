-- Migration Part 2: Migrate existing user_roles data to use org: prefix

UPDATE user_roles 
SET role = 'org:owner' 
WHERE role = 'owner';

UPDATE user_roles 
SET role = 'org:admin' 
WHERE role = 'admin';

UPDATE user_roles 
SET role = 'org:dispatcher' 
WHERE role IN ('dispatcher', 'dispatch');

UPDATE user_roles 
SET role = 'org:driver' 
WHERE role = 'driver';

UPDATE user_roles 
SET role = 'org:viewer' 
WHERE role = 'viewer';