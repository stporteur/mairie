import { loadEnvFile } from './infrastructure/loadEnvFile';
import { createOrm } from './infrastructure/persistence/createOrm';
import { MikroOrmParametersRepository } from './infrastructure/persistence/MikroOrmParametersRepository';

async function main(): Promise<void> {
  loadEnvFile();
  const orm = await createOrm();
  try {
    const profiles = await new MikroOrmParametersRepository(orm).findAll();
    console.log(JSON.stringify(profiles, null, 2));
  } finally {
    await orm.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
