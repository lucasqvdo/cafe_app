--
-- PostgreSQL database dump
--

\restrict cmNrO67vRkfgnvVaIKASq5YwayOAYgcVZrFWmB0TBDAShmtQRxTOg9cEBFwu12S

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cardapio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cardapio (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    descricao text,
    preco numeric(10,2) NOT NULL,
    categoria character varying(50) NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cardapio OWNER TO postgres;

--
-- Name: TABLE cardapio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cardapio IS 'Card pio do caf‚';


--
-- Name: cardapio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cardapio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cardapio_id_seq OWNER TO postgres;

--
-- Name: cardapio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cardapio_id_seq OWNED BY public.cardapio.id;


--
-- Name: itens_pedido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.itens_pedido (
    id integer NOT NULL,
    pedido_id integer NOT NULL,
    cardapio_id integer NOT NULL,
    quantidade integer NOT NULL,
    preco_unitario numeric(10,2) NOT NULL
);


ALTER TABLE public.itens_pedido OWNER TO postgres;

--
-- Name: TABLE itens_pedido; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.itens_pedido IS 'Itens de cada pedido';


--
-- Name: itens_pedido_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.itens_pedido_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.itens_pedido_id_seq OWNER TO postgres;

--
-- Name: itens_pedido_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.itens_pedido_id_seq OWNED BY public.itens_pedido.id;


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    mesa integer NOT NULL,
    cliente_nome character varying(100) NOT NULL,
    cliente_telefone character varying(20) NOT NULL,
    status character varying(50) DEFAULT 'pendente'::character varying,
    total numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- Name: TABLE pedidos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pedidos IS 'Pedidos dos clientes';


--
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_id_seq OWNER TO postgres;

--
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_admin boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Tabela de atendentes do caf‚';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: cardapio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cardapio ALTER COLUMN id SET DEFAULT nextval('public.cardapio_id_seq'::regclass);


--
-- Name: itens_pedido id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido ALTER COLUMN id SET DEFAULT nextval('public.itens_pedido_id_seq'::regclass);


--
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cardapio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cardapio (id, nome, descricao, preco, categoria, ativo, created_at) FROM stdin;
1	Caf‚ Expresso	Caf‚ expresso tradicional 30ml	3.50	Bebidas	t	2026-05-20 15:34:08.67467
2	Caf‚ com Leite	Caf‚ com leite coado	5.00	Bebidas	t	2026-05-20 15:34:08.67467
3	Cappuccino	Expresso com leite vaporizado e chocolate	7.00	Bebidas	t	2026-05-20 15:34:08.67467
4	Macchiato	Expresso com um toque de leite quente	6.50	Bebidas	t	2026-05-20 15:34:08.67467
5	Caf‚ Americano	Expresso dilu¡do em  gua quente	4.00	Bebidas	t	2026-05-20 15:34:08.67467
6	Croissant	Croissant folhado de manteiga	8.00	PÆes	t	2026-05-20 15:34:08.67467
7	PÆo de Queijo	PÆo de queijo quentinho	6.00	PÆes	t	2026-05-20 15:34:08.67467
8	Bolo de Chocolate	Fatia de bolo de chocolate	6.50	Doces	t	2026-05-20 15:34:08.67467
9	Bolo de Cenoura com Chocolate	Fatia de bolo de cenoura com cobertura	7.00	Doces	t	2026-05-20 15:34:08.67467
10	Muffin Blueberry	Muffin com blueberry	7.50	Doces	t	2026-05-20 15:34:08.67467
11	Brownie	Brownie de chocolate	8.00	Doces	t	2026-05-20 15:34:08.67467
12	Sandu¡che de Presunto e Queijo	Sandu¡che quente prensado	12.00	Salgados	t	2026-05-20 15:34:08.67467
13	Sandu¡che de Frango	Sandu¡che quente com frango desfiado	13.00	Salgados	t	2026-05-20 15:34:08.67467
14	Quiche Lorraine	Quiche com bacon e queijo	10.00	Salgados	t	2026-05-20 15:34:08.67467
15	Quiche de Espinafre	Quiche com espinafre e ricota	9.50	Salgados	t	2026-05-20 15:34:08.67467
16	µgua	µgua mineral 500ml	2.50	Bebidas	t	2026-05-20 15:34:08.67467
17	Refrigerante	Refrigerante lata 350ml	4.00	Bebidas	t	2026-05-20 15:34:08.67467
18	Suco Natural de Laranja	Suco de laranja rec‚m-espremido	6.00	Bebidas	t	2026-05-20 15:34:08.67467
19	Suco Natural de Morango	Suco de morango rec‚m-espremido	7.00	Bebidas	t	2026-05-20 15:34:08.67467
20	Ch  Gelado	Ch  gelado de limÆo	5.00	Bebidas	t	2026-05-20 15:34:08.67467
\.


--
-- Data for Name: itens_pedido; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.itens_pedido (id, pedido_id, cardapio_id, quantidade, preco_unitario) FROM stdin;
1	1	16	1	2.50
2	1	2	1	5.00
3	1	9	1	7.00
\.


--
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, mesa, cliente_nome, cliente_telefone, status, total, created_at, updated_at) FROM stdin;
1	1	Lucas	11984489030	entregue	14.50	2026-05-20 18:28:02.980797	2026-05-21 18:33:53.460209
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, created_at, is_admin) FROM stdin;
1	admin	$2a$10$vhe2F6kmMfE51AB0Md819eFiNQu3N600R4K1/BhoxZ5LmhCjItUEu	2026-05-20 15:34:08.648338	t
\.


--
-- Name: cardapio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cardapio_id_seq', 20, true);


--
-- Name: itens_pedido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.itens_pedido_id_seq', 3, true);


--
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: cardapio cardapio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cardapio
    ADD CONSTRAINT cardapio_pkey PRIMARY KEY (id);


--
-- Name: itens_pedido itens_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT itens_pedido_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_cardapio_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cardapio_categoria ON public.cardapio USING btree (categoria);


--
-- Name: idx_itens_pedido_pedido_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_itens_pedido_pedido_id ON public.itens_pedido USING btree (pedido_id);


--
-- Name: idx_pedidos_mesa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedidos_mesa ON public.pedidos USING btree (mesa);


--
-- Name: idx_pedidos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedidos_status ON public.pedidos USING btree (status);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: itens_pedido itens_pedido_cardapio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT itens_pedido_cardapio_id_fkey FOREIGN KEY (cardapio_id) REFERENCES public.cardapio(id);


--
-- Name: itens_pedido itens_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT itens_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict cmNrO67vRkfgnvVaIKASq5YwayOAYgcVZrFWmB0TBDAShmtQRxTOg9cEBFwu12S

