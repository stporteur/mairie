import type { ParameterInput, ParameterProfile } from '../../shared/types/parameters';

export interface ParametersRepository {
  findAll(): Promise<ParameterProfile[]>;
  findById(id: number): Promise<ParameterProfile | null>;
  create(input: ParameterInput): Promise<ParameterProfile>;
  /** Resolves to null when the profile does not exist. */
  update(id: number, input: ParameterInput): Promise<ParameterProfile | null>;
  /** Resolves to false when the profile does not exist. */
  delete(id: number): Promise<boolean>;
}
