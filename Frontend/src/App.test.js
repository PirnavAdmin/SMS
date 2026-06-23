import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the admin dashboard sample', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /sample sidebar and admin field layout/i })
  ).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /admin menu/i })).toBeInTheDocument();
});
