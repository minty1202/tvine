import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { theme } from '@/config/theme/mantine';
import { CollapsiblePanel } from './CollapsiblePanel';
import { resetPanelAtoms } from './store';

function renderWithMantine(ui: React.ReactElement) {
  return render(<MantineProvider theme={theme}>{ui}</MantineProvider>);
}

beforeEach(() => {
  resetPanelAtoms();
});

describe('CollapsiblePanel', () => {
  it('Toggle クリックでパネルの開閉が連動する', async () => {
    const user = userEvent.setup();

    renderWithMantine(
      <>
        <CollapsiblePanel.Toggle
          panelKey="test"
          icon={<span>icon</span>}
          defaultOpened={false}
        />
        <CollapsiblePanel
          panelKey="test"
          title="Test Panel"
          icon={<span>icon</span>}
          defaultOpened={false}
        >
          <div>content</div>
        </CollapsiblePanel>
      </>,
    );

    // 初期状態: 閉じている → ClosedBar が表示
    expect(screen.getByText('Test Panel')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();

    // Toggle クリックで開く
    await user.click(screen.getByTitle('test'));
    expect(screen.getByText('content')).toBeInTheDocument();

    // 再クリックで閉じる
    await user.click(screen.getByTitle('test'));
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('閉じた状態のバーをクリックで開く', async () => {
    const user = userEvent.setup();

    renderWithMantine(
      <CollapsiblePanel
        panelKey="bar"
        title="Bar Panel"
        icon={<span>icon</span>}
        defaultOpened={false}
      >
        <div>bar content</div>
      </CollapsiblePanel>,
    );

    expect(screen.queryByText('bar content')).not.toBeInTheDocument();

    // ClosedBar をクリック
    await user.click(screen.getByText('Bar Panel'));
    expect(screen.getByText('bar content')).toBeInTheDocument();
  });

  it('開いた状態のヘッダーをクリックで閉じる', async () => {
    const user = userEvent.setup();

    renderWithMantine(
      <CollapsiblePanel
        panelKey="header"
        title="Header Panel"
        icon={<span>icon</span>}
        defaultOpened
      >
        <div>header content</div>
      </CollapsiblePanel>,
    );

    expect(screen.getByText('header content')).toBeInTheDocument();

    // Header をクリックで閉じる
    await user.click(screen.getByText('Header Panel'));
    expect(screen.queryByText('header content')).not.toBeInTheDocument();
  });
});
