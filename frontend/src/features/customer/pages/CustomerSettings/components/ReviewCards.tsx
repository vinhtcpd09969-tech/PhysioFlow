import { useState } from 'react';
import {
  Star,
  Edit2,
  Check,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import {
  updateServiceReview,
  updateStaffReview,
  rateAppointment,
} from '../../../api/customer.api';
import toast from 'react-hot-toast';
import { censorText } from '../../../../../utils/profanity';

export const QUICK_FEEDBACK_TAGS = [
  'Chuyên viên nhiệt tình',
  'Giảm đau rõ rệt',
  'Kỹ thuật tay nghề cao',
  'Phòng ốc sạch sẽ',
  'Đúng giờ hẹn',
  'Tư vấn tận tâm',
];

export const EMOTION_MAP: Record<number, { text: string; emoji: string; color: string }> = {
  5: { text: 'Rất tuyệt vời (Cơ thể nhẹ nhõm, rất hài lòng)', emoji: '😍', color: 'text-emerald-600 dark:text-emerald-400' },
  4: { text: 'Hài lòng (Dịch vụ chu đáo, cải thiện tốt)', emoji: '😊', color: 'text-teal-600 dark:text-teal-400' },
  3: { text: 'Bình thường (Đạt yêu cầu)', emoji: '😐', color: 'text-amber-600 dark:text-amber-400' },
  2: { text: 'Chưa hài lòng (Cần cải thiện)', emoji: '🙁', color: 'text-orange-600 dark:text-orange-400' },
  1: { text: 'Rất không hài lòng (Cần xử lý)', emoji: '😡', color: 'text-rose-600 dark:text-rose-400' },
};

export function ReviewCard({
  id,
  title,
  avatar,
  rating,
  comment,
  reply,
  date,
  type,
  onUpdated,
}: {
  id: string;
  title: string;
  avatar?: string | null;
  rating: number;
  comment: string;
  reply?: string | null;
  date: string;
  type: 'service' | 'staff';
  onUpdated: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftRating, setDraftRating] = useState(rating);
  const [draftComment, setDraftComment] = useState(comment);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setDraftRating(rating);
    setDraftComment(comment);
    setIsEditing(true);
  };

  const handleToggleTag = (tag: string) => {
    if (draftComment.includes(tag)) {
      setDraftComment((prev) => prev.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setDraftComment((prev) => (prev.trim() ? `${prev.trim()}, ${tag}` : tag));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { rating: draftRating, comment: draftComment };
      if (type === 'service') {
        await updateServiceReview(id, payload);
      } else {
        await updateStaffReview(id, payload);
      }
      toast.success('Đã cập nhật đánh giá thành công!');
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật đánh giá.');
    } finally {
      setSaving(false);
    }
  };

  const currentEmotion = EMOTION_MAP[isEditing ? draftRating : rating] || EMOTION_MAP[5];

  return (
    <div
      className={`w-full bg-white dark:bg-zinc-900 rounded-3xl border p-6 md:p-7 shadow-xs space-y-5 transition-all duration-300 ${
        isEditing
          ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
          : 'border-slate-200/80 dark:border-zinc-800 hover:border-teal-400/50 dark:hover:border-zinc-700 hover:shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-3.5 min-w-0">
          {type === 'staff' ? (
            avatar ? (
              <img
                src={avatar}
                alt={title}
                className="size-12 rounded-full object-cover shrink-0 border-2 border-indigo-200 dark:border-indigo-800 shadow-2xs"
              />
            ) : (
              <div className="size-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0 border-2 border-indigo-200/80 dark:border-indigo-800 shadow-2xs uppercase">
                {title.split(' ').slice(-2).map((n) => n[0]).join('') || 'NS'}
              </div>
            )
          ) : avatar ? (
            <img
              src={avatar}
              alt={title}
              className="size-12 rounded-2xl object-cover shrink-0 border border-teal-200 dark:border-teal-800 shadow-2xs"
            />
          ) : (
            <div className="size-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-xl flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50 shadow-2xs">
              🌿
            </div>
          )}
          <div className="min-w-0">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border mb-1 inline-block ${
                type === 'staff'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                  : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
              }`}
            >
              {type === 'staff' ? 'Nhân sự PHCN' : 'Gói Dịch Vụ'}
            </span>
            <h4 className="font-black text-base text-slate-900 dark:text-white truncate">{title}</h4>
            <span className="text-[11px] text-slate-400 font-medium">{date}</span>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1 shrink-0">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                disabled={!isEditing}
                onClick={() => isEditing && setDraftRating(i + 1)}
                className={`p-0.5 transition-all ${
                  isEditing ? 'cursor-pointer hover:scale-125 active:scale-95' : 'cursor-default'
                }`}
              >
                <Star
                  size={20}
                  className={
                    i < (isEditing ? draftRating : rating)
                      ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                      : 'text-slate-200 dark:text-zinc-700'
                  }
                />
              </button>
            ))}
          </div>
          <span className={`text-[11px] font-bold ${currentEmotion.color}`}>
            {currentEmotion.emoji} {currentEmotion.text.split('(')[0].trim()}
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400">Gợi ý nhanh:</span>
            {QUICK_FEEDBACK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                  draftComment.includes(tag)
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200'
                }`}
              >
                + {tag}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            placeholder="Viết nhận xét chi tiết về dịch vụ/nhân sự..."
            className="w-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:border-teal-500 focus:bg-white dark:focus:bg-zinc-900 p-3.5 rounded-2xl text-xs font-semibold resize-none outline-none text-slate-800 dark:text-zinc-200 transition-colors"
          />

          <div className="flex justify-end items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-teal-600/20 active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" size={13} /> : <Check size={13} />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium bg-slate-50/60 dark:bg-zinc-800/40 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/60">
            "{censorText(comment) || 'Khách hàng không để lại nhận xét chi tiết.'}"
          </p>

          {reply && (
            <div className="ml-4 sm:ml-6 pl-4 border-l-2 border-teal-500 space-y-1 py-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                💬 Phản hồi từ OfficeCare:
              </span>
              <p className="text-xs text-slate-600 dark:text-zinc-400 italic leading-relaxed">
                {reply}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 text-xs font-black text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 py-1 px-3 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-955 transition-colors cursor-pointer"
            >
              <Edit2 size={13} />
              Chỉnh sửa đánh giá
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PendingReviewCard({
  title,
  avatar,
  cuocHenId,
  type,
  onSubmitted,
}: {
  title: string;
  avatar?: string | null;
  cuocHenId: string;
  type: 'service' | 'staff';
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleToggleTag = (tag: string) => {
    if (comment.includes(tag)) {
      setComment((prev) => prev.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setComment((prev) => (prev.trim() ? `${prev.trim()}, ${tag}` : tag));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload =
        type === 'service'
          ? { rating_dich_vu: rating, comment_dich_vu: comment }
          : { rating_ktv: rating, comment_ktv: comment };
      await rateAppointment(cuocHenId, payload);
      toast.success('Đã gửi đánh giá thành công!');
      onSubmitted();
    } catch (err) {
      console.error(err);
      toast.error('Không thể gửi đánh giá.');
    } finally {
      setSaving(false);
    }
  };

  const currentEmotion = EMOTION_MAP[rating] || EMOTION_MAP[5];

  return (
    <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-955/20 dark:to-orange-955/10 rounded-3xl border border-dashed border-amber-300/80 dark:border-amber-800 p-5 md:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
        <div className="flex items-center gap-3.5">
          {type === 'staff' ? (
            avatar ? (
              <img
                src={avatar}
                alt={title}
                className="size-12 rounded-full object-cover shrink-0 border-2 border-amber-300 shadow-2xs"
              />
            ) : (
              <div className="size-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-sm flex items-center justify-center shrink-0 border-2 border-amber-300 shadow-2xs uppercase">
                {title.split(' ').slice(-2).map((n) => n[0]).join('') || 'NS'}
              </div>
            )
          ) : avatar ? (
            <img
              src={avatar}
              alt={title}
              className="size-12 rounded-2xl object-cover shrink-0 border border-amber-300 shadow-2xs"
            />
          ) : (
            <div className="size-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300/60 flex items-center justify-center text-xl shrink-0 shadow-2xs">
              📦
            </div>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300/60 mb-1 inline-block">
              {type === 'service' ? 'Đánh giá dịch vụ cần hoàn tất' : 'Kỹ thuật viên / Chuyên viên cần đánh giá'}
            </span>
            <h4 className="font-black text-sm text-amber-900 dark:text-amber-200 leading-tight">
              {title}
            </h4>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1 shrink-0 bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                className="p-0.5 hover:scale-125 active:scale-95 transition-all cursor-pointer"
              >
                <Star
                  size={18}
                  className={
                    i < rating
                      ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                      : 'text-slate-300 dark:text-zinc-700'
                  }
                />
              </button>
            ))}
          </div>
          <span className={`text-[10px] font-bold ${currentEmotion.color}`}>
            {currentEmotion.emoji} {currentEmotion.text.split('(')[0].trim()}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-amber-800/70 dark:text-amber-400">Chọn nhanh:</span>
          {QUICK_FEEDBACK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleToggleTag(tag)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                comment.includes(tag)
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-zinc-800 hover:bg-amber-100'
              }`}
            >
              + {tag}
            </button>
          ))}
        </div>

        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn về buổi trị liệu, hiệu quả giảm đau hoặc sự nhiệt tình của nhân sự..."
          className="w-full bg-white dark:bg-zinc-900 border border-amber-200/80 dark:border-zinc-800 focus:border-amber-500 p-3.5 rounded-2xl text-xs font-semibold resize-none outline-none text-slate-800 dark:text-zinc-200 transition-colors"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20 active:scale-95"
        >
          {saving ? <Loader2 className="animate-spin" size={13} /> : <PlusCircle size={13} />}
          Gửi đánh giá
        </button>
      </div>
    </div>
  );
}
