'use client';
import { useState } from 'react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';

export interface ReviewFormData {
  title: string;
  body: string;
  rating: number;
  receiptFile?: File;
}

export interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => Promise<void>;
  productName: string;
}

export function ReviewForm({ onSubmit, productName }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await onSubmit({ title, body, rating, receiptFile }); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-text-secondary text-sm">Reviewing: <span className="text-text-primary font-medium">{productName}</span></p>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1" id="rating-label">Rating</p>
        <div className="flex gap-1" role="group" aria-labelledby="rating-label">
          {[1,2,3,4,5].map((s) => (
            <button key={s} type="button" onClick={() => setRating(s)} className={`text-2xl ${s <= rating ? 'text-lemon' : 'text-surface-3'}`} aria-label={`${s} star${s !== 1 ? 's' : ''}`} aria-pressed={s === rating}>★</button>
          ))}
        </div>
      </div>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarise your experience" required />
      <div className="flex flex-col gap-1">
        <label htmlFor="review-body" className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Review</label>
        <textarea
          id="review-body"
          className="bg-surface-3 border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary outline-none focus:border-green focus:ring-1 focus:ring-green resize-none"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your experience in detail..."
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="receipt-file" className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Receipt (optional — earn Verified badge)</label>
        <input
          id="receipt-file"
          type="file"
          accept="image/*"
          onChange={(e) => setReceiptFile(e.target.files?.[0])}
          className="text-sm text-text-secondary"
        />
      </div>
      <p className="text-text-secondary text-[10px]">You will earn VenlaxIQ ForecastPoints for publishing this review.</p>
      <Button type="submit" variant="primary" className="w-full" loading={loading}>Submit Review</Button>
    </form>
  );
}
