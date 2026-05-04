import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !providerId) return;
    await createReview(user.uid, providerId, rating, comment);
    navigate(`/providers/${providerId}`);
  }

  if (eligible.data === false) {
    return (
      <Card variant="subtle">
        <CardContent className="p-8 text-center">
          {t('reviews.notEligible')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="brand-eyebrow" />
        <p className="section-label">{t('reviews.shareExperience')}</p>
        <CardTitle>{t('reviews.new')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          <Select
            value={String(rating)}
            onChange={(event) =>
              setRating(Number(event.target.value) as Review['rating'])
            }
            options={[1, 2, 3, 4, 5].map((value) => ({
              value: String(value),
              label: `${value}`,
            }))}
          />
          <Input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t('reviews.commentPlaceholder')}
          />
          <Button className="w-full sm:w-auto" type="submit">
            {t('common.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
