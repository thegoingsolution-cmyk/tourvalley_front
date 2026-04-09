'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { getImagePath } from '@/utils/path';
import 'swiper/css';
import 'swiper/css/navigation';
import './InsuranceLogoSwiper.css';

const LOGOS = [
  { file: '현대해상.png', alt: '현대해상' },
  { file: 'DB손해보험.png', alt: 'DB손해보험' },
  { file: 'KB손해보험.png', alt: 'KB손해보험' },
  { file: '메리츠화재.png', alt: '메리츠화재' },
  { file: '라이나손보.png', alt: '라이나손보' },
  // { file: '교보생명.jpg', alt: '교보생명' },
  // { file: '동양생명.jpg', alt: '동양생명' },
  // { file: '라이나생명.jpg', alt: '라이나생명' },
  // { file: '롯데손해보험.jpg', alt: '롯데손해보험' },
  // { file: '미레에셋생명.jpg', alt: '미래에셋생명' },
  // { file: '삼성생명.jpg', alt: '삼성생명' },
  // { file: '삼성화재.jpg', alt: '삼성화재' },
  // { file: '환화손보.jpg', alt: '한화손보' },
  // { file: '흥국생명.jpg', alt: '흥국생명' },
  // { file: '흥국화재.jpg', alt: '흥국화재' },
  // { file: 'AIA생명.jpg', alt: 'AIA생명' },
  // { file: 'AIG.jpg', alt: 'AIG' },
] as const;

/** 로고가 적을 때 Swiper loop가 동작하도록 동일 로고를 여러 슬라이드로 펼침 */
const LOGO_SLIDE_REPEAT = 4;

type InsuranceLogoSwiperProps = {
  variant?: 'pc' | 'mobile';
};

export default function InsuranceLogoSwiper({ variant = 'pc' }: InsuranceLogoSwiperProps) {
  const isMobile = variant === 'mobile';
  const slidesPerView = isMobile ? 2 : 5;
  const spaceBetween = 12;
  const modules = [Autoplay, Navigation];
  const logoSlides = Array.from({ length: LOGOS.length * LOGO_SLIDE_REPEAT }, (_, i) => {
    const logo = LOGOS[i % LOGOS.length];
    return { logo, key: `${logo.file}__${i}` };
  });

  return (
    <div className={`insurance-logo-swiper insurance-logo-swiper--${variant}`}>
      <Swiper
        className="insurance-logo-swiper__root"
        modules={modules}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        slidesPerGroup={1}
        loop
        loopAddBlankSlides={false}
        speed={1000}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation
      >
        {logoSlides.map(({ logo, key }) => (
          <SwiperSlide key={key} className="insurance-logo-swiper__slide">
            <div className="insurance-logo-swiper__slide-inner">
              <img
                src={getImagePath(`/images/${logo.file}`)}
                alt={logo.alt}
                className="insurance-logo-swiper__img"
                loading="lazy"
                decoding="async"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
