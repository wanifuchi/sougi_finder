import React from 'react';
import type { SearchResult } from '../types';
import { 
    ArrowLeftIcon, 
    BuildingOfficeIcon, 
    ChatBubbleLeftEllipsisIcon, 
    DirectionsIcon, 
    ExternalLinkIcon, 
    PhoneIcon, 
    QuestionMarkCircleIcon 
} from './Icons';
import { StarRating } from './StarRating';

interface DetailPageProps {
  result: SearchResult;
  onBack: () => void;
}

export const DetailPage: React.FC<DetailPageProps> = ({ result, onBack }) => {
  const mapQuery = result.address ? `${result.title}, ${result.address}` : result.title;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <button 
          onClick={onBack} 
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-800 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>検索結果に戻る</span>
        </button>
      </div>

      <div className="p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">
          {result.title}
        </h2>
        {typeof result.rating === 'number' && typeof result.reviewCount === 'number' && result.reviewCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <StarRating rating={result.rating} />
            <span className="font-semibold text-slate-800">{result.rating.toFixed(1)}</span>
            <span className="text-slate-500">({result.reviewCount}件のレビュー)</span>
          </div>
        )}
      </div>

      <div className="aspect-w-16 aspect-h-9" style={{ height: '300px' }}>
        <iframe
          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=m&z=16&output=embed&iwloc=near`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${result.title}`}
          className="w-full h-full"
        ></iframe>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={result.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors duration-200 px-4 py-3 rounded-lg shadow-sm"
          >
            <DirectionsIcon className="w-5 h-5" />
            <span>Googleマップで開く</span>
          </a>
          {result.phone && (
            <a
              href={`tel:${result.phone}`}
              className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-200 px-4 py-3 rounded-lg"
            >
              <PhoneIcon className="w-5 h-5" />
              <span>電話をかける</span>
            </a>
          )}
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">施設情報</h3>
          <ul className="space-y-4 text-slate-700">
            {result.address && (
              <li className="flex items-start gap-4">
                <BuildingOfficeIcon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">住所</span>
                  <p>{result.address}</p>
                </div>
              </li>
            )}
            {result.phone && (
              <li className="flex items-start gap-4">
                <PhoneIcon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-semibold block">電話番号</span>
                  <p className="text-sky-600 hover:underline">
                    <a href={`tel:${result.phone}`}>{result.phone}</a>
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>
        
        {/* 利用者の声 Section */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-slate-500" />
            利用者の声
          </h3>
          {result.reviews && result.reviews.length > 0 ? (
            <div className="space-y-4">
              {result.reviews.map((review, index) => (
                <blockquote key={index} className="p-4 border-l-4 border-slate-200 bg-slate-50 text-slate-700 rounded-r-lg">
                  <p className="italic">「{review}」</p>
                </blockquote>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 text-slate-500 rounded-lg text-sm">
              <p>代表的な口コミ情報はありませんでした。</p>
            </div>
          )}
          <a
            href={result.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors duration-200 px-4 py-2 rounded-lg w-full border border-sky-200 hover:border-sky-300"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            <span>Googleマップで全ての口コミを見る</span>
          </a>
        </div>

        {/* よくある質問 Section */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <QuestionMarkCircleIcon className="w-6 h-6 text-slate-500" />
            よくある質問
          </h3>
          {result.qanda && result.qanda.length > 0 ? (
            <dl className="space-y-4">
              {result.qanda.map((item, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-lg">
                  <dt className="font-semibold text-slate-800 flex items-start gap-2">
                    <span className="font-bold text-sky-600">Q.</span>
                    <span>{item.question}</span>
                  </dt>
                  <dd className="mt-2 text-slate-700 flex items-start gap-2">
                    <span className="font-bold text-slate-500">A.</span>
                    <span>{item.answer}</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="p-4 bg-slate-50 text-slate-500 rounded-lg text-sm">
              <p>よくある質問に関する情報はありません。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};