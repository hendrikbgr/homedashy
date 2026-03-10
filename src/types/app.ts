export interface App {
  id: number;
  name: string;
  url: string;
  description: string | null;
  category: string | null;
  categoryColor?: string | null;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: Date | null;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  createdAt: Date | null;
}
