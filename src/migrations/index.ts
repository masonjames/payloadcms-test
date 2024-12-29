import * as migration_20241221_130412_initial from './20241221_130412_initial';
import * as migration_20241229_012725 from './20241229_012725';

export const migrations = [
  {
    up: migration_20241221_130412_initial.up,
    down: migration_20241221_130412_initial.down,
    name: '20241221_130412_initial',
  },
  {
    up: migration_20241229_012725.up,
    down: migration_20241229_012725.down,
    name: '20241229_012725'
  },
];
