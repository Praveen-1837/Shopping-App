import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import {
  BookOpen,
  Users,
  IndianRupee,
  Award,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Star,
  MessageSquare,
  Eye,
  Edit3,
  Globe,
  Lock,
  Calendar,
  Send,
  X,
} from 'lucide-react';

interface EducatorStats {
  totalEnrolledStudents: number;
  activeCourses: number;
  totalCourses: number;
  totalRevenue: number;
  averageRating: number;
}

interface ActivityEvent {
  id: string;
  type: 'ENROLLMENT' | 'REVIEW';
  title: string;
  subtitle: string;
  timestamp: string;
}

interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  totalSales: number;
  chartData: { label: string; revenue: number; orders: number }[];
}

interface StudentProgress {
  studentId: string;
  name: string;
  email: string;
  progressPercent: number;
  completedModulesCount: number;
  certificateIssued: boolean;
  lastActive: string;
}

interface StudentDetail {
  student: { id: string; name: string; email: string };
  progressPercent: number;
  certificateIssued: boolean;
  lastActive: string;
  lessons: { id: string; title: string; completed: boolean }[];
}

interface CourseReview {
  id: string;
  rating: number;
  comment?: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  user: { name: string; email: string };
}

export default function EducatorCentre() {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'revenue' | 'students' | 'reviews'>('overview');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Selected Course State for Student Roster & Reviews
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [inspectStudentId, setInspectStudentId] = useState<string | null>(null);

  // Review Reply State
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);

  // 1. Educator Stats Query
  const { data: statsData } = useQuery<{ success: boolean; data: EducatorStats }>({
    queryKey: ['educator-stats'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: EducatorStats }>('/educator/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  // 2. Educator Activity Feed Query
  const { data: activityData, isLoading: loadingActivity } = useQuery<{ success: boolean; data: ActivityEvent[] }>({
    queryKey: ['educator-activity-feed'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: ActivityEvent[] }>('/educator/activity-feed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn && activeTab === 'overview',
  });

  // 3. Educator Courses List Query
  const { data: coursesData, isLoading: loadingCourses } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['educator-courses-all'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: any[] }>('/courses?includeUnpublished=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  // 4. Revenue Analytics Query
  const { data: revenueData, isLoading: loadingRevenue } = useQuery<{ success: boolean; data: RevenueAnalytics }>({
    queryKey: ['educator-revenue-analytics', period],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: RevenueAnalytics }>(
        `/educator/analytics/revenue?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!isSignedIn && activeTab === 'revenue',
  });

  // 5. Course Students Roster Query
  const activeCourseIdForRoster = selectedCourseId || coursesData?.data?.[0]?.id;

  const { data: rosterData, isLoading: loadingRoster } = useQuery<{
    success: boolean;
    data: StudentProgress[];
  }>({
    queryKey: ['educator-course-students', activeCourseIdForRoster],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: StudentProgress[] }>(
        `/educator/courses/${activeCourseIdForRoster}/students`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!isSignedIn && activeTab === 'students' && !!activeCourseIdForRoster,
  });

  // 6. Detailed Student Inspection Query
  const { data: studentDetailData, isLoading: loadingStudentDetail } = useQuery<{
    success: boolean;
    data: StudentDetail;
  }>({
    queryKey: ['educator-student-detail', activeCourseIdForRoster, inspectStudentId],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: StudentDetail }>(
        `/educator/courses/${activeCourseIdForRoster}/students/${inspectStudentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!isSignedIn && !!inspectStudentId && !!activeCourseIdForRoster,
  });

  // 7. Course Reviews Query & Star Breakdown
  const activeCourseIdForReviews = selectedCourseId || coursesData?.data?.[0]?.id;

  const { data: reviewsData, isLoading: loadingReviews } = useQuery<{
    success: boolean;
    data: CourseReview[];
    breakdown: Record<number, number>;
  }>({
    queryKey: ['educator-course-reviews', activeCourseIdForReviews],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{
        success: boolean;
        data: CourseReview[];
        breakdown: Record<number, number>;
      }>(`/educator/courses/${activeCourseIdForReviews}/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn && activeTab === 'reviews' && !!activeCourseIdForReviews,
  });

  // Toggle Publish Status Mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ courseId, published }: { courseId: string; published: boolean }) => {
      const token = await getToken();
      await apiClient.put(
        `/courses/${courseId}`,
        { published },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educator-courses-all'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  // Save Educator Reply Mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      const token = await getToken();
      await apiClient.patch(
        `/reviews/${reviewId}/reply`,
        { reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setReplyingReviewId(null);
      queryClient.invalidateQueries({ queryKey: ['educator-course-reviews'] });
    },
  });

  const stats = statsData?.data || {
    totalEnrolledStudents: 0,
    activeCourses: 0,
    totalCourses: 0,
    totalRevenue: 0,
    averageRating: 0,
  };

  const activityEvents = activityData?.data || [];
  const coursesList = coursesData?.data || [];
  const revenueAnalytics = revenueData?.data || { period: 'daily', totalRevenue: 0, totalSales: 0, chartData: [] };
  const rosterList = rosterData?.data || [];
  const reviewsList = reviewsData?.data || [];
  const breakdown = reviewsData?.breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const maxRevenue = Math.max(...revenueAnalytics.chartData.map((d) => d.revenue), 100);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-text-muted/15 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading text-secondary">Educator Masterclass Studio</h1>
          <p className="text-xs text-text-muted">
            Build multi-format course curricula, track student completion progress, monitor revenue trends, and engage with reviews.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/educator/courses/new"
            className="px-5 py-2.5 bg-secondary text-text-primary text-xs font-bold rounded-xl hover:bg-secondary-hover transition-colors shadow-soft flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Course</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Active Courses */}
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Active Courses
            </span>
            <span className="text-3xl font-extrabold font-heading text-secondary block">
              {stats.activeCourses} / {stats.totalCourses}
            </span>
            <span className="text-[11px] text-text-muted">Published masterclasses</span>
          </div>
          <div className="p-3.5 bg-secondary-light text-secondary rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Enrolled Students */}
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Enrolled Students
            </span>
            <span className="text-3xl font-extrabold font-heading text-primary block">
              {stats.totalEnrolledStudents}
            </span>
            <span className="text-[11px] text-text-muted">Distinct active learners</span>
          </div>
          <div className="p-3.5 bg-primary-light text-primary rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Gross Revenue */}
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Total Course Earnings
            </span>
            <span className="text-3xl font-extrabold font-heading text-text-primary block">
              ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-text-muted">Gross sales revenue</span>
          </div>
          <div className="p-3.5 bg-background-muted text-secondary rounded-2xl border border-text-muted/10">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Avg Rating */}
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Average Course Rating
            </span>
            <span className="text-3xl font-extrabold font-heading text-secondary block flex items-center space-x-1">
              <Star className="w-6 h-6 text-secondary fill-secondary" />
              <span>{stats.averageRating || 'N/A'}</span>
            </span>
            <span className="text-[11px] text-text-muted">Student feedback average</span>
          </div>
          <div className="p-3.5 bg-secondary/20 text-secondary rounded-2xl">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex flex-wrap items-center gap-1.5 bg-background-muted p-1 rounded-2xl border border-text-muted/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-secondary text-white shadow-soft'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Overview & Activity
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-secondary text-white shadow-soft'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          My Courses & Publishing ({coursesList.length})
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'revenue'
              ? 'bg-secondary text-white shadow-soft'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Revenue Analytics
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-secondary text-white shadow-soft'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Student Progress Roster
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-secondary text-white shadow-soft'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Reviews & Educator Replies
        </button>
      </div>

      {/* TAB 1: Overview & Activity Feed */}
      {activeTab === 'overview' && (
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-4">
          <h3 className="font-heading font-bold text-base text-text-primary flex items-center space-x-2 border-b border-text-muted/10 pb-3">
            <TrendingUp className="w-5 h-5 text-secondary" />
            <span>Recent Student Enrollments & Review Activity</span>
          </h3>

          {loadingActivity ? (
            <div className="py-8 flex justify-center text-text-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : activityEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              No recent student activity logged yet across your masterclasses.
            </div>
          ) : (
            <div className="space-y-3">
              {activityEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl border border-text-muted/15 bg-background-muted/30 flex items-start justify-between text-xs"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${evt.type === 'ENROLLMENT' ? 'bg-primary-light text-primary' : 'bg-secondary/20 text-secondary'}`}>
                      {evt.type === 'ENROLLMENT' ? <Users className="w-4 h-4" /> : <Star className="w-4 h-4 fill-secondary" />}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">{evt.title}</p>
                      <p className="text-[11px] text-text-muted">{evt.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: My Courses & Publishing Management */}
      {activeTab === 'courses' && (
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
            <h3 className="font-heading font-bold text-base text-text-primary flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-secondary" />
              <span>Masterclass Catalog Management</span>
            </h3>
            <Link
              to="/educator/courses/new"
              className="px-4 py-2 bg-secondary text-text-primary text-xs font-bold rounded-xl hover:bg-secondary-hover transition-colors shadow-soft flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Course</span>
            </Link>
          </div>

          {loadingCourses ? (
            <div className="py-8 flex justify-center text-text-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : coursesList.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              You haven't created any masterclass courses yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coursesList.map((c: any) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-text-muted/15 bg-background-card shadow-soft space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-secondary uppercase">
                        {c.category}
                      </span>

                      {/* Published Toggle */}
                      <button
                        onClick={() =>
                          togglePublishMutation.mutate({
                            courseId: c.id,
                            published: !c.published,
                          })
                        }
                        disabled={togglePublishMutation.isPending}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
                          c.published
                            ? 'bg-success-light text-success border border-success/30'
                            : 'bg-background-muted text-text-muted border border-text-muted/20'
                        }`}
                      >
                        {c.published ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{c.published ? 'Published' : 'Draft (Unpublished)'}</span>
                      </button>
                    </div>

                    <h4 className="text-base font-bold font-heading text-text-primary">{c.title}</h4>
                    <p className="text-xs text-text-muted line-clamp-2">{c.description}</p>
                    <p className="text-xs font-bold text-primary">
                      Price: ₹{Number(c.price).toFixed(2)}{' '}
                      {c.discountPrice && (
                        <span className="line-through text-text-muted text-[11px] ml-1">
                          ₹{Number(c.discountPrice).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-text-muted/10 pt-3">
                    <Link
                      to={`/course/${c.id}`}
                      className="text-xs font-bold text-secondary hover:underline flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCourseId(c.id);
                          setActiveTab('students');
                        }}
                        className="px-3 py-1.5 bg-background-muted text-text-primary text-xs font-semibold rounded-xl border border-text-muted/20 hover:bg-secondary-light/40"
                      >
                        Roster
                      </button>

                      <Link
                        to={`/educator/courses/edit/${c.id}`}
                        className="px-3 py-1.5 bg-secondary text-white text-xs font-semibold rounded-xl hover:bg-secondary-hover transition-colors flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Curriculum</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Revenue Analytics */}
      {activeTab === 'revenue' && (
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/10 pb-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <span>Masterclass Revenue Trend</span>
              </h3>
              <p className="text-xs text-text-muted">
                Gross earnings aggregated by {period} period from student course purchases
              </p>
            </div>

            <div className="flex items-center space-x-1 bg-background-muted/80 p-1 rounded-xl border border-text-muted/15">
              <button
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'daily' ? 'bg-secondary text-white shadow-soft' : 'text-text-muted'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'weekly' ? 'bg-secondary text-white shadow-soft' : 'text-text-muted'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'monthly' ? 'bg-secondary text-white shadow-soft' : 'text-text-muted'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {loadingRevenue ? (
            <div className="py-12 flex justify-center text-text-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : revenueAnalytics.chartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No revenue recorded for the selected period yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-background-muted/30 rounded-2xl border border-text-muted/10 overflow-x-auto no-scrollbar">
                {revenueAnalytics.chartData.map((dp, i) => {
                  const heightPercent = Math.max(10, Math.round((dp.revenue / maxRevenue) * 100));
                  return (
                    <div key={i} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-bold text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                        ₹{dp.revenue}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-secondary/80 group-hover:bg-secondary rounded-t-xl transition-all shadow-soft"
                      ></div>
                      <span className="text-[10px] text-text-muted font-mono truncate max-w-[50px]">{dp.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Student Progress Roster */}
      {activeTab === 'students' && (
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/10 pb-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary flex items-center space-x-2">
                <Users className="w-5 h-5 text-secondary" />
                <span>Student Roster & Progress Breakdown</span>
              </h3>
              <p className="text-xs text-text-muted">
                Track lesson completion progress and issued certificates for enrolled students
              </p>
            </div>

            {/* Course Selector Dropdown */}
            {coursesList.length > 0 && (
              <select
                value={activeCourseIdForRoster}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-4 py-2 bg-background-muted/80 border border-text-muted/20 rounded-xl text-xs font-bold text-text-primary cursor-pointer"
              >
                {coursesList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loadingRoster ? (
            <div className="py-8 flex justify-center text-text-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : rosterList.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              No students enrolled in this course yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background-muted text-text-muted font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Certificate</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text-muted/10">
                  {rosterList.map((s) => (
                    <tr key={s.studentId} className="hover:bg-background-muted/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-text-primary">{s.name}</td>
                      <td className="py-3 px-4 text-text-muted">{s.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-background-muted h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-secondary h-full rounded-full"
                              style={{ width: `${s.progressPercent}%` }}
                            />
                          </div>
                          <span className="font-bold">{s.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {s.certificateIssued ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded border border-success/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Issued
                          </span>
                        ) : (
                          <span className="text-[10px] text-text-muted">In Progress</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        {new Date(s.lastActive).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectStudentId(s.studentId)}
                          className="px-3 py-1 bg-secondary-light text-secondary hover:bg-secondary hover:text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Student Inspection Modal */}
          {inspectStudentId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-background-card rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-card border border-text-muted/15 relative">
                <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-primary">Student Progress Breakdown</h3>
                    <p className="text-xs text-text-muted">
                      {studentDetailData?.data?.student?.name} ({studentDetailData?.data?.student?.email})
                    </p>
                  </div>
                  <button
                    onClick={() => setInspectStudentId(null)}
                    className="p-1 hover:bg-background-muted rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>

                {loadingStudentDetail ? (
                  <div className="py-8 flex justify-center text-text-muted">
                    <RefreshCw className="w-6 h-6 animate-spin text-secondary" />
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between bg-background-muted/40 p-3 rounded-xl border border-text-muted/10 text-xs">
                      <span>Overall Progress: <strong>{studentDetailData?.data?.progressPercent}%</strong></span>
                      <span>Certificate: {studentDetailData?.data?.certificateIssued ? 'Issued ✓' : 'Pending'}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold text-text-primary uppercase text-[11px] tracking-wider">Lesson Status Checklist:</h4>
                      {studentDetailData?.data?.lessons.map((les) => (
                        <div
                          key={les.id}
                          className="p-2.5 rounded-xl border border-text-muted/15 bg-background-muted/20 flex items-center justify-between"
                        >
                          <span className="font-medium text-text-primary line-clamp-1">{les.title}</span>
                          {les.completed ? (
                            <span className="text-success font-bold text-[10px] flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Completed
                            </span>
                          ) : (
                            <span className="text-text-muted text-[10px]">Unfinished</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Course Reviews & Educator Replies */}
      {activeTab === 'reviews' && (
        <div className="bg-background-card rounded-3xl p-6 border border-text-muted/15 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/10 pb-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary flex items-center space-x-2">
                <Star className="w-5 h-5 text-secondary fill-secondary" />
                <span>Student Reviews & Public Educator Responses</span>
              </h3>
              <p className="text-xs text-text-muted">
                Review student feedback and publish responses shown on course landing pages
              </p>
            </div>

            {/* Course Selector Dropdown */}
            {coursesList.length > 0 && (
              <select
                value={activeCourseIdForReviews}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-4 py-2 bg-background-muted/80 border border-text-muted/20 rounded-xl text-xs font-bold text-text-primary cursor-pointer"
              >
                {coursesList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Star Breakdown Chart */}
          <div className="bg-background-muted/40 p-4 rounded-2xl border border-text-muted/15 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="p-2 bg-background-card rounded-xl border border-text-muted/10">
                <span className="font-bold text-secondary flex items-center justify-center space-x-1">
                  <span>{star} Stars:</span>
                  <strong>{breakdown[star] || 0}</strong>
                </span>
              </div>
            ))}
          </div>

          {loadingReviews ? (
            <div className="py-8 flex justify-center text-text-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : reviewsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              No student reviews received for this course yet.
            </div>
          ) : (
            <div className="space-y-4">
              {reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl border border-text-muted/15 bg-background-card shadow-soft space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-text-primary">{rev.user?.name}</span>
                      <div className="flex items-center text-secondary">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-secondary" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-text-primary text-xs">{rev.comment || 'No comment text provided.'}</p>

                  {/* Public Educator Reply Display */}
                  {rev.reply ? (
                    <div className="bg-secondary-light/40 border-l-4 border-secondary p-3.5 rounded-r-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-secondary font-bold">
                        <span>Educator Response:</span>
                        <button
                          onClick={() => {
                            setReplyingReviewId(rev.id);
                            setReplyTextMap({ ...replyTextMap, [rev.id]: rev.reply || '' });
                          }}
                          className="hover:underline cursor-pointer"
                        >
                          Edit Reply
                        </button>
                      </div>
                      <p className="text-xs text-text-primary">{rev.reply}</p>
                    </div>
                  ) : replyingReviewId !== rev.id ? (
                    <button
                      onClick={() => {
                        setReplyingReviewId(rev.id);
                        setReplyTextMap({ ...replyTextMap, [rev.id]: '' });
                      }}
                      className="px-3 py-1 bg-secondary-light text-secondary text-[11px] font-bold rounded-lg hover:bg-secondary hover:text-white transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Reply to Review</span>
                    </button>
                  ) : null}

                  {/* Reply Input Form */}
                  {replyingReviewId === rev.id && (
                    <div className="space-y-2 border-t border-text-muted/10 pt-3">
                      <textarea
                        rows={2}
                        placeholder="Write a public response to this student review..."
                        value={replyTextMap[rev.id] || ''}
                        onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                        className="w-full px-3 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs"
                      ></textarea>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setReplyingReviewId(null)}
                          className="px-3 py-1 bg-background-muted text-text-muted text-xs rounded-lg hover:bg-text-muted/10"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            replyMutation.mutate({
                              reviewId: rev.id,
                              reply: replyTextMap[rev.id] || '',
                            })
                          }
                          disabled={replyMutation.isPending}
                          className="px-4 py-1 bg-secondary text-white text-xs font-bold rounded-lg hover:bg-secondary-hover flex items-center space-x-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publish Reply</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
