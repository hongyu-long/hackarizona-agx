import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { runModel } from './model.mjs';
import { buildExperiment, score } from '../../src/features/forecast/experiment.ts';
import { parseForecast } from '../../src/features/forecast/artifact.ts';
import { withWeatherContext } from '../../src/features/forecast/context.ts';
import { createHash } from 'node:crypto';

if (existsSync('.env')) process.loadEnvFile('.env');

// Node 22.18+ can execute the erasable TypeScript experiment contract directly.
const paths = process.argv.slice(2);
const sourceFiles = await Promise.all((paths.length ? paths : ['data/forecast/srer-week.json']).map(async path => { const raw = await readFile(path, 'utf8'); return { path, sha256: createHash('sha256').update(raw).digest('hex'), catalog: JSON.parse(raw) }; }));
const catalogs = sourceFiles.map(file => file.catalog);
const experiment = buildExperiment(catalogs);
await mkdir('outputs/forecast', { recursive: true });
let contextInput = null;
if (process.env.FORECAST_CONTEXT) contextInput = JSON.parse(await readFile(process.env.FORECAST_CONTEXT, 'utf8'));
await writeFile('outputs/forecast/experiment.json', JSON.stringify(experiment, null, 2));
const baseline = score(experiment.test, experiment.test.map(r => r.persistence));
const { model, error: modelError } = await runModel('outputs/forecast/experiment.json', 'outputs/forecast/model.json', experiment);
// Select on validation error count; ties retain the simpler baseline. Never select on test results.
let selected = 'persistence';
let modelTest = null;
if (model) {
  const validation = score(experiment.validation, model.validation.map(p => Number(p.probability >= 0.5)));
  const baselineValidation = score(experiment.validation, experiment.validation.map(r => r.persistence));
  if (validation.cases && validation.missed + validation.falseAlarms < baselineValidation.missed + baselineValidation.falseAlarms) selected = 'TabPFN';
  modelTest = score(experiment.test, model.test.map(p => Number(p.probability >= 0.5)));
}
const generatedAt = new Date().toISOString();
const forecasts = experiment.test.map((r, i) => parseForecast({ schemaVersion: 1, state: 'available', site: r.site, cutoff: r.cutoff, targetEnd: r.targetEnd, generatedAt, source: 'NEON', inputReferences: r.provenance.inputs.map(input => `${r.site}/${input.start}/${input.end}`), provenance: r.provenance, limitations: experiment.limitations, predictor: selected, modelVersion: selected === 'TabPFN' ? model.version : 'persistence-1', variant: 'tower', reliability: 'uncalibrated', inputQuality: 'passed', prediction: selected === 'TabPFN' ? Number(model.test[i].probability >= 0.5) : r.persistence, ...(selected === 'TabPFN' ? { probability: model.test[i].probability } : {}) }));
const report = { schemaVersion: 1, generatedAt, rawRecords: experiment.rawRecords, examples: experiment.examples.length, partitions: { train: experiment.train.length, validation: experiment.validation.length, test: experiment.test.length }, exclusions: experiment.rawRecords - experiment.examples.length, sources: experiment.sources, featureNames: experiment.featureNames, split: experiment.split, threshold: 0.5, selection: 'Fewer validation classification errors; ties retain persistence.', selected, baseline, modelTest, modelError, limitations: experiment.limitations, forecasts };
report.sourceFiles = sourceFiles.map(({ path, sha256 }) => ({ path, sha256 }));
if (contextInput) {
  const contextExperiment = { ...experiment, featureNames: [...experiment.featureNames, 'cloudPercent'], train: withWeatherContext(experiment.train, contextInput), validation: withWeatherContext(experiment.validation, contextInput), test: withWeatherContext(experiment.test, contextInput) };
  await writeFile('outputs/forecast/context-experiment.json', JSON.stringify(contextExperiment, null, 2));
  // Retain exact context provenance alongside its matched examples.
  await writeFile('outputs/forecast/context-source.json', JSON.stringify(contextInput, null, 2));
  const matchedIds = new Set(contextExperiment.test.map(r => r.id));
  const towerMatched = experiment.test.filter(r => matchedIds.has(r.id));
  report.contextComparison = { cases: towerMatched.length, baseline: score(towerMatched, towerMatched.map(r => r.persistence)), towerModel: model ? score(towerMatched, model.test.filter(p => matchedIds.has(p.id)).map(p => Number(p.probability >= 0.5))) : null, contextModel: null, error: 'Context model not run.' };
  if (process.env.FORECAST_PYTHON && contextExperiment.train.length && contextExperiment.validation.length && contextExperiment.test.length) {
    const { model: result, error } = await runModel('outputs/forecast/context-experiment.json', 'outputs/forecast/context-model.json', contextExperiment);
    report.contextComparison.error = error;
    if (result) {
      report.contextComparison.contextModel = score(towerMatched, result.test.map(p => Number(p.probability >= 0.5)));
      report.contextComparison.error = null;
    }
  }
  report.limitations = report.limitations.filter(l => !l.startsWith('Cloud comparison unavailable:'));
  report.limitations.push('Context comparison is exploratory; tower model remains the primary selection experiment. Source availability metadata must be independently verified.');
  report.forecasts.forEach(f => { f.limitations = report.limitations; });
}
await writeFile('outputs/forecast/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, forecasts: `${forecasts.length} forecast records written to outputs/forecast/report.json` }, null, 2));
