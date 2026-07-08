--
-- PostgreSQL database dump
--

\restrict scRfMZ32RBrpdgHUS3diRKnDDuGwYT4fLpwBGzZBmHk3iRVxZpcKxZhGCDJYGDP

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chi_dinh_buoi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chi_dinh_buoi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nhat_ky_id uuid NOT NULL,
    goi_dich_vu_id uuid,
    ghi_chu text
);


ALTER TABLE public.chi_dinh_buoi OWNER TO postgres;

--
-- Name: cuoc_hen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuoc_hen (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khach_hang_id uuid NOT NULL,
    nhan_su_id integer,
    goi_dich_vu_id uuid,
    phac_do_dieu_tri_id uuid,
    so_thu_tu_buoi integer,
    ngay_gio_bat_dau timestamp(6) with time zone NOT NULL,
    ngay_gio_ket_thuc timestamp(6) with time zone NOT NULL,
    loai character varying(20) NOT NULL,
    trang_thai character varying(20) DEFAULT 'cho_xac_nhan'::character varying NOT NULL,
    ghi_chu text,
    phong_id integer,
    ly_do_huy text,
    thoi_gian_huy timestamp with time zone
);


ALTER TABLE public.cuoc_hen OWNER TO postgres;

--
-- Name: danh_gia_chat_luong; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danh_gia_chat_luong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cuoc_hen_id uuid NOT NULL,
    khach_hang_id uuid NOT NULL,
    so_sao integer NOT NULL,
    nhan_xet text
);


ALTER TABLE public.danh_gia_chat_luong OWNER TO postgres;

--
-- Name: danh_muc_goi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.danh_muc_goi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ten_danh_muc character varying(150) NOT NULL,
    mo_ta text,
    loai_goi_ap_dung character varying(20) DEFAULT 'LIEU_TRINH'::character varying NOT NULL
);


ALTER TABLE public.danh_muc_goi OWNER TO postgres;

--
-- Name: giao_dich_thanh_toan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.giao_dich_thanh_toan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hoa_don_id uuid NOT NULL,
    so_tien bigint NOT NULL,
    loai_giao_dich character varying(20) NOT NULL,
    phuong_thuc character varying(20) NOT NULL,
    ma_tham_chieu character varying(100),
    nhan_vien_thuc_hien_id integer NOT NULL,
    ngay_giao_dich timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.giao_dich_thanh_toan OWNER TO postgres;

--
-- Name: goi_dich_vu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goi_dich_vu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ten_goi character varying(200) NOT NULL,
    loai_goi character varying(20) NOT NULL,
    tong_so_buoi integer DEFAULT 1 NOT NULL,
    thoi_luong_phut integer DEFAULT 30 NOT NULL,
    don_gia bigint NOT NULL,
    don_gia_theo_buoi bigint NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    anh_goi text,
    danh_muc_goi_id uuid,
    muc_tieu text,
    quy_trinh text
);


ALTER TABLE public.goi_dich_vu OWNER TO postgres;

--
-- Name: ho_so_chuyen_gia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ho_so_chuyen_gia (
    id integer NOT NULL,
    nguoi_dung_id integer NOT NULL,
    so_nam_kinh_nghiem integer,
    bang_cap_chung_chi text,
    mo_ta text
);


ALTER TABLE public.ho_so_chuyen_gia OWNER TO postgres;

--
-- Name: ho_so_chuyen_gia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ho_so_chuyen_gia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ho_so_chuyen_gia_id_seq OWNER TO postgres;

--
-- Name: ho_so_chuyen_gia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ho_so_chuyen_gia_id_seq OWNED BY public.ho_so_chuyen_gia.id;


--
-- Name: hoa_don; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hoa_don (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khach_hang_id uuid NOT NULL,
    phac_do_dieu_tri_id uuid,
    cuoc_hen_id uuid,
    tong_tien_goc bigint DEFAULT 0 NOT NULL,
    hinh_thuc_thanh_toan_goi character varying(20),
    ti_le_giam_gia_goi integer DEFAULT 0,
    voucher_id uuid,
    so_tien_giam_voucher bigint DEFAULT 0,
    tong_tien_phai_tra bigint NOT NULL,
    so_tien_da_tra bigint DEFAULT 0 NOT NULL,
    trang_thai character varying(30) DEFAULT 'chua_thanh_toan'::character varying NOT NULL,
    ghi_chu text,
    ngay_tao timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.hoa_don OWNER TO postgres;

--
-- Name: khach_hang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khach_hang (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ho_ten character varying(150) NOT NULL,
    email character varying(255),
    mat_khau_hash character varying(255),
    so_dien_thoai character varying(20),
    dia_chi text,
    ngay_sinh date,
    gioi_tinh character varying(10),
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL
);


ALTER TABLE public.khach_hang OWNER TO postgres;

--
-- Name: khuyen_mai_voucher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.khuyen_mai_voucher (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_code character varying(50) NOT NULL,
    loai_giam_gia character varying(20) NOT NULL,
    gia_tri_giam bigint NOT NULL,
    giam_toi_da bigint,
    don_hang_toi_thieu bigint DEFAULT 0 NOT NULL,
    ngay_bat_dau timestamp(6) with time zone NOT NULL,
    ngay_het_han timestamp(6) with time zone,
    so_luong_gioi_han integer,
    so_luong_da_dung integer DEFAULT 0 NOT NULL,
    dang_kich_hoat boolean DEFAULT true NOT NULL
);


ALTER TABLE public.khuyen_mai_voucher OWNER TO postgres;

--
-- Name: lich_truc_nhan_su; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lich_truc_nhan_su (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nhan_su_id integer NOT NULL,
    ngay_truc date NOT NULL,
    ca_truc character varying(20) NOT NULL,
    gio_bat_dau time(6) without time zone NOT NULL,
    gio_ket_thuc time(6) without time zone NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    phong_id integer
);


ALTER TABLE public.lich_truc_nhan_su OWNER TO postgres;

--
-- Name: nguoi_dung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nguoi_dung (
    id integer NOT NULL,
    ho_ten character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    so_dien_thoai character varying(20),
    mat_khau_hash character varying(255) NOT NULL,
    vai_tro_id smallint NOT NULL,
    trang_thai character varying(20) DEFAULT 'hoat_dong'::character varying NOT NULL,
    anh_dai_dien text
);


ALTER TABLE public.nguoi_dung OWNER TO postgres;

--
-- Name: nguoi_dung_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nguoi_dung_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nguoi_dung_id_seq OWNER TO postgres;

--
-- Name: nguoi_dung_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nguoi_dung_id_seq OWNED BY public.nguoi_dung.id;


--
-- Name: nhat_ky_buoi_dieu_tri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nhat_ky_buoi_dieu_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cuoc_hen_id uuid NOT NULL,
    nguoi_tao_id integer NOT NULL,
    vas_truoc integer,
    vas_sau integer,
    chan_doan text,
    chong_chi_dinh text,
    ghi_chu text,
    ngay_tao timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.nhat_ky_buoi_dieu_tri OWNER TO postgres;

--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    otp character varying(6) NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- Name: phac_do_dieu_tri; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phac_do_dieu_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khach_hang_id uuid NOT NULL,
    goi_dich_vu_id uuid NOT NULL,
    tong_so_buoi integer NOT NULL,
    so_buoi_da_dung integer DEFAULT 0 NOT NULL,
    trang_thai character varying(20) DEFAULT 'cho_kich_hoat'::character varying NOT NULL,
    ngay_kich_hoat date,
    han_su_dung date
);


ALTER TABLE public.phac_do_dieu_tri OWNER TO postgres;

--
-- Name: phong_lam_viec; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phong_lam_viec (
    id integer NOT NULL,
    ten_phong character varying(100) NOT NULL,
    ma_phong character varying(20),
    loai_phong character varying(50) NOT NULL,
    suc_chua integer DEFAULT 1 NOT NULL,
    trang_thai character varying(20) DEFAULT 'san_sang'::character varying NOT NULL,
    mo_ta text
);


ALTER TABLE public.phong_lam_viec OWNER TO postgres;

--
-- Name: phong_lam_viec_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.phong_lam_viec_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.phong_lam_viec_id_seq OWNER TO postgres;

--
-- Name: phong_lam_viec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.phong_lam_viec_id_seq OWNED BY public.phong_lam_viec.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    nguoi_dung_id integer,
    khach_hang_id uuid,
    token text NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: tam_giu_cho; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tam_giu_cho (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying(100) NOT NULL,
    ngay_gio_bat_dau timestamp with time zone NOT NULL,
    ngay_gio_ket_thuc timestamp with time zone NOT NULL,
    nhan_su_id integer,
    goi_dich_vu_id uuid,
    thoi_gian_het_han timestamp with time zone NOT NULL,
    thoi_gian_tao timestamp with time zone DEFAULT now(),
    khach_hang_id uuid,
    so_dien_thoai text
);


