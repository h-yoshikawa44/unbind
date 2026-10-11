import { composeStories } from '@storybook/react-vite';
// テストでは @inertiajs/react がこのモックに差し替わる（vite.config.ts の test.alias）。型もモックとして扱うため直接 import する。
import { router } from '../../.storybook/mocks/inertia';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import * as stories from './Error.stories';

const { Default } = composeStories(stories);

describe('Error ページ', () => {
  it('message をアラートとして表示する', () => {
    render(<Default message="KV の読み込みに失敗しました。" />);
    expect(screen.getByRole('alert')).toHaveTextContent('KV の読み込みに失敗しました。');
  });

  it('「一覧へ戻る」で一覧へ遷移する', async () => {
    const user = userEvent.setup();
    render(<Default />);

    const link = screen.getByRole('link', { name: '一覧へ戻る' });
    expect(link).toHaveAttribute('href', '/');
    await user.click(link);

    expect(router.visit).toHaveBeenCalledWith('/');
  });

  it('ヘッダのロゴからも一覧へ遷移する', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.click(screen.getByRole('link', { name: 'Unbind' }));

    expect(router.visit).toHaveBeenCalledWith('/');
  });
});
