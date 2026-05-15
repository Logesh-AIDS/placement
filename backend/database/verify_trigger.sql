-- ============================================================================
-- Verify and Fix Database Trigger for Score Updates
-- Run this if assessment scores are not updating
-- ============================================================================

-- 1. Check if trigger exists
SELECT 
    tgname AS trigger_name,
    tgenabled AS enabled,
    pg_get_triggerdef(oid) AS definition
FROM pg_trigger 
WHERE tgname = 'update_student_status_after_test';

-- 2. Check if function exists
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS definition
FROM pg_proc 
WHERE proname = 'update_user_status_from_test';

-- 3. If trigger doesn't exist or is disabled, recreate it:

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_student_status_after_test ON test_attempts;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_user_status_from_test();

-- Recreate the function
CREATE OR REPLACE FUNCTION update_user_status_from_test()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET
        score  = NEW.score,
        status = CASE
            WHEN NEW.percentage >= 80 THEN 'qualified'::user_status
            WHEN NEW.percentage >= 50 THEN 'partial'::user_status
            ELSE 'not_qualified'::user_status
        END
    WHERE id = NEW.student_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_student_status_after_test
    AFTER INSERT OR UPDATE ON test_attempts
    FOR EACH ROW
    WHEN (NEW.completed_at IS NOT NULL)
    EXECUTE FUNCTION update_user_status_from_test();

-- 4. Verify trigger is now active
SELECT 
    tgname AS trigger_name,
    tgenabled AS enabled,
    CASE tgenabled
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        WHEN 'R' THEN 'Replica'
        WHEN 'A' THEN 'Always'
        ELSE 'Unknown'
    END AS status
FROM pg_trigger 
WHERE tgname = 'update_student_status_after_test';

-- 5. Test the trigger with existing data (optional - only if you have test attempts)
-- This will retroactively update scores for completed tests
UPDATE test_attempts 
SET completed_at = completed_at 
WHERE completed_at IS NOT NULL;

-- 6. Verify scores were updated
SELECT 
    u.id,
    u.name,
    u.email,
    u.score,
    u.status,
    ta.score AS test_score,
    ta.percentage,
    ta.completed_at
FROM users u
LEFT JOIN test_attempts ta ON u.id = ta.student_id
WHERE u.role = 'student'
ORDER BY u.id;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 
-- The trigger should fire automatically when:
-- 1. A new test attempt is inserted with completed_at set
-- 2. An existing test attempt is updated and completed_at is set
--
-- If scores are still not updating after running this script:
-- 1. Check backend logs for errors
-- 2. Verify the explicit UPDATE in testAttempts.controller.ts is working
-- 3. Check database user permissions
-- 4. Verify the percentage column is being calculated correctly
--
-- ============================================================================
