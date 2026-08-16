export interface Comment {
  _id: string;
  post: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  message: string;
  likes: string[];
  createdAt: string;
}