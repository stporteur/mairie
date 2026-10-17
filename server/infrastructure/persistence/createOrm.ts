import { MikroORM } from '@mikro-orm/postgresql';
import type { EntitySchema } from '@mikro-orm/core';
import { readDatabaseConfig, type DatabaseConfig } from './databaseConfig';
import { entities } from './entities';

/**
 * The schema is owned by Liquibase (see /db): MikroORM only maps and queries it,
 * it must never create or alter tables.
 */
export async function createOrm(
  config: DatabaseConfig = readDatabaseConfig(),
  mappedEntities: EntitySchema<any>[] = entities,
) {
  return MikroORM.init({
    ...config,
    entities: mappedEntities,
    discovery: { warnWhenNoEntities: false },
  });
}

export type Orm = Awaited<ReturnType<typeof createOrm>>;
