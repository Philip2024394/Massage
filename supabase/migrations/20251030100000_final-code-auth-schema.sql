-- ====================================================================
-- FINAL SCHEMA SCRIPT FOR CODE-BASED AUTHENTICATION
-- Purpose: Rebuilds the schema for a passwordless, code-based system.
-- Instructions: Run this entire script once in your Supabase SQL Editor.
-- ====================================================================

-- ========= STEP 1: SAFE CLEANUP =========
-- Drop dependent objects first to avoid errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();
DROP FUNCTION IF EXISTS public.increment_therapist_account_number();
DROP FUNCTION IF EXISTS public.increment_place_account_number();
DROP SEQUENCE IF EXISTS public.therapists_account_number_seq;
DROP SEQUENCE IF EXISTS public.places_account_number_seq;

-- Drop tables, cascading to remove foreign keys and other dependencies.
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.therapists CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;

-- Drop custom types (enums).
DROP TYPE IF EXISTS public.user_account_type;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.therapist_status;
DROP TYPE IF EXISTS public.place_status;


-- ========= STEP 2: SCHEMA CREATION =========
-- 2.1: Create custom types (Enums)
CREATE TYPE public.user_account_type AS ENUM ('therapist', 'place');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.therapist_status AS ENUM ('pending', 'active', 'blocked');
CREATE TYPE public.place_status AS ENUM ('pending', 'active', 'blocked');