ALTER TABLE public.tam_giu_cho OWNER TO postgres;

--
-- Name: thiet_bi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thiet_bi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_thiet_bi character varying(50) NOT NULL,
    ten_thiet_bi character varying(150) NOT NULL,
    ngay_mua date,
    trang_thai character varying(20) DEFAULT 'san_sang'::character varying NOT NULL,
    ghi_chu text
);


ALTER TABLE public.thiet_bi OWNER TO postgres;

--
-- Name: thong_bao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.thong_bao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nguoi_dung_id integer,
    khach_hang_id uuid,
    tieu_de character varying(200) NOT NULL,
    noi_dung text NOT NULL,
    loai character varying(30) DEFAULT 'he_thong'::character varying NOT NULL,
    da_doc boolean DEFAULT false NOT NULL,
    thoi_gian_tao timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.thong_bao OWNER TO postgres;

--
-- Name: vai_tro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vai_tro (
    id smallint NOT NULL,
    ma_vai_tro character varying(20) NOT NULL,
    ten_vai_tro character varying(50) NOT NULL
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
-- Name: ho_so_chuyen_gia id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ho_so_chuyen_gia ALTER COLUMN id SET DEFAULT nextval('public.ho_so_chuyen_gia_id_seq'::regclass);


--
-- Name: nguoi_dung id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nguoi_dung ALTER COLUMN id SET DEFAULT nextval('public.nguoi_dung_id_seq'::regclass);


--
-- Name: phong_lam_viec id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_lam_viec ALTER COLUMN id SET DEFAULT nextval('public.phong_lam_viec_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: vai_tro id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vai_tro ALTER COLUMN id SET DEFAULT nextval('public.vai_tro_id_seq'::regclass);


--
-- Data for Name: chi_dinh_buoi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chi_dinh_buoi (id, nhat_ky_id, goi_dich_vu_id, ghi_chu) FROM stdin;
1744055e-4300-4b17-850e-66483e2475b6	24cf2ca0-7ab8-4229-b605-63f5f35d9c7c	c1000000-0000-0000-0000-000000000001	\N
\.


--
-- Data for Name: cuoc_hen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuoc_hen (id, khach_hang_id, nhan_su_id, goi_dich_vu_id, phac_do_dieu_tri_id, so_thu_tu_buoi, ngay_gio_bat_dau, ngay_gio_ket_thuc, loai, trang_thai, ghi_chu, phong_id, ly_do_huy, thoi_gian_huy) FROM stdin;
4f9a63fd-1763-4c9f-a783-d063b5840d04	d5d1baf4-628a-4622-ba35-95da33c19c16	5	c1000000-0000-0000-0000-000000000000	\N	\N	2026-07-04 10:00:00+07	2026-07-04 10:30:00+07	KHAM	hoan_thanh	Khám lượng giá ban đầu	1	\N	\N
152b230c-d768-4bf6-b6d6-43046c5adda0	d5d1baf4-628a-4622-ba35-95da33c19c16	5	c1000000-0000-0000-0000-000000000000	\N	\N	2026-07-04 14:50:00+07	2026-07-04 15:20:00+07	KHAM	da_huy	Khám lượng giá ban đầu	1	\N	\N
5a9bd1cd-a99c-458e-9bfd-9f2fd365a6ba	d5d1baf4-628a-4622-ba35-95da33c19c16	10	c1000000-0000-0000-0000-000000000102	\N	\N	2026-07-04 14:30:00+07	2026-07-04 14:50:00+07	DICH_VU_LE	da_xac_nhan	Trị liệu lẻ: Trị liệu sóng xung kích Focused Shockwave	4	\N	\N
b40efd0d-9845-4e4a-8523-fb9f7fbcf426	d5d1baf4-628a-4622-ba35-95da33c19c16	5	c1000000-0000-0000-0000-000000000000	\N	\N	2026-07-04 15:30:00+07	2026-07-04 16:00:00+07	KHAM	da_xac_nhan	Khám lượng giá ban đầu	1	\N	\N
8568a50c-9340-4368-a94f-f66cd2162c79	d5d1baf4-628a-4622-ba35-95da33c19c16	7	c1000000-0000-0000-0000-000000000101	\N	\N	2026-07-05 14:45:00+07	2026-07-05 15:00:00+07	DICH_VU_LE	da_xac_nhan	Trị liệu lẻ: Trị liệu Laser công suất cao giảm sưng viêm	2	\N	\N
\.


--
-- Data for Name: danh_gia_chat_luong; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danh_gia_chat_luong (id, cuoc_hen_id, khach_hang_id, so_sao, nhan_xet) FROM stdin;
\.


--
-- Data for Name: danh_muc_goi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.danh_muc_goi (id, ten_danh_muc, mo_ta, loai_goi_ap_dung) FROM stdin;
d1000000-0000-0000-0000-000000000001	Khám & Lượng Giá Chuyên Sâu	Các gói khám và đánh giá ban đầu với Bác sĩ	KHAM
d1000000-0000-0000-0000-000000000002	Trị Liệu Giải Quyết Cơn Đau	Các gói lẻ điện xung, laser, sóng xung kích điều trị triệu chứng	LE
d1000000-0000-0000-0000-000000000003	Phục Hồi Chức Năng Chuyên Sâu	Các gói liệu trình chuyên sâu điều trị phục hồi cột sống, khớp xương gối	LIEU_TRINH
7f5999ce-4791-406e-b9cd-772b2833bdee	Khám Lưng	\N	KHAM
\.


--
-- Data for Name: giao_dich_thanh_toan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.giao_dich_thanh_toan (id, hoa_don_id, so_tien, loai_giao_dich, phuong_thuc, ma_tham_chieu, nhan_vien_thuc_hien_id, ngay_giao_dich) FROM stdin;
\.


--
-- Data for Name: goi_dich_vu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goi_dich_vu (id, ten_goi, loai_goi, tong_so_buoi, thoi_luong_phut, don_gia, don_gia_theo_buoi, trang_thai, anh_goi, danh_muc_goi_id, muc_tieu, quy_trinh) FROM stdin;
c1000000-0000-0000-0000-000000000003	Gói Phục Hồi Chấn Thương Thể Thao & Viêm Gân Cấp	LIEU_TRINH	12	60	5400000	450000	hoat_dong	/goi/images/laser_tri_lieu.png	d1000000-0000-0000-0000-000000000003	\N	\N
c1000000-0000-0000-0000-000000000000	Khám lâm sàng & Lượng giá chức năng cơ xương khớp	KHAM	1	30	200000	200000	hoat_dong	/goi/images/kham_sang_loc.png	d1000000-0000-0000-0000-000000000001	Biết Được Tình Trạng Đau Của Khách Hàng , Đưa Giải Phác Đồ Hợp Lý	Bác Sĩ Đo Chỉ Số Cơ Thể Và Khám Thăm Khám Vùng Đau
c1000000-0000-0000-0000-000000000103	Giải cơ sâu & màng cơ chuyên sâu Myofascial Release	LE	1	60	350000	350000	hoat_dong	/goi/images/giai_co_sau.png	d1000000-0000-0000-0000-000000000002	123	123
c1000000-0000-0000-0000-000000000001	Gói Phục Hồi Cột Sống & Đau Vai Gáy Chuyên Sâu	LIEU_TRINH	8	60	3200000	450000	hoat_dong	/goi/images/giai_co_sau.png	d1000000-0000-0000-0000-000000000003	123	123
c1000000-0000-0000-0000-000000000101	Trị liệu Laser công suất cao giảm sưng viêm	LE	1	15	250000	250000	hoat_dong	/goi/images/laser_tri_lieu.png	\N	\N	\N
c1000000-0000-0000-0000-000000000102	Trị liệu sóng xung kích Focused Shockwave	LE	1	20	300000	300000	hoat_dong	/goi/images/song_xung_kich.png	\N	\N	\N
c1000000-0000-0000-0000-000000000002	Gói Trị Liệu Thoát Vị Đĩa Đệm Cột Sống Thắt Lưng	LIEU_TRINH	10	60	4500000	460000	hoat_dong	/goi/images/song_xung_kich.png	\N	123	123
\.


--
-- Data for Name: ho_so_chuyen_gia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ho_so_chuyen_gia (id, nguoi_dung_id, so_nam_kinh_nghiem, bang_cap_chung_chi, mo_ta) FROM stdin;
1	5	15	/nhan_su/images/cert_assess.png,/nhan_su/images/cert_physio.png	Bác sĩ Nguyễn Văn An là chuyên gia hàng đầu với hơn 15 năm kinh nghiệm trong lĩnh vực Phục hồi chức năng và Vật lý trị liệu cơ xương khớp. Ông từng tốt nghiệp thủ khoa Đại học Y Dược TP.HCM và tu nghiệp chuyên sâu tại Singapore. Bác sĩ An nổi tiếng với phương pháp lượng giá sinh học vận động toàn diện, giúp phát hiện nguồn gốc sâu xa của các chứng đau cột sống cổ, vai gáy và thắt lưng của dân văn phòng.
2	6	10	/nhan_su/images/cert_assess.png,/nhan_su/images/cert_physio.png	Bác sĩ Trần Thị Bình có hơn 10 năm công tác chuyên sâu về Cơ Xương Khớp và Y học Thể thao. Bà chuyên điều trị phục hồi các chấn thương thể thao cấp tính, đứt dây chằng chéo trước, rách sụn chêm và viêm gân mãn tính. Bác sĩ Bình luôn áp dụng các công nghệ y khoa tiên tiến như sóng xung kích hội tụ và laser công suất cao kết hợp phác đồ vận động cá nhân hóa để đẩy nhanh tốc độ phục hồi.
3	7	8	/nhan_su/images/cert_assess.png,/nhan_su/images/cert_physio.png	Kỹ thuật viên Lê Văn Cường có 8 năm kinh nghiệm thực hành trị liệu bằng tay chuyên sâu (Manual Therapy). Anh là chuyên gia về giải phóng cơ sâu (Myofascial Release) và di động khớp phục hồi biên độ vận động. Cường luôn tận tâm hướng dẫn bệnh nhân từng bài tập cốt lõi để duy trì hiệu quả trị liệu lâu dài.
4	8	6	/nhan_su/images/cert_assess.png,/nhan_su/images/cert_physio.png	Kỹ thuật viên Phạm Thị Dung là nữ chuyên gia trị liệu có 6 năm kinh nghiệm về phục hồi chức năng sau phẫu thuật cột sống và thay khớp. Sự nhẹ nhàng, chu đáo cùng chuyên môn vững vàng của cô giúp bệnh nhân luôn cảm thấy an tâm và có động lực trong suốt hành trình tập luyện.
5	9	5	/nhan_su/images/cert_assess.png,/nhan_su/images/cert_physio.png	Kỹ thuật viên Lê Văn Chiến có 5 năm kinh nghiệm về Vật lý trị liệu phục hồi thể thao, hỗ trợ các vận động viên phục hồi phong độ tối ưu sau chấn thương dây chằng và cơ bắp.
6	10	4	/nhan_su/images/cert_assess.png,/nhan_su/images/cert_physio.png	Kỹ thuật viên Phạm Thị Đào có 4 năm kinh nghiệm trị liệu bằng tay và vận động trị liệu cột sống cổ - vai - gáy cho đối tượng nhân viên văn phòng.
13	11	1	Bác sĩ Vật lý trị liệu	\N
14	12	1	Bác sĩ Vật lý trị liệu	\N
15	13	1	Kỹ thuật viên Vật lý trị liệu	\N
\.


--
-- Data for Name: hoa_don; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hoa_don (id, khach_hang_id, phac_do_dieu_tri_id, cuoc_hen_id, tong_tien_goc, hinh_thuc_thanh_toan_goi, ti_le_giam_gia_goi, voucher_id, so_tien_giam_voucher, tong_tien_phai_tra, so_tien_da_tra, trang_thai, ghi_chu, ngay_tao) FROM stdin;
\.


--
-- Data for Name: khach_hang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khach_hang (id, ho_ten, email, mat_khau_hash, so_dien_thoai, dia_chi, ngay_sinh, gioi_tinh, trang_thai) FROM stdin;
10000000-0000-0000-0000-000000000011	Nguyễn Văn An	kh1@gmail.com	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	0912000011	12 Nguyễn Huệ, Q1, TP.HCM	1988-03-15	nam	hoat_dong
10000000-0000-0000-0000-000000000012	Trần Thị Bảo	kh2@gmail.com	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	0912000012	45 Lê Lợi, Q1, TP.HCM	1992-07-22	nu	hoat_dong
10000000-0000-0000-0000-000000000013	Lê Quang Cường	kh3@gmail.com	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	0912000013	78 Trần Hưng Đạo, Q5, TP.HCM	1985-11-08	nam	hoat_dong
10000000-0000-0000-0000-000000000014	Phạm Thị Dung	kh4@gmail.com	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	0912000014	23 Điện Biên Phủ, Q3, TP.HCM	1995-04-30	nu	hoat_dong
d5d1baf4-628a-4622-ba35-95da33c19c16	Trần Vinh	vinhtcpd09969@gmail.com	$2b$10$OXLSw7p06oxu28UfM1j8p.ZlB26ojcWXkVtYkzKNPuvBsgCYNDNs2	\N	\N	\N	\N	hoat_dong
f4a36fe7-4ef3-400c-9f28-5e96e52598a4	Trần Vinh	0398655532@officecare.placeholder	$2b$10$yy5u3Ip05ubzPaLqa493l.QMtX/XMYnUF6zRFxrIdpQpy5p88fxyW	0398655532	\N	\N	nam	hoat_dong
\.


--
-- Data for Name: khuyen_mai_voucher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.khuyen_mai_voucher (id, ma_code, loai_giam_gia, gia_tri_giam, giam_toi_da, don_hang_toi_thieu, ngay_bat_dau, ngay_het_han, so_luong_gioi_han, so_luong_da_dung, dang_kich_hoat) FROM stdin;
50000000-0000-0000-0000-000000000001	WELCOME10	phan_tram	10	200000	500000	2026-06-29 07:00:00+07	2026-09-27 07:00:00+07	100	0	t
50000000-0000-0000-0000-000000000002	SUMMER200	tien_mat	200000	200000	1000000	2026-06-29 07:00:00+07	2026-07-29 07:00:00+07	50	0	t
\.


--
-- Data for Name: lich_truc_nhan_su; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lich_truc_nhan_su (id, nhan_su_id, ngay_truc, ca_truc, gio_bat_dau, gio_ket_thuc, trang_thai, phong_id) FROM stdin;
35c21c8a-4082-4f3a-b721-a58465242851	5	2026-07-03	SANG	07:00:00	16:00:00	hoat_dong	1
fb2d1e0f-efb4-4fec-a7c1-1dcc5520bd6e	6	2026-07-03	SANG	07:00:00	16:00:00	hoat_dong	1
43aa330c-f47f-40ba-ba8d-51b976583a2d	12	2026-07-03	SANG	07:00:00	16:00:00	hoat_dong	5
452fcf26-7084-42da-8539-530620fe35bd	5	2026-07-04	SANG	07:00:00	16:00:00	hoat_dong	1
f101f03e-a6ba-48a2-878a-a8a13b8442b1	6	2026-07-04	SANG	07:00:00	16:00:00	hoat_dong	1
a5d266e7-c769-4605-8c1c-6268cf041db8	8	2026-07-02	SANG	11:00:00	20:00:00	hoat_dong	2
31c4ee91-c4b1-4ee5-a16f-3951364570b2	9	2026-07-02	SANG	07:00:00	16:00:00	hoat_dong	2
c44bd2b9-c060-471c-b431-b0128dd56b10	9	2026-07-03	SANG	07:00:00	16:00:00	hoat_dong	2
8f1f5a26-f68e-4195-8345-746f0fec90d2	9	2026-07-04	SANG	07:00:00	16:00:00	hoat_dong	2
65fa0dd0-f164-46c6-b9fd-ba1538f56b40	8	2026-07-04	SANG	07:00:00	16:00:00	hoat_dong	2
cfe11e72-a41d-46bb-b4a7-a352259d43b7	10	2026-07-04	SANG	11:00:00	20:00:00	hoat_dong	4
42a11380-468c-4cdd-914b-cda233f78fd5	5	2026-07-05	SANG	07:00:00	16:00:00	hoat_dong	1
423cbe0f-f8e8-4872-a81c-e1f1e5593059	7	2026-07-04	SANG	07:00:00	16:00:00	hoat_dong	4
6d80e147-a354-4474-a1de-4e4884378c4e	7	2026-07-05	SANG	07:00:00	16:00:00	hoat_dong	2
\.


--
-- Data for Name: nguoi_dung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nguoi_dung (id, ho_ten, email, so_dien_thoai, mat_khau_hash, vai_tro_id, trang_thai, anh_dai_dien) FROM stdin;
1	Nguyễn Admin Hệ Thống	admin@officecare.vn	0901000001	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	5	hoat_dong	\N
2	Trần Minh Quản Lý	quanly@officecare.vn	0901000002	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	6	hoat_dong	\N
3	Lê Thị Hoa	letan1@officecare.vn	0901000003	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	2	hoat_dong	\N
4	Phạm Ngọc Mai	letan2@officecare.vn	0901000004	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	2	hoat_dong	\N
5	BS. Nguyễn Văn Khoa	bacsi1@officecare.vn	0901000005	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	4	hoat_dong	/nhan_su/images/dr_nguyen_van_a.png
6	BS. Trần Thị Lan Anh	bacsi2@officecare.vn	0901000006	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	4	hoat_dong	/nhan_su/images/dr_tran_thi_b.png
7	KTV. Đỗ Thanh Tùng	ktv1@officecare.vn	0901000007	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	3	hoat_dong	/nhan_su/images/ktv_le_van_c.png
8	KTV. Nguyễn Thị Bích	ktv2@officecare.vn	0901000008	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	3	hoat_dong	/nhan_su/images/ktv_pham_thi_d.png
9	KTV. Hoàng Văn Minh	ktv3@officecare.vn	0901000009	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	3	hoat_dong	/nhan_su/images/ktv_le_van_c.png
10	KTV. Vũ Thị Thanh	ktv4@officecare.vn	0901000010	$2b$10$Pa.Psa0yUMgFF/XBoLRC9enPa1ySh0dTrM9o8O7RmASsLRcK5.fsu	3	hoat_dong	/nhan_su/images/ktv_pham_thi_d.png
11	Phan Phú lâm	lam@gmail.com	0398655333	$2b$10$nXuSxfxvKsh.J5kcToJsNuaN3dH/vA9NYWxi0xKTqAvR5hUGwGv.S	4	vo_hieu	\N
12	tiên trịnh	tien@gmail.com	0398655574	$2b$10$mnmTAfqcUVNgh47wSIioy.EwS0hy8VDxefrGQX8uUkMRzK0LJrWjS	4	hoat_dong	\N
13	kindc	vinhtcpd9969@gmail.com	0269874532	$2b$10$XSOqfG/H7ChnM.MQeISLEOpk8yVNG4jIznUNdcOECzyUnPtWXjrW2	3	hoat_dong	\N
\.


--
-- Data for Name: nhat_ky_buoi_dieu_tri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nhat_ky_buoi_dieu_tri (id, cuoc_hen_id, nguoi_tao_id, vas_truoc, vas_sau, chan_doan, chong_chi_dinh, ghi_chu, ngay_tao) FROM stdin;
24cf2ca0-7ab8-4229-b605-63f5f35d9c7c	4f9a63fd-1763-4c9f-a783-d063b5840d04	5	\N	\N	thoái hóa	chống điện xung	không	2026-07-03 23:44:27.002684+07
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_codes (id, email, otp, expires_at, created_at) FROM stdin;
ef62aae8-3c29-4ce7-b059-0d8e3d9906cd	vinhtcpd09969@gmail.com	961509	2026-07-02 15:22:41.73+07	2026-07-02 15:12:41.732+07
29125fd4-a3e4-4881-8a03-bddf8957802e	vinhtcpd09969@gmail.com	446778	2026-07-02 15:37:13.466+07	2026-07-02 15:27:13.489+07
3a5c164d-34f7-4321-836e-dcac7db737ca	vinhtcpd09969@gmail.com	548296	2026-07-02 15:41:43.441+07	2026-07-02 15:31:43.445+07
864d6ae5-7158-4fde-ae4b-375229be1965	vinhtcpd09969@gmail.com	742513	2026-07-02 22:48:26.677+07	2026-07-02 22:38:26.685+07
99e6670b-ce7b-480c-9722-4040f58feb3a	vinhtcpd09969@gmail.com	903838	2026-07-03 20:14:11.79+07	2026-07-03 20:04:11.813+07
\.


--
-- Data for Name: phac_do_dieu_tri; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phac_do_dieu_tri (id, khach_hang_id, goi_dich_vu_id, tong_so_buoi, so_buoi_da_dung, trang_thai, ngay_kich_hoat, han_su_dung) FROM stdin;
f0000000-0000-0000-0000-000000000001	10000000-0000-0000-0000-000000000011	c1000000-0000-0000-0000-000000000001	8	2	dang_dieu_tri	2026-06-25	\N
f0000000-0000-0000-0000-000000000002	10000000-0000-0000-0000-000000000012	c1000000-0000-0000-0000-000000000002	10	0	dang_dieu_tri	2026-07-01	\N
\.


--
-- Data for Name: phong_lam_viec; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phong_lam_viec (id, ten_phong, ma_phong, loai_phong, suc_chua, trang_thai, mo_ta) FROM stdin;
1	Phòng Khám Lâm Sàng 01	PK-01	phong_kham	2	san_sang	Phòng khám bệnh lâm sàng ban đầu
2	Phòng Trị Liệu 01	TL-01	phong_tri_lieu	4	san_sang	Phòng trị liệu cơ bản
3	Phòng Tập Phục Hồi Chức Năng	PHCN-01	phong_tap	6	san_sang	Phòng tập PHCN chuyên biệt
4	Phòng Trị Liệu Đặc Biệt	TL-DB	phong_tri_lieu	2	san_sang	Phòng trị liệu cao cấp
5	Khám 1	PK	phong_kham	2	san_sang	
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, nguoi_dung_id, khach_hang_id, token, expires_at, created_at) FROM stdin;
1	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTMxMTExLCJleHAiOjE3ODM1MzU5MTF9.EYzbXp15rk_HdI_QwHFWwRt_wR3g2iyf5UyHw7i-JQg	2026-07-08 18:38:31.688	2026-07-01 18:38:31.795
2	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgyOTMxMTE4LCJleHAiOjE3ODM1MzU5MTh9.JtS0sn-YqMGHatnfTQskIVxtrC5iiM7NjUvpxKB2YF4	2026-07-08 18:38:38.404	2026-07-01 18:38:38.406
3	7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzgyOTMxMTY1LCJleHAiOjE3ODM1MzU5NjV9.9BAhXgRWqRlMq81vME3d2h5h9IKb_gLKlVw9iC6nGno	2026-07-08 18:39:25.873	2026-07-01 18:39:25.874
4	5	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzgyOTMxMTcyLCJleHAiOjE3ODM1MzU5NzJ9.7mGfDmq8oI13S7EiYKTUgI3qz-BaHr0bvxhcm4_oycE	2026-07-08 18:39:32.153	2026-07-01 18:39:32.154
5	7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzgyOTMxMTgxLCJleHAiOjE3ODM1MzU5ODF9.Obqqz-0ckLBx_eV0nHogBt0RSbDRZzHdhea-CmUJf_0	2026-07-08 18:39:41.744	2026-07-01 18:39:41.746
6	5	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzgyOTMxMTg1LCJleHAiOjE3ODM1MzU5ODV9.VJhlyEEgsT6BeokPf5dog9kg9r1CfrY-_E7KT629wTQ	2026-07-08 18:39:45.492	2026-07-01 18:39:45.492
7	2	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgyOTMxMTk3LCJleHAiOjE3ODM1MzU5OTd9.G0k4mD6jQcloE7HLzQfGj8ktO6Mv_EAWJ8T-c2mvnXQ	2026-07-08 18:39:57.245	2026-07-01 18:39:57.246
8	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTMxMjIyLCJleHAiOjE3ODM1MzYwMjJ9.vJQZW4ODseOr5ilLcfBRq431NRu2G74nRx089UsWCQs	2026-07-08 18:40:22.769	2026-07-01 18:40:22.769
9	2	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgyOTMxMjMxLCJleHAiOjE3ODM1MzYwMzF9.KIQlrZjOU0-N9O1xRmezvDupk30Spv4yhN0_5jHyO-s	2026-07-08 18:40:31.39	2026-07-01 18:40:31.39
10	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MjkzMTI0MCwiZXhwIjoxNzgzNTM2MDQwfQ.Yy2odZtNhwoAG9lXWRGpybOGvnXyZItI3SQtAzUhYdc	2026-07-08 18:40:40.788	2026-07-01 18:40:40.79
11	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTMzMjY5LCJleHAiOjE3ODM1MzgwNjl9.FkXipIHI0FUGlgvygBB84R535e1RwXo1Qu2VUsdnZbU	2026-07-08 19:14:29.231	2026-07-01 19:14:29.267
12	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MjkzMzI5NywiZXhwIjoxNzgzNTM4MDk3fQ.Oa4SWJ8mVB2Hue17VsxK_KgCH7y_PaMhME-BGkp2h1g	2026-07-08 19:14:57.739	2026-07-01 19:14:57.749
13	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTY5MzE1LCJleHAiOjE3ODM1NzQxMTV9.-17R7scV_QSA61DZNQre_WQcrttMDb_HrKyrzohmG1A	2026-07-09 05:15:15.426	2026-07-02 05:15:15.447
14	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk2OTMzMywiZXhwIjoxNzgzNTc0MTMzfQ.6C0CouOlJyTsSVMamXUk7JOX4ZE9WnGfDtlZyXwtsU0	2026-07-09 05:15:33.176	2026-07-02 05:15:33.181
15	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk3MDY5NywiZXhwIjoxNzgzNTc1NDk3fQ.tRzyjV8mFUIG06gEw-n2NeqsMrOFQ7dvxAFgCjgODLw	2026-07-09 05:38:17.726	2026-07-02 05:38:17.733
16	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTcwNzgzLCJleHAiOjE3ODM1NzU1ODN9.fQ-yRxLhfoTRjAJ0Lo66qVuzR-eIF0CxKZQRpwjho-U	2026-07-09 05:39:43.432	2026-07-02 05:39:43.442
17	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk3MTYyMiwiZXhwIjoxNzgzNTc2NDIyfQ.HjX6r7FVseNE04ThODFSbGprrqI1MTw7kU5WWIcinwo	2026-07-09 05:53:42.836	2026-07-02 05:53:42.866
18	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTc0MjU2LCJleHAiOjE3ODM1NzkwNTZ9.Cb3125DEgiLllbTd-pZinfIuwLr4m2L5zj_ufLZaMQA	2026-07-09 06:37:36.225	2026-07-02 06:37:36.247
19	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk3OTU3MSwiZXhwIjoxNzgzNTg0MzcxfQ.mdLgRoBXeRGXu7nzfoNbqzUIHSxGFZzjstMj6dPgv_8	2026-07-09 08:06:11.026	2026-07-02 08:06:11.046
20	7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzgyOTc5NzI2LCJleHAiOjE3ODM1ODQ1MjZ9.HZ3oGme2Lxq-mrtkdyclCFvh7SA3EPzrmCo2VoY3gwI	2026-07-09 08:08:46.349	2026-07-02 08:08:46.409
21	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk3OTcyOSwiZXhwIjoxNzgzNTg0NTI5fQ.eD6WWjHRm1dBwV8saHiTFSGgijwakMKfn_-lX3XvcmE	2026-07-09 08:08:49.655	2026-07-02 08:08:49.656
22	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTgwNDA1LCJleHAiOjE3ODM1ODUyMDV9.9S3E4xcVfWqO0K6ovKCQZWz0Mchw0b6LCjUVfq1DkmE	2026-07-09 08:20:05.418	2026-07-02 08:20:05.427
23	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk4ODY5NiwiZXhwIjoxNzgzNTkzNDk2fQ.5rKVOV9IlDsZmNVlX_iBtw9QYFDZl9TGRYmPqmQ30yQ	2026-07-09 10:38:16.581	2026-07-02 10:38:16.607
24	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTg4ODI1LCJleHAiOjE3ODM1OTM2MjV9.VTdVum5Pp0axt285ieefM7g7mfCwfpcCS1U464cDbHI	2026-07-09 10:40:25.75	2026-07-02 10:40:25.816
25	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk4OTEzOSwiZXhwIjoxNzgzNTkzOTM5fQ.miTeXX7_z0nIY0fnbBeJPBncqcGwmKOXkryRr5N5zS0	2026-07-09 10:45:39.064	2026-07-02 10:45:39.068
26	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTkwMTY2LCJleHAiOjE3ODM1OTQ5NjZ9.jgQvwUaksTLmcptV08M_2FkoD4OUQ_Vp_2KCdlhWsx8	2026-07-09 11:02:46.804	2026-07-02 11:02:46.849
27	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk5MDIxMSwiZXhwIjoxNzgzNTk1MDExfQ.KjQMzZVTEQK_qv0mmd9iMI9oHuaWGdBfXf35if8n90Y	2026-07-09 11:03:31.573	2026-07-02 11:03:31.578
28	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTkzMTY1LCJleHAiOjE3ODM1OTc5NjV9.yxmvGXZudkRC3RUEm6IA0LWaLZHG96Fco2J7ePLC9mw	2026-07-09 11:52:45.014	2026-07-02 11:52:45.019
29	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk5MzE3OSwiZXhwIjoxNzgzNTk3OTc5fQ.M_KAF4ylvF8n99D0EZlXG4_pWZDLGdetHw3TA72SYdo	2026-07-09 11:52:59.177	2026-07-02 11:52:59.178
30	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgyOTk3NjY4LCJleHAiOjE3ODM2MDI0Njh9.9whYxVFTICCQ3y5jMcVkcz42ENDjdGtS_SuxZhIh4G0	2026-07-09 13:07:48.196	2026-07-02 13:07:48.272
31	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk5NzY3OCwiZXhwIjoxNzgzNjAyNDc4fQ.HynkYZDMb2qX0EjXi68VMsijldL4W0rE5HQLEc7hUvY	2026-07-09 13:07:58.239	2026-07-02 13:07:58.245
32	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4Mjk5ODQ2NCwiZXhwIjoxNzgzNjAzMjY0fQ.yl2HLCU9KIMgpjppcn7DyPMepG9uUScGMQmcyJpnRPo	2026-07-09 13:21:04.56	2026-07-02 13:21:04.576
33	2	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgzMDAxNDg0LCJleHAiOjE3ODM2MDYyODR9.kupmMYTQ4CLXu_xKgNu9V8-RwnzWhunpvDQ7brpReGE	2026-07-09 14:11:24.231	2026-07-02 14:11:24.251
34	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzAwMTU1OCwiZXhwIjoxNzgzNjA2MzU4fQ.UmEqzRvvokdNRf1hsy1GFQxxkdjqkCJua3TVcx9wxIo	2026-07-09 14:12:38.819	2026-07-02 14:12:38.821
35	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDA0MTIxLCJleHAiOjE3ODM2MDg5MjF9.j-HD_oPYIWfB2WBPDBYCt0dUd_Fg6AWu9o8Dmd4sq1U	2026-07-09 14:55:21.398	2026-07-02 14:55:21.427
36	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDA0NTc2LCJleHAiOjE3ODM2MDkzNzZ9.AhyTubJUhVeBQ265w5UaNcdHhp-aP6ChT08za_QHI1M	2026-07-09 15:02:56.592	2026-07-02 15:02:56.595
37	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDA0NjQ1LCJleHAiOjE3ODM2MDk0NDV9.5smPiPv3AQVxmiDlrgrgAHdN2cU3FbHdwKalURatLx4	2026-07-09 15:04:05.815	2026-07-02 15:04:05.823
38	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzAwNTA0MiwiZXhwIjoxNzgzNjA5ODQyfQ.x75Swq2xPYNnT597sddUX7w5o_MR0xsO6HweIMVOLi0	2026-07-09 15:10:42.357	2026-07-02 15:10:42.371
39	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDA2NjQ0LCJleHAiOjE3ODM2MTE0NDR9.qp9Z4b5tf6ahrB8mAVM-ALIiTniuM0JmTnKPfEGUAmo	2026-07-09 15:37:24.764	2026-07-02 15:37:24.787
40	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzAwNzE2NiwiZXhwIjoxNzgzNjExOTY2fQ.IGgGszYWf8NsARaLWIOWfWeUI-3G8tWjDTiTN2hcpnE	2026-07-09 15:46:06.006	2026-07-02 15:46:06.029
41	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzAwNzE3NSwiZXhwIjoxNzgzNjExOTc1fQ.e4zwi1RDi8dYWNkatzGHpbVWE8ruqN4luFkuqQYtYxs	2026-07-09 15:46:15.452	2026-07-02 15:46:15.453
42	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDA3NDk0LCJleHAiOjE3ODM2MTIyOTR9.Xa3ILpLvFPpnOLZep7w4Z8BiSuZlC0VVr3zT_F7nBzk	2026-07-09 15:51:34.715	2026-07-02 15:51:34.727
43	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDA3NTE0LCJleHAiOjE3ODM2MTIzMTR9.3YYDoWDCI6maDnnQAcovAuoC9j3gqW0QzNxdGMOopXY	2026-07-09 15:51:54.978	2026-07-02 15:51:54.981
44	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzAwNzYxMywiZXhwIjoxNzgzNjEyNDEzfQ.weYWWGL3KTaSQlki9Iiq80FFyxZmw17uu--zAV2MEoY	2026-07-09 15:53:33.003	2026-07-02 15:53:33.003
45	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDA4MDQ5LCJleHAiOjE3ODM2MTI4NDl9.Z1A2Ress-mUgl_Lh-9CWWM9wPWcHt-NGtCDVqxlwGUY	2026-07-09 16:00:49.124	2026-07-02 16:00:49.13
46	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDA4ODEzLCJleHAiOjE3ODM2MTM2MTN9.BEcaUDcpymmH6jf7WabAws7_5VgEoJHYm90WA1ikQP0	2026-07-09 16:13:33.757	2026-07-02 16:13:33.83
47	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzAwODgzNSwiZXhwIjoxNzgzNjEzNjM1fQ.rXtikq2pPDgbcjqa4qq7irKrIKS7f-vR0hn9Euc7HEg	2026-07-09 16:13:55.991	2026-07-02 16:13:55.996
48	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzAwODg0MywiZXhwIjoxNzgzNjEzNjQzfQ.6jjJpYrDP3qfSGdV5kBDauVhlofXazh6f_XzjyCrFdc	2026-07-09 16:14:03.641	2026-07-02 16:14:03.643
49	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDA5Mjc0LCJleHAiOjE3ODM2MTQwNzR9.zz5dZOP-KP3fdAilfInlUbKNADuxhHGrh3MLJ8AkieY	2026-07-09 16:21:14.133	2026-07-02 16:21:14.141
50	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzAxMDI3NSwiZXhwIjoxNzgzNjE1MDc1fQ.DBXRVDbftd3rNPiLHaEi8URs4LUecie-58NW9tGsG5Q	2026-07-09 16:37:55.313	2026-07-02 16:37:55.342
51	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzAxMDI4MCwiZXhwIjoxNzgzNjE1MDgwfQ.plqSZ5Qh-txypYTfdEJgOxglHJ3r_YgfjEntRCA7ePg	2026-07-09 16:38:00.207	2026-07-02 16:38:00.21
52	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDExNTI2LCJleHAiOjE3ODM2MTYzMjZ9.6kk9-Ss0hZ-0rZDmz1EFJD8oTmtXmbzDbQ12XGBR0po	2026-07-09 16:58:46.269	2026-07-02 16:58:46.28
53	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDExOTg4LCJleHAiOjE3ODM2MTY3ODh9.jhwMJ0bBO5Ooesm3p5t71-LgyN5gVRH_1Ad8c7qg3nc	2026-07-09 17:06:28.756	2026-07-02 17:06:28.814
54	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDEyMTQ0LCJleHAiOjE3ODM2MTY5NDR9.Lvj41LyEDEIFdSVFGSktgdsGGkHrGf1O07JOW5KHhgg	2026-07-09 17:09:04.525	2026-07-02 17:09:04.527
55	7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzgzMDc1MTkzLCJleHAiOjE3ODM2Nzk5OTN9.3F-mF7D_BUK8vV8y61UTRRkPLy3n5KjyfA4MLiZgqZY	2026-07-10 10:39:53.482	2026-07-03 10:39:53.508
56	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzA3NTIwMywiZXhwIjoxNzgzNjgwMDAzfQ.jXs0C2rV9jCZcqxB2hEOZuhNGLzNXkteCY7e75qF_2U	2026-07-10 10:40:03.883	2026-07-03 10:40:03.885
57	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDc1NTg0LCJleHAiOjE3ODM2ODAzODR9.mLe86r1-6p8K5PbBnX6slOXxDuJVJr8uYShohJbAS3Y	2026-07-10 10:46:24.303	2026-07-03 10:46:24.305
58	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzA3NTYxOCwiZXhwIjoxNzgzNjgwNDE4fQ.yUHV2l9V_lQXxuBAOR10qiRTR4j5qVxoIa4ylSjyMYY	2026-07-10 10:46:58.211	2026-07-03 10:46:58.212
59	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDc1NjU3LCJleHAiOjE3ODM2ODA0NTd9.7ybR7_GHKW5XIjW5k1hP6Z-J_aBP4qJHrQWGP6RLuc4	2026-07-10 10:47:37.304	2026-07-03 10:47:37.305
60	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzA3NjQyNCwiZXhwIjoxNzgzNjgxMjI0fQ.dCxpkdqTG9aAUsox8xf5dM6XLfeaExy-rRa7Z-DrNBI	2026-07-10 11:00:24.529	2026-07-03 11:00:24.557
61	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzA3NjQzMCwiZXhwIjoxNzgzNjgxMjMwfQ.uY00Eo1UHtuOUxNlxpHRvlvtlm-OJoYZWjzHzm4aN30	2026-07-10 11:00:30.511	2026-07-03 11:00:30.512
62	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDc5MzI5LCJleHAiOjE3ODM2ODQxMjl9.dLH_XuBdIfql0RqvrCUTCBqptXHmhfDJhbK0-Dxwn0I	2026-07-10 11:48:49.692	2026-07-03 11:48:49.711
63	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzA3OTc1NiwiZXhwIjoxNzgzNjg0NTU2fQ.XTTRSDFZto__KwJjIXdmjKcvKKpyPQWAWLWI8L-4vzM	2026-07-10 11:55:56.456	2026-07-03 11:55:56.515
64	7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzgzMDc5ODMzLCJleHAiOjE3ODM2ODQ2MzN9.Tg15tV6pzPtPsma9IZcoV-HaVek_mIu4h06Y3AtzQZg	2026-07-10 11:57:13.814	2026-07-03 11:57:13.816
65	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzA3OTgzNywiZXhwIjoxNzgzNjg0NjM3fQ.zCKZBmRxCoQJmdg5xSIc2vVuJaatk3x_bd099KPcVGc	2026-07-10 11:57:17.241	2026-07-03 11:57:17.242
66	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzA4MDY4NiwiZXhwIjoxNzgzNjg1NDg2fQ.dp2MaPqRS18D4f5jXQgvhl7ws3YJVq0i9eQj2jN1xsw	2026-07-10 12:11:26.99	2026-07-03 12:11:27.013
67	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzA4MTIxNywiZXhwIjoxNzgzNjg2MDE3fQ.a7zV3XaIVBOH4-HZ1T240l4yFw8ePbZ_0CecKsL7_1M	2026-07-10 12:20:17.223	2026-07-03 12:20:17.236
68	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzA4MTMwOCwiZXhwIjoxNzgzNjg2MTA4fQ._I3ZmNUppUOsqHNos0gOj8hLwAfEoDpF_-_51dmf6ts	2026-07-10 12:21:48.267	2026-07-03 12:21:48.271
69	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzA4Mzc2OCwiZXhwIjoxNzgzNjg4NTY4fQ.yfFVukv3ZdW-AOF_g8XMVfz36YFxYETLJakHn3BRdtc	2026-07-10 13:02:48.397	2026-07-03 13:02:48.399
70	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDg2ODI1LCJleHAiOjE3ODM2OTE2MjV9.8U2OgWfX527rZpmxU4nsCtl7lTNlkSEz2xPso932sIo	2026-07-10 13:53:45.014	2026-07-03 13:53:45.046
71	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDg2ODQzLCJleHAiOjE3ODM2OTE2NDN9.6XHn3FhEhV9TvMWlJxD8pakdDb4oyZbpnHNztygyhGw	2026-07-10 13:54:03.828	2026-07-03 13:54:03.841
72	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzA4ODY4NiwiZXhwIjoxNzgzNjkzNDg2fQ.vijdpBdnLnWh1a9a6IHvoCv8Vph6OQEU9OkbMHSDR84	2026-07-10 14:24:46.245	2026-07-03 14:24:46.284
73	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDkyNDgzLCJleHAiOjE3ODM2OTcyODN9.XwbvKhFBSL_NqurKe0i7Zox9B00m-ij54vOD-SthcnY	2026-07-10 15:28:03.257	2026-07-03 15:28:03.274
74	5	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzgzMDkzMDM5LCJleHAiOjE3ODM2OTc4Mzl9.-sFVd2LbSFb_zSWM8wAb0zG4kSugt7RwezLfyv8n3LA	2026-07-10 15:37:19.244	2026-07-03 15:37:19.246
75	\N	10000000-0000-0000-0000-000000000011	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAxMSIsImlhdCI6MTc4MzA5MzU0OCwiZXhwIjoxNzgzNjk4MzQ4fQ.tqxLJmfFOFGyobpiaTmoHx4axRrDHWEBwusy_L1mpgM	2026-07-10 15:45:48.596	2026-07-03 15:45:48.621
76	\N	d5d1baf4-628a-4622-ba35-95da33c19c16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ1ZDFiYWY0LTYyOGEtNDYyMi1iYTM1LTk1ZGEzM2MxOWMxNiIsImlhdCI6MTc4MzA5MzU1NSwiZXhwIjoxNzgzNjk4MzU1fQ.yCrS97NBeOpkiZFob6-jz0zxsnhwSNH-tGzm6heu-00	2026-07-10 15:45:55.307	2026-07-03 15:45:55.307
77	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDkzNTkyLCJleHAiOjE3ODM2OTgzOTJ9.PKlbiKaPB-CUKe1laHTcAC1Jrl4-6JuzmSg1R5EwI2k	2026-07-10 15:46:32.367	2026-07-03 15:46:32.369
78	5	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzgzMDk1MzMwLCJleHAiOjE3ODM3MDAxMzB9.86xCuPGblQdB_j-sQghjGvlf7A1L4mdSj0RWU3fW-mo	2026-07-10 16:15:30.036	2026-07-03 16:15:30.073
79	7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzgzMDk1ODEyLCJleHAiOjE3ODM3MDA2MTJ9._fmAl0VE9S1gJlfEic5Bjfi3-eBeawePNhRRU7bNI-Q	2026-07-10 16:23:32.353	2026-07-03 16:23:32.362
80	7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzgzMDk2MDkzLCJleHAiOjE3ODM3MDA4OTN9.widpxVckvBeWebrvm9qUZihqHH19V35PQ8tVLKLosd8	2026-07-10 16:28:13.728	2026-07-03 16:28:13.729
81	1	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzgzMDk2MTE2LCJleHAiOjE3ODM3MDA5MTZ9.8RXkAXGI4TAb563q2ZGWU6XaU7tyk29swk59wo1UAl4	2026-07-10 16:28:36.131	2026-07-03 16:28:36.132
82	7	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzgzMDk2MTM5LCJleHAiOjE3ODM3MDA5Mzl9.eGv7z3TRhsySfoJ6J3MUNCMWNXNma-9_39rI_uO_oBo	2026-07-10 16:28:59.035	2026-07-03 16:28:59.036
83	3	\N	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzgzMDk3MTU0LCJleHAiOjE3ODM3MDE5NTR9.yizGlZ8siTrwfufaHjw-edVTdlkwYmC77IEbq6HRUjU	2026-07-10 16:45:54.98	2026-07-03 16:45:55.002
\.


--
-- Data for Name: tam_giu_cho; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tam_giu_cho (id, session_id, ngay_gio_bat_dau, ngay_gio_ket_thuc, nhan_su_id, goi_dich_vu_id, thoi_gian_het_han, thoi_gian_tao, khach_hang_id, so_dien_thoai) FROM stdin;
470a2a1d-0708-41a6-bc77-39b14b9c3f44	d85363f6-6ddd-4589-83a9-d3ba15ad2959	2026-07-05 14:45:00+07	2026-07-05 15:00:00+07	7	c1000000-0000-0000-0000-000000000101	2026-07-03 23:32:19.397+07	2026-07-03 23:27:19.3984+07	d5d1baf4-628a-4622-ba35-95da33c19c16	\N
\.


--
-- Data for Name: thiet_bi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thiet_bi (id, ma_thiet_bi, ten_thiet_bi, ngay_mua, trang_thai, ghi_chu) FROM stdin;
90000000-0000-0000-0000-000000000001	LASER-01	Máy Laser trị liệu công suất cao	2025-01-10	san_sang	Máy điều trị viêm sưng
90000000-0000-0000-0000-000000000002	SHOCK-01	Máy sóng xung kích hội tụ Focused Shockwave	2025-02-15	san_sang	Máy xung kích giảm đau điểm kích hoạt
90000000-0000-0000-0000-000000000003	US-01	Máy siêu âm trị liệu	2024-11-20	san_sang	Siêu âm giảm co thắt
90000000-0000-0000-0000-000000000004	TRACT-01	Giường kéo giãn cột sống áp lực âm	2024-12-05	san_sang	Giường kéo giãn cổ/thắt lưng
90000000-0000-0000-0000-000000000005	BIO-01	Thiết bị phản hồi sinh học Biofeedback	2025-03-01	dang_bao_tri	Bảo trì định kỳ hàng tháng
\.


--
-- Data for Name: thong_bao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.thong_bao (id, nguoi_dung_id, khach_hang_id, tieu_de, noi_dung, loai, da_doc, thoi_gian_tao) FROM stdin;
\.


--
-- Data for Name: vai_tro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vai_tro (id, ma_vai_tro, ten_vai_tro) FROM stdin;
1	khach_hang	Khách hàng
2	le_tan	Lễ tân
3	ky_thuat_vien	Kỹ thuật viên
4	bac_si	Bác sĩ
5	admin	Quản trị viên
6	quan_ly	Quản lý
\.


--
-- Name: ho_so_chuyen_gia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ho_so_chuyen_gia_id_seq', 15, true);


--
-- Name: nguoi_dung_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nguoi_dung_id_seq', 13, true);


--
-- Name: phong_lam_viec_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.phong_lam_viec_id_seq', 5, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 83, true);


--
-- Name: vai_tro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vai_tro_id_seq', 6, true);


--
-- Name: chi_dinh_buoi chi_dinh_buoi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_dinh_buoi
    ADD CONSTRAINT chi_dinh_buoi_pkey PRIMARY KEY (id);


--
-- Name: cuoc_hen cuoc_hen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuoc_hen
    ADD CONSTRAINT cuoc_hen_pkey PRIMARY KEY (id);


--
-- Name: danh_gia_chat_luong danh_gia_chat_luong_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_chat_luong
    ADD CONSTRAINT danh_gia_chat_luong_pkey PRIMARY KEY (id);


--
-- Name: danh_muc_goi danh_muc_goi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_muc_goi
    ADD CONSTRAINT danh_muc_goi_pkey PRIMARY KEY (id);


--
-- Name: giao_dich_thanh_toan giao_dich_thanh_toan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giao_dich_thanh_toan
    ADD CONSTRAINT giao_dich_thanh_toan_pkey PRIMARY KEY (id);


--
-- Name: goi_dich_vu goi_dich_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_pkey PRIMARY KEY (id);


--
-- Name: ho_so_chuyen_gia ho_so_chuyen_gia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ho_so_chuyen_gia
    ADD CONSTRAINT ho_so_chuyen_gia_pkey PRIMARY KEY (id);


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
-- Name: khuyen_mai_voucher khuyen_mai_voucher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.khuyen_mai_voucher
    ADD CONSTRAINT khuyen_mai_voucher_pkey PRIMARY KEY (id);


--
-- Name: lich_truc_nhan_su lich_truc_nhan_su_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_truc_nhan_su
    ADD CONSTRAINT lich_truc_nhan_su_pkey PRIMARY KEY (id);


--
-- Name: nguoi_dung nguoi_dung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT nguoi_dung_pkey PRIMARY KEY (id);


--
-- Name: nhat_ky_buoi_dieu_tri nhat_ky_buoi_dieu_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nhat_ky_buoi_dieu_tri
    ADD CONSTRAINT nhat_ky_buoi_dieu_tri_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: phac_do_dieu_tri phac_do_dieu_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phac_do_dieu_tri
    ADD CONSTRAINT phac_do_dieu_tri_pkey PRIMARY KEY (id);


--
-- Name: phong_lam_viec phong_lam_viec_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phong_lam_viec
    ADD CONSTRAINT phong_lam_viec_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: tam_giu_cho tam_giu_cho_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tam_giu_cho
    ADD CONSTRAINT tam_giu_cho_pkey PRIMARY KEY (id);


--
-- Name: tam_giu_cho tam_giu_cho_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tam_giu_cho
    ADD CONSTRAINT tam_giu_cho_session_id_key UNIQUE (session_id);


--
-- Name: thiet_bi thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: thong_bao thong_bao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_pkey PRIMARY KEY (id);


--
-- Name: vai_tro vai_tro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vai_tro
    ADD CONSTRAINT vai_tro_pkey PRIMARY KEY (id);


--
-- Name: danh_gia_chat_luong_cuoc_hen_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX danh_gia_chat_luong_cuoc_hen_id_key ON public.danh_gia_chat_luong USING btree (cuoc_hen_id);


--
-- Name: ho_so_chuyen_gia_nguoi_dung_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ho_so_chuyen_gia_nguoi_dung_id_key ON public.ho_so_chuyen_gia USING btree (nguoi_dung_id);


--
-- Name: idx_tam_giu_cho_het_han; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tam_giu_cho_het_han ON public.tam_giu_cho USING btree (thoi_gian_het_han);


--
-- Name: khach_hang_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX khach_hang_email_key ON public.khach_hang USING btree (email);


--
-- Name: khuyen_mai_voucher_ma_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX khuyen_mai_voucher_ma_code_key ON public.khuyen_mai_voucher USING btree (ma_code);


--
-- Name: nguoi_dung_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX nguoi_dung_email_key ON public.nguoi_dung USING btree (email);


--
-- Name: nhat_ky_buoi_dieu_tri_cuoc_hen_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX nhat_ky_buoi_dieu_tri_cuoc_hen_id_key ON public.nhat_ky_buoi_dieu_tri USING btree (cuoc_hen_id);


--
-- Name: thiet_bi_ma_thiet_bi_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX thiet_bi_ma_thiet_bi_key ON public.thiet_bi USING btree (ma_thiet_bi);


--
-- Name: chi_dinh_buoi chi_dinh_buoi_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_dinh_buoi
    ADD CONSTRAINT chi_dinh_buoi_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id);


