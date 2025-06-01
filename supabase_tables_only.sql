CREATE TABLE public.flashcard_sets (
    id integer NOT NULL,
    user_email text NOT NULL,
    summary_id integer,
    title text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.flashcard_sets OWNER TO postgres;

--
-- Name: flashcard_sets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flashcard_sets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flashcard_sets_id_seq OWNER TO postgres;

--
-- Name: flashcard_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flashcard_sets_id_seq OWNED BY public.flashcard_sets.id;


--
-- Name: flashcards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flashcards (
    id integer NOT NULL,
    set_id integer,
    question text NOT NULL,
    answer text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    incorrect_answers jsonb
);


ALTER TABLE public.flashcards OWNER TO postgres;

--
-- Name: flashcards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flashcards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flashcards_id_seq OWNER TO postgres;

--
-- Name: flashcards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flashcards_id_seq OWNED BY public.flashcards.id;


--
-- Name: summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.summaries (
    id integer NOT NULL,
    user_email character varying(255) NOT NULL,
    video_url text,
    summary text NOT NULL,
    pdf_path text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title character varying(255),
    file_name character varying(255)
);


ALTER TABLE public.summaries OWNER TO postgres;

--
-- Name: summaries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.summaries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.summaries_id_seq OWNER TO postgres;

--
-- Name: summaries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.summaries_id_seq OWNED BY public.summaries.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(100),
    password character varying(255) NOT NULL,
    membership_type character varying(10) DEFAULT 'free'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    google_id character varying(255),
    usage_count integer DEFAULT 0,
    last_reset timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone_number character varying(32),
    CONSTRAINT users_membership_type_check CHECK (((membership_type)::text = ANY ((ARRAY['free'::character varying, 'payed'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: flashcard_sets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcard_sets ALTER COLUMN id SET DEFAULT nextval('public.flashcard_sets_id_seq'::regclass);


--
-- Name: flashcards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcards ALTER COLUMN id SET DEFAULT nextval('public.flashcards_id_seq'::regclass);


--
-- Name: summaries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summaries ALTER COLUMN id SET DEFAULT nextval('public.summaries_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: flashcard_sets flashcard_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcard_sets
    ADD CONSTRAINT flashcard_sets_pkey PRIMARY KEY (id);


--
-- Name: flashcards flashcards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);


--
-- Name: summaries summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summaries
    ADD CONSTRAINT summaries_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: flashcard_sets flashcard_sets_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcard_sets
    ADD CONSTRAINT flashcard_sets_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.summaries(id) ON DELETE CASCADE;


--
-- Name: flashcards flashcards_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.flashcard_sets(id) ON DELETE CASCADE;


--
-- Name: summaries summaries_user_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.summaries
    ADD CONSTRAINT summaries_user_email_fkey FOREIGN KEY (user_email) REFERENCES public.users(email) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

