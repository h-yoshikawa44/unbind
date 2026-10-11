import type { Preview } from '@storybook/react-vite';
import { clearAllMocks } from 'storybook/test';
import '../src/index.css';

const preview: Preview = {
  // router モックの呼び出し履歴がストーリー間で混ざらないようにする。
  beforeEach() {
    clearAllMocks();
  },
};

export default preview;
