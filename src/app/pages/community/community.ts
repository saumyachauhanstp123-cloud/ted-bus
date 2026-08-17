import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import {
  CommunityService
} from '../../services/community';

import {
  AuthService
} from '../../services/auth';

import {
  ToastService
} from '../../services/toast.service';

import {
  Comment
} from '../../models/comments';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './community.html',
  styleUrl: './community.css'
})
export class Community implements OnInit {
  private readonly translate =
    inject(TranslateService);

  private readonly toast =
    inject(ToastService);

  readonly communityService =
    inject(CommunityService);

  readonly authService =
    inject(AuthService);

  // ==================================
  // FORM STATE
  // ==================================
  title = '';
  content = '';
  category = '';
  imageUrl = '';

  commentTexts: {
    [postId: string]: string;
  } = {};

  // ==================================
  // UI STATE
  // ==================================
  readonly showCreateForm =
    signal(false);

  readonly creating =
    signal(false);

  readonly selectedCategory =
    signal('');

  readonly sortBy =
    signal<'recent' | 'popular'>(
      'recent'
    );

  // ==================================
  // COMMENTS CACHE
  // ==================================
  readonly commentsMap =
    signal<{
      [postId: string]: Comment[];
    }>({});

  readonly expandedComments =
    signal<Set<string>>(
      new Set<string>()
    );

  // ==================================
  // DASHBOARD STATS
  // ==================================
  readonly stats = signal({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0
  });

  /**
   * Har stats API request ko version milega.
   * Purana response naye stats ko overwrite nahi karega.
   */
  private statsRequestVersion = 0;

  /**
   * Rapid double-click par like aur turant unlike hone se rokega.
   */
  private readonly pendingLikeRequests =
    new Set<string>();

  /**
   * Comment button ko multiple requests bhejne se rokega.
   */
  private readonly pendingCommentRequests =
    new Set<string>();

  readonly categories = [
    'Travel Tips',
    'Routes',
    'Destinations',
    'Journey Stories'
  ];

  ngOnInit(): void {
    this.loadPosts();

    if (this.authService.isLoggedIn()) {
      this.loadUserStats();
    }
  }

  // ==================================
  // APPLY DASHBOARD STATS
  // ==================================
  private applyStats(
    responseStats: any,
    invalidateOldRequests = false
  ): void {
    if (invalidateOldRequests) {
      /**
       * Agar koi purani GET /stats request pending hai,
       * to ab uska response ignore kiya jayega.
       */
      this.statsRequestVersion++;
    }

    this.stats.set({
      totalPosts: Number(
        responseStats?.totalPosts ?? 0
      ),

      totalLikes: Number(
        responseStats?.totalLikes ?? 0
      ),

      totalComments: Number(
        responseStats?.totalComments ?? 0
      )
    });
  }

  // ==================================
  // LOAD USER STATS
  // ==================================
  loadUserStats(): void {
    if (!this.authService.isLoggedIn()) {
      this.applyStats(null);
      return;
    }

    const currentRequestVersion =
      ++this.statsRequestVersion;

    this.communityService
      .getUserStats()
      .subscribe({
        next: (response: any) => {
          /**
           * Is request ke baad like/comment response
           * aa chuka hai to ye response purana hai.
           */
          if (
            currentRequestVersion !==
            this.statsRequestVersion
          ) {
            return;
          }

          this.applyStats(
            response?.stats
          );
        },

        error: (error: any) => {
          console.error(
            'Community stats load error:',
            error
          );

          /**
           * Important:
           * API error par existing correct stats ko zero
           * nahi karenge.
           */
          if (
            currentRequestVersion !==
            this.statsRequestVersion
          ) {
            return;
          }
        }
      });
  }

  // ==================================
  // LOAD POSTS
  // ==================================
  loadPosts(): void {
    this.communityService.loadPosts({
      category:
        this.selectedCategory(),

      sort:
        this.sortBy()
    });
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
    this.loadPosts();
  }

  setSort(
    sort: 'recent' | 'popular'
  ): void {
    this.sortBy.set(sort);
    this.loadPosts();
  }

