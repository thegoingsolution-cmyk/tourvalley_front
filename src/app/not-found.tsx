import Link from 'next/link';
import './not-found.css';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__inner">
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">페이지를 찾을 수 없습니다</h1>
        <p className="not-found__desc">
          요청하신 페이지가 없거나 주소가 변경되었을 수 있습니다.
          <br />
          홈에서 다시 시작해 주세요.
        </p>
        <Link href="/" className="not-found__button">
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}
