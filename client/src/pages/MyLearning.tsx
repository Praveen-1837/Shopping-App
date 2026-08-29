import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { CourseProgress } from '../types/course';
import { BookOpen, Award, PlayCircle, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MyLearning() {
  const { getToken, isSignedIn } = useAuth();

  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: CourseProgress[] }>({
    queryKey: ['my-learning'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: CourseProgress[] }>('/my-learning', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: isSignedIn,
  });

  const enrollments = data?.data || [];

  if (!isSignedIn) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="bg-background-card rounded-2xl p-10 border border-text-muted/15 shadow-soft space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-secondary" />
          <h2 className="text-2xl font-bold font-heading text-primary">Sign in to Access My Learning</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Please log in to your account to access your purchased courses and learning progress.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-secondary text-white text-xs font-semibold rounded-xl hover:bg-secondary-hover transition-colors shadow-soft"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-sm font-medium">Fetching your enrolled courses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-text-muted/15 pb-6">
        <div className="flex items-center space-x-2 text-secondary font-semibold text-xs uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4 text-secondary" />
          <span>My World — Learning Engine</span>
        </div>
        <h1 className="text-3xl font-bold font-heading text-primary">My Enrolled Masterclasses</h1>
        <p className="text-sm text-text-secondary">
          Track your course completion, resume modules, and download completion certificates
        </p>
      </div>

      {isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-error flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">
            {(error as any)?.response?.data?.error?.message || 'Failed to load your learning dashboard'}
          </p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-4">
          <BookOpen className="w-14 h-14 mx-auto text-text-muted opacity-40" />
          <h3 className="text-2xl font-bold font-heading">No Enrolled Courses Yet</h3>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            You haven't enrolled in any eco-masterclasses or sustainable farming workshops yet.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-secondary text-white text-xs font-semibold rounded-xl hover:bg-secondary-hover transition-colors shadow-soft"
          >
            <span>Explore Course Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((prog) => {
            const c = prog.course;
            const isCompleted = prog.progressPercent === 100;
            const totalMods = c?.modules?.length || 1;
            const completedCount = prog.completedModules?.length || 0;

            return (
              <div
                key={prog.id}
                className="bg-background-card rounded-2xl border border-text-muted/15 overflow-hidden shadow-card flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-[16/9] bg-background-muted overflow-hidden">
                    <img
                      src={
                        c?.previewVideo ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800'
                      }
                      alt={c?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-background-card/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-secondary border border-text-muted/10">
                      {c?.category || 'Course'}
                    </div>

                    {isCompleted && (
                      <div className="absolute top-3 right-3 bg-success text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4">
                    <h3 className="font-heading font-bold text-base text-text-primary line-clamp-2">
                      {c?.title}
                    </h3>

                    {/* Progress Bar Component */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>Progress ({completedCount}/{totalMods} modules)</span>
                        <strong className="text-secondary font-mono">{prog.progressPercent}%</strong>
                      </div>
                      <div className="w-full h-2.5 bg-background-muted rounded-full overflow-hidden border border-text-muted/15">
                        <div
                          className="h-full bg-secondary transition-all duration-500 rounded-full"
                          style={{ width: `${prog.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Certificate Badge State */}
                    {prog.certificateIssued && (
                      <div className="bg-primary-light/50 border border-primary/30 rounded-xl p-3 text-xs text-primary flex items-center space-x-2">
                        <Award className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <strong className="block font-bold">Certificate Unlocked!</strong>
                          <span>Verified Digital Certificate Earned</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0 border-t border-text-muted/10 mt-3 pt-3">
                  <Link
                    to={`/my-world/courses/${c?.id}/learn`}
                    className="w-full py-3 bg-secondary text-white hover:bg-secondary-hover font-semibold text-xs rounded-xl transition-all shadow-soft flex items-center justify-center space-x-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>{isCompleted ? 'Review Course Lessons' : 'Continue Learning'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
