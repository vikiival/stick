import { warn } from 'node:console'
import { create, getOptional } from '@kodadot1/metasquid/entity'
import md5 from 'md5'
import { CollectionEntity as CE, NFTEntity as NE } from '../../model'
import { createEvent } from '../shared/event'
import { handleMetadata } from '../shared/metadata'
import { unwrap } from '../utils/extract'
import { debug, pending, success } from '../utils/logger'
import { Action, Context, createTokenId } from '../utils/types'
import { calculateCollectionOwnerCountAndDistribution, tokenUri, versionOf } from '../utils/helper'
import { mintHandler } from '../shared/token'
import { getCreateTokenEvent } from './getters'

const OPERATION = Action.MINT

/**
 * Handle the token create event (Nfts.Issued)
 * Creates a new token
 * Logs Action.MINT event
 * @param context - the context for the event
 **/
export async function handleTokenCreate(context: Context): Promise<void> {
  pending(OPERATION, context.block.height.toString())
  const event = unwrap(context, getCreateTokenEvent)
  debug(OPERATION, event)
  const id = createTokenId(event.collectionId, event.sn)
  const collection = await getOptional<CE>(context.store, CE, event.collectionId)

  if (!collection) {
    warn(OPERATION, `collection ${event.collectionId} not found`)
    return
  }

  const final = create(NE, id, {})
  // plsBe(real, collection);
  // plsBe(remintable, final);

  final.id = id
  final.hash = md5(id)
  final.issuer = event.caller
  final.currentOwner = event.owner
  final.blockNumber = BigInt(event.blockNumber)
  final.collection = collection
  final.sn = BigInt(event.sn)
  final.metadata = event.metadata || tokenUri(collection.baseUri, event.sn) || collection.metadata
  final.price = null
  final.burned = false
  final.createdAt = event.timestamp
  final.updatedAt = event.timestamp
  final.lewd = false
  final.version = versionOf(context)
  final.recipient = collection.recipient
  final.royalty = collection.royalty

  collection.updatedAt = event.timestamp
  collection.nftCount += 1
  collection.supply += 1
  const { ownerCount, distribution } = await calculateCollectionOwnerCountAndDistribution(
    context.store,
    collection.id,
    final.currentOwner
  )
  collection.ownerCount = ownerCount
  collection.distribution = distribution

  if (final.metadata) {
    const metadata = await handleMetadata(final.metadata, context.store)
    final.meta = metadata
    final.name = metadata?.name
    final.image = metadata?.image
    final.media = metadata?.animationUrl

    await mintHandler(context, collection, final)
  }

  success(OPERATION, `${final.id}`)
  await context.store.save(final)
  await context.store.save(collection)
  

  await createEvent(
    final,
    OPERATION,
    event,
    context.call?.args?.witnessData?.mintPrice || '0',
    context.store,
    final.issuer !== final.currentOwner ? final.issuer : undefined
  )
}
