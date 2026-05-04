import React from 'react';
import i18n from '@/i18n';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="p-8 text-center">{i18n.t('ui.unexpectedError')}</main>
      );
    }
    return this.props.children;
  }
}
