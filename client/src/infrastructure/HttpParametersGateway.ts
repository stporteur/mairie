import type { ParameterProfile } from '@shared/types/parameters';
import type { ParametersGateway } from '@/ports/ParametersGateway';

export class HttpParametersGateway implements ParametersGateway {
  async fetchParameters(): Promise<ParameterProfile[]> {
    const response = await fetch('/api/parameters');
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    return await response.json() as ParameterProfile[];
  }
}
