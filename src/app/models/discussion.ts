export interface Discussion {
  _id: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  topic: string;
  title: string;
  message: string;
  replies: {
    author: {
      _id: string;
      name: string;
      avatar: string;
    };
    message: string;
    createdAt: string;
  }[];
  createdAt: string;
}