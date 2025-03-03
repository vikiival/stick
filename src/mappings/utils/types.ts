import {
  DataHandlerContext,
  SubstrateBatchProcessorFields,
  Block as _Block,
  Call as _Call,
  Event as _Event,
  Extrinsic as _Extrinsic,
  type SubstrateBatchProcessor as SubstrateProcessor,
  BlockHeader
} from '@subsquid/substrate-processor'
import { nanoid } from 'nanoid'
// impsort { Interaction } from '../../model/generated/_interaction';
import { Store as SquidStore } from '@subsquid/typeorm-store'
import { EntityManager } from 'typeorm'
import { Logger } from '@subsquid/logger'
import { Attribute } from '../../model/generated/_attribute'

import { Interaction } from '../../model'
import { SetMetadata } from '../nfts/types'
import { COLLECTION_OFFER } from '../../environment'
import { type Attribute as HyperAttribute, attributeFrom as hyperAttributeFrom } from '@kodadot1/hyperdata'

export type BaseCall = {
  caller: string
  blockNumber: string
  timestamp: Date
  name?: string
}
// In case of fire consult this repo:
// https://github.com/subsquid-labs/squid-substrate-template/tree/main

export const fieldSelection = {
  block: {
    timestamp: true
  },
  extrinsic: {
    signature: true,
  },
  call: {
      name: true,
      args: true,
      origin: true
  },
  event: {
      name: true,
      args: true,
  }
} as const

export type SelectedFields = typeof fieldSelection

type Fields = SubstrateBatchProcessorFields<SubstrateProcessor<SelectedFields>>
export type Block = _Block<Fields>
export type Event = _Event<Fields>
export type Call = _Call<Fields>
export type Extrinsic = _Extrinsic<Fields>


export type CollectionInteraction = Interaction.CREATE | Interaction.DESTROY

type OneOfInteraction = Interaction

export function collectionEventFrom(
  interaction: CollectionInteraction,
  basecall: BaseCall,
  meta: string
): IEvent<CollectionInteraction> {
  return eventFrom<CollectionInteraction>(interaction, basecall, meta)
}

/**
 * Check is current entity is NFT
 * @param event - event should satisfy { collectionId: string, sn: string } interface
**/
export function isNFT<T extends SetMetadata>(event: T) {
  return event.sn !== undefined
}

/**
 * Check is current entity is Offer
 * @param event - event should satisfy { collectionId: string, sn: string } interface
**/
export function isOffer<T extends SetMetadata>(event: T): boolean {
  return event.collectionId === COLLECTION_OFFER
}

export function eventFrom<T>(
  interaction: T,
  { blockNumber, caller, timestamp }: BaseCall,
  meta: string,
  currentOwner?: string
): IEvent<T> {
  return {
    interaction,
    blockNumber: BigInt(blockNumber),
    caller,
    currentOwner: currentOwner ?? caller,
    timestamp,
    meta,
  }
}

export function attributeFrom(attribute: HyperAttribute): Attribute {
  return new Attribute(
    {},
    {
      display: attribute.display ? String(attribute.display) : null,
      trait: attribute.trait ? String(attribute.trait) : null,
      value: String(attribute.value),
    }
  )
}

export type ManagedStore = SquidStore & { em: () => EntityManager }
export type Store =  SquidStore // & { em: () => EntityManager }
export type BatchContext<S = Store> = DataHandlerContext<S, Fields>
export type SelectedBlock = Pick<BlockHeader<Fields>, 'height' | 'timestamp' | 'hash'>
export type SelectedEvent = Pick<Event, 'name' | 'args'>
export type SelectedExtrinsic = Pick<Extrinsic, 'signature'>
export type SelectedCall = Pick<Call, 'name' | 'origin' | 'args'>

export type Context<S = Store>  = {
  store: S
  block: SelectedBlock
  event: SelectedEvent
  extrinsic: SelectedExtrinsic | undefined
  call: SelectedCall | undefined
  // log: Logger
}

export type Optional<T> = T | null

export interface IEvent<T = OneOfInteraction> {
  interaction: T
  blockNumber: bigint
  caller: string
  currentOwner: string
  timestamp: Date
  meta: string
}

export type CallWith<T> = BaseCall & T

export type EntityConstructor<T> = {
  new (...args: any[]): T
}

export type WithAmount = {
  amount: bigint
}

export type WithCaller = {
  caller: string
}

export type SomethingWithMeta = {
  metadata: string
}

export type SomethingWithOptionalMeta = {
  metadata?: string
}

export type UnwrapFunc<T> = (ctx: Context) => T
export type SanitizerFunc = (url: string) => string

export function ensure<T>(value: unknown): T {
  return value as T
}

export const createTokenId = (collection: string, id: string): string => `${collection}-${id}`

export const eventId = (id: string, event: Interaction): string => `${id}-${event}-${nanoid()}`

export type TokenMetadata = {
  name?: string
  description: string
  external_url?: string
  image: string
  animation_url?: string
  attributes?: MetadataAttribute[]
}

export type MetadataAttribute = {
  display_type?: DisplayType
  trait_type?: string
  value: number | string
}

export enum DisplayType {
  null,
  'boost_number',
  'number',
  'boost_percentage',
}

export { Interaction as Action } from '../../model'
