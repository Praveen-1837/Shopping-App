export interface CourseModule {
  id: string;
  title: string;
  videoUrl: string;
  order: number;
}

export interface Course {
  id: string;
  educatorId: string;
  educator?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  };
  title: string;
  description: string;
  price: number;
  durationMins: number;
  category: string;
  modules: CourseModule[];
  previewVideo?: string;
  certificate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
  completedModules: string[];
  progressPercent: number;
  certificateIssued: boolean;
  updatedAt: string;
}