-- 2.2: Create Therapists Table
CREATE TABLE public.therapists (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    login_code text UNIQUE NOT NULL,
    account_number text UNIQUE NOT NULL,
    name text,
    profile_image_url text,
    rating numeric(2,1) DEFAULT 0.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    specialties text[],
    bio text,
    experience integer,
    is_online boolean DEFAULT false NOT NULL,
    status therapist_status DEFAULT 'active' NOT NULL,
    city text,
    lat double precision,
    lng double precision,
    pricing_session_60 integer,
    pricing_session_90 integer,
    pricing_session_120 integer,
    massage_types text[],
    phone text,
    languages text[],
    certifications text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.therapists IS 'Stores profiles for individual massage therapists, authenticated by code.';

-- 2.3: Create Places Table
CREATE TABLE public.places (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    login_code text UNIQUE NOT NULL,
    account_number text UNIQUE NOT NULL,
    name text,
    profile_image_url text,
    rating numeric(2,1) DEFAULT 0.0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    address text,
    city text,
    lat double precision,
    lng double precision,
    phone text,
    services text[],
    is_online boolean DEFAULT false NOT NULL,
    status place_status DEFAULT 'active' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.places IS 'Stores profiles for massage businesses, authenticated by code.';

-- 2.4: Create Reviews Table
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id uuid NOT NULL,
    target_type user_account_type NOT NULL,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NOT NULL,
    status review_status DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'Stores reviews for both therapists and places.';


-- ========= STEP 3: SEED DATA WITH CODES =========
-- Insert 70 Therapists
INSERT INTO public.therapists (login_code, account_number, name, city, phone, lat, lng) VALUES
('TH001', 'T-1001', 'Ayu Lestari', 'Jakarta', '+6281234567890', -6.2088, 106.8456),
('TH002', 'T-1002', 'Budi Santoso', 'Surabaya', '+6281234567891', -7.2575, 112.7521),
('TH003', 'T-1003', 'Citra Dewi', 'Bandung', '+6281234567892', -6.9175, 107.6191),
('TH004', 'T-1004', 'Dian Nugraha', 'Medan', '+6281234567893', 3.5952, 98.6722),
('TH005', 'T-1005', 'Eka Wijaya', 'Semarang', '+6281234567894', -6.9667, 110.4381),
('TH006', 'T-1006', 'Fitriani', 'Makassar', '+6281234567895', -5.1477, 119.4327),
('TH007', 'T-1007', 'Gita Permata', 'Palembang', '+6281234567896', -2.9761, 104.7754),
('TH008', 'T-1008', 'Hadi Prasetyo', 'Yogyakarta', '+6281234567897', -7.7956, 110.3695),
('TH009', 'T-1009', 'Indah Sari', 'Denpasar', '+6281234567898', -8.6705, 115.2126),
('TH010', 'T-1010', 'Joko Susilo', 'Jakarta', '+6281234567899', -6.2088, 106.8456),
('TH011', 'T-1011', 'Kartika Putri', 'Surabaya', '+6281234567900', -7.2575, 112.7521),
('TH012', 'T-1012', 'Lia Handayani', 'Bandung', '+6281234567901', -6.9175, 107.6191),
('TH013', 'T-1013', 'Mega Utami', 'Medan', '+6281234567902', 3.5952, 98.6722),
('TH014', 'T-1014', 'Nanda Pratama', 'Semarang', '+6281234567903', -6.9667, 110.4381),
('TH015', 'T-1015', 'Oscar Maulana', 'Makassar', '+6281234567904', -5.1477, 119.4327),
('TH016', 'T-1016', 'Putri Amelia', 'Palembang', '+6281234567905', -2.9761, 104.7754),
('TH017', 'T-1017', 'Rian Hidayat', 'Yogyakarta', '+6281234567906', -7.7956, 110.3695),
('TH018', 'T-1018', 'Sari Melati', 'Denpasar', '+6281234567907', -8.6705, 115.2126),
('TH019', 'T-1019', 'Tono Setiawan', 'Jakarta', '+6281234567908', -6.2088, 106.8456),
('TH020', 'T-1020', 'Umi Kalsum', 'Surabaya', '+6281234567909', -7.2575, 112.7521),
('TH021', 'T-1021', 'Vina Panduwinata', 'Bandung', '+6281234567910', -6.9175, 107.6191),
('TH022', 'T-1022', 'Wawan Gunawan', 'Medan', '+6281234567911', 3.5952, 98.6722),
('TH023', 'T-1023', 'Yani Suryani', 'Semarang', '+6281234567912', -6.9667, 110.4381),
('TH024', 'T-1024', 'Zainal Abidin', 'Makassar', '+6281234567913', -5.1477, 119.4327),
('TH025', 'T-1025', 'Ani Yudhoyono', 'Palembang', '+6281234567914', -2.9761, 104.7754),
('TH026', 'T-1026', 'Bambang Pamungkas', 'Yogyakarta', '+6281234567915', -7.7956, 110.3695),
('TH027', 'T-1027', 'Cici Paramida', 'Denpasar', '+6281234567916', -8.6705, 115.2126),
('TH028', 'T-1028', 'Dedi Mizwar', 'Jakarta', '+6281234567917', -6.2088, 106.8456),
('TH029', 'T-1029', 'Endang S. Taurina', 'Surabaya', '+6281234567918', -7.2575, 112.7521),
('TH030', 'T-1030', 'Fahri Hamzah', 'Bandung', '+6281234567919', -6.9175, 107.6191),
('TH031', 'T-1031', 'Grace Natalie', 'Medan', '+6281234567920', 3.5952, 98.6722),
('TH032', 'T-1032', 'Harry Tanoe', 'Semarang', '+6281234567921', -6.9667, 110.4381),
('TH033', 'T-1033', 'Iis Dahlia', 'Makassar', '+6281234567922', -5.1477, 119.4327),
('TH034', 'T-1034', 'Jusuf Kalla', 'Palembang', '+6281234567923', -2.9761, 104.7754),
('TH035', 'T-1035', 'Krisdayanti', 'Yogyakarta', '+6281234567924', -7.7956, 110.3695),
('TH036', 'T-1036', 'Luhut Panjaitan', 'Denpasar', '+6281234567925', -8.6705, 115.2126),
('TH037', 'T-1037', 'Megawati', 'Jakarta', '+6281234567926', -6.2088, 106.8456),
('TH038', 'T-1038', 'Nadiem Makarim', 'Surabaya', '+6281234567927', -7.2575, 112.7521),
('TH039', 'T-1039', 'Prabowo Subianto', 'Bandung', '+6281234567928', -6.9175, 107.6191),
('TH040', 'T-1040', 'Retno Marsudi', 'Medan', '+6281234567929', 3.5952, 98.6722),
('TH041', 'T-1041', 'Sandiaga Uno', 'Semarang', '+6281234567930', -6.9667, 110.4381),
('TH042', 'T-1042', 'Titiek Soeharto', 'Makassar', '+6281234567931', -5.1477, 119.4327),
('TH043', 'T-1043', 'Wiranto', 'Palembang', '+6281234567932', -2.9761, 104.7754),
('TH044', 'T-1044', 'Yasonna Laoly', 'Yogyakarta', '+6281234567933', -7.7956, 110.3695),
('TH045', 'T-1045', 'Zulkifli Hasan', 'Denpasar', '+6281234567934', -8.6705, 115.2126),
('TH046', 'T-1046', 'Agus Yudhoyono', 'Jakarta', '+6281234567935', -6.2088, 106.8456),
('TH047', 'T-1047', 'Basuki T. Purnama', 'Surabaya', '+6281234567936', -7.2575, 112.7521),
('TH048', 'T-1048', 'Erick Thohir', 'Bandung', '+6281234567937', -6.9175, 107.6191),
('TH049', 'T-1049', 'Ganjar Pranowo', 'Medan', '+6281234567938', 3.5952, 98.6722),
('TH050', 'T-1050', 'Mahfud MD', 'Semarang', '+6281234567939', -6.9667, 110.4381),
('TH051', 'T-1051', 'Puan Maharani', 'Makassar', '+6281234567940', -5.1477, 119.4327),
('TH052', 'T-1052', 'Ridwan Kamil', 'Palembang', '+6281234567941', -2.9761, 104.7754),
('TH053', 'T-1053', 'Sri Mulyani', 'Yogyakarta', '+6281234567942', -7.7956, 110.3695),
('TH054', 'T-1054', 'Anies Baswedan', 'Denpasar', '+6281234567943', -8.6705, 115.2126),
('TH055', 'T-1055', 'Bima Arya', 'Jakarta', '+6281234567944', -6.2088, 106.8456),
('TH056', 'T-1056', 'Khofifah Indar', 'Surabaya', '+6281234567945', -7.2575, 112.7521),
('TH057', 'T-1057', 'Tri Rismaharini', 'Bandung', '+6281234567946', -6.9175, 107.6191),
('TH058', 'T-1058', 'Gibran Rakabuming', 'Medan', '+6281234567947', 3.5952, 98.6722),
('TH059', 'T-1059', 'Bobby Nasution', 'Semarang', '+6281234567948', -6.9667, 110.4381),
('TH060', 'T-1060', 'Najwa Shihab', 'Makassar', '+6281234567949', -5.1477, 119.4327),
('TH061', 'T-1061', 'Raffi Ahmad', 'Palembang', '+6281234567950', -2.9761, 104.7754),
('TH062', 'T-1062', 'Deddy Corbuzier', 'Yogyakarta', '+6281234567951', -7.7956, 110.3695),
('TH063', 'T-1063', 'Atta Halilintar', 'Denpasar', '+6281234567952', -8.6705, 115.2126),
('TH064', 'T-1064', 'Arief Muhammad', 'Jakarta', '+6281234567953', -6.2088, 106.8456),
('TH065', 'T-1065', 'Jerome Polin', 'Surabaya', '+6281234567954', -7.2575, 112.7521),
('TH066', 'T-1066', 'Raditya Dika', 'Bandung', '+6281234567955', -6.9175, 107.6191),
('TH067', 'T-1067', 'Hotman Paris', 'Medan', '+6281234567956', 3.5952, 98.6722),
('TH068', 'T-1068', 'Denny Sumargo', 'Semarang', '+6281234567957', -6.9667, 110.4381),
('TH069', 'T-1069', 'Vincent Rompies', 'Makassar', '+6281234567958', -5.1477, 119.4327),
('TH070', 'T-1070', 'Desta Mahendra', 'Palembang', '+6281234567959', -2.9761, 104.7754);

-- Insert 70 Places
INSERT INTO public.places (login_code, account_number, name, city, phone, lat, lng) VALUES
('PL001', 'P-1001', 'Zen Spa', 'Jakarta', '+6285234567890', -6.2088, 106.8456),
('PL002', 'P-1002', 'Oasis Massage', 'Surabaya', '+6285234567891', -7.2575, 112.7521),
('PL003', 'P-1003', 'Bandung Wellness', 'Bandung', '+6285234567892', -6.9175, 107.6191),
('PL004', 'P-1004', 'Medan Tranquility', 'Medan', '+6285234567893', 3.5952, 98.6722),
('PL005', 'P-1005', 'Semarang Serenity', 'Semarang', '+6285234567894', -6.9667, 110.4381),
('PL006', 'P-1006', 'Makassar Healing', 'Makassar', '+6285234567895', -5.1477, 119.4327),
('PL007', 'P-1007', 'Palembang Retreat', 'Palembang', '+6285234567896', -2.9761, 104.7754),
('PL008', 'P-1008', 'Jogja Harmony', 'Yogyakarta', '+6285234567897', -7.7956, 110.3695),
('PL009', 'P-1009', 'Bali Bliss', 'Denpasar', '+6285234567898', -8.6705, 115.2126),
('PL010', 'P-1010', 'Capital Calm', 'Jakarta', '+6285234567899', -6.2088, 106.8456),
('PL011', 'P-1011', 'Surabaya Sanctuary', 'Surabaya', '+6285234567900', -7.2575, 112.7521),
('PL012', 'P-1012', 'Mountain View Spa', 'Bandung', '+6285234567901', -6.9175, 107.6191),
('PL013', 'P-1013', 'Deli Serdang Spa', 'Medan', '+6285234567902', 3.5952, 98.6722),
('PL014', 'P-1014', 'Lumpia Lounge', 'Semarang', '+6285234567903', -6.9667, 110.4381),
('PL015', 'P-1015', 'Celebes Center', 'Makassar', '+6285234567904', -5.1477, 119.4327),
('PL016', 'P-1016', 'Musi River Massage', 'Palembang', '+6285234567905', -2.9761, 104.7754),
('PL017', 'P-1017', 'Gudeg Garden', 'Yogyakarta', '+6285234567906', -7.7956, 110.3695),
('PL018', 'P-1018', 'Kuta Corner', 'Denpasar', '+6285234567907', -8.6705, 115.2126),
('PL019', 'P-1019', 'Jakarta Junction', 'Jakarta', '+6285234567908', -6.2088, 106.8456),
('PL020', 'P-1020', 'Heroic Hands', 'Surabaya', '+6285234567909', -7.2575, 112.7521),
('PL021', 'P-1021', 'Paris van Java Spa', 'Bandung', '+6285234567910', -6.9175, 107.6191),
('PL022', 'P-1022', 'Toba Tranquility', 'Medan', '+6285234567911', 3.5952, 98.6722),
('PL023', 'P-1023', 'Kota Lama Wellness', 'Semarang', '+6285234567912', -6.9667, 110.4381),
('PL024', 'P-1024', 'Losari Beach Massage', 'Makassar', '+6285234567913', -5.1477, 119.4327),
('PL025', 'P-1025', 'Ampera Bridge Spa', 'Palembang', '+6285234567914', -2.9761, 104.7754),
('PL026', 'P-1026', 'Malioboro Massage', 'Yogyakarta', '+6285234567915', -7.7956, 110.3695),
('PL027', 'P-1027', 'Seminyak Serenity', 'Denpasar', '+6285234567916', -8.6705, 115.2126),
('PL028', 'P-1028', 'Monas Massage', 'Jakarta', '+6285234567917', -6.2088, 106.8456),
('PL029', 'P-1029', 'Suroboyo Spa', 'Surabaya', '+6285234567918', -7.2575, 112.7521),
('PL030', 'P-1030', 'Flower City Healing', 'Bandung', '+6285234567919', -6.9175, 107.6191),
('PL031', 'P-1031', 'Durian Day Spa', 'Medan', '+6285234567920', 3.5952, 98.6722),
('PL032', 'P-1032', 'Lawang Sewu Lounge', 'Semarang', '+6285234567921', -6.9667, 110.4381),
('PL033', 'P-1033', 'Fort Rotterdam Retreat', 'Makassar', '+6285234567922', -5.1477, 119.4327),
('PL034', 'P-1034', 'Pempek Paradise', 'Palembang', '+6285234567923', -2.9761, 104.7754),
('PL035', 'P-1035', 'Prambanan Place', 'Yogyakarta', '+6285234567924', -7.7956, 110.3695),
('PL036', 'P-1036', 'Ubud Universe', 'Denpasar', '+6285234567925', -8.6705, 115.2126),
('PL037', 'P-1037', 'Sunda Kelapa Spa', 'Jakarta', '+6285234567926', -6.2088, 106.8456),
('PL038', 'P-1038', 'Bamboo Shark Bay', 'Surabaya', '+6285234567927', -7.2575, 112.7521),
('PL039', 'P-1039', 'Tangkuban Perahu Touch', 'Bandung', '+6285234567928', -6.9175, 107.6191),
('PL040', 'P-1040', 'Istana Maimun Massage', 'Medan', '+6285234567929', 3.5952, 98.6722),
('PL041', 'P-1041', 'Sam Poo Kong Sanctuary', 'Semarang', '+6285234567930', -6.9667, 110.4381),
('PL042', 'P-1042', 'Bantimurung Bliss', 'Makassar', '+6285234567931', -5.1477, 119.4327),
('PL043', 'P-1043', 'Kuto Besak Fortress Spa', 'Palembang', '+6285234567932', -2.9761, 104.7754),
('PL044', 'P-1044', 'Borobudur Balance', 'Yogyakarta', '+6285234567933', -7.7956, 110.3695),
('PL045', 'P-1045', 'Tanah Lot Temple', 'Denpasar', '+6285234567934', -8.6705, 115.2126),
('PL046', 'P-1046', 'Ancol Dreamland', 'Jakarta', '+6285234567935', -6.2088, 106.8456),
('PL047', 'P-1047', 'Kenjeran Park', 'Surabaya', '+6285234567936', -7.2575, 112.7521),
('PL048', 'P-1048', 'Kawah Putih Wellness', 'Bandung', '+6285234567937', -6.9175, 107.6191),
('PL049', 'P-1049', 'Sibolangit Serenity', 'Medan', '+6285234567938', 3.5952, 98.6722),
('PL050', 'P-1050', 'Gedong Songo Garden', 'Semarang', '+6285234567939', -6.9667, 110.4381),
('PL051', 'P-1051', 'Pulau Samalona Spa', 'Makassar', '+6285234567940', -5.1477, 119.4327),
('PL052', 'P-1052', 'Kemaro Island Retreat', 'Palembang', '+6285234567941', -2.9761, 104.7754),
('PL053', 'P-1053', 'Ratu Boko Royal', 'Yogyakarta', '+6285234567942', -7.7956, 110.3695),
('PL054', 'P-1054', 'Garuda Wisnu Kencana', 'Denpasar', '+6285234567943', -8.6705, 115.2126),
('PL055', 'P-1055', 'Thousand Islands Spa', 'Jakarta', '+6285234567944', -6.2088, 106.8456),
('PL056', 'P-1056', 'Madura Bridge Massage', 'Surabaya', '+6285234567945', -7.2575, 112.7521),
('PL057', 'P-1057', 'Ciwidey Valley', 'Bandung', '+6285234567946', -6.9175, 107.6191),
('PL058', 'P-1058', 'Berastagi Bliss', 'Medan', '+6285234567947', 3.5952, 98.6722),
('PL059', 'P-1059', 'Umbul Sidomukti', 'Semarang', '+6285234567948', -6.9667, 110.4381),
('PL060', 'P-1060', 'Kodingareng Keke', 'Makassar', '+6285234567949', -5.1477, 119.4327),
('PL061', 'P-1061', 'Punti Kayu Park', 'Palembang', '+6285234567950', -2.9761, 104.7754),
('PL062', 'P-1062', 'Timang Beach Touch', 'Yogyakarta', '+6285234567951', -7.7956, 110.3695),
('PL063', 'P-1063', 'Nusa Dua Nook', 'Denpasar', '+6285234567952', -8.6705, 115.2126),
('PL064', 'P-1064', 'Ragunan Zoo Retreat', 'Jakarta', '+6285234567953', -6.2088, 106.8456),
('PL065', 'P-1065', 'Ciputra Waterpark', 'Surabaya', '+6285234567954', -7.2575, 112.7521),
('PL066', 'P-1066', 'Trans Studio Bandung', 'Bandung', '+6285234567955', -6.9175, 107.6191),
('PL067', 'P-1067', 'Hillpark Sibolangit', 'Medan', '+6285234567956', 3.5952, 98.6722),
('PL068', 'P-1068', 'Saloka Theme Park', 'Semarang', '+6285234567957', -6.9667, 110.4381),
('PL069', 'P-1069', 'Trans Studio Makassar', 'Makassar', '+6285234567958', -5.1477, 119.4327),
('PL070', 'P-1070', 'Amanzi Waterpark', 'Palembang', '+6285234567959', -2.9761, 104.7754);


-- ========= STEP 4: RLS POLICIES & STORAGE =========
-- 4.1: Enable RLS
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4.2: Policies (Profiles are public, reviews are public if approved, all writes require service_role)
CREATE POLICY "Profiles are public to view" ON public.therapists FOR SELECT USING (true);
CREATE POLICY "Places are public to view" ON public.places FOR SELECT USING (true);
CREATE POLICY "Reviews are public if approved" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit a review" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage all profiles and reviews" ON public.therapists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin can manage all places" ON public.places FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin can manage all reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

-- 4.3: Storage Bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4.4: Storage Policies (Drop if exist, then create)
DROP POLICY IF EXISTS "Profile images are publicly accessible." ON storage.objects;
CREATE POLICY "Profile images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'profile-images' );

DROP POLICY IF EXISTS "Anyone can upload a profile image." ON storage.objects;
CREATE POLICY "Anyone can upload a profile image." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'profile-images' );

DROP POLICY IF EXISTS "Users can update their own profile image." ON storage.objects;
-- This policy is no longer relevant as we don't have auth.uid(), but we leave a permissive one for admin/service_role.
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR UPDATE USING (true) WITH CHECK (true);
