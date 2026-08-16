export interface Review {

  id: number;

  busName: string;

  route: string;

  rating: number;

  reviewText: string;

  reviewerName: string;

  reviewDate: string;

  reviewTime: number;

  reportCount: number;

  isHidden: boolean;
  helpfulCount: number;

isTrustedReviewer: boolean;



}