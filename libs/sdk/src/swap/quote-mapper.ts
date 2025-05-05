import { FusionPlusQuoteReceiveDto, FusionQuoteReceiveDto, IQuote } from '@1inch-community/models'

export function quoteMapper(dto: FusionQuoteReceiveDto | FusionPlusQuoteReceiveDto): IQuote {
  let toTokenAmount = '0'
  let recommendedPresetName = ''
  if ('toTokenAmount' in dto) {
    toTokenAmount = dto.toTokenAmount
  }
  if ('dstTokenAmount' in dto) {
    toTokenAmount = dto.dstTokenAmount
  }
  if ('recommended_preset' in dto) {
    recommendedPresetName = dto.recommended_preset
  }
  if ('recommendedPreset' in dto) {
    recommendedPresetName = dto.recommendedPreset
  }
  return {
    toTokenAmount,
    recommendedPresetName,
    presets: dto.presets,
    autoSlippage: dto.autoK,
  }
}
