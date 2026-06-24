import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useContactCheck } from '@/hooks/use-contact-check';
import { createReview } from '@/services/reviews.service';
import type { Review } from '@/types/review';

export function NewReviewPage() {
  const { providerId } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const eligible = useContactCheck(user?.uid, providerId);
  const [rating, setRating] = useState<Review['rating']>(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  function readableError(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('error.')) return t(message);
    return t('reviews.submitFailed');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !providerId) return;
    setError(null);
    try {
      await createReview(user.uid, providerId, rating, comment);
      navigate(`/providers/${providerId}`);
    } catch (error) {
      setError(readableError(error));
    }
  }

  if (eligible.data === false) {
    return (
      <Card className="motion-reveal" variant="subtle">
        <CardContent className="motion-reveal p-8 text-center">
          {t('reviews.notEligible')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="motion-reveal">
      <CardHeader>
        <div className="brand-eyebrow" />
        <p className="section-label">{t('reviews.shareExperience')}</p>
        <CardTitle>{t('reviews.new')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="motion-stagger grid gap-4"
          onSubmit={(event) => void submit(event)}
        >
          <div className="space-y-2">
            <Label htmlFor="review-rating">{t('reviews.title')}</Label>
            <Select
              id="review-rating"
              value={String(rating)}
              onChange={(event) =>
                setRating(Number(event.target.value) as Review['rating'])
              }
              options={[1, 2, 3, 4, 5].map((value) => ({
                value: String(value),
                label: `${value}`,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">
              {t('reviews.commentPlaceholder')}
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t('reviews.commentPlaceholder')}
            />
          </div>
          <Button className="w-full sm:w-auto" type="submit">
            {t('common.save')}
          </Button>
          {error ? (
            <p className="motion-pop soft-note p-3 text-sm font-semibold text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
