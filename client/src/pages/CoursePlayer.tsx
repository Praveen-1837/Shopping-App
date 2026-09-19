import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Course, CourseProgress } from '../types/course';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Award,
  PlayCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  Download,
  Video,
  Lock,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'article' | 'resource';
  videoUrl?: string;
  content?: string;
  resourceUrl?: string;
  freePreview?: boolean;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>(); // courseId
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Fetch course details
  const { data: courseData, isLoading: isCourseLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: any }>(`/courses/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch user learning progress
  const { data: learningData, isLoading: isLearningLoading } = useQuery<{ success: boolean; data: CourseProgress[] }>({
    queryKey: ['my-learning'],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiClient.get<{ success: boolean; data: CourseProgress[] }>('/my-learning', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const course = courseData?.data;
  const progressList = learningData?.data || [];
  const currentProgress = progressList.find((p) => p.courseId === id);

  // Parse sections and lessons flat list
  const rawModules: any = course?.modules;
  const sections: Section[] = [];
  const allLessons: Lesson[] = [];

  if (rawModules?.sections && Array.isArray(rawModules.sections)) {
    rawModules.sections.forEach((sec: any) => {
      const secLessons: Lesson[] = (sec.lessons || []).map((l: any, idx: number) => ({
        id: l.id || `les-${sec.id}-${idx}`,
        title: l.title || `Lesson ${idx + 1}`,
        type: l.type || 'video',
        videoUrl: l.videoUrl,
        content: l.content,
        resourceUrl: l.resourceUrl,
        freePreview: Boolean(l.freePreview),
        order: l.order || idx + 1,
      }));

      sections.push({
        id: sec.id || `sec-${sections.length + 1}`,
        title: sec.title || `Section ${sections.length + 1}`,
        order: sec.order || sections.length + 1,
        lessons: secLessons,
      });

      allLessons.push(...secLessons);
    });
  } else if (Array.isArray(rawModules)) {
    const legacyLessons: Lesson[] = rawModules.map((m: any, idx: number) => ({
      id: m.id || `les-${idx + 1}`,
      title: m.title || `Lesson ${idx + 1}`,
      type: 'video',
      videoUrl: m.videoUrl,
      freePreview: idx === 0,
      order: idx + 1,
    }));

    sections.push({
      id: 'sec-1',
      title: 'Course Curriculum',
      order: 1,
      lessons: legacyLessons,
    });
    allLessons.push(...legacyLessons);
  }

  // Determine active lesson
  const currentLesson =
    allLessons.find((l) => l.id === activeLessonId) || allLessons[0];

  const completedSet = new Set(currentProgress?.completedModules || []);
  const isCurrentLessonCompleted = currentLesson ? completedSet.has(currentLesson.id) : false;

  // Mark Lesson Complete Mutation
  const markCompleteMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const token = await getToken();
      const res = await apiClient.patch(
        `/courses/${id}/progress`,
        { moduleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-learning'] });
      // Advance to next lesson if available
      const currIdx = allLessons.findIndex((l) => l.id === currentLesson?.id);
      if (currIdx >= 0 && currIdx < allLessons.length - 1) {
        setActiveLessonId(allLessons[currIdx + 1].id);
      }
    },
  });

  if (isCourseLoading || isLearningLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-base font-medium">Preparing learning player...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h2 className="text-2xl font-bold font-heading text-error">Course Session Error</h2>
          <p className="text-sm text-error/90">Could not initialize course player.</p>
          <Link
            to="/my-world/courses"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-secondary text-white text-sm font-semibold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Learning</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Learning Navigation Bar */}
      <div className="bg-background-card border-b border-text-muted/15 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <Link
            to="/my-world/courses"
            className="flex items-center space-x-1.5 text-sm text-text-secondary hover:text-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-text-muted">|</span>
          <h1 className="font-heading font-bold text-base text-text-primary line-clamp-1">
            {course.title}
          </h1>
        </div>

        {/* Progress Bar & Certificate Pill */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-sm">
            <span className="text-text-muted">Progress:</span>
            <strong className="text-secondary font-mono">
              {currentProgress?.progressPercent || 0}%
            </strong>
          </div>

          {currentProgress?.certificateIssued && (
            <div className="bg-primary-light text-primary border border-primary/30 px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
              <Award className="w-4 h-4 text-primary" />
              <span>Certificate Earned</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Learning Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4">
        {/* Left Column (3 cols): Lesson Viewer & Controls */}
        <div className="lg:col-span-3 p-4 sm:p-6 lg:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Render 3 Lesson Types */}
            {currentLesson?.type === 'video' && (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-text-muted/15 shadow-card">
                {currentLesson.videoUrl ? (
                  <iframe
                    src={currentLesson.videoUrl}
                    title={currentLesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-text-muted space-y-2">
                    <PlayCircle className="w-16 h-16 text-secondary opacity-60" />
                    <p className="text-base font-medium">Select a video lesson from the sidebar</p>
                  </div>
                )}
              </div>
            )}

            {currentLesson?.type === 'article' && (
              <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-4 min-h-[400px]">
                <div className="flex items-center space-x-2 text-secondary font-bold text-sm uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>Reading Article Lesson</span>
                </div>
                <h2 className="text-2xl font-bold font-heading text-primary">{currentLesson.title}</h2>
                <div className="prose max-w-none text-text-primary text-base leading-relaxed border-t border-text-muted/10 pt-4 whitespace-pre-wrap">
                  {currentLesson.content || 'No article content provided for this lesson.'}
                </div>
              </div>
            )}

            {currentLesson?.type === 'resource' && (
              <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-6 min-h-[350px]">
                <div className="flex items-center space-x-2 text-secondary font-bold text-sm uppercase tracking-wider">
                  <Download className="w-4 h-4" />
                  <span>Downloadable Learning Resource</span>
                </div>
                <h2 className="text-2xl font-bold font-heading text-primary">{currentLesson.title}</h2>

                <div className="bg-background-muted/60 rounded-2xl p-6 border border-text-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-secondary-light text-secondary rounded-xl">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary text-base">{currentLesson.title}</h4>
                      <p className="text-sm text-text-muted">PDF / Slides / Resource File</p>
                    </div>
                  </div>

                  {currentLesson.resourceUrl ? (
                    <a
                      href={currentLesson.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-secondary text-white text-sm font-bold rounded-xl hover:bg-secondary-hover transition-colors shadow-soft flex items-center space-x-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Resource</span>
                    </a>
                  ) : (
                    <span className="text-sm text-text-muted italic">No resource URL attached</span>
                  )}
                </div>
              </div>
            )}

            {/* Active Lesson Header & Mark Complete Action */}
            <div className="bg-background-card rounded-2xl p-6 border border-text-muted/15 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-secondary uppercase tracking-wider block mb-1">
                  Active Lesson: {currentLesson?.type.toUpperCase()}
                </span>
                <h2 className="text-xl font-bold font-heading text-text-primary">
                  {currentLesson?.title || 'Lesson Title'}
                </h2>
              </div>

              {currentLesson && (
                <button
                  onClick={() => markCompleteMutation.mutate(currentLesson.id)}
                  disabled={markCompleteMutation.isPending || isCurrentLessonCompleted}
                  className={`px-6 py-3 font-semibold text-sm rounded-xl transition-all shadow-soft flex items-center space-x-2 cursor-pointer ${
                    isCurrentLessonCompleted
                      ? 'bg-success-light text-success border border-success/30 cursor-default'
                      : 'bg-secondary text-white hover:bg-secondary-hover'
                  }`}
                >
                  {isCurrentLessonCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Lesson Completed!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {markCompleteMutation.isPending ? 'Updating...' : 'Mark Lesson Complete'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Certificate Banner (Triggered on 100% completion) */}
          {currentProgress?.certificateIssued && (
            <div className="bg-success-light border-2 border-success/40 rounded-2xl p-6 text-center space-y-2 shadow-soft">
              <Award className="w-12 h-12 mx-auto text-success" />
              <h3 className="text-xl font-bold font-heading text-success">
                🎓 Congratulations! Masterclass Completed!
              </h3>
              <p className="text-sm text-text-secondary max-w-lg mx-auto">
                You have successfully completed all lessons for <strong>{course.title}</strong>. Your digital certificate of eco-sustainability completion has been officially issued.
              </p>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Curriculum Sections & Lessons Sidebar */}
        <div className="bg-background-card border-t lg:border-t-0 lg:border-l border-text-muted/15 p-6 space-y-6">
          <div className="border-b border-text-muted/10 pb-3">
            <h3 className="font-heading font-bold text-base text-primary">Curriculum Outline</h3>
            <span className="text-sm text-text-muted">
              {completedSet.size} of {allLessons.length} lessons finished
            </span>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            {sections.map((sec) => (
              <div key={sec.id} className="space-y-2">
                <h4 className="text-sm font-bold text-secondary uppercase tracking-wider border-b border-text-muted/10 pb-1">
                  {sec.title}
                </h4>

                <div className="space-y-1.5 pl-1">
                  {sec.lessons.map((les) => {
                    const isCompleted = completedSet.has(les.id);
                    const isActive = currentLesson?.id === les.id;

                    return (
                      <button
                        key={les.id}
                        onClick={() => setActiveLessonId(les.id)}
                        className={`w-full text-left p-3 rounded-xl border text-sm flex items-center justify-between transition-all cursor-pointer ${
                          isActive
                            ? 'border-secondary bg-secondary-light/40 ring-2 ring-secondary/20 font-bold'
                            : 'border-text-muted/15 bg-background-muted/30 hover:border-secondary/40'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-text-muted shrink-0" />
                          )}
                          <span className="truncate text-text-primary">
                            {les.title}
                          </span>
                        </div>

                        {les.type === 'video' && <Video className="w-3.5 h-3.5 text-text-muted shrink-0 ml-1" />}
                        {les.type === 'article' && <FileText className="w-3.5 h-3.5 text-text-muted shrink-0 ml-1" />}
                        {les.type === 'resource' && <Download className="w-3.5 h-3.5 text-text-muted shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
