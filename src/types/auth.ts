export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  user_metadata: {
    name: string;
    role: string;
    phone?: string;
    cedula?: string;
  };
}

export interface AuthSession {
  user: AuthUser;
}

export interface SupabaseResponse<T> {
  data: T;
  error: { message: string } | null;
}

export interface ProfileData {
  id: string;
  name: string;
  phone: string;
  cedula: string;
  role: string;
}