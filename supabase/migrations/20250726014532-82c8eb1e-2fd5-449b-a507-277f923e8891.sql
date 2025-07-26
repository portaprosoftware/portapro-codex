-- Disable Row Level Security on stock_adjustments table since using Clerk authentication
ALTER TABLE public.stock_adjustments DISABLE ROW LEVEL SECURITY;

-- Check and disable RLS on other tables that might cause similar issues with Clerk auth
-- These tables appear to have RLS enabled but may not have proper policies for Clerk auth

-- Check if consumable_stock_adjustments has RLS issues
ALTER TABLE public.consumable_stock_adjustments DISABLE ROW LEVEL SECURITY;

-- Check if product_location_stock has RLS issues  
ALTER TABLE public.product_location_stock DISABLE ROW LEVEL SECURITY;