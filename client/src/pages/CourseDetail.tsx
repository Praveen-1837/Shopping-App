import { useState, useMemo } from 'react';
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
  Check,
  RefreshCw,
  AlertCircle,
  PlayCircle,
  Lock,
  Star,
  MessageSquare,
  Send,
  Globe,
  MonitorPlay,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  Unlock
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

/* ─── Sub-components ─── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center text-secondary">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'fill-secondary text-secondary' : 'text-slate-300 fill-slate-300'}`}
        />
      ))}
    </div>
  );
}

function CurriculumAccordion({ modules, totalDuration }: { modules: any[]; totalDuration: number }) {
  const [isOpen, setIsOpen] = useState(true);
  
  // Estimate module duration if not provided
  const avgMins = modules.length > 0 ? Math.max(1, Math.floor(totalDuration / modules.length)) : 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-heading font-bold text-text-primary text-base">Course Modules</h3>
          <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {modules.length} lessons
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
      </button>
      
      {isOpen && (
        <div className="divide-y divide-slate-100">
          {modules.map((mod, i) => (
            <div key={mod.id || i} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
              <div className="mt-0.5 text-slate-400">
                {i === 0 ? <Unlock className="w-4 h-4 text-secondary" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-semibold ${i === 0 ? 'text-primary' : 'text-text-primary'}`}>
                  {i + 1}. {mod.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                  <span className="flex items-center gap-1"><MonitorPlay className="w-3.5 h-3.5" /> Video</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {avgMins} mins</span>
                </div>
              </div>
            </div>
          ))}
          {modules.length === 0 && (
            <div className="p-6 text-center text-base text-text-muted">
              Curriculum is currently being updated.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

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

  // Fetch course
  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Course }>({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Course }>(`/courses/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch reviews
  const { data: reviewsData, isLoading: loadingReviews } = useQuery<{ success: boolean; data: ReviewItem[] }>({
    queryKey: ['course-reviews-public', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ReviewItem[] }>(`/courses/${id}/reviews`);
      return res.data;
    },
    enabled: !!id,
  });

  // Add Review
  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) return navigate('/login');
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
  const isOwner = (clerkUser && course?.educatorId === clerkUser.id) || userRole === 'ADMIN';

  // Normalize modules to handle both legacy flat array and new { sections } object
  const flatModules = useMemo(() => {
    if (!course?.modules) return [];
    if (Array.isArray(course.modules)) return course.modules;
    if (typeof course.modules === 'object' && Array.isArray((course.modules as any).sections)) {
      const allLessons: any[] = [];
      (course.modules as any).sections.forEach((sec: any) => {
        if (Array.isArray(sec.lessons)) {
          allLessons.push(...sec.lessons);
        }
      });
      return allLessons;
    }
    return [];
  }, [course?.modules]);

  // Add to Cart
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) return navigate('/login');
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

  // Delete Course
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await apiClient.delete(`/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => navigate('/courses'),
  });

  // Derived Stats
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
  }, [reviews]);
  
  // Simulated Enrolled Count for UI richness
  const enrolledCount = useMemo(() => Math.floor(Math.random() * 1500) + 200, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 text-text-secondary bg-background">
        <RefreshCw className="w-10 h-10 animate-spin text-secondary" />
        <p className="text-base font-semibold">Loading course architecture...</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="min-h-screen py-20 px-4 flex justify-center bg-background">
        <div className="bg-white border border-error/30 rounded-2xl p-10 max-w-lg w-full text-center shadow-sm space-y-5">
          <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-text-primary">Course Unavailable</h2>
          <p className="text-base text-text-muted">
            {(error as any)?.response?.data?.error?.message || 'This course may have been removed or is currently private.'}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white text-base font-bold rounded-xl transition-transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const hours = Math.floor(course.durationMins / 60);
  const mins = course.durationMins % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  
  const lastUpdated = new Date(course.updatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* ─────────────────────────────────────────────────────────
          HERO HEADER SECTION
          ───────────────────────────────────────────────────────── */}
      <section className="bg-primary text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-white opacity-5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto relative z-10">
          {/* Breadcrumb & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link to="/courses" className="flex items-center gap-1.5 text-base font-medium text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
            
            {isOwner && (
              <div className="flex items-center gap-3">
                <Link
                  to={`/educator/courses/edit/${course.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-sm font-bold rounded-lg transition-colors backdrop-blur-sm"
                >
                  <Edit3 className="w-4 h-4" /> Edit Course
                </Link>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-error/80 hover:bg-error text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-error p-1 rounded-lg">
                    <span className="text-sm font-bold px-2">Sure?</span>
                    <button onClick={() => deleteMutation.mutate()} className="px-3 py-1.5 bg-white text-error text-sm font-black rounded-md hover:bg-slate-100">
                      {deleteMutation.isPending ? '...' : 'Yes'}
                    </button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 bg-black/20 text-white text-sm font-bold rounded-md hover:bg-black/30">
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hero Content */}
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-secondary">
              <BookOpen className="w-4 h-4" /> {course.category}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-heading leading-tight">
              {course.title}
            </h1>
            
            <p className="text-lg text-white/80 font-medium leading-relaxed max-w-2xl">
              {(course.description || '').split('\n')[0] || "Master new skills with our comprehensive, expert-led curriculum designed for immediate real-world application."}
            </p>
            
            {/* Meta Stats */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-base text-white/90 pt-2">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Star className="w-4 h-4 text-secondary fill-secondary" />
                <span className="font-bold">{avgRating.toFixed(1)}</span>
                <span className="text-white/70">({reviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-300" />
                <span><strong className="text-white">{enrolledCount.toLocaleString()}</strong> enrolled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-300" />
                <span>English</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-slate-300" />
                <span>Updated {lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          MAIN SPLIT LAYOUT
          ───────────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
          
          {/* Left Column (Content) */}
          <div className="w-full lg:flex-1 space-y-8">
            
            {/* Overview Section */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold font-heading text-text-primary">About This Course</h2>
              <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
              
              {/* Learning Objectives Mock UI */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mt-6">
                <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 text-secondary" /> What you'll learn
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base text-text-secondary">
                  <div className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Understand core concepts deeply.</div>
                  <div className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Apply knowledge in real-world scenarios.</div>
                  <div className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Build sustainable practices.</div>
                  <div className="flex items-start gap-2"><Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> Receive expert feedback.</div>
                </div>
              </div>
            </section>

            {/* Curriculum Section */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold font-heading text-text-primary">Course Curriculum</h2>
              <CurriculumAccordion modules={flatModules} totalDuration={course.durationMins} />
            </section>

            {/* Instructor Profile Box */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold font-heading text-text-primary mb-6">Your Instructor</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  <span className="text-3xl font-bold text-slate-300">
                    {course.educator?.name?.charAt(0) || 'E'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{course.educator?.name || 'Expert Educator'}</h3>
                    <p className="text-base text-secondary font-semibold">{course.educator?.role?.replace('_', ' ') || 'Content Creator'}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-text-muted">
                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-accent text-accent" /> 4.8 Instructor Rating</span>
                    <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {reviews.length * 3 + 12} Reviews</span>
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {enrolledCount + 800} Students</span>
                  </div>
                  <p className="text-base text-text-secondary leading-relaxed">
                    A dedicated professional committed to sustainable development and eco-conscious education. Passionate about delivering high-quality, actionable insights to empower the next generation.
                  </p>
                </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold font-heading text-text-primary">Student Reviews</h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="font-bold text-text-primary">{avgRating.toFixed(1)}</span>
                </div>
              </div>

              {isSignedIn && (
                <form onSubmit={(e) => { e.preventDefault(); addReviewMutation.mutate(); }} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-base font-bold text-text-primary">Write a Review</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-muted">Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setNewRating(star)} className="p-1 hover:scale-110 transition-transform">
                          <Star className={`w-5 h-5 ${star <= newRating ? 'text-secondary fill-secondary' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="How was your learning experience?"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-secondary focus:ring-1 focus:ring-secondary rounded-xl text-base transition-shadow outline-none"
                    required
                  />
                  <button type="submit" disabled={addReviewMutation.isPending} className="px-5 py-2.5 bg-primary text-white text-base font-bold rounded-xl hover:bg-primary-hover flex items-center gap-2 transition-colors disabled:opacity-50">
                    <Send className="w-4 h-4" /> {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              <div className="space-y-5">
                {loadingReviews ? (
                  <div className="py-8 flex justify-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin" /></div>
                ) : reviews.length === 0 ? (
                  <p className="text-base text-text-muted italic py-4">No reviews written for this course yet.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="pb-5 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {r.user?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-text-primary text-base block">{r.user?.name}</span>
                            <span className="text-[10px] text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <StarRating rating={r.rating} />
                      </div>
                      <p className="text-text-secondary text-base mt-2">{r.comment}</p>
                      {r.reply && (
                        <div className="mt-3 ml-4 bg-slate-50 border-l-2 border-secondary p-4 rounded-r-xl">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-text-primary mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-secondary" /> Educator Response
                          </div>
                          <p className="text-sm text-text-secondary">{r.reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column (Sticky Enrollment Card) */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-6 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              
              {/* Video Preview Wrapper */}
              <div className="relative aspect-video bg-black flex flex-col items-center justify-center border-b border-slate-100 group cursor-pointer overflow-hidden">
                {course.previewVideo ? (
                  <iframe src={course.previewVideo} title="Preview" className="w-full h-full relative z-10" allowFullScreen />
                ) : (
                  <>
                    <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" alt="Course Cover" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                    <div className="relative z-10 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-8 h-8 text-white fill-white/20" />
                    </div>
                    <span className="relative z-10 text-white font-bold text-base mt-3 tracking-wide drop-shadow-md">Preview Course</span>
                  </>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-black font-heading text-text-primary">
                      ₹{Number(course.price).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                    {course.price > 0 && <span className="text-base text-text-muted line-through mb-1">₹{(Number(course.price) * 1.5).toFixed(0)}</span>}
                  </div>
                  <p className="text-sm font-semibold text-success flex items-center gap-1"><Award className="w-3.5 h-3.5" /> 33% Off Today</p>
                </div>

                <button
                  onClick={() => addToCartMutation.mutate()}
                  disabled={addToCartMutation.isPending}
                  className={`w-full py-4 text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                    added ? 'bg-success text-white' : 'bg-primary text-white hover:bg-primary-hover hover:-translate-y-0.5'
                  }`}
                >
                  {added ? (
                    <><Check className="w-5 h-5" /> Enrolled Successfully!</>
                  ) : (
                    <><MonitorPlay className="w-5 h-5" /> Enroll Now</>
                  )}
                </button>

                <div className="text-center text-sm text-text-muted">
                  30-Day Money-Back Guarantee
                </div>

                {/* Features Checklist */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-base font-bold text-text-primary mb-2">This course includes:</h4>
                  <div className="flex items-center gap-3 text-base text-text-secondary">
                    <MonitorPlay className="w-4 h-4 text-text-muted" /> {durationText} on-demand video
                  </div>
                  <div className="flex items-center gap-3 text-base text-text-secondary">
                    <FileText className="w-4 h-4 text-text-muted" /> {flatModules.length + 2} downloadable resources
                  </div>
                  <div className="flex items-center gap-3 text-base text-text-secondary">
                    <Lock className="w-4 h-4 text-text-muted" /> Full lifetime access
                  </div>
                  <div className="flex items-center gap-3 text-base text-text-secondary">
                    <MonitorPlay className="w-4 h-4 text-text-muted" /> Access on mobile and TV
                  </div>
                  {course.certificate && (
                    <div className="flex items-center gap-3 text-base text-text-secondary">
                      <Award className="w-4 h-4 text-text-muted" /> Certificate of completion
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button className="flex-1 py-2 text-sm font-bold text-text-primary bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Share</button>
                  <button className="flex-1 py-2 text-sm font-bold text-text-primary bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Gift this course</button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
