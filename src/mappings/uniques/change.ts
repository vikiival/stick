import { getOrFail as get } from '@kodadot1/metasquid/entity'
import { CollectionEntity as CE } from '../../model'
import { unwrap } from '../utils/extract'
import { debug, pending, success } from '../utils/logger'
import { Action, Context } from '../utils/types'
import { getChangeCollectionOwnerEvent } from './getters'

const OPERATION = Action.CHANGEISSUER

/**
 * Handle the collection owner change event (Uniques.OwnerChanged)
 * Changes the owner of the collection
 * Logs Action.CHANGEISSUER event
 * @param context - the context for the event
 **/
export async function handleCollectionOwnerChange(context: Context): Promise<void> {
  pending(OPERATION, `${context.block.height}`)
  const event = unwrap(context, getChangeCollectionOwnerEvent)
  debug(OPERATION, event)

  const entity = await get(context.store, CE, event.id)
  entity.currentOwner = event.owner

  success(OPERATION, `${event.id} by ${event.caller}`)
  await context.store.save(entity)
}
