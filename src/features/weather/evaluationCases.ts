import arizonaUrl from '../../../DataEvaluation/data_arizona_orchard_weather.csv?url';
import missouriUrl from '../../../DataEvaluation/missouri_statewide_weather.csv?url';

export type EvaluationCase = {
  timestamp: string;
  observedAt: string;
  lowerTemperatureC: number;
  upperTemperatureC: number;
  lowerWindMph: number;
  upperWindMph: number;
  lowerDirectionDeg: number;
  upperDirectionDeg: number;
};

export type EvaluationDataset = {
  id: 'arizona' | 'missouri';
  name: string;
  records: EvaluationCase[];
};

type DatasetSource = { id: EvaluationDataset['id']; name: string; url: string };
type CsvResponse = Pick<Response, 'ok' | 'text'>;
type CsvFetcher = (url: string) => Promise<CsvResponse>;

const sources: DatasetSource[] = [
  { id: 'arizona', name: 'Arizona orchard test cases', url: arizonaUrl },
  { id: 'missouri', name: 'Missouri statewide test cases', url: missouriUrl }
];

const columns = [
  'timestamp',
  'temperature_5ft_C',
  'temperature_30ft_C',
  'wind_speed_5ft_mph',
  'wind_speed_30ft_mph',
  'wind_direction_5ft_deg',
  'wind_direction_30ft_deg'
];

function timestampToIso(value: string, rowNumber: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid timestamp on CSV row ${rowNumber}.`);
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day ||
    date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) {
    throw new Error(`Invalid timestamp on CSV row ${rowNumber}.`);
  }
  return date.toISOString();
}

export function parseEvaluationCsv(csv: string): EvaluationCase[] {
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  if (header?.split(',').join('|') !== columns.join('|') || !lines.length) {
    throw new Error('Evaluation CSV has an unexpected header or no cases.');
  }

  return lines.map((line, index) => {
    const rowNumber = index + 2;
    const values = line.split(',');
    if (values.length !== columns.length) throw new Error(`Invalid field count on CSV row ${rowNumber}.`);
    const numbers = values.slice(1).map(Number);
    if (numbers.some(value => !Number.isFinite(value))) throw new Error(`Invalid numeric value on CSV row ${rowNumber}.`);
    const [lowerTemperatureC, upperTemperatureC, lowerWindMph, upperWindMph, lowerDirectionDeg, upperDirectionDeg] = numbers;
    if (lowerWindMph < 0 || upperWindMph < 0 ||
      lowerDirectionDeg < 0 || lowerDirectionDeg > 360 || upperDirectionDeg < 0 || upperDirectionDeg > 360) {
      throw new Error(`Out-of-range weather value on CSV row ${rowNumber}.`);
    }

    return {
      timestamp: values[0],
      observedAt: timestampToIso(values[0], rowNumber),
      lowerTemperatureC,
      upperTemperatureC,
      lowerWindMph,
      upperWindMph,
      lowerDirectionDeg,
      upperDirectionDeg
    };
  });
}

export async function loadEvaluationDatasets(fetchCsv: CsvFetcher = url => fetch(url)): Promise<EvaluationDataset[]> {
  return Promise.all(sources.map(async source => {
    const response = await fetchCsv(source.url);
    if (!response.ok) throw new Error(`Unable to load ${source.name}.`);
    return { id: source.id, name: source.name, records: parseEvaluationCsv(await response.text()) };
  }));
}
