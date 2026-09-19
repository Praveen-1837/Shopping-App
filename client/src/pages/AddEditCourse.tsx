import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Course } from '../types/course';
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle,
  Video,
  FileText,
  Download,
  Eye,
  Globe,
  Lock,
  Upload,
} from 'lucide-react';

export interface LessonItem {
  id: string;
  title: string;
  type: 'video' | 'article' | 'resource';
  videoUrl?: string;
  content?: string;
  resourceUrl?: string;
  freePreview?: boolean;
  order: number;
}

export interface SectionItem {
  id: string;
  title: string;
  order: number;
  lessons: LessonItem[];
}

export default function AddEditCourse() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('999');
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [durationMins, setDurationMins] = useState<string>('120');
  const [category, setCategory] = useState<string>('Sustainable Agriculture');
  const [published, setPublished] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'INVITE_ONLY'>('PUBLIC');
  const [previewVideo, setPreviewVideo] = useState<string>('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [certificate, setCertificate] = useState<boolean>(true);

  // Sections State
  const [sections, setSections] = useState<SectionItem[]>([
    {
      id: 'sec-1',
      title: 'Section 1: Fundamentals & Principles',
      order: 1,
      lessons: [
        {
          id: 'les-1',
          title: 'Welcome to the Masterclass',
          type: 'video',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          freePreview: true,
          order: 1,
        },
        {
          id: 'les-2',
          title: 'Curriculum & Setup Overview',
          type: 'article',
          content: 'Welcome! In this guide, we will cover the core principles of soil ecology and sustainable harvesting.',
          freePreview: false,
          order: 2,
        },
      ],
    },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Fetch course if edit mode
  const { data: existingData, isLoading: isFetching } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['course', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: any }>(`/courses/${id}`);
      return res.data;
    },
    enabled: isEditMode && !!id,
  });

  useEffect(() => {
    if (existingData?.data) {
      const c = existingData.data;
      setTitle(c.title || '');
      setDescription(c.description || '');
      setPrice(c.price ? String(c.price) : '999');
      setDiscountPrice(c.discountPrice ? String(c.discountPrice) : '');
      setDurationMins(c.durationMins ? String(c.durationMins) : '120');
      setCategory(c.category || 'Sustainable Agriculture');
      setPublished(Boolean(c.published));
      setVisibility(c.visibility || 'PUBLIC');
      setPreviewVideo(c.previewVideo || '');
      setCertificate(Boolean(c.certificate));

      // Parse structured sections vs legacy modules
      if (c.modules?.sections && Array.isArray(c.modules.sections)) {
        setSections(c.modules.sections);
      } else if (Array.isArray(c.modules)) {
        setSections([
          {
            id: 'sec-1',
            title: 'Section 1: Course Modules',
            order: 1,
            lessons: c.modules.map((m: any, idx: number) => ({
              id: m.id || `les-${idx + 1}`,
              title: m.title || `Lesson ${idx + 1}`,
              type: 'video',
              videoUrl: m.videoUrl || '',
              freePreview: idx === 0,
              order: idx + 1,
            })),
          },
        ]);
      }
    }
  }, [existingData]);

  // Section Helpers
  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `sec-${Date.now()}`,
        title: `Section ${sections.length + 1}: New Section`,
        order: sections.length + 1,
        lessons: [
          {
            id: `les-${Date.now()}-1`,
            title: 'Lesson 1',
            type: 'video',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            order: 1,
          },
        ],
      },
    ]);
  };

  const removeSection = (secIdx: number) => {
    setSections(sections.filter((_, i) => i !== secIdx));
  };

  const updateSectionTitle = (secIdx: number, titleVal: string) => {
    const updated = [...sections];
    updated[secIdx].title = titleVal;
    setSections(updated);
  };

  // Lesson Helpers
  const addLesson = (secIdx: number) => {
    const updated = [...sections];
    const lessonCount = updated[secIdx].lessons.length;
    updated[secIdx].lessons.push({
      id: `les-${Date.now()}-${lessonCount + 1}`,
      title: `New Lesson ${lessonCount + 1}`,
      type: 'video',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      order: lessonCount + 1,
    });
    setSections(updated);
  };

  const removeLesson = (secIdx: number, lesIdx: number) => {
    const updated = [...sections];
    updated[secIdx].lessons = updated[secIdx].lessons.filter((_, i) => i !== lesIdx);
    setSections(updated);
  };

  const updateLesson = (secIdx: number, lesIdx: number, field: keyof LessonItem, value: any) => {
    const updated = [...sections];
    updated[secIdx].lessons[lesIdx] = {
      ...updated[secIdx].lessons[lesIdx],
      [field]: value,
    };
    setSections(updated);
  };

  // Submit Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const payload = {
        title,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice.trim() ? parseFloat(discountPrice) : null,
        durationMins: parseInt(durationMins, 10),
        category,
        published,
        visibility,
        previewVideo: previewVideo || undefined,
        certificate,
        modules: { sections },
      };

      if (isEditMode) {
        await apiClient.put(`/courses/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await apiClient.post('/courses', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate('/educator/centre');
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to save course. Please check your form inputs.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (sections.length === 0 || sections.every((s) => s.lessons.length === 0)) {
      setErrorMsg('Course must contain at least one section and lesson.');
      return;
    }
    const priceNum = parseFloat(price);
    if (priceNum < 0 || !Number.isFinite(priceNum)) {
      setErrorMsg('Price must be a valid non-negative number');
      return;
    }
    saveMutation.mutate();
  };

  if (isEditMode && isFetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-base font-medium">Loading course data for edit...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-text-muted/15 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-secondary font-semibold text-sm uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-secondary" />
            <span>Educator Curriculum Builder</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-primary">
            {isEditMode ? 'Edit Course & Curriculum' : 'Create New Course & Curriculum'}
          </h1>
        </div>

        <Link
          to="/educator/centre"
          className="flex items-center space-x-1 text-sm text-text-secondary hover:text-secondary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Educator Centre</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-error-light border border-error/30 rounded-2xl p-4 text-error flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Course Settings & Visibility */}
        <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
            <h2 className="text-lg font-bold font-heading text-primary">
              1. General Details & Publishing Settings
            </h2>

            {/* Published Toggle */}
            <div className="flex items-center space-x-3 bg-background-muted p-2 rounded-xl border border-text-muted/15">
              <span className="text-sm font-bold text-text-primary">
                Status: {published ? <span className="text-success">Published</span> : <span className="text-text-muted">Draft</span>}
              </span>
              <button
                type="button"
                onClick={() => setPublished(!published)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  published ? 'bg-success' : 'bg-text-muted/30'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    published ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-primary">
              Course Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Masterclass: Regenerative Organic Farming"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-primary">
                Regular Price (₹) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                step="1"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-primary">
                Discount Price (₹)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="Optional discount"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-primary">
                Duration (Mins) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                required
                min="10"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-primary">
                Catalog Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-secondary/40"
              >
                <option value="PUBLIC">Public (In Catalog)</option>
                <option value="INVITE_ONLY">Invite Only (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-primary">
              Category <span className="text-error">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-secondary/40"
            >
              <option value="Sustainable Agriculture">Sustainable Agriculture</option>
              <option value="Eco Living">Eco Living</option>
              <option value="Permaculture">Permaculture</option>
              <option value="Organic Farming">Organic Farming</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-primary">
              Course Summary Description <span className="text-error">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-text-primary">
                Preview Video URL (YouTube / Embed)
              </label>
              <input
                type="text"
                value={previewVideo}
                onChange={(e) => setPreviewVideo(e.target.value)}
                className="w-full px-4 py-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-secondary/40 font-mono text-sm"
              />
            </div>

            <div className="pt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={certificate}
                  onChange={(e) => setCertificate(e.target.checked)}
                  className="w-4 h-4 accent-secondary"
                />
                <span className="text-sm font-semibold text-text-primary">
                  Issue Digital Certificate on 100% Completion
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Section & Lesson Hierarchy Builder */}
        <div className="bg-background-card rounded-2xl p-8 border border-text-muted/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
            <div>
              <h2 className="text-lg font-bold font-heading text-primary">
                2. Curriculum Builder (Sections & Lessons)
              </h2>
              <p className="text-sm text-text-muted">
                Organize your curriculum into ordered sections and multi-format lessons (video, article, resource).
              </p>
            </div>
            <button
              type="button"
              onClick={addSection}
              className="flex items-center space-x-1 px-3 py-2 bg-secondary text-white text-sm font-bold rounded-xl hover:bg-secondary-hover transition-colors shadow-soft cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((sec, secIdx) => (
              <div
                key={sec.id}
                className="p-6 rounded-2xl border-2 border-secondary/20 bg-background-muted/20 space-y-5"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between gap-3 border-b border-text-muted/15 pb-3">
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-sm font-bold text-secondary uppercase tracking-wider">
                      Section {secIdx + 1}:
                    </span>
                    <input
                      type="text"
                      required
                      value={sec.title}
                      onChange={(e) => updateSectionTitle(secIdx, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-background-card border border-text-muted/20 rounded-xl text-sm font-bold text-text-primary"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => addLesson(secIdx)}
                      className="px-2.5 py-1 bg-secondary-light text-secondary hover:bg-secondary hover:text-white text-sm font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Lesson</span>
                    </button>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(secIdx)}
                        className="text-error hover:bg-error-light/50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lessons List in Section */}
                <div className="space-y-4 pl-2 sm:pl-4">
                  {sec.lessons.map((les, lesIdx) => (
                    <div
                      key={les.id}
                      className="p-4 rounded-xl border border-text-muted/20 bg-background-card space-y-3 shadow-soft"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="text-[11px] font-bold text-text-muted">
                            Lesson {lesIdx + 1}
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="Lesson Title"
                            value={les.title}
                            onChange={(e) => updateLesson(secIdx, lesIdx, 'title', e.target.value)}
                            className="flex-1 px-3 py-1 bg-background-muted/60 border border-text-muted/20 rounded-lg text-sm font-semibold"
                          />
                        </div>

                        {/* Lesson Type Selector */}
                        <div className="flex items-center space-x-2">
                          <select
                            value={les.type}
                            onChange={(e) => updateLesson(secIdx, lesIdx, 'type', e.target.value as any)}
                            className="px-2.5 py-1 bg-background-muted border border-text-muted/20 rounded-lg text-sm font-bold text-secondary cursor-pointer"
                          >
                            <option value="video">🎥 Video Lesson</option>
                            <option value="article">📄 Article / Text</option>
                            <option value="resource">📁 Resource Download</option>
                          </select>

                          {/* Free Preview Checkbox */}
                          <label className="flex items-center space-x-1 text-[11px] text-text-muted cursor-pointer">
                            <input
                              type="checkbox"
                              checked={les.freePreview || false}
                              onChange={(e) => updateLesson(secIdx, lesIdx, 'freePreview', e.target.checked)}
                              className="accent-secondary"
                            />
                            <span>Free Preview</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeLesson(secIdx, lesIdx)}
                            className="text-error hover:bg-error-light p-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Type-Specific Content Inputs */}
                      {les.type === 'video' && (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-text-muted flex items-center space-x-1">
                            <Video className="w-3 h-3 text-secondary" />
                            <span>Video Lesson Embed or Direct URL</span>
                          </label>
                          <input
                            type="url"
                            placeholder="https://www.youtube.com/embed/... or direct mp4 URL"
                            value={les.videoUrl || ''}
                            onChange={(e) => updateLesson(secIdx, lesIdx, 'videoUrl', e.target.value)}
                            className="w-full px-3 py-1.5 bg-background-muted/40 border border-text-muted/20 rounded-lg text-sm font-mono"
                          />
                        </div>
                      )}

                      {les.type === 'article' && (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-text-muted flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-secondary" />
                            <span>Article Content (Markdown supported)</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Enter lesson text, instructions, and reading materials..."
                            value={les.content || ''}
                            onChange={(e) => updateLesson(secIdx, lesIdx, 'content', e.target.value)}
                            className="w-full px-3 py-1.5 bg-background-muted/40 border border-text-muted/20 rounded-lg text-sm"
                          ></textarea>
                        </div>
                      )}

                      {les.type === 'resource' && (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-text-muted flex items-center space-x-1">
                            <Download className="w-3 h-3 text-secondary" />
                            <span>Downloadable Resource File URL (PDF, Slides, Code)</span>
                          </label>
                          <input
                            type="url"
                            placeholder="https://res.cloudinary.com/.../resource.pdf"
                            value={les.resourceUrl || ''}
                            onChange={(e) => updateLesson(secIdx, lesIdx, 'resourceUrl', e.target.value)}
                            className="w-full px-3 py-1.5 bg-background-muted/40 border border-text-muted/20 rounded-lg text-sm font-mono"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full py-4 bg-secondary text-white hover:bg-secondary-hover font-semibold text-base rounded-xl transition-all shadow-soft flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Course Curriculum...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>{isEditMode ? 'Update Masterclass Curriculum' : 'Save & Publish Curriculum'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
