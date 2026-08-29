import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Course } from '../types/course';
import CourseCard from '../components/CourseCard';
import { Search, Filter, RefreshCw, BookOpen, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Sustainable Agriculture',
  'Eco Living',
  'Permaculture',
  'Organic Farming',
];

interface CoursesResponse {
  success: boolean;
  data: Course[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function Courses() {
  const { user } = useUser();
  const userRole = (user?.publicMetadata?.role as string) || 'CUSTOMER';
  const isEducator = ['EDUCATOR', 'ADMIN'].includes(userRole);

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [page, setPage] = useState<number>(1);

  // Fetch courses query
  const { data, isLoading, isError, error, refetch } = useQuery<CoursesResponse>({
    queryKey: ['courses', page, selectedCategory, search],
    queryFn: async () => {
      const res = await apiClient.get<CoursesResponse>('/courses', {
        params: {
          page,
          limit: 9,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: search.trim() || undefined,
        },
      });
      return res.data;
    },
  });

  const courses = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-text-muted/15 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-secondary font-semibold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Digital Learning Engine</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-primary">Sustainable Knowledge & Masterclasses</h1>
          <p className="text-sm text-text-secondary">
            Master organic farming techniques, zero-waste lifestyle, and eco-agriculture from certified educators
          </p>
        </div>

        {isEducator && (
          <Link
            to="/educator/courses/new"
            className="flex items-center space-x-2 px-5 py-2.5 bg-secondary text-white hover:bg-secondary-hover font-semibold text-xs rounded-xl shadow-soft transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </Link>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-background-card p-4 rounded-2xl border border-text-muted/15 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Keyword Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-text-muted" />
          <input
            type="text"
            placeholder="Search courses, techniques..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>

        {/* Category Filter Badges */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-text-muted shrink-0 hidden sm:inline-block" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-secondary text-white shadow-soft'
                  : 'bg-background-muted/60 text-text-secondary hover:bg-background-muted border border-text-muted/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
          <RefreshCw className="w-8 h-8 animate-spin text-secondary" />
          <p className="text-sm font-medium">Loading course catalog...</p>
        </div>
      ) : isError ? (
        <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-error text-center space-y-3">
          <p className="text-sm font-medium">
            {(error as any)?.response?.data?.error?.message || 'Failed to load course catalog'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-error text-white text-xs font-bold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-text-muted opacity-40" />
          <h3 className="text-xl font-bold font-heading">No Courses Found</h3>
          <p className="text-xs text-text-secondary">
            Try adjusting your search query or selecting a different course category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-text-muted/15">
          <span className="text-xs text-text-secondary">
            Showing page <strong className="text-text-primary">{pagination.page}</strong> of{' '}
            <strong className="text-text-primary">{pagination.totalPages}</strong>
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border rounded-xl disabled:opacity-40 hover:bg-background-card transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 border rounded-xl disabled:opacity-40 hover:bg-background-card transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
