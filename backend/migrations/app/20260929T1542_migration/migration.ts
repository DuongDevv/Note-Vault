#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4cbbe9e64f1b04f6ee81cf1c679a51128b617fce726fe1bd6b29bc5d89e36965/contract';
import startContract from '../../snapshots/4cbbe9e64f1b04f6ee81cf1c679a51128b617fce726fe1bd6b29bc5d89e36965/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8f35143e3f6210b8a971696b46eec301147791bcda1e997a2d43117eb184db10/contract';
import endContract from '../../snapshots/8f35143e3f6210b8a971696b46eec301147791bcda1e997a2d43117eb184db10/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'topics', column: 'color' }),
      this.dropColumn({ schema: 'public', table: 'topics', column: 'icon' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
