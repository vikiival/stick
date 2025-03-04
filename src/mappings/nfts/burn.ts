import { getOptional, getWith } from '@kodadot1/metasquid/entity'
import { NFTEntity as NE, TradeStatus, Swap } from '../../model'
import { unwrap } from '../utils/extract'
import { debug, pending, success } from '../utils/logger'
import { Action, Context, createTokenId } from '../utils/types'
import { createEvent } from '../shared/event'
import { calculateCollectionFloor, calculateCollectionOwnerCountAndDistribution } from '../utils/helper'
import { burnHandler } from '../shared/token'
import { getBurnTokenEvent } from './getters'

const OPERATION = Action.BURN

/**
 * Handle the token burn event (Nfts.Burned)
 * Marks the token as burned
 * Logs Action.BURN event
 * @param context - the context for the event
**/
export async function handleTokenBurn(context: Context): Promise<void> {
  pending(OPERATION, `${context.block.height}`)
  const event = unwrap(context, getBurnTokenEvent)
  debug(OPERATION, event)

  const id = createTokenId(event.collectionId, event.sn)
  const entity = await getWith(context.store, NE, id, { collection: true })

  const { floor } = await calculateCollectionFloor(context.store, entity.collection.id, id)
  const { ownerCount, distribution } = await calculateCollectionOwnerCountAndDistribution(
    context.store,
    entity.collection.id,
    entity.currentOwner
  )

  entity.burned = true
  entity.updatedAt = event.timestamp

  entity.collection.supply -= 1
  entity.collection.floor = floor
  entity.collection.ownerCount = ownerCount
  entity.collection.distribution = distribution
  entity.collection.updatedAt = event.timestamp

  await burnHandler(context, entity)

  success(OPERATION, `${id} by ${event.caller}`)
  await context.store.save(entity)
  await context.store.save(entity.collection)
  const meta = entity.metadata ?? ''
  await createEvent(entity, OPERATION, event, meta, context.store)

  const swap = await getOptional(context.store, Swap, id)
  if (swap && swap.status === TradeStatus.ACTIVE) {
    swap.status = TradeStatus.CANCELLED
    swap.updatedAt = event.timestamp
    await context.store.save(swap)
  }
}
