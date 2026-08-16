import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityService } from '../../services/community';
import { AuthService } from '../../services/auth';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';
@Component({
  selector: 'app-discussion-board',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './discussion-board.html',
  styleUrl: './discussion-board.css'
})
export class DiscussionBoard implements OnInit {
  communityService = inject(CommunityService);
  authService = inject(AuthService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);
  topic = '';
  title = '';
  message = '';

  creating = signal(false);
  selectedTopic = signal('');
  replyTexts: { [id: string]: string } = {};
  expandedDiscussion = signal<string | null>(null);

  topics = [
    'Routes',
    'Destinations',
    'Travel Advice'
  ];

  ngOnInit(): void {
    this.communityService.loadDiscussions();
  }

  filterByTopic(topic: string): void {
    this.selectedTopic.set(topic);
    this.communityService.loadDiscussions(topic || undefined);
  }
  createDiscussion(): void {
  if (!this.topic || !this.title.trim() || !this.message.trim()) {
    this.toast.warning(this.translate.instant('DISCUSSION_PAGE.ERRORS.FILL_ALL'));
    return;
  }

  this.creating.set(true);

  this.communityService.createDiscussion({
    topic: this.topic,
    title: this.title,
    message: this.message,
  }).subscribe({
    next: () => {
      this.creating.set(false);
      this.topic = '';
      this.title = '';
      this.message = '';
      this.toast.success('Discussion created successfully!'); // 👈 Success toast
      this.communityService.loadDiscussions(this.selectedTopic() || undefined);
    },
    error: (err: any) => {
      this.creating.set(false);
      this.toast.error(err?.error?.message || this.translate.instant('COMMON.ERROR'));
    },
  });
}

 
   
       

  toggleReplies(id: string): void {
    this.expandedDiscussion.set(this.expandedDiscussion() === id ? null : id);
  }

 addReply(discussionId: string): void {
  const text = this.replyTexts[discussionId]?.trim();
  if (!text) return;

  this.communityService.addReply(discussionId, text).subscribe({
    next: () => {
      this.replyTexts[discussionId] = '';
      this.toast.success('Reply added successfully!'); // 👈 Success toast
      this.communityService.loadDiscussions(this.selectedTopic() || undefined);
    },
    error: (err: any) => this.toast.error(err?.error?.message || this.translate.instant('COMMON.ERROR')),
  });
}
  getTimeAgo(dateStr: string): string {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return ''; }
  }
}