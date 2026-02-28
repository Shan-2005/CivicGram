export interface Issue {
  id: string | number;
  title: string;
  description: string;
  category: string;
  image_url: string;
  latitude: number;
  longitude: number;
  status: 'REPORTED' | 'VERIFIED' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  trust_score: number;
  is_verified: boolean;
  user_id: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
  resolved_at?: string;
  assigned_municipality?: string;
}

export interface Comment {
  id: string | number;
  issue_id: string | number;
  user_id: string;
  text: string;
  created_at: string;
}

export interface Municipality {
  id: string;
  name: string;
  area: string;
  contact: string;
}

export interface AdminUser {
  email: string;
  name: string;
  status: 'approved' | 'pending' | 'rejected';
  approved_at?: string;
  requested_at: string;
}

export type ViewType = 'FEED' | 'MAP' | 'CREATE' | 'DASHBOARD' | 'PROFILE';
export type AdminViewTab = 'ISSUES' | 'APPROVE_ADMINS' | 'MUNICIPALITIES' | 'ASSIGN';
