import { router } from '@inertiajs/react';
import type { PageProps } from '../../pages.gen';
import type { TokenWithAnalysis } from '@/types';
import { RootLayout } from '@/layouts/RootLayout';
import { SentenceEditor } from '@/components/SentenceEditor/SentenceEditor';
import { toPayload } from '@/inertia';
import styles from './Show.module.css';

export default function Show({ sentence, tagSuggestions }: PageProps<'Sentences/Show'>) {
  if (!sentence) {
    return (
      <RootLayout>
        <div className={styles.emptyHint}>
          <p>英文が見つかりません</p>
        </div>
      </RootLayout>
    );
  }

  const handleSave = (tokens: TokenWithAnalysis[], naturalTranslation: string, tags: string[]) => {
    router.put(`/sentences/${sentence.id}`, toPayload({ tokens, naturalTranslation, tags }));
  };

  const handleBack = () => {
    router.visit('/');
  };

  return (
    <RootLayout>
      <SentenceEditor
        sentence={sentence}
        onSave={handleSave}
        onBack={handleBack}
        tagSuggestions={tagSuggestions}
      />
    </RootLayout>
  );
}
