import { useState } from 'react';
import { Alert, Button, RatingStars, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useCreateReviewMutation } from '@/api/endpoints.js';

export function ReviewForm({ orderId }) {
  const { t } = useI18n();
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (rating < 1) return setError(t('validation.ratingRequired'));
    setError('');
    try {
      await createReview({ orderId, rating, ...(comment.trim() ? { comment: comment.trim() } : {}) }).unwrap();
    } catch (err) {
      setError(apiErrorMessage(err, t));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <h3 className="font-semibold text-text-primary">{t('orders.reviewTitle')}</h3>
      <RatingStars value={rating} onChange={setRating} label={t('orders.review')} />
      <div>
        <label htmlFor="review-comment" className="mb-1 block text-sm font-medium text-text-primary">{t('orders.reviewComment')}</label>
        <textarea id="review-comment" rows={2} maxLength={500} value={comment} onChange={e => setComment(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary" />
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Button type="submit" loading={isLoading}>{t('orders.reviewSubmit')}</Button>
    </form>
  );
}
