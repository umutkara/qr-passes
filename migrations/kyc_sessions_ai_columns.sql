-- Migration: Ensure kyc_sessions has all required AI review columns
-- Run this in Supabase SQL Editor if columns are missing

-- Check and add ai_result column (jsonb)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kyc_sessions' 
        AND column_name = 'ai_result'
    ) THEN
        ALTER TABLE public.kyc_sessions ADD COLUMN ai_result jsonb;
        RAISE NOTICE 'Added ai_result column';
    ELSE
        RAISE NOTICE 'ai_result column already exists';
    END IF;
END $$;

-- Check and add final_status column (text)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kyc_sessions' 
        AND column_name = 'final_status'
    ) THEN
        ALTER TABLE public.kyc_sessions ADD COLUMN final_status text;
        RAISE NOTICE 'Added final_status column';
    ELSE
        RAISE NOTICE 'final_status column already exists';
    END IF;
END $$;

-- Check and add reviewed_at column (timestamptz)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kyc_sessions' 
        AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE public.kyc_sessions ADD COLUMN reviewed_at timestamptz;
        RAISE NOTICE 'Added reviewed_at column';
    ELSE
        RAISE NOTICE 'reviewed_at column already exists';
    END IF;
END $$;

-- Check and add document_url column (text)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kyc_sessions' 
        AND column_name = 'document_url'
    ) THEN
        ALTER TABLE public.kyc_sessions ADD COLUMN document_url text;
        RAISE NOTICE 'Added document_url column';
    ELSE
        RAISE NOTICE 'document_url column already exists';
    END IF;
END $$;

-- Check and add video_url column (text)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'kyc_sessions' 
        AND column_name = 'video_url'
    ) THEN
        ALTER TABLE public.kyc_sessions ADD COLUMN video_url text;
        RAISE NOTICE 'Added video_url column';
    ELSE
        RAISE NOTICE 'video_url column already exists';
    END IF;
END $$;

-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'kyc_sessions'
  AND column_name IN ('ai_result', 'final_status', 'reviewed_at', 'document_url', 'video_url')
ORDER BY column_name;


