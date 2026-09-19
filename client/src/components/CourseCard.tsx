import { optimizeCloudinaryUrl } from "../utils/formatters";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Course } from '../types/course';
import { BookOpen, Clock, Award, ArrowRight, ShoppingCart, Check, User } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState<boolean>(false);

  const thumbnail =
    course.previewVideo ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800';

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      await apiClient.post(
        '/cart/items',
        { courseId: course.id, quantity: 1, type: 'COURSE' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setAdded(false), 2000);
    },
  });

  const hours = Math.floor(course.durationMins / 60);
  const mins = course.durationMins % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

  return (
    <div className="bg-background-card rounded-2xl border border-text-muted/15 overflow-hidden shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Course Thumbnail */}
        <div className="relative aspect-[16/9] bg-background-muted overflow-hidden">
          <img
            src={optimizeCloudinaryUrl(thumbnail, 600, 338)}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 bg-secondary/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Digital Course</span>
          </div>

          {course.certificate && (
            <div className="absolute top-3 right-3 bg-primary-light text-primary border border-primary/30 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>Certificate</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span className="flex items-center space-x-1 text-primary font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>{course.educator?.name || 'Expert Educator'}</span>
            </span>
            <span className="flex items-center space-x-1 text-text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>{durationText}</span>
            </span>
          </div>

          <h3 className="font-heading font-bold text-lg text-text-primary group-hover:text-primary transition-colors line-clamp-2">
            <Link to={`/course/${course.id}`}>{course.title}</Link>
          </h3>

          <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 pt-0 flex items-center justify-between border-t border-text-muted/10 mt-3 pt-3">
        <div>
          <span className="text-sm text-text-muted block">Tuition Fee</span>
          <span className="text-xl font-bold font-heading text-primary">
            ₹{Number(course.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
            className={`p-2.5 rounded-xl transition-all shadow-soft cursor-pointer flex items-center space-x-1 ${
              added
                ? 'bg-success text-white'
                : 'bg-secondary-light text-secondary hover:bg-secondary hover:text-white'
            }`}
            title="Add Course to Cart"
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </button>

          <Link
            to={`/course/${course.id}`}
            className="flex items-center space-x-1 px-3.5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-soft"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