  // ==================================
  // CREATE POST
  // ==================================
  createPost(): void {
    const currentUser =
      this.authService.currentUser();

    if (!currentUser?.isVerified) {
      this.toast.error(
        this.translate.instant(
          'COMMUNITY_PAGE.ERRORS.VERIFIED_ONLY'
        )
      );

      return;
    }

    if (
      !this.title.trim() ||
      !this.content.trim() ||
      !this.category
    ) {
      this.toast.warning(
        this.translate.instant(
          'COMMUNITY_PAGE.ERRORS.FILL_ALL'
        )
      );

      return;
    }

    if (
      this.content.trim().length < 20
    ) {
      this.toast.warning(
        this.translate.instant(
          'COMMUNITY_PAGE.ERRORS.MIN_CHARS'
        )
      );

      return;
    }

    this.creating.set(true);

    this.communityService
      .createPost({
        title: this.title.trim(),
        content: this.content.trim(),
        category: this.category,
        imageUrl: this.imageUrl
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.resetForm();

          this.toast.success(
            this.translate.instant(
              'POST_CREATED_SUCCESS'
            )
          );

          this.loadPosts();
          this.loadUserStats();
        },

        error: (error: any) => {
          this.creating.set(false);

          this.toast.error(
            error?.error?.message ||
            'Failed to create post'
          );
        }
      });
  }

  private resetForm(): void {
    this.title = '';
    this.content = '';
    this.category = '';
    this.imageUrl = '';

    this.showCreateForm.set(false);
  }

  // ==================================
  // LIKE / UNLIKE
  // ==================================
  toggleLike(postId: string): void {
    if (!this.authService.isLoggedIn()) {
      this.toast.info(
        'Please login to like posts'
      );

      return;
    }

    /**
     * Rapid double-click ignore hoga.
     */
    if (
      this.pendingLikeRequests.has(postId)
    ) {
      return;
    }

    this.pendingLikeRequests.add(postId);

    this.communityService
      .toggleLike(postId)
      .subscribe({
        next: (response: any) => {
          /**
           * Post card par backend ki actual
           * updated likes array show karenge.
           */
          this.communityService.posts.update(
            posts =>
              posts.map(post => {
                if (post._id !== postId) {
                  return post;
                }

                if (
                  Array.isArray(
                    response.likes
                  )
                ) {
                  return {
                    ...post,
                    likes: response.likes
                  };
                }

                /**
                 * Old backend response fallback.
                 */
                const userId =
                  this.authService
                    .currentUser()
                    ?._id || '';

                const currentLikes =
                  Array.isArray(post.likes)
                    ? post.likes
                    : [];

                if (response.liked) {
                  return {
                    ...post,
                    likes: Array.from(
                      new Set([
                        ...currentLikes,
                        userId
                      ])
                    )
                  };
                }

                return {
                  ...post,
                  likes:
                    currentLikes.filter(
                      likeId =>
                        String(likeId) !==
                        String(userId)
                    )
                };
              })
          );

          /**
           * Response me backend already correct stats
           * bhej raha hai: 2 posts, 2 likes, 3 comments.
           */
          if (response?.stats) {
            this.applyStats(
              response.stats,
              true
            );
          } else {
            this.loadUserStats();
          }

          this.pendingLikeRequests.delete(
            postId
          );
        },

        error: (error: any) => {
          this.pendingLikeRequests.delete(
            postId
          );

          console.error(
            'Like update error:',
            error
          );

          this.toast.error(
            error?.error?.message ||
            'Failed to update like'
          );
        }
      });
  }

  isLiked(post: any): boolean {
    const userId =
      this.authService
        .currentUser()
        ?._id;

    if (
      !userId ||
      !Array.isArray(post.likes)
    ) {
      return false;
    }

    return post.likes.some(
      (like: any) => {
        const likeUserId =
          typeof like === 'string'
            ? like
            : like?._id;

        return (
          String(likeUserId) ===
          String(userId)
        );
      }
    );
  }

  // ==================================
  // SHARE
  // ==================================
  sharePost(post: any): void {
    const text =
      `🚌 ${post.title}\n\n` +
      `${post.content}\n\n` +
      'Check it out on TED BUS!';

    const url =
      window.location.href;

    if (navigator.share) {
      void navigator.share({
        title: post.title,
        text,
        url
      });
    } else {
      void navigator.clipboard.writeText(
        `${text}\n${url}`
      );

      this.toast.success(
        this.translate.instant(
          'COMMUNITY_PAGE.POST_COPIED'
        )
      );
    }

    this.communityService
      .sharePost(post._id)
      .subscribe({
        error: error => {
          console.error(
            'Share count update failed:',
            error
          );
        }
      });
  }

  // ==================================
  // DELETE POST
  // ==================================
  deletePost(postId: string): void {
    const confirmed =
      confirm(
        'Are you sure you want to delete this post?'
      );

    if (!confirmed) {
      return;
    }

    this.communityService
      .deletePost(postId)
      .subscribe({
        next: () => {
          this.toast.success(
            this.translate.instant(
              'POST_DELETED'
            )
          );

          this.loadPosts();
          this.loadUserStats();
        },

        error: (error: any) => {
          this.toast.error(
            error?.error?.message ||
            'Failed to delete post'
          );
        }
      });
  }

  // ==================================
  // REPORT POST
  // ==================================
  reportPost(postId: string): void {
    const reason =
      prompt(
        this.translate.instant(
          'COMMUNITY_PAGE.ERRORS.REPORT_REASON'
        )
      );

    if (!reason) {
      return;
    }

    this.communityService
      .reportContent({
        contentType: 'post',
        contentId: postId,
        reason
      })
      .subscribe({
        next: () => {
          this.toast.success(
            this.translate.instant(
              'COMMUNITY_PAGE.POST_REPORTED'
            )
          );
        },

        error: (error: any) => {
          this.toast.error(
            error?.error?.message ||
            'Failed to report post'
          );
        }
      });
  }

  // ==================================
  // COMMENTS
  // ==================================
  toggleComments(postId: string): void {
    const expanded =
      new Set(
        this.expandedComments()
      );

    if (expanded.has(postId)) {
      expanded.delete(postId);
    } else {
      expanded.add(postId);
      this.loadComments(postId);
    }

    this.expandedComments.set(
      expanded
    );
  }

  isExpanded(postId: string): boolean {
    return this.expandedComments()
      .has(postId);
  }

  loadComments(postId: string): void {
    this.communityService
      .getComments(postId)
      .subscribe({
        next: (response: any) => {
          this.commentsMap.update(
            map => ({
              ...map,
              [postId]:
                response?.comments || []
            })
          );
        },

        error: (error: any) => {
          console.error(
            'Comments load error:',
            error
          );
        }
      });
  }

  getPostComments(
    postId: string
  ): Comment[] {
    return (
      this.commentsMap()[postId] ||
      []
    );
  }

  addComment(postId: string): void {
    const text =
      this.commentTexts[postId]
        ?.trim();

    if (!text) {
      return;
    }

    if (
      this.pendingCommentRequests.has(
        postId
      )
    ) {
      return;
    }

    this.pendingCommentRequests.add(
      postId
    );

    this.communityService
      .addComment(postId, text)
      .subscribe({
        next: (response: any) => {
          this.pendingCommentRequests.delete(
            postId
          );

          this.commentTexts[postId] = '';

          this.loadComments(postId);

          /**
           * Backend ki actual updated commentCount
           * card par show hogi.
           */
          this.communityService.posts.update(
            posts =>
              posts.map(post => {
                if (post._id !== postId) {
                  return post;
                }

                return {
                  ...post,

                  commentCount: Number(
                    response?.commentCount ??
                    (
                      Number(
                        post.commentCount || 0
                      ) + 1
                    )
                  )
                };
              })
          );

          /**
           * Dashboard ke correct stats apply honge
           * aur purani pending request invalidate hogi.
           */
          if (response?.stats) {
            this.applyStats(
              response.stats,
              true
            );
          } else {
            this.loadUserStats();
          }
        },

        error: (error: any) => {
          this.pendingCommentRequests.delete(
            postId
          );

          console.error(
            'Comment add error:',
            error
          );

          this.toast.error(
            error?.error?.message ||
            'Failed to add comment'
          );
        }
      });
  }

  // ==================================
  // IMAGE
  // ==================================
  onImageSelected(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      this.imageUrl =
        reader.result as string;
    };

    reader.readAsDataURL(
      input.files[0]
    );
  }

  // ==================================
  // HELPERS
  // ==================================
  getTimeAgo(
    dateString: string
  ): string {
    try {
      const difference =
        Date.now() -
        new Date(
          dateString
        ).getTime();

      const minutes =
        Math.floor(
          difference / 60000
        );

      if (minutes < 60) {
        return `${minutes}m ago`;
      }

      const hours =
        Math.floor(
          minutes / 60
        );

      if (hours < 24) {
        return `${hours}h ago`;
      }

      const days =
        Math.floor(
          hours / 24
        );

      return `${days}d ago`;
    } catch {
      return '';
    }
  }

  isOwner(post: any): boolean {
    return (
      String(post.author?._id) ===
      String(
        this.authService
          .currentUser()
          ?._id
      )
    );
  }
}