--
-- Name: chi_dinh_buoi chi_dinh_buoi_nhat_ky_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chi_dinh_buoi
    ADD CONSTRAINT chi_dinh_buoi_nhat_ky_id_fkey FOREIGN KEY (nhat_ky_id) REFERENCES public.nhat_ky_buoi_dieu_tri(id) ON DELETE CASCADE;


--
-- Name: cuoc_hen cuoc_hen_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuoc_hen
    ADD CONSTRAINT cuoc_hen_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id);


--
-- Name: cuoc_hen cuoc_hen_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuoc_hen
    ADD CONSTRAINT cuoc_hen_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id) ON DELETE CASCADE;


--
-- Name: cuoc_hen cuoc_hen_nhan_su_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuoc_hen
    ADD CONSTRAINT cuoc_hen_nhan_su_id_fkey FOREIGN KEY (nhan_su_id) REFERENCES public.nguoi_dung(id);


--
-- Name: cuoc_hen cuoc_hen_phac_do_dieu_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuoc_hen
    ADD CONSTRAINT cuoc_hen_phac_do_dieu_tri_id_fkey FOREIGN KEY (phac_do_dieu_tri_id) REFERENCES public.phac_do_dieu_tri(id);


--
-- Name: cuoc_hen cuoc_hen_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuoc_hen
    ADD CONSTRAINT cuoc_hen_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong_lam_viec(id) ON DELETE SET NULL;


