export interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  title: string;
  content: string;
  imageUrl: string;
  category: string;
  likes: string[];
  commentCount: number;
  shareCount: number;
  status: string;
  createdAt: string;
}