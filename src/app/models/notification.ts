export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'Booking' | 'Cancellation' | 'ScheduleChange' | 'Reminder' | 'Promotion' | 'Alert' | 'System';
  isRead: boolean;
  language: string;
  channels?: {
    inApp: { status: string };
    email: { enabled: boolean; status: string; sentAt?: string; error?: string };
    push: { enabled: boolean; status: string; sentAt?: string };
  };
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}