--
-- Name: danh_gia_chat_luong danh_gia_chat_luong_cuoc_hen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_chat_luong
    ADD CONSTRAINT danh_gia_chat_luong_cuoc_hen_id_fkey FOREIGN KEY (cuoc_hen_id) REFERENCES public.cuoc_hen(id) ON DELETE CASCADE;


--
-- Name: danh_gia_chat_luong danh_gia_chat_luong_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.danh_gia_chat_luong
    ADD CONSTRAINT danh_gia_chat_luong_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id) ON DELETE CASCADE;


--
-- Name: giao_dich_thanh_toan giao_dich_thanh_toan_hoa_don_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giao_dich_thanh_toan
    ADD CONSTRAINT giao_dich_thanh_toan_hoa_don_id_fkey FOREIGN KEY (hoa_don_id) REFERENCES public.hoa_don(id) ON DELETE CASCADE;


--
-- Name: giao_dich_thanh_toan giao_dich_thanh_toan_nhan_vien_thuc_hien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.giao_dich_thanh_toan
    ADD CONSTRAINT giao_dich_thanh_toan_nhan_vien_thuc_hien_id_fkey FOREIGN KEY (nhan_vien_thuc_hien_id) REFERENCES public.nguoi_dung(id);


--
-- Name: goi_dich_vu goi_dich_vu_danh_muc_goi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goi_dich_vu
    ADD CONSTRAINT goi_dich_vu_danh_muc_goi_id_fkey FOREIGN KEY (danh_muc_goi_id) REFERENCES public.danh_muc_goi(id) ON DELETE SET NULL;


