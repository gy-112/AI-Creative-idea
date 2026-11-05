INSERT INTO region (code, name_ko, name_en) VALUES
  ('JONGNO', '종로구', 'Jongno-gu'),
  ('JUNG',   '중구',   'Jung-gu'),
  ('MAPO',   '마포구', 'Mapo-gu')
ON CONFLICT (code) DO NOTHING;

INSERT INTO landmark (code, region_id, name_ko, name_en, latitude, longitude, badge_image_url)
SELECT v.code, r.id, v.name_ko, v.name_en, v.lat, v.lng, v.img
FROM (VALUES
  ('GYEONGBOKGUNG', 'JONGNO', '경복궁',       'Gyeongbokgung Palace',  37.5796, 126.9770, '/images/badges/gyeongbokgung.png'),
  ('BUKCHON',       'JONGNO', '북촌한옥마을', 'Bukchon Hanok Village', 37.5826, 126.9835, '/images/badges/bukchon.png'),
  ('INSADONG',      'JONGNO', '인사동',       'Insadong',              37.5744, 126.9858, '/images/badges/insadong.png'),
  ('NAMSAN',        'JUNG',   '남산서울타워', 'N Seoul Tower',         37.5512, 126.9882, '/images/badges/namsan.png'),
  ('MYEONGDONG',    'JUNG',   '명동성당',     'Myeongdong Cathedral',  37.5633, 126.9872, '/images/badges/myeongdong.png'),
  ('DEOKSUGUNG',    'JUNG',   '덕수궁',       'Deoksugung Palace',     37.5658, 126.9751, '/images/badges/deoksugung.png'),
  ('HONGDAE',       'MAPO',   '홍대 거리',    'Hongdae Street',        37.5563, 126.9236, '/images/badges/hongdae.png'),
  ('GYEONGUI',      'MAPO',   '경의선숲길',   'Gyeongui Line Forest Park', 37.5589, 126.9246, '/images/badges/gyeongui.png'),
  ('MANGWON',       'MAPO',   '망원한강공원', 'Mangwon Hangang Park',  37.5555, 126.8956, '/images/badges/mangwon.png')
) AS v(code, region_code, name_ko, name_en, lat, lng, img)
JOIN region r ON r.code = v.region_code
ON CONFLICT (code) DO NOTHING;
