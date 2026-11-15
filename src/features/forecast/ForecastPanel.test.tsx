// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ForecastPanel } from './ForecastPanel';
import { loadForecasts } from './artifact';
import { provenance } from './test-fixture';
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
it('imports a forecast, preserves screening and saves and exports its complete evidence', async () => {
  const forecast = { schemaVersion: 1, state: 'available', site: 'SRER', cutoff: '2024-06-01T10:00:00Z', targetEnd: '2024-06-01T10:30:00Z', generatedAt: '2026-11-15T10:00:00Z', predictor: 'TabPFN', modelVersion: 'test-fixture', variant: 'tower', prediction: 1, probability: 0.72, reliability: 'uncalibrated', inputQuality: 'passed', source: 'NEON', inputReferences: ['SRER/2024-06-01T09:30:00Z'], limitations: ['Historical experiment'] };
  render(<><p>Current screening: STOP</p><ForecastPanel/></>);
  const file = new File(['report'], 'report.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: async () => JSON.stringify({ schemaVersion: 1, forecasts: [{ ...forecast, provenance }] }) });
  fireEvent.change(screen.getByLabelText('Import experiment report'), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByText('Inversion probability: 72.0%')).toBeTruthy());
  expect(screen.getByText(/Reliability: uncalibrated/)).toBeTruthy();
  expect(screen.getByText('Current screening: STOP')).toBeTruthy();
  fireEvent.click(screen.getByText('Save forecast evidence'));
  expect(loadForecasts(localStorage)).toEqual([{ ...forecast, provenance }]);
  const create = vi.fn(() => 'blob:test');
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  fireEvent.click(screen.getByText('Export forecast evidence'));
  expect(create).toHaveBeenCalledOnce();
  vi.unstubAllGlobals();
});
