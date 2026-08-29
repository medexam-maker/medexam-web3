import React, { useState, useMemo } from 'react';
import { Search, Calendar, Clock, User, ArrowRight, BookOpen, Share2, Eye, Sparkles } from 'lucide-react';
import { BlogPost, INITIAL_BLOG_POSTS } from '../data/blogData';

interface BlogSectionProps {
  customPosts?: BlogPost[];
  onBackToHome: () => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ customPosts, onBackToHome }) => {
  const posts = customPosts && customPosts.length > 0 ? customPosts : INITIAL_BLOG_POSTS;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);

  // Filter Categories
  const categories = ['all', 'نصائح امتحانات', 'شرح تخصصات', 'تجارب نجاح', 'أخبار المجالس'];

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  // If a full article is open:
  if (activeArticle) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 dir-rtl" dir="rtl">
        {/* Top Header Back Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveArticle(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرجوع لمقالات المدونة</span>
          </button>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            {activeArticle.category}
          </span>
        </div>

        {/* Article Full Reader Container */}
        <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
              {activeArticle.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-b border-slate-100 pb-4">
              <span className="flex items-center gap-1 font-bold text-slate-700">
                <User className="w-4 h-4 text-emerald-600" />
                {activeArticle.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                {activeArticle.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                قراءة: {activeArticle.readTime}
              </span>
            </div>
          </div>

          {/* Banner Image */}
          {activeArticle.imageUrl && (
            <div className="rounded-2xl overflow-hidden h-64 sm:h-80 w-full border border-slate-200">
              <img 
                src={activeArticle.imageUrl} 
                alt={activeArticle.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Markdown / Content Text Body */}
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base space-y-4 font-normal">
            {activeArticle.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph.replace(/###/g, '').replace(/\*\*/g, '')}
              </p>
            ))}
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">الكلمات المفتاحية:</span>
            {activeArticle.tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200">
                #{tag}
              </span>
            ))}
          </div>
        </article>
      </div>
    );
  }

  // Articles List Grid View
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 dir-rtl" dir="rtl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
              مدونة MedExam الطبية
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">
            مقالات ونائح امتحانات المجالس الطبية
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            دليلك الطبي المعتمد للاستعداد للامتحانات القومية، شرح التخصصات، واستراتيجيات الحل والتفوق
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'جميع المقالات' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في المقالات والمواضيع الطبية..."
          className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
        />
      </div>

      {/* Articles Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Thumbnail */}
                <div className="h-44 overflow-hidden relative border-b border-slate-100">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                    {post.category}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      {post.author}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Single Button per Card */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-3">
                <button
                  onClick={() => setActiveArticle(post)}
                  className="w-full bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>اقرأ المقالة بالكامل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-sm">لا توجد مقالات مطابقة لبحثك.</p>
          <p className="text-xs">جرب البحث بكلمات أخرى أو اختر تصنيفاً آخر.</p>
        </div>
      )}

    </div>
  );
};
