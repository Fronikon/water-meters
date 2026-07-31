import apiClient from './client.ts';
import type { MetersResponse, RawArea } from '../types/meters.ts';

/**
 * GET /meters/?limit=<limit>&offset=<offset>
 */
export async function fetchMeters(
  limit: number,
  offset: number
): Promise<MetersResponse> {
  const response = await apiClient.get<MetersResponse>('meters/', {
    params: { limit, offset },
  });
  return response.data;
}

/**
 * GET /areas/ с повторяющимся параметром id__in.
 * Пример: /areas/?id__in=id1&id__in=id2
 */
export async function fetchAreas(ids: string[]): Promise<RawArea[]> {
  if (ids.length === 0) return [];

  const params = new URLSearchParams();
  for (const id of ids) {
    params.append('id__in', id);
  }

  const response = await apiClient.get<{
    count: number;
    results: RawArea[];
  }>('areas/', {
    params,
    paramsSerializer: () => params.toString(),
  });

  return response.data.results;
}

/**
 * DELETE /meters/<id>/
 */
export async function deleteMeter(id: string): Promise<void> {
  await apiClient.delete(`meters/${id}/`);
}
