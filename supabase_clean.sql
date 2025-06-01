-- Create types
CREATE TYPE public.membership_status AS ENUM (
    'free',
    'premium'
);

-- Create tables

-- Users table
CREATE TABLE public.users (
    user_id serial PRIMARY KEY,
    email varchar(100),
    password varchar(255) NOT NULL,
    membership_type varchar(10) DEFAULT 'free' NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    first_name varchar(255) NOT NULL,
    last_name varchar(255) NOT NULL,
    google_id varchar(255),
    usage_count integer DEFAULT 0,
    last_reset timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone_number varchar(32),
    CONSTRAINT users_membership_type_check CHECK (membership_type IN ('free', 'payed'))
);

-- Enable RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Summaries table
CREATE TABLE public.summaries (
    id serial PRIMARY KEY,
    user_email varchar(255) NOT NULL,
    video_url text,
    summary text NOT NULL,
    pdf_path text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title varchar(255),
    file_name varchar(255)
);

-- Enable RLS for summaries table
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Flashcard sets table
CREATE TABLE public.flashcard_sets (
    id serial PRIMARY KEY,
    user_email text NOT NULL,
    summary_id integer,
    title text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for flashcard_sets table
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;

-- Flashcards table
CREATE TABLE public.flashcards (
    id serial PRIMARY KEY,
    set_id integer,
    question text NOT NULL,
    answer text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    incorrect_answers jsonb
);

-- Enable RLS for flashcards table
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Add foreign keys
ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.flashcard_sets(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.flashcard_sets
    ADD CONSTRAINT flashcard_sets_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.summaries(id) ON DELETE CASCADE;

-- Add RLS policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid()::text = email);

CREATE POLICY "Users can view their own summaries" ON public.summaries
    FOR SELECT USING (auth.uid()::text = user_email);

CREATE POLICY "Users can view their own flashcard sets" ON public.flashcard_sets
    FOR SELECT USING (auth.uid()::text = user_email);

CREATE POLICY "Users can view flashcards from their sets" ON public.flashcards
    FOR SELECT USING (set_id IN (
        SELECT id FROM public.flashcard_sets WHERE user_email = auth.uid()::text
    ));

-- Insert policies
CREATE POLICY "Users can insert their own summaries" ON public.summaries
    FOR INSERT WITH CHECK (auth.uid()::text = user_email);

CREATE POLICY "Users can insert their own flashcard sets" ON public.flashcard_sets
    FOR INSERT WITH CHECK (auth.uid()::text = user_email);

CREATE POLICY "Users can insert flashcards to their sets" ON public.flashcards
    FOR INSERT WITH CHECK (set_id IN (
        SELECT id FROM public.flashcard_sets WHERE user_email = auth.uid()::text
    )); 