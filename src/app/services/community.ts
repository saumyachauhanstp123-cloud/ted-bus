import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post';
import { Comment } from '../models/comments';
import { Discussion } from '../models/discussion';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/community';

  posts = signal<Post[]>([]);
  discussions = signal<Discussion[]>([]);
  loading = signal(false);
  total = signal(0);

  // ===== POSTS =====
  loadPosts(params: any = {}): void {
    this.loading.set(true);

    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);

    this.http.get<any>(`${this.apiUrl}/posts?${query.toString()}`).subscribe({
      next: (res) => {
        this.posts.set(res.posts || []);
        this.total.set(res.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createPost(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts`, data);
  }

  updatePost(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/posts/${id}`, data);
  }

  deletePost(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/posts/${id}`);
  }

  toggleLike(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts/${id}/like`, {});
  }

  sharePost(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts/${id}/share`, {});
  }

  // ===== COMMENTS =====
  getComments(postId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/posts/${postId}/comments`);
  }

  addComment(postId: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/posts/${postId}/comments`, { message });
  }

  deleteComment(commentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/comments/${commentId}`);
  }

  // ===== DISCUSSIONS =====
  loadDiscussions(topic?: string): void {
    this.loading.set(true);
    const query = topic ? `?topic=${topic}` : '';

    this.http.get<any>(`${this.apiUrl}/discussions${query}`).subscribe({
      next: (res) => {
        this.discussions.set(res.discussions || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createDiscussion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/discussions`, data);
  }

  addReply(discussionId: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/discussions/${discussionId}/reply`, { message });
  }

  // ===== REPORTS =====
  reportContent(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/report`, data);
  }

  // ===== USER STATS =====
  getUserStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}