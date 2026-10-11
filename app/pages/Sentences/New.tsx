import { router } from '@inertiajs/react';
import type { PageProps } from '../../pages.gen';
import { RootLayout } from '@/layouts/RootLayout';
import { SentenceForm } from '@/components/SentenceForm/SentenceForm';
import { tokenize } from '@/tokenize';
import { toPayload } from '@/inertia';

export default function New({ tagSuggestions }: PageProps<'Sentences/New'>) {
  const handleSubmit = (text: string, tags: string[]) => {
    const id = crypto.randomUUID();
    const tokens = tokenize(id, text);
    router.post('/sentences', toPayload({ id, text, tokens, tags }));
  };

  const handleCancel = () => {
    router.visit('/');
  };

  return (
    <RootLayout>
      <SentenceForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        tagSuggestions={tagSuggestions}
      />
    </RootLayout>
  );
}
