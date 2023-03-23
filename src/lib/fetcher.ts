import ky from 'ky';

export const kyFetcher = async (url: string) => {
  return ky.get(url).then(res => res.json<string[]>());
};
