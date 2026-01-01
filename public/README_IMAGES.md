# 이미지 파일 안내

이 디렉토리에 다음 이미지 파일들을 추가해주세요:

## 필수 이미지

### 1. 파비콘
- **파일명**: `favicon.ico`
- **위치**: `/public/favicon.ico`
- **크기**: 16x16, 32x32, 48x48 (멀티 사이즈 권장)
- **용도**: 브라우저 탭에 표시되는 아이콘

### 2. 로고 이미지
- **파일명**: `logo.png` (또는 `logo.svg`)
- **위치**: `/public/images/logo.png`
- **크기**: 권장 240x80px (비율 유지)
- **용도**: 헤더에 표시되는 로고

### 3. Apple Touch Icon (선택사항)
- **파일명**: `apple-touch-icon.png`
- **위치**: `/public/apple-touch-icon.png`
- **크기**: 180x180px
- **용도**: iOS 기기에서 홈 화면에 추가할 때 사용

## 이미지 추가 방법

1. 위의 이미지 파일들을 해당 경로에 추가하세요.
2. 로고 이미지는 배경이 투명한 PNG 또는 SVG 파일을 권장합니다.
3. 파비콘은 온라인 도구를 사용하여 생성할 수 있습니다:
   - https://favicon.io/
   - https://realfavicongenerator.net/

## 참고

- Next.js는 `/public` 디렉토리의 파일을 자동으로 서빙합니다.
- `/public/images/logo.png`는 `/images/logo.png`로 접근 가능합니다.
- 이미지가 없어도 에러는 발생하지 않지만, 대체 텍스트가 표시됩니다.

