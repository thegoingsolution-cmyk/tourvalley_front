// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Notice {
  id: number;
  title: string;
  author_name: string;
  view_count: number;
  created_at: string;
  updated_at?: string;
  content?: string;
}

export interface NoticeListResponse {
  success: boolean;
  data: {
    notices: Notice[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message?: string;
}

export interface NoticeDetailResponse {
  success: boolean;
  data: {
    notice: Notice;
  };
  message?: string;
}

// 공지사항 목록 조회
export async function getNotices(params: {
  page?: number;
  limit?: number;
  search?: string;
  searchType?: 'title' | 'content' | 'all';
}): Promise<NoticeListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.searchType) queryParams.append('searchType', params.searchType);

  const response = await fetch(`${API_BASE_URL}/api/notices?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('공지사항 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
}

// 공지사항 상세 조회
export async function getNoticeDetail(id: number): Promise<NoticeDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/notices/${id}`);
  
  if (!response.ok) {
    throw new Error('공지사항을 불러오는데 실패했습니다.');
  }

  return response.json();
}

