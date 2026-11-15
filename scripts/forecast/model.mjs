import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

export async function runModel(inputPath, outputPath, experiment) {
  if (!process.env.FORECAST_PYTHON) return { model: null, error: 'TabPFN not run. Set FORECAST_PYTHON to a Python executable with TabPFN installed.' };
  const run = spawnSync(process.env.FORECAST_PYTHON, ['scripts/forecast/tabpfn_runner.py', inputPath, outputPath], { encoding: 'utf8', timeout: 300000 });
  if (run.status !== 0) {
    const policyBlocked = String(run.stderr).includes('Application Control policy');
    return { model: null, error: policyBlocked ? 'Windows Application Control blocked a numerical-library DLL; TabPFN could not run.' : `TabPFN execution failed (${run.error?.code ?? run.status}); verify local dependencies and model access.` };
  }
  const model = JSON.parse(await readFile(outputPath, 'utf8'));
  if (typeof model.version !== 'string' || !model.version) throw new Error('Missing model version.');
  for (const name of ['validation', 'test']) {
    const rows = experiment[name], predictions = model[name];
    if (!Array.isArray(predictions) || predictions.length !== rows.length || predictions.some((p, i) => p.id !== rows[i].id || typeof p.probability !== 'number' || !Number.isFinite(p.probability) || p.probability < 0 || p.probability > 1)) throw new Error('Model output does not match evaluation cases.');
  }
  return { model, error: null };
}
