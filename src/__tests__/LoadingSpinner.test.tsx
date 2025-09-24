import '@testing-library/jest-dom/jest-globals'; // Habilita los matchers extra de Testing Library en Jest
import { ComponentProps } from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Reemplazamos el componente animado por un div estático para aislar la lógica de la prueba
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    )
  }
}));

describe('LoadingSpinner', () => {
  it('renders medium size spinner by default', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.border-2') as HTMLElement;

    expect(spinner).toHaveClass('w-8 h-8'); // El tamaño por defecto debe ser mediano
  });

  it('applies custom size and className', () => {
    const { container } = render(<LoadingSpinner size="large" className="custom-class" />);
    const wrapper = container.firstElementChild as HTMLElement;
    const spinner = container.querySelector('.border-2') as HTMLElement;

    expect(wrapper).toHaveClass('custom-class'); // Respeta la clase adicional recibida por props
    expect(spinner).toHaveClass('w-12 h-12'); // El tamaño grande ajusta las dimensiones del spinner
  });
});
