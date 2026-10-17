import type { ParameterInput, ParameterProfile } from '@shared/types/parameters';
import type { ParametersGateway } from '@/ports/ParametersGateway';
import { jsonBody, requestJson } from './requestJson';

export class HttpParametersGateway implements ParametersGateway {
  fetchParameters(): Promise<ParameterProfile[]> {
    return requestJson<ParameterProfile[]>('/api/parameters');
  }

  fetchParameter(id: number): Promise<ParameterProfile> {
    return requestJson<ParameterProfile>(`/api/parameters/${id}`);
  }

  createParameter(input: ParameterInput): Promise<ParameterProfile> {
    return requestJson<ParameterProfile>('/api/parameters', jsonBody('POST', input));
  }

  updateParameter(id: number, input: ParameterInput): Promise<ParameterProfile> {
    return requestJson<ParameterProfile>(`/api/parameters/${id}`, jsonBody('PUT', input));
  }

  deleteParameter(id: number): Promise<void> {
    return requestJson<void>(`/api/parameters/${id}`, { method: 'DELETE' });
  }
}
