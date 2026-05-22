--
-- PostgreSQL database dump
--

\restrict fPef6LdT7zhVk4hiNbZNvmk1DUWFcSf51BChe974Phe1EkZrLrNEwmEjBm5hfHg

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: buoi_tri_lieu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buoi_tri_lieu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lich_dieu_tri_id uuid NOT NULL,
    khach_hang_id uuid NOT NULL,
    ky_thuat_vien_id uuid NOT NULL,
    phong_id bigint,
    dich_vu_id uuid,
    thoi_gian_bat_dau timestamp without time zone NOT NULL,
    thoi_gian_ket_thuc timestamp without time zone,
    danh_gia_truoc_buoi integer,
    danh_gia_sau_buoi integer,
    danh_gia_hieu_qua integer,
    so_thu_tu_buoi integer,
    danh_gia_id uuid,
    trang_thai character varying(20) DEFAULT 'dang_thuc_hien'::character varying NOT NULL,
    canh_bao_dac_biet text,
    ai_tom_tat_ngan character varying(300),
    thoi_gian_ghi_chu timestamp without time zone
);


ALTER TABLE public.buoi_tri_lieu OWNER TO postgres;

--
-- Name: chuyen_gia_y_te; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chuyen_gia_y_te (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    ma_nhan_vien character varying(20) NOT NULL,
    chuyen_mon_chinh character varying(200) NOT NULL,
    so_nam_kinh_nghiem integer,
    chung_chi text,
    mo_ta_ban_than text,
    anh_dai_dien_url text,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    ngay_vao_lam date
);


ALTER TABLE public.chuyen_gia_y_te OWNER TO postgres;

--
-- Name: danh_gia_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danh_gia_dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buoi_tri_lieu_id uuid NOT NULL,
    khach_hang_id uuid NOT NULL,
    ky_thuat_vien_id uuid NOT NULL,
    so_sao_tong integer NOT NULL,
    so_sao_ktv integer,
    nhan_xet text,
    hieu_qua_dieu_tri character varying(30),
    se_quay_lai boolean,
    hien_thi_cong_khai boolean DEFAULT false NOT NULL,
    thoi_gian_danh_gia timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.danh_gia_dich_vu OWNER TO postgres;

--
-- Name: danh_muc_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danh_muc_dich_vu (
    id bigint NOT NULL,
    ten_danh_muc character varying(100) NOT NULL,
    mo_ta text,
    thu_tu_hien_thi integer DEFAULT 0 NOT NULL,
    an_hien boolean DEFAULT true NOT NULL
);


ALTER TABLE public.danh_muc_dich_vu OWNER TO postgres;

--
-- Name: danh_muc_dich_vu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.danh_muc_dich_vu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.danh_muc_dich_vu_id_seq OWNER TO postgres;

--
-- Name: danh_muc_dich_vu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.danh_muc_dich_vu_id_seq OWNED BY public.danh_muc_dich_vu.id;


--
-- Name: dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    danh_muc_id bigint NOT NULL,
    ten_dich_vu character varying(200) NOT NULL,
    mo_ta_ngan character varying(500),
    mo_ta_chi_tiet text,
    thoi_luong_phut integer NOT NULL,
    don_gia bigint NOT NULL,
    hinh_anh_url text,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    thu_tu_hien_thi integer DEFAULT 0 NOT NULL,
    thiet_bi_yeu_cau character varying(100)
);


ALTER TABLE public.dich_vu OWNER TO postgres;

--
-- Name: goi_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goi_dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ten_goi character varying(200) NOT NULL,
    ma_goi character varying(30) NOT NULL,
    mo_ta text,
    tong_so_buoi integer NOT NULL,
    gia_goi bigint NOT NULL,
    gia_goc bigint,
    han_dung_thang integer DEFAULT 6 NOT NULL,
    hien_thi_website boolean DEFAULT true NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    chi_tiet_dich_vu jsonb DEFAULT '[]'::jsonb,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    danh_muc_id bigint
);


