import { create as createEntity } from '@kodadot1/metasquid/entity'
import md5 from 'md5'
import { Store } from '../../utils/types'
import { CollectionEntity as CE, NFTEntity as NE, TokenEntity as TE } from '../../../model'
import { debug } from '../../utils/logger'
import { OPERATION, generateTokenId, mediaOf, tokenName } from './utils'

export class TokenAPI {
  constructor(private store: Store) {}

  async create(collection: CE, nft: NE): Promise<TE | undefined> {
    const nftMedia = mediaOf(nft) ?? mediaOf(collection)
    if (!nftMedia) {
      return
    }
    const tokenId = generateTokenId(collection.id, nftMedia)
    debug(OPERATION, { createToken: `Create TOKEN ${tokenId} for NFT ${nft.id}` })

    const token = createEntity(TE, tokenId, {
      createdAt: nft.createdAt,
      collection,
      name: tokenName(nft.name, collection.id),
      count: 1,
      supply: 1,
      hash: md5(tokenId),
      image: nft.image ?? collection.image,
      media: nft.media ?? collection.media,
      metadata: nft.metadata ?? collection.metadata,
      meta: nft.meta ?? collection.meta,
      blockNumber: nft.blockNumber,
      updatedAt: nft.updatedAt,
      id: tokenId,
    })

    await this.store.save(token)
    await this.store.update(NE, nft.id, { token })

    return token
  }

  async removeNftFromToken(nft: NE, token: TE): Promise<void> {
    if (!token) {
      return
    }
    debug(OPERATION, { removeNftFromToken: `Unlink NFT ${nft.id} from  TOKEN ${token.id}` })

    await this.store.update(NE, nft.id, { token: null })
    const updatedCount = token.count - 1
    await this.store.update(TE, token.id, {
      supply: token.supply - 1,
      count: updatedCount,
      updatedAt: nft.updatedAt,
    })

    if (updatedCount === 0) {
      debug(OPERATION, { deleteEmptyToken: `delete empty token ${token.id}` })

      await this.store.delete(TE, token.id)
    }
  }

  async addNftToToken(nft: NE | NE[], token: TE): Promise<TE> {
    let nftsToUpdate = Array.isArray(nft) ? nft : [nft]
    debug(OPERATION, { updateToken: `Adding ${nftsToUpdate.length} NFT(s) to TOKEN ${token.id}` })

    const updatedCount = token.count + nftsToUpdate.length
    const updatedSupply = token.supply + nftsToUpdate.length
    token.count = updatedCount
    token.supply = updatedSupply
    token.updatedAt = new Date()
    await this.store.save(token)

    // Batch update NFT entities
    const nftUpdates = nftsToUpdate.map((nft) => ({
      ...nft,
      token,
    }))
    await this.store.save(NE, nftUpdates)

    return token
  }
}
