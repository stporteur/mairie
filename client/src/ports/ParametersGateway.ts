import type { ParameterInput, ParameterProfile } from '@shared/types/parameters';

export interface ParametersGateway {
  fetchParameters(): Promise<ParameterProfile[]>;
  fetchParameter(id: number): Promise<ParameterProfile>;
  createParameter(input: ParameterInput): Promise<ParameterProfile>;
  updateParameter(id: number, input: ParameterInput): Promise<ParameterProfile>;
    deleteParameter(id: number): Promise<void>;
  }
