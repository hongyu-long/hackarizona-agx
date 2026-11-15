// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { defaults } from './risk';
import { EvaluationCasesPanel } from './EvaluationCasesPanel';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('replays the supplied weather cases separately from forecasts and live readings', async () => {
  const header = 'timestamp,temperature_5ft_C,temperature_30ft_C,wind_speed_5ft_mph,wind_speed_30ft_mph,wind_direction_5ft_deg,wind_direction_30ft_deg';
  const arizona = `${header}\n2026-06-01 00:00:00,22.86,24.81,5.47,7.2,233.5,215.9\n2026-06-02 00:10:00,22.06,22.06,3.29,2.63,233.4,196.2`;
  const missouri = `${header}\n2026-06-01 00:00:00,19.4,20.68,5.55,9.21,230.7,253.3`;
  const fetch = vi.fn(async (url: string) => new Response(url.includes('missouri') ? missouri : arizona));
  vi.stubGlobal('fetch', fetch);

  render(<EvaluationCasesPanel config={defaults}/>);
  expect(await screen.findByText('Case 1 of 2')).toBeTruthy();
  expect(screen.getByText(/not a future inversion forecast or TabPFN output/)).toBeTruthy();
  expect(screen.getByText(/approximate 95% confidence interval/)).toBeTruthy();
  expect(screen.getByText('22.86')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Next case' }));
  expect(screen.getByText('Case 2 of 2')).toBeTruthy();
  await waitFor(() => expect(screen.getAllByText('22.06')).toHaveLength(2));

  fireEvent.change(screen.getByLabelText('Test dataset'), { target: { value: 'missouri' } });
  expect(await screen.findByText('Case 1 of 1')).toBeTruthy();
  expect(screen.getByText('19.4')).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(2);
});