ALTER TABLE public.goi_dich_vu OWNER TO postgres;

--
-- Name: goi_dich_vu_chi_tiet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goi_dich_vu_chi_tiet (
    id integer NOT NULL,
    goi_dich_vu_id uuid,
    dich_vu_id uuid,
    so_buoi_trong_goi integer DEFAULT 1
);


ALTER TABLE public.goi_dich_vu_chi_tiet OWNER TO postgres;

--
-- Name: goi_dich_vu_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goi_dich_vu_chi_tiet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.goi_dich_vu_chi_tiet_id_seq OWNER TO postgres;

--
-- Name: goi_dich_vu_chi_tiet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goi_dich_vu_chi_tiet_id_seq OWNED BY public.goi_dich_vu_chi_tiet.id;


--
-- Name: hoa_don; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hoa_don (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_hoa_don character varying(20) NOT NULL,
    khach_hang_id uuid NOT NULL,
    loai_hoa_don character varying(20) NOT NULL,
    lich_dat_id uuid,
    dang_ky_goi_id uuid,
    tong_tien_truoc_giam bigint DEFAULT 0 NOT NULL,
    so_tien_giam bigint DEFAULT 0 NOT NULL,
    tong_tien_thanh_toan bigint NOT NULL,
    da_thanh_toan bigint DEFAULT 0 NOT NULL,
    trang_thai character varying(30) DEFAULT 'chua_thanh_toan'::character varying NOT NULL,
    ghi_chu text,
    ngay_tao timestamp without time zone DEFAULT now() NOT NULL,
    ngay_thanh_toan timestamp without time zone,
    thu_boi uuid
);


ALTER TABLE public.hoa_don OWNER TO postgres;

--
-- Name: hoa_don_chi_tiet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hoa_don_chi_tiet (
    id bigint NOT NULL,
    hoa_don_id uuid NOT NULL,
    mo_ta character varying(300) NOT NULL,
    don_gia bigint NOT NULL,
    so_luong integer DEFAULT 1 NOT NULL,
    thanh_tien bigint NOT NULL,
    dich_vu_id uuid
);


ALTER TABLE public.hoa_don_chi_tiet OWNER TO postgres;

--
-- Name: hoa_don_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hoa_don_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hoa_don_chi_tiet_id_seq OWNER TO postgres;

--
-- Name: hoa_don_chi_tiet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hoa_don_chi_tiet_id_seq OWNED BY public.hoa_don_chi_tiet.id;


--
-- Name: khach_hang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khach_hang (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    ngay_sinh date,
    gioi_tinh character varying(10),
    dia_chi text,
    hang_khach_hang character varying(20) DEFAULT 'thuong'::character varying NOT NULL,
    preferred_ktv_id uuid,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    so_cccd character varying(20)
);


ALTER TABLE public.khach_hang OWNER TO postgres;

--
-- Name: lich_dat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_dat (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_lich_dat character varying(20) NOT NULL,
    khach_hang_id uuid,
    ho_ten_khach character varying(150),
    so_dien_thoai character varying(20),
    gioi_tinh_khach character varying(10),
    dich_vu_id uuid,
    ky_thuat_vien_id uuid,
    phong_id bigint,
    ngay_gio_bat_dau timestamp without time zone NOT NULL,
    ngay_gio_ket_thuc timestamp without time zone NOT NULL,
    ly_do_kham text,
    anh_dinh_kem_url text,
    trang_thai character varying(30) DEFAULT 'cho_xac_nhan'::character varying NOT NULL,
    dang_ky_goi_id uuid,
    ghi_chu_dat_lich text,
    ghi_chu_noi_bo text,
    thoi_gian_checkin timestamp without time zone,
    thoi_gian_huy timestamp without time zone,
    ly_do_huy text,
    nguoi_tao character varying(20) DEFAULT 'khach_hang'::character varying NOT NULL,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    chan_doan text,
    chong_chi_dinh text,
    khuyen_nghi_dich_vu_id uuid,
    khuyen_nghi_goi_id uuid
);


