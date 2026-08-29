import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Course } from '../types/course';
import {
  BookOpen,
  Clock,
  Award,
  ArrowLeft,
  Trash2,
  Edit3,
  ShoppingCart,
  Check,
  RefreshCw,
  AlertCircle,
  PlayCircle,
  Lock,
  Star,
  MessageSquare,
  Send,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  user: { name: string };
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  const [added, setAdded] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);

  // Review Form State
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');

  // Fetch course query
  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Course }>({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Course }>(`/courses/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch public course reviews query
  const { data: reviewsData, isLoading: loadingReviews } = useQuery<{ success: boolean; data: ReviewItem[] }>({
    queryKey: ['course-reviews-public', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ReviewItem[] }>(`/courses/${id}/reviews`);
      return res.data;
    },
    enabled: !!id,
  });

  // Submit Review Mutation
  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      await apiClient.post(
        `/courses/${id}/reviews`,
        { rating: newRating, comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['course-reviews-public', id] });
    },
  });

  const course = data?.data;
  const reviews = reviewsData?.data || [];
  const userRole = (clerkUser?.publicMetadata?.role as string) || 'CUSTOMER';
  const isOwner =
    (clerkUser && course?.educatorId === clerkUser.id) || userRole === 'ADMIN';

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      await apiClient.post(
        '/cart/items',
        { courseId: course?.id, quantity: 1, type: 'COURSE' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setAdded(false), 2500);
    },
  });

  // Delete Course Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await apiClient.delete(`/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      navigate('/courses');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-sm font-medium">Loading course detail...</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h2 className="text-2xl font-bold text-error font-heading">Course Not Found</h2>
          <p className="text-xs text-error/90 max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || 'The requested course does not exist.'}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-secondary text-white text-xs font-semibold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Course Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const hours = Math.floor(course.durationMins / 60);
  const mins = course.durationMins % 60;
  const durationText = hours > 0 ? `${hours} hours ${mins} mins` : `${mins} mins`;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <Link
          to="/courses"
          className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Catalog</span>
        </Link>

        {isOwner && (
          <div className="flex items-center space-x-3">
            <Link
              to={`/educator/courses/edit/${course.id}`}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-background-card border border-text-muted/20 hover:bg-background-muted text-xs font-semibold text-text-primary rounded-xl transition-colors"
            >
              <Edit3 className="w-4 h-4 text-secondary" />
              <span>Edit Course</span>
            </Link>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-error-light border border-error/30 hover:bg-error text-error hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-error-light p-1.5 rounded-xl border border-error/30">
                <span className="text-xs text-error font-bold px-2">Confirm Delete?</span>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1 bg-error text-white text-xs font-bold rounded-lg"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-2 py-1 bg-background-card text-text-primary text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Video Preview & Course Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Preview Player Box */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-text-muted/15 shadow-card">
            {course.previewVideo ? (
              <iframe
                src={course.previewVideo}
                title={course.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-background-muted text-text-muted">
                <PlayCircle className="w-16 h-16 text-secondary opacity-60" />
                <p className="text-sm font-medium">Preview Video Unavailable</p>
              </div>
            )}
          </div>

          {/* Description & Overview */}
          <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-4">
            <h1 className="text-3xl font-bold font-heading text-primary leading-tight">
              {course.title}
            </h1>

            <div className="flex items-center space-x-4 text-xs text-text-secondary border-y border-text-muted/10 py-3">
              <span className="flex items-center space-x-1 text-secondary font-bold">
                <BookOpen className="w-4 h-4" />
                <span>{course.category}</span>
              </span>

              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-text-muted" />
                <span>{durationText}</span>
              </span>

              {course.certificate && (
                <span className="flex items-center space-x-1 text-primary font-semibold">
                  <Award className="w-4 h-4" />
                  <span>Certificate Included</span>
                </span>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-bold font-heading text-text-primary">Course Curriculum & Learning Objectives</h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>
          </div>

          {/* Student Reviews & Public Educator Responses */}
          <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-6">
            <h3 className="text-lg font-bold font-heading text-primary border-b border-text-muted/10 pb-3 flex items-center justify-between">
              <span>Student Feedback & Educator Responses ({reviews.length})</span>
              <div className="flex items-center text-accent text-sm">
                <Star className="w-4 h-4 fill-accent mr-1" />
                <span>
                  {reviews.length > 0
                    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                    : 'No reviews'}
                </span>
              </div>
            </h3>

            {/* Leave a Review Form */}
            {isSignedIn && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addReviewMutation.mutate();
                }}
                className="bg-background-muted/40 p-4 rounded-xl border border-text-muted/15 space-y-3"
              >
                <h4 className="text-xs font-bold text-text-primary">Leave a Student Review</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-text-muted">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newRating ? 'text-accent fill-accent' : 'text-text-muted/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="Share your thoughts on this masterclass..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 bg-background-card border border-text-muted/20 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  disabled={addReviewMutation.isPending}
                  className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl hover:bg-secondary-hover flex items-center space-x-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </form>
            )}

            {loadingReviews ? (
              <div className="py-6 flex justify-center text-text-muted">
                <RefreshCw className="w-5 h-5 animate-spin text-secondary" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-text-muted italic">No reviews written for this course yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-text-muted/15 bg-background-muted/20 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text-primary">{r.user?.name}</span>
                      <div className="flex items-center text-accent">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-accent" />
                        ))}
                      </div>
                    </div>
                    <p className="text-text-primary text-xs">{r.comment}</p>

                    {/* Educator Reply */}
                    {r.reply && (
                      <div className="bg-secondary-light/40 border-l-4 border-secondary p-3 rounded-r-xl space-y-1 mt-2">
                        <div className="flex items-center space-x-1 text-[11px] font-bold text-secondary">
                          <MessageSquare className="w-3 h-3" />
                          <span>Educator Response:</span>
                        </div>
                        <p className="text-xs text-text-primary">{r.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Purchase CTA */}
        <div className="space-y-6">
          <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft space-y-6 sticky top-24">
            <div>
              <span className="text-xs text-text-muted block">Total Tuition Fee</span>
              <span className="text-3xl font-bold font-heading text-primary">
                ₹{Number(course.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2 text-xs text-text-secondary border-t border-text-muted/10 pt-4">
              <div className="flex justify-between">
                <span>Educator:</span>
                <strong className="text-text-primary">{course.educator?.name || 'Expert'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Access:</span>
                <strong className="text-success">Lifetime Digital Access</strong>
              </div>
            </div>

            <button
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending}
              className={`w-full py-4 font-semibold text-sm rounded-xl transition-all shadow-soft flex items-center justify-center space-x-2 cursor-pointer ${
                added ? 'bg-success text-white' : 'bg-secondary text-white hover:bg-secondary-hover'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Enroll — Add Course to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
