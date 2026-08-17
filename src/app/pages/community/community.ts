import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunityService } from '../../services/community';
import { AuthService } from '../../services/auth';
import { Comment } from '../../models/comments';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './community.html',
  styleUrl: './community.css',
})
export class Community implements OnInit {
  private translate = inject(TranslateService);
  private toast = inject(ToastService);
  communityService = inject(CommunityService);
  authService = inject(AuthService);

  // Form State
  title = '';
  content = '';
  category = '';
  imageUrl = '';
  commentTexts: { [key: string]: string } = {};

  // UI State
  showCreateForm = signal(false);
  creating = signal(false);
  selectedCategory = signal('');
  sortBy = signal<'recent' | 'popular'>('recent');
  

  // Comments cache
  commentsMap = signal<{ [postId: string]: Comment[] }>({});
  expandedComments = signal<Set<string>>(new Set());

  // Stats
  stats = signal({ totalPosts: 0, totalLikes: 0, totalComments: 0 });

  categories = ['Travel Tips', 'Routes', 'Destinations', 'Journey Stories'];

  ngOnInit(): void {
    this.loadPosts();
    if (this.authService.isLoggedIn()) {
      this.loadUserStats();
    }
  }

 loadUserStats(): void {
  if (!this.authService.isLoggedIn()) {
    this.stats.set({
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0
    });

    return;
  }

  this.communityService.getUserStats().subscribe({
    next: (response: any) => {
      const stats = response?.stats || {};

      this.stats.set({
        totalPosts: Number(stats.totalPosts || 0),
        totalLikes: Number(stats.totalLikes || 0),
        totalComments: Number(
  stats.commentsWritten ?? stats.totalComments ?? 0
)
      });
    },

    error: (error: any) => {
      console.error("Community stats load error:", error);

      this.stats.set({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0
      });
    }
  });
}

  loadPosts(): void {
    this.communityService.loadPosts({
      category: this.selectedCategory(),
      sort: this.sortBy(),
    });
  }

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.loadPosts();
  }

  setSort(sort: 'recent' | 'popular'): void {
    this.sortBy.set(sort);
    this.loadPosts();
  }

  createPost(): void {
    const currentUser = this.authService.currentUser();
    
    if (!currentUser?.isVerified) {
      this.toast.error(this.translate.instant('COMMUNITY_PAGE.ERRORS.VERIFIED_ONLY'));
      return;
    }

    if (!this.title.trim() || !this.content.trim() || !this.category) {
      this.toast.warning(this.translate.instant('COMMUNITY_PAGE.ERRORS.FILL_ALL'));
      return;
    }

    if (this.content.trim().length < 20) {
      this.toast.warning(this.translate.instant('COMMUNITY_PAGE.ERRORS.MIN_CHARS'));
      return;
    }

    this.creating.set(true);

    this.communityService.createPost({
      title: this.title,
      content: this.content,
      category: this.category,
      imageUrl: this.imageUrl,
    }).subscribe({
      next: () => {
        this.creating.set(false);
        this.resetForm();
        this.toast.success(this.translate.instant('POST_CREATED_SUCCESS'));
        this.loadPosts();
        this.loadUserStats();
      },
      error: (err: any) => {
        this.creating.set(false);
        this.toast.error(err?.error?.message || 'Failed to create post');
      },
    });
  }

  private resetForm() {
    this.title = '';
    this.content = '';
    this.category = '';
    this.imageUrl = '';
    this.showCreateForm.set(false);
  }
  toggleLike(postId: string): void {
  if (!this.authService.isLoggedIn()) {
    this.toast.info('Please login to like posts');
    return;
  }

  this.communityService.toggleLike(postId).subscribe({
    next: (res: any) => {
      this.communityService.posts.update(posts =>
        posts.map(p => {
          if (p._id === postId) {
            const userId =
              this.authService.currentUser()?._id || '';

            return {
              ...p,
              likes: res.liked
                ? [...p.likes, userId]
                : p.likes.filter(
                    (id: string) => id !== userId
                  ),
            };
          }

          return p;
        })
      );

      // Dashboard stats ko refresh karega
      this.loadUserStats();
    },

    error: (err: any) => {
      this.toast.error(
        err?.error?.message ||
        'Failed to update like'
      );
    },
  });
}

  
            

  isLiked(post: any): boolean {
    const userId = this.authService.currentUser()?._id;
    return userId ? post.likes.includes(userId) : false;
  }

  sharePost(post: any): void {
    const text = `🚌 ${post.title}\n\n${post.content}\n\nCheck it out on TED BUS!`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title: post.title, text: text, url: url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      this.toast.success(this.translate.instant('COMMUNITY_PAGE.POST_COPIED'));
    }
    this.communityService.sharePost(post._id).subscribe();
  }

  deletePost(postId: string): void {
    if (!confirm('Are you sure you want to delete this post?')) return;

    this.communityService.deletePost(postId).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('POST_DELETED'));
        this.loadPosts();
        this.loadUserStats();
      },
      error: (err: any) => this.toast.error('Failed to delete post'),
    });
  }

  reportPost(postId: string): void {
    const reason = prompt(this.translate.instant('COMMUNITY_PAGE.ERRORS.REPORT_REASON'));
    if (!reason) return;

    this.communityService.reportContent({
      contentType: 'post',
      contentId: postId,
      reason,
    }).subscribe({
      next: () => this.toast.success(this.translate.instant('COMMUNITY_PAGE.POST_REPORTED')),
      error: (err: any) => this.toast.error('Failed to report post'),
    });
  }

  toggleComments(postId: string): void {
    const expanded = new Set(this.expandedComments());
    if (expanded.has(postId)) {
      expanded.delete(postId);
    } else {
      expanded.add(postId);
      this.loadComments(postId);
    }
    this.expandedComments.set(expanded);
  }

  isExpanded(postId: string): boolean {
    return this.expandedComments().has(postId);
  }

  loadComments(postId: string): void {
    this.communityService.getComments(postId).subscribe({
      next: (res: any) => {
        this.commentsMap.update(map => ({ ...map, [postId]: res.comments || [] }));
      },
    });
  }

  getPostComments(postId: string): Comment[] {
    return this.commentsMap()[postId] || [];
  }

  addComment(postId: string): void {
    const text = this.commentTexts[postId]?.trim();
    if (!text) return;

    this.communityService.addComment(postId, text).subscribe({
      next: () => {
        this.commentTexts[postId] = '';
        this.loadComments(postId);
        this.communityService.posts.update(posts =>
          posts.map(p => p._id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)
        );
        this.loadUserStats();
      },
      error: (err: any) => this.toast.error('Failed to add comment'),
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const reader = new FileReader();
    reader.onload = () => this.imageUrl = reader.result as string;
    reader.readAsDataURL(input.files[0]);
  }

  getTimeAgo(dateStr: string): string {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch { return ''; }
  }

  isOwner(post: any): boolean {
    return post.author?._id === this.authService.currentUser()?._id;
  }
}