--
-- Name: ho_so_chuyen_gia ho_so_chuyen_gia_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ho_so_chuyen_gia
    ADD CONSTRAINT ho_so_chuyen_gia_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id) ON DELETE CASCADE;


--
-- Name: hoa_don hoa_don_cuoc_hen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_cuoc_hen_id_fkey FOREIGN KEY (cuoc_hen_id) REFERENCES public.cuoc_hen(id) ON DELETE SET NULL;


--
-- Name: hoa_don hoa_don_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id);


--
-- Name: hoa_don hoa_don_phac_do_dieu_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_phac_do_dieu_tri_id_fkey FOREIGN KEY (phac_do_dieu_tri_id) REFERENCES public.phac_do_dieu_tri(id) ON DELETE SET NULL;


--
-- Name: hoa_don hoa_don_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hoa_don
    ADD CONSTRAINT hoa_don_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.khuyen_mai_voucher(id) ON DELETE SET NULL;


--
-- Name: lich_truc_nhan_su lich_truc_nhan_su_nhan_su_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_truc_nhan_su
    ADD CONSTRAINT lich_truc_nhan_su_nhan_su_id_fkey FOREIGN KEY (nhan_su_id) REFERENCES public.nguoi_dung(id) ON DELETE CASCADE;


--
-- Name: lich_truc_nhan_su lich_truc_nhan_su_phong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lich_truc_nhan_su
    ADD CONSTRAINT lich_truc_nhan_su_phong_id_fkey FOREIGN KEY (phong_id) REFERENCES public.phong_lam_viec(id) ON DELETE SET NULL;