ALTER TABLE public.lich_dat OWNER TO postgres;

--
-- Name: lich_dieu_tri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_dieu_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khach_hang_id uuid NOT NULL,
    loai_dieu_tri character varying(20) NOT NULL,
    dich_vu_id uuid,
    goi_dich_vu_id uuid,
    tong_so_buoi integer NOT NULL,
    so_buoi_da_dung integer DEFAULT 0 NOT NULL,
    trang_thai character varying(20) DEFAULT 'dang_dieu_tri'::character varying NOT NULL,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    ma_lich_dieu_tri character varying(20),
    phong_id bigint,
    ho_ten_khach character varying(150),
    so_dien_thoai character varying(20),
    ghi_chu_noi_bo text,
    lich_dat_id uuid,
    ngay_bat_dau timestamp without time zone,
    ngay_ket_thuc timestamp without time zone
);


ALTER TABLE public.lich_dieu_tri OWNER TO postgres;

--
-- Name: lich_lam_viec; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_lam_viec (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    ngay date NOT NULL,
    gio_bat_dau time without time zone NOT NULL,
    gio_ket_thuc time without time zone NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying
);


ALTER TABLE public.lich_lam_viec OWNER TO postgres;

--
-- Name: nguoi_dung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nguoi_dung (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ho_ten character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    so_dien_thoai character varying(20),
    mat_khau_hash character varying(255) NOT NULL,
    vai_tro_id smallint NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    da_xac_thuc_email boolean DEFAULT false NOT NULL,
    avatar_url text,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL,
    lan_dang_nhap_cuoi timestamp without time zone,
    deleted_at timestamp without time zone
);


ALTER TABLE public.nguoi_dung OWNER TO postgres;

--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- Name: phong; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phong (
    id bigint NOT NULL,
    ten_phong character varying(100) NOT NULL,
    ma_phong character varying(20) NOT NULL,
    loai_phong character varying(100),
    loai_dich_vu_ho_tro jsonb,
    thiet_bi jsonb,
    mo_ta text,
    trang_thai character varying(20) DEFAULT 'san_sang'::character varying NOT NULL,
    tang character varying(20)
);


ALTER TABLE public.phong OWNER TO postgres;

--
-- Name: phong_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phong_dich_vu (
    id bigint NOT NULL,
    phong_id bigint NOT NULL,
    danh_muc_id bigint NOT NULL
);


ALTER TABLE public.phong_dich_vu OWNER TO postgres;

--
-- Name: phong_dich_vu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phong_dich_vu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.phong_dich_vu_id_seq OWNER TO postgres;

--
-- Name: phong_dich_vu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phong_dich_vu_id_seq OWNED BY public.phong_dich_vu.id;


--
-- Name: phong_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phong_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.phong_id_seq OWNER TO postgres;

--
-- Name: phong_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phong_id_seq OWNED BY public.phong.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    nguoi_dung_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: system_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_audit_log (
    id bigint NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    payload text,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_audit_log OWNER TO postgres;

--
-- Name: system_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_audit_log_id_seq OWNER TO postgres;

--
-- Name: system_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_audit_log_id_seq OWNED BY public.system_audit_log.id;


--
-- Name: thanh_toan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thanh_toan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_giao_dich character varying(50) NOT NULL,
    hoa_don_id uuid NOT NULL,
    so_tien bigint NOT NULL,
    phuong_thuc character varying(20) NOT NULL,
    trang_thai character varying(20) DEFAULT 'cho_xu_ly'::character varying NOT NULL,
    ma_tham_chieu character varying(100),
    nguoi_thu_tien_id uuid,
    thoi_gian_giao_dich timestamp without time zone DEFAULT now() NOT NULL,
    ghi_chu text
);


