import type { SampleOption } from '../samples.config';

export const samples = {
  fakeSampleA: '/fake/sample/a/url.wav',
  fakeSampleB: '/fake/sample/b/url.wav',
} as const;

const sampleOptions: SampleOption[] = [
  {
    name: 'Fake sample A',
    url: samples.fakeSampleA,
  },
  {
    name: 'Fake sample B',
    url: samples.fakeSampleB,
  },
];

export default sampleOptions;
