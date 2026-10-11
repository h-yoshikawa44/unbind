/**
 * Storybook 用の `@inertiajs/react` モック（.storybook/vite.config.ts のエイリアスで差し替える）。
 * 遷移・送信は実行せず、呼び出しを Actions パネルに記録する。
 */
import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { fn } from 'storybook/test';

export const router = {
  visit: fn().mockName('router.visit'),
  get: fn().mockName('router.get'),
  post: fn().mockName('router.post'),
  put: fn().mockName('router.put'),
  patch: fn().mockName('router.patch'),
  delete: fn().mockName('router.delete'),
  reload: fn().mockName('router.reload'),
};

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Link({ href, onClick, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    event.preventDefault();
    router.visit(href);
  };
  return <a href={href} onClick={handleClick} {...rest} />;
}
