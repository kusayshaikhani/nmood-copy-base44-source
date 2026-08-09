import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function RateExperienceSheet({ experience, open, onOpenChange, onSubmit }) {
  const { t } = useLocalization();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, review);
      setRating(0);
      setReview('');
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="text-center py-2">
        <h2 className="font-semibold text-lg mb-1">{t('experiences.rate.title')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{experience?.title}</p>

        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              type="button"
              className="transition-default"
            >
              <Star
                className={`w-8 h-8 ${(hover || rating) >= n ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
              />
            </button>
          ))}
        </div>

        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder={t('experiences.rate.placeholder')}
          rows={3}
          className="resize-none mb-4 text-sm"
        />

        <Button className="w-full" disabled={rating === 0} onClick={handleSubmit}>{t('experiences.rate.submit')}</Button>
      </div>
    </BottomSheet>
  );
}