import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { CouncilInfo, SpecialtyInfo } from '../types';
import { generateSlug, extractIdFromSlug } from '../lib/slugify';

interface SeoPagesProps {
  councils: CouncilInfo[];
  specialties: SpecialtyInfo[];
  siteSettings: any;
  onStartExam: (specialtyId: string) => void;
  onOpenSubscribe: () => void;
  currentUser: any;
}

export const SpecialtyPage: React.FC<SeoPagesProps> = ({ specialties, councils, siteSettings, onStartExam, onOpenSubscribe, currentUser }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const specialty = useMemo(() => {
    const id = extractIdFromSlug(slug || '');
    return specialties.find(s => s.id === id);
  }, [specialties, slug]);

  const council = useMemo(() => councils.find(c => c.id === specialty?.councilId), [councils, specialty]);

  if (!specialty) {
    return <div className="p-8 text-center text-rose-600 font-bold">التخصص غير موجود</div>;
  }
  
  const realSlug = generateSlug(specialty.titleEn, specialty.titleAr, specialty.id);

  // SEO fields from admin settings if any
  const seoData = siteSettings?.seoPages?.find((p: any) => p.path === `/specialty/${realSlug}` || p.path === `/specialty/${specialty.id}`) || {};
  const title = seoData.title || `امتحان ${specialty.titleAr} | أسئلة وامتحانات ${specialty.titleAr}`;
  const desc = seoData.description || specialty.description || `بنك أسئلة امتحان ${specialty.titleAr}`;
  const image = seoData.image || council?.logoUrl || siteSettings.logoUrl;
  const canonicalUrl = `https://medexam.net/specialty/${realSlug}`;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in text-slate-800">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={image} />
      </Helmet>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-bold">
        {council && (
          <>
            <Link to={`/council/${generateSlug(council.titleEn, council.titleAr, council.id)}`} className="hover:text-emerald-600 transition-colors">
              {council.titleAr}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        {/* Section would go here if we had one */}
        <span className="text-emerald-700">{specialty.titleAr}</span>
      </div>

      {/* Zone 1: Above the fold */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8 flex flex-col md:flex-row gap-8 items-center">
        {council?.logoUrl && (
          <img src={council.logoUrl} alt={specialty.titleAr} className="w-32 h-32 rounded-2xl object-cover shadow-sm border border-slate-100" />
        )}
        <div className="flex-1 text-center md:text-right">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{title}</h1>
          <p className="text-slate-600 mb-6 leading-relaxed max-w-2xl">{desc}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              onClick={() => onStartExam(specialty.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-emerald-200"
            >
              <FileText className="w-5 h-5" />
              📝 امتحان {specialty.titleAr}
            </button>
            <button
              onClick={() => {
                 if (!currentUser || !currentUser.isSubscribed) {
                   onOpenSubscribe();
                 } else {
                   navigate('/exams'); // or whatever view holds the bank
                 }
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-md shadow-slate-300"
            >
              📚 بنك أسئلة {specialty.titleAr}
            </button>
          </div>
        </div>
      </div>

      {/* Zone 2: Below the fold SEO content */}
      {seoData.content && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 prose prose-slate max-w-none prose-headings:font-black prose-a:text-emerald-600" dangerouslySetInnerHTML={{ __html: seoData.content }} />
      )}
    </div>
  );
};

export const CouncilPage: React.FC<SeoPagesProps> = ({ councils, specialties, siteSettings }) => {
  const { slug } = useParams<{ slug: string }>();
  
  const council = useMemo(() => {
    const id = extractIdFromSlug(slug || '');
    return councils.find(c => c.id === id);
  }, [councils, slug]);
  
  if (!council) {
    return <div className="p-8 text-center text-rose-600 font-bold">المجلس غير موجود</div>;
  }

  const councilSpecialties = specialties.filter(s => s.councilId === council.id);
  const realSlug = generateSlug(council.titleEn, council.titleAr, council.id);
  const seoData = siteSettings?.seoPages?.find((p: any) => p.path === `/council/${realSlug}` || p.path === `/council/${council.id}`) || {};
  const title = seoData.title || council.titleAr;
  const desc = seoData.description || council.description;
  const image = seoData.image || council.logoUrl || siteSettings.logoUrl;
  const canonicalUrl = `https://medexam.net/council/${realSlug}`;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in text-slate-800">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={image} />
      </Helmet>

      <div className="text-sm text-slate-500 mb-6 font-bold">
        <Link to="/" className="hover:text-emerald-600">الرئيسية</Link>
        <ChevronRight className="w-4 h-4 inline-block mx-2" />
        <span className="text-emerald-700">{council.titleAr}</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 mb-8 flex flex-col md:flex-row gap-8 items-center text-center md:text-right">
        {council.logoUrl && <img src={council.logoUrl} alt={council.titleAr} className="w-32 h-32 rounded-2xl object-cover shadow-sm" />}
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 mb-4">{title}</h1>
          <p className="text-slate-600">{desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {councilSpecialties.map(spec => (
          <Link to={`/specialty/${generateSlug(spec.titleEn, spec.titleAr, spec.id)}`} key={spec.id} className="bg-white border border-slate-200 hover:border-emerald-500 p-6 rounded-2xl flex flex-col items-center justify-center text-center group transition-all hover:-translate-y-1 hover:shadow-lg shadow-sm">
            <h3 className="font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">{spec.titleAr}</h3>
            <p className="text-xs text-slate-500 mb-4">{spec.description}</p>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{spec.questionCount} سؤال</span>
          </Link>
        ))}
      </div>

      {seoData.content && (
         <div className="bg-white rounded-3xl border border-slate-200 p-8 prose max-w-none" dangerouslySetInnerHTML={{ __html: seoData.content }} />
      )}
    </div>
  );
};

export const SectionPage: React.FC<SeoPagesProps> = () => {
  // Same logic as above but filtering by section_name 
  return <div>Section Page</div>;
};

export const NewsPage: React.FC<{ blogPosts: any[], siteSettings: any }> = ({ blogPosts, siteSettings }) => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.id === slug);

  if (!post) return <div className="p-8 text-center text-rose-600 font-bold">الخبر غير موجود</div>;

  const title = post.title;
  const desc = post.excerpt || post.title;
  const image = post.imageUrl || siteSettings.logoUrl;
  const canonicalUrl = `https://medexam.net/news/${post.id}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in text-slate-800">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={image} />
      </Helmet>

      {/* Basic render */}
      <h1 className="text-3xl font-black mb-4">{title}</h1>
      {post.imageUrl && <img src={post.imageUrl} className="w-full h-64 object-cover rounded-2xl mb-6" />}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
};
