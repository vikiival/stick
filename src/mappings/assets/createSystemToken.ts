import { create } from '@kodadot1/metasquid/entity'
import { BlockHandlerContext } from '@subsquid/substrate-processor'
import { AssetEntity } from '../../model'
import { Store } from '../utils/types'
import { pending, success } from '../utils/logger'

const OPERATION = 'ASSET_REGISTER' as any

export async function forceCreateKusamaAsset(context: BlockHandlerContext<Store>): Promise<void> {
  pending(OPERATION, `${context.block.height}`);
  const asset = create<AssetEntity>(AssetEntity, '', {
    name: 'Kusama',
    symbol: 'KSM',
    decimals: 12,
  });
  success(OPERATION,`${asset.id} is ${asset.name || ''}`);
  await context.store.save<AssetEntity>(asset);
}

export async function forceCreateUsdtAsset(context: BlockHandlerContext<Store>): Promise<void> {
  pending(OPERATION, `${context.block.height}`);
  const asset = create<AssetEntity>(AssetEntity, '1984', {
    name: 'Tether USD',
    symbol: 'USDt',
    decimals: 6,
  });
  success(OPERATION,`${asset.id} is ${asset.name || ''}`);
  await context.store.save<AssetEntity>(asset);
}

export async function forceCreateRmrkAsset(context: BlockHandlerContext<Store>): Promise<void> {
  pending(OPERATION, `${context.block.height}`);
  const asset = create<AssetEntity>(AssetEntity, '8', {
    name: 'RMRK.app',
    symbol: 'RMRK',
    decimals: 10,
  });
  success(OPERATION,`${asset.id} is ${asset.name || ''}`);
  await context.store.save<AssetEntity>(asset);
}