import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  CommunityService
} from '../../services/community';

import {
  AuthService
} from '../../services/auth';

import {
  Comment
} from '../../models/comments';

import {
  TranslateService,
  TranslatePipe
} from '@ngx-translate/core';

import {
  ToastService
} from '../../services/toast.service';

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
  private translate =
    inject(TranslateService);

  private toast =
    inject(ToastService);

  communityService =
    inject(CommunityService);

  authService =
    inject(AuthService);

  // Form State
  title = '';
  content = '';
  category = '';
  imageUrl = '';

  commentTexts: {
    [key: string]: string
  } = {};

  // UI State
  showCreateForm = signal(false);
  creating = signal(false);
  selectedCategory = signal('');

  sortBy =
    signal<'recent' | 'popular'>(
      'recent'
    );

  // Comments cache
  commentsMap =
    signal<{
      [postId: string]: Comment[]
    }>({});

  expandedComments =
    signal<Set<string>>(
      new Set()
    );

  // Dashboard Stats
  stats = signal({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0
  });

  categories = [
    'Travel Tips',
    'Routes',
    'Destinations',
    'Journey Stories'
  ];

  ngOnInit(): void {
    this.loadPosts();

    if (
      this.authService.isLoggedIn()
    ) {
      this.loadUserStats();
    }
  }

  // ================================
  // LOAD USER STATS
  // ================================
  loadUserStats(): void {
    if (
      !this.authService.isLoggedIn()
    ) {
      this.stats.set({
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0
      });

      return;
    }

    this.communityService
      .getUserStats()
      .subscribe({
        next: (response: any) => {
          const responseStats =
            response?.stats || {};

          this.stats.set({
            totalPosts: Number(
              responseStats.totalPosts || 0
            ),

            totalLikes: Number(
              responseStats.totalLikes || 0
            ),

            totalComments: Number(
              responseStats.totalComments || 0
            )
          });
        },

        error: (error: any) => {
          console.error(
            'Community stats load error:',
            error
          );

          this.stats.set({
            totalPosts: 0,
            totalLikes: 0,
            totalComments: 0
          });
        }
      });
  }

  // ================================
  // LOAD POSTS
  // ================================
  loadPosts(): void {
    this.communityService.loadPosts({
      category:
        this.selectedCategory(),

      sort:
        this.sortBy()
    });
  }

  setCategory(
    category: string
  ): void {
    this.selectedCategory.set(
      category
    );

    this.loadPosts();
  }

  setSort(
    sort: 'recent' | 'popular'
  ): void {
    this.sortBy.set(sort);
    this.loadPosts();
  }

  // ================================
  // CREATE POST
  // ================================
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
        title: this.title,
        content: this.content,
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

  // ================================
  // LIKE / UNLIKE
  // ================================
  toggleLike(postId: string): void {
    if (
      !this.authService.isLoggedIn()
    ) {
      this.toast.info(
        'Please login to like posts'
      );

      return;
    }

    this.communityService
      .toggleLike(postId)
      .subscribe({
        next: (response: any) => {
          /*
           * Backend ki actual likes array
           * post card par apply hogi.
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

                /*
                 * Old backend response ke liye fallback
                 */
                const userId =
                  this.authService
                    .currentUser()
                    ?._id || '';

                return {
                  ...post,

                  likes: response.liked
                    ? [
                        ...post.likes,
                        userId
                      ]
                    : post.likes.filter(
                        id =>
                          String(id) !==
                          String(userId)
                      )
                };
              })
          );

          /*
           * Backend ne updated dashboard
           * stats return ki hain.
           */
          if (response.stats) {
            this.stats.set({
              totalPosts: Number(
                response.stats
                  .totalPosts || 0
              ),

              totalLikes: Number(
                response.stats
                  .totalLikes || 0
              ),

              totalComments: Number(
                response.stats
                  .totalComments || 0
              )
            });
          } else {
            this.loadUserStats();
          }
        },

        error: (error: any) => {
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

  // ================================
  // SHARE
  // ================================
  sharePost(post: any): void {
    const text =
      `🚌 ${post.title}\n\n` +
      `${post.content}\n\n` +
      `Check it out on TED BUS!`;

    const url =
      window.location.href;

    if (navigator.share) {
      navigator.share({
        title: post.title,
        text,
        url
      });
    } else {
      navigator.clipboard.writeText(
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
      .subscribe();
  }

  // ================================
  // DELETE POST
  // ================================
  deletePost(postId: string): void {
    if (
      !confirm(
        'Are you sure you want to delete this post?'
      )
    ) {
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

        error: () => {
          this.toast.error(
            'Failed to delete post'
          );
        }
      });
  }

  // ================================
  // REPORT POST
  // ================================
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

        error: () => {
          this.toast.error(
            'Failed to report post'
          );
        }
      });
  }

  // ================================
  // COMMENTS
  // ================================
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
                response.comments || []
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

    this.communityService
      .addComment(postId, text)
      .subscribe({
        next: (response: any) => {
          this.commentTexts[postId] = '';

          this.loadComments(postId);

          /*
           * Backend se actual comment count
           * post card par update hoga.
           */
          this.communityService.posts.update(
            posts =>
              posts.map(post =>
                post._id === postId
                  ? {
                      ...post,

                      commentCount:
                        Number(
                          response.commentCount ??
                          (
                            post.commentCount +
                            1
                          )
                        )
                    }
                  : post
              )
          );

          /*
           * Dashboard comments stat update
           */
          if (response.stats) {
            this.stats.set({
              totalPosts: Number(
                response.stats
                  .totalPosts || 0
              ),

              totalLikes: Number(
                response.stats
                  .totalLikes || 0
              ),

              totalComments: Number(
                response.stats
                  .totalComments || 0
              )
            });
          } else {
            this.loadUserStats();
          }
        },

        error: (error: any) => {
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

  // ================================
  // IMAGE
  // ================================
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

  // ================================
  // HELPERS
  // ================================
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