ALTER TABLE public.thanh_toan OWNER TO postgres;

--
-- Name: thiet_bi_y_te; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thiet_bi_y_te (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_thiet_bi character varying(20) NOT NULL,
    ten_thiet_bi character varying(100) NOT NULL,
    loai_thiet_bi character varying(100),
    ngay_mua date,
    ngay_bao_tri_tiep_theo date,
    trang_thai character varying(20) DEFAULT 'san_sang'::character varying NOT NULL,
    phong_id_hien_tai bigint,
    ghi_chu text,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.thiet_bi_y_te OWNER TO postgres;

--
-- Name: vai_tro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vai_tro (
    id smallint NOT NULL,
    ma_vai_tro character varying(20) NOT NULL,
    ten_hien_thi character varying(50) NOT NULL,
    mo_ta_quyen text
);


ALTER TABLE public.vai_tro OWNER TO postgres;

--
-- Name: vai_tro_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vai_tro_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.vai_tro_id_seq OWNER TO postgres;

--
-- Name: vai_tro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vai_tro_id_seq OWNED BY public.vai_tro.id;


--
-- Name: voucher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voucher (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_voucher character varying(50) NOT NULL,
    ten_chien_dich character varying(200),
    loai_giam character varying(20) NOT NULL,
    gia_tri_giam bigint NOT NULL,
    giam_toi_da bigint,
    don_hang_toi_thieu bigint DEFAULT 0 NOT NULL,
    ap_dung_cho character varying(30) DEFAULT 'tat_ca'::character varying NOT NULL,
    so_luong_toi_da integer,
    so_luong_da_dung integer DEFAULT 0 NOT NULL,
    ngay_bat_dau date NOT NULL,
    ngay_het_han date,
    tao_boi uuid NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    thoi_gian_tao timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.voucher OWNER TO postgres;

--
-- Name: danh_muc_dich_vu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_muc_dich_vu ALTER COLUMN id SET DEFAULT nextval('public.danh_muc_dich_vu_id_seq'::regclass);


--
-- Name: goi_dich_vu_chi_tiet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet ALTER COLUMN id SET DEFAULT nextval('public.goi_dich_vu_chi_tiet_id_seq'::regclass);


--
-- Name: hoa_don_chi_tiet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don_chi_tiet ALTER COLUMN id SET DEFAULT nextval('public.hoa_don_chi_tiet_id_seq'::regclass);


--
-- Name: phong id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong ALTER COLUMN id SET DEFAULT nextval('public.phong_id_seq'::regclass);


--
-- Name: phong_dich_vu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_dich_vu ALTER COLUMN id SET DEFAULT nextval('public.phong_dich_vu_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: system_audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_log ALTER COLUMN id SET DEFAULT nextval('public.system_audit_log_id_seq'::regclass);


--
-- Name: vai_tro id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vai_tro ALTER COLUMN id SET DEFAULT nextval('public.vai_tro_id_seq'::regclass);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_pkey PRIMARY KEY (id);


--
-- Name: danh_gia_dich_vu danh_gia_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_dich_vu
    ADD CONSTRAINT danh_gia_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: danh_muc_dich_vu danh_muc_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_muc_dich_vu
    ADD CONSTRAINT danh_muc_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: dich_vu dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dich_vu
    ADD CONSTRAINT dich_vu_pkey PRIMARY KEY (id);


--
-- Name: goi_dich_vu_chi_tiet goi_dich_vu_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet
    ADD CONSTRAINT goi_dich_vu_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: goi_dich_vu goi_dich_vu_ma_goi_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_ma_goi_key UNIQUE (ma_goi);


--
-- Name: goi_dich_vu goi_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: hoa_don_chi_tiet hoa_don_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don_chi_tiet
    ADD CONSTRAINT hoa_don_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: hoa_don hoa_don_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_pkey PRIMARY KEY (id);


--
-- Name: khach_hang khach_hang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khach_hang
    ADD CONSTRAINT khach_hang_pkey PRIMARY KEY (id);


--
-- Name: chuyen_gia_y_te ky_thuat_vien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chuyen_gia_y_te
    ADD CONSTRAINT ky_thuat_vien_pkey PRIMARY KEY (id);


--
-- Name: lich_dat lich_dat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_pkey PRIMARY KEY (id);


--
-- Name: lich_dieu_tri lich_dieu_tri_ma_lich_dieu_tri_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_ma_lich_dieu_tri_key UNIQUE (ma_lich_dieu_tri);


--
-- Name: lich_dieu_tri lich_dieu_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_pkey PRIMARY KEY (id);


--
-- Name: lich_lam_viec lich_lam_viec_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_lam_viec
    ADD CONSTRAINT lich_lam_viec_pkey PRIMARY KEY (id);


--
-- Name: nguoi_dung nguoi_dung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT nguoi_dung_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: phong_dich_vu phong_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_dich_vu
    ADD CONSTRAINT phong_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: phong phong_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong
    ADD CONSTRAINT phong_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: system_audit_log system_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_log
    ADD CONSTRAINT system_audit_log_pkey PRIMARY KEY (id);


--
-- Name: thanh_toan thanh_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thanh_toan
    ADD CONSTRAINT thanh_toan_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_y_te thiet_bi_y_te_ma_thiet_bi_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thiet_bi_y_te
    ADD CONSTRAINT thiet_bi_y_te_ma_thiet_bi_key UNIQUE (ma_thiet_bi);


--
-- Name: thiet_bi_y_te thiet_bi_y_te_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thiet_bi_y_te
    ADD CONSTRAINT thiet_bi_y_te_pkey PRIMARY KEY (id);


--
-- Name: vai_tro vai_tro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vai_tro
    ADD CONSTRAINT vai_tro_pkey PRIMARY KEY (id);


--
-- Name: voucher voucher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_pkey PRIMARY KEY (id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_ky_thuat_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_ky_thuat_vien_id_fkey FOREIGN KEY (ky_thuat_vien_id) REFERENCES public.chuyen_gia_y_te(id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_lich_dieu_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_lich_dieu_tri_id_fkey FOREIGN KEY (lich_dieu_tri_id) REFERENCES public.lich_dieu_tri(id);


--
-- Name: buoi_tri_lieu buoi_tri_lieu_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buoi_tri_lieu
    ADD CONSTRAINT buoi_tri_lieu_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: danh_gia_dich_vu danh_gia_dich_vu_buoi_tri_lieu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_dich_vu
    ADD CONSTRAINT danh_gia_dich_vu_buoi_tri_lieu_id_fkey FOREIGN KEY (buoi_tri_lieu_id) REFERENCES public.buoi_tri_lieu(id);


--
-- Name: danh_gia_dich_vu danh_gia_dich_vu_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_dich_vu
    ADD CONSTRAINT danh_gia_dich_vu_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: danh_gia_dich_vu danh_gia_dich_vu_ky_thuat_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_dich_vu
    ADD CONSTRAINT danh_gia_dich_vu_ky_thuat_vien_id_fkey FOREIGN KEY (ky_thuat_vien_id) REFERENCES public.chuyen_gia_y_te(id);


--
-- Name: dich_vu dich_vu_danh_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dich_vu
    ADD CONSTRAINT dich_vu_danh_muc_id_fkey FOREIGN KEY (danh_muc_id) REFERENCES public.danh_muc_dich_vu(id);


--
-- Name: goi_dich_vu_chi_tiet goi_dich_vu_chi_tiet_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet
    ADD CONSTRAINT goi_dich_vu_chi_tiet_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: goi_dich_vu_chi_tiet goi_dich_vu_chi_tiet_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu_chi_tiet
    ADD CONSTRAINT goi_dich_vu_chi_tiet_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id) ON DELETE CASCADE;


--
-- Name: goi_dich_vu goi_dich_vu_danh_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_danh_muc_id_fkey FOREIGN KEY (danh_muc_id) REFERENCES public.danh_muc_dich_vu(id);


--
-- Name: hoa_don_chi_tiet hoa_don_chi_tiet_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don_chi_tiet
    ADD CONSTRAINT hoa_don_chi_tiet_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: hoa_don_chi_tiet hoa_don_chi_tiet_hoa_don_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don_chi_tiet
    ADD CONSTRAINT hoa_don_chi_tiet_hoa_don_id_fkey FOREIGN KEY (hoa_don_id) REFERENCES public.hoa_don(id);


--
-- Name: hoa_don hoa_don_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: hoa_don hoa_don_lich_dat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_lich_dat_id_fkey FOREIGN KEY (lich_dat_id) REFERENCES public.lich_dat(id);


--
-- Name: khach_hang khach_hang_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khach_hang
    ADD CONSTRAINT khach_hang_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: chuyen_gia_y_te ky_thuat_vien_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chuyen_gia_y_te
    ADD CONSTRAINT ky_thuat_vien_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: lich_dat lich_dat_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: lich_dat lich_dat_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: lich_dat lich_dat_khuyen_nghi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_khuyen_nghi_dich_vu_id_fkey FOREIGN KEY (khuyen_nghi_dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: lich_dat lich_dat_khuyen_nghi_goi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_khuyen_nghi_goi_id_fkey FOREIGN KEY (khuyen_nghi_goi_id) REFERENCES public.goi_dich_vu(id);


--
-- Name: lich_dat lich_dat_ky_thuat_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_ky_thuat_vien_id_fkey FOREIGN KEY (ky_thuat_vien_id) REFERENCES public.chuyen_gia_y_te(id);


--
-- Name: lich_dat lich_dat_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dat
    ADD CONSTRAINT lich_dat_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_dich_vu_id_fkey FOREIGN KEY (dich_vu_id) REFERENCES public.dich_vu(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_lich_dat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_lich_dat_id_fkey FOREIGN KEY (lich_dat_id) REFERENCES public.lich_dat(id);


--
-- Name: lich_dieu_tri lich_dieu_tri_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_dieu_tri
    ADD CONSTRAINT lich_dieu_tri_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: lich_lam_viec lich_lam_viec_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_lam_viec
    ADD CONSTRAINT lich_lam_viec_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: nguoi_dung nguoi_dung_vai_tro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT nguoi_dung_vai_tro_id_fkey FOREIGN KEY (vai_tro_id) REFERENCES public.vai_tro(id);


--
-- Name: phong_dich_vu phong_dich_vu_danh_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_dich_vu
    ADD CONSTRAINT phong_dich_vu_danh_muc_id_fkey FOREIGN KEY (danh_muc_id) REFERENCES public.danh_muc_dich_vu(id);


--
-- Name: phong_dich_vu phong_dich_vu_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_dich_vu
    ADD CONSTRAINT phong_dich_vu_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong(id);


--
-- Name: refresh_tokens refresh_tokens_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id);


--
-- Name: system_audit_log system_audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_audit_log
    ADD CONSTRAINT system_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.nguoi_dung(id);


--
-- Name: thanh_toan thanh_toan_hoa_don_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thanh_toan
    ADD CONSTRAINT thanh_toan_hoa_don_id_fkey FOREIGN KEY (hoa_don_id) REFERENCES public.hoa_don(id);


--
-- Name: voucher voucher_tao_boi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voucher
    ADD CONSTRAINT voucher_tao_boi_fkey FOREIGN KEY (tao_boi) REFERENCES public.nguoi_dung(id);


--
-- PostgreSQL database dump complete
--

\unrestrict fPef6LdT7zhVk4hiNbZNvmk1DUWFcSf51BChe974Phe1EkZrLrNEwmEjBm5hfHg

