import type { ParameterProfile } from '@shared/types/parameters';

export interface ParametersGateway {
  fetchParameters(): Promise<ParameterProfile[]>;
}