--
-- Name: nguoi_dung nguoi_dung_vai_tro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT nguoi_dung_vai_tro_id_fkey FOREIGN KEY (vai_tro_id) REFERENCES public.vai_tro(id);


--
-- Name: nhat_ky_buoi_dieu_tri nhat_ky_buoi_dieu_tri_cuoc_hen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nhat_ky_buoi_dieu_tri
    ADD CONSTRAINT nhat_ky_buoi_dieu_tri_cuoc_hen_id_fkey FOREIGN KEY (cuoc_hen_id) REFERENCES public.cuoc_hen(id) ON DELETE CASCADE;


--
-- Name: nhat_ky_buoi_dieu_tri nhat_ky_buoi_dieu_tri_nguoi_tao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nhat_ky_buoi_dieu_tri
    ADD CONSTRAINT nhat_ky_buoi_dieu_tri_nguoi_tao_id_fkey FOREIGN KEY (nguoi_tao_id) REFERENCES public.nguoi_dung(id);


--
-- Name: phac_do_dieu_tri phac_do_dieu_tri_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phac_do_dieu_tri
    ADD CONSTRAINT phac_do_dieu_tri_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id);


--
-- Name: phac_do_dieu_tri phac_do_dieu_tri_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phac_do_dieu_tri
    ADD CONSTRAINT phac_do_dieu_tri_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id) ON DELETE CASCADE;


--
-- Name: tam_giu_cho tam_giu_cho_goi_dich_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tam_giu_cho
    ADD CONSTRAINT tam_giu_cho_goi_dich_vu_id_fkey FOREIGN KEY (goi_dich_vu_id) REFERENCES public.goi_dich_vu(id) ON DELETE CASCADE;


--
-- Name: tam_giu_cho tam_giu_cho_nhan_su_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tam_giu_cho
    ADD CONSTRAINT tam_giu_cho_nhan_su_id_fkey FOREIGN KEY (nhan_su_id) REFERENCES public.nguoi_dung(id) ON DELETE SET NULL;


--
-- Name: thong_bao thong_bao_khach_hang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_khach_hang_id_fkey FOREIGN KEY (khach_hang_id) REFERENCES public.khach_hang(id) ON DELETE CASCADE;


--
-- Name: thong_bao thong_bao_nguoi_dung_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_nguoi_dung_id_fkey FOREIGN KEY (nguoi_dung_id) REFERENCES public.nguoi_dung(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict scRfMZ32RBrpdgHUS3diRKnDDuGwYT4fLpwBGzZBmHk3iRVxZpcKxZhGCDJYGDP

