'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Grid, Navigation } from 'swiper/modules';
import { getImagePath } from '@/utils/path';
import 'swiper/css';
import 'swiper/css/grid';
import 'swiper/css/navigation';
import './InsuranceLogoSwiper.css';

const LOGOS = [
  { file: '교보생명.jpg', alt: '교보생명' },
  { file: '동양생명.jpg', alt: '동양생명' },
  { file: '라이나생명.jpg', alt: '라이나생명' },
  { file: '롯데손해보험.jpg', alt: '롯데손해보험' },
  { file: '메리츠화재.jpg', alt: '메리츠화재' },
  { file: '미레에셋생명.jpg', alt: '미래에셋생명' },
  { file: '삼성생명.jpg', alt: '삼성생명' },
  { file: '삼성화재.jpg', alt: '삼성화재' },
  { file: '현대해상.jpg', alt: '현대해상' },
  { file: '환화손보.jpg', alt: '한화손보' },
  { file: '흥국생명.jpg', alt: '흥국생명' },
  { file: '흥국화재.jpg', alt: '흥국화재' },
  { file: 'AIA생명.jpg', alt: 'AIA생명' },
  { file: 'AIG.jpg', alt: 'AIG' },
] as const;

type InsuranceLogoSwiperProps = {
  variant?: 'pc' | 'mobile';
};

export default function InsuranceLogoSwiper({ variant = 'pc' }: InsuranceLogoSwiperProps) {
  const isMobile = variant === 'mobile';
  const slidesPerView = isMobile ? 4 : 6;
  const spaceBetween = isMobile ? 4 : 12;
  const modules = isMobile ? [Autoplay, Navigation] : [Autoplay, Navigation, Grid];

  return (
    <div className={`insurance-logo-swiper insurance-logo-swiper--${variant}`}>
      <Swiper
        className="insurance-logo-swiper__root"
        modules={modules}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        slidesPerGroup={1}
        grid={isMobile ? undefined : { rows: 2, fill: 'row' }}
        loop
        loopAddBlankSlides={!isMobile}
        speed={1000}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        navigation
      >
        {LOGOS.map((logo) => (
          <SwiperSlide key={logo.file} className="insurance-logo-swiper__slide">
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
