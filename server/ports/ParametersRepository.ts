import type { ParameterProfile } from '../../shared/types/parameters';

export interface ParametersRepository {
  findAll(): Promise<ParameterProfile[]>;
}
