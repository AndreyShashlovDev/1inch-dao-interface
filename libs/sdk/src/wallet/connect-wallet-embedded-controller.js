import { Subject } from 'rxjs'
import { adapterId } from './adapter-id'
import { UniversalBrowserExtensionAdapter } from './adapters/universal-browser-extension-adapter'
import { GlobalDataAdapter } from './global-data-adapter'
import { getInjectedProviderDetail } from './injected-provider-detail'
export class ConnectWalletEmbeddedController {
  config
  currentActiveAdapter = null
  activeAdapters = new Map()
  data = new GlobalDataAdapter(this)
  update$ = new Subject()
  get isConnected() {
    return true
  }
  get connectedWalletInfo() {
    return this.currentActiveAdapter?.info ?? null
  }
  constructor(config) {
    this.config = config
  }
  async init() {
    if (!this.config.walletProvider) return
    const injectedProviderDetail = await getInjectedProviderDetail(this.config.walletProvider)
    const id = adapterId(injectedProviderDetail.info)
    const adapter = new UniversalBrowserExtensionAdapter(injectedProviderDetail)
    this.activeAdapters.set(id, adapter)
    await adapter.connect(this.config.chainId)
    this.currentActiveAdapter = adapter
    this.update$.next()
  }
  async getSupportedWallets() {
    const injectedProviderDetail = await getInjectedProviderDetail(this.config.walletProvider)
    return [injectedProviderDetail.info]
  }
  async writeContract(params) {
    if (!this.currentActiveAdapter || !this.currentActiveAdapter.client) {
      throw new Error('Wallet not connected')
    }
    return await this.currentActiveAdapter.writeContract(params)
  }
  async signTypedData(typeData) {
    if (!this.currentActiveAdapter || !this.currentActiveAdapter.client) {
      throw new Error('Wallet not connected')
    }
    return await this.currentActiveAdapter.signTypedData(typeData)
  }
  setChainIds(chainIds) {
    this.data.setChainIds(chainIds)
  }
  connect(info) {
    throw new Error('Method not implemented.')
  }
  addConnection(info) {
    throw new Error('Method not implemented.')
  }
  disconnect() {
    throw new Error('Method not implemented.')
  }
  getDataAdapter(info) {
    throw new Error('Method not implemented.')
  }
  setActiveAddress(info, address) {
    throw new Error('Method not implemented.')
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdC13YWxsZXQtZW1iZWRkZWQtY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbm5lY3Qtd2FsbGV0LWVtYmVkZGVkLWNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQTtBQU85QixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQTtBQUN6RCxPQUFPLEVBQUUseUJBQXlCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTtBQUN0RSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBQ3hDLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRSxNQUFNLGdEQUFnRCxDQUFBO0FBRWpHLE1BQU0sT0FBTywrQkFBK0I7SUFlYjtJQWQ3QixvQkFBb0IsR0FBMEIsSUFBSSxDQUFBO0lBQ2xELGNBQWMsR0FBZ0MsSUFBSSxHQUFHLEVBQUUsQ0FBQTtJQUU5QyxJQUFJLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNsQyxPQUFPLEdBQWtCLElBQUksT0FBTyxFQUFRLENBQUE7SUFFckQsSUFBSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsSUFBSSxtQkFBbUI7UUFDckIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQTtJQUNoRCxDQUFDO0lBRUQsWUFBNkIsTUFBK0I7UUFBL0IsV0FBTSxHQUFOLE1BQU0sQ0FBeUI7SUFBRyxDQUFDO0lBRWhFLEtBQUssQ0FBQyxJQUFJO1FBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYztZQUFFLE9BQU07UUFDdkMsTUFBTSxzQkFBc0IsR0FBRyxNQUFNLHlCQUF5QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDMUYsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2pELE1BQU0sT0FBTyxHQUFHLElBQUksZ0NBQWdDLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtRQUM1RSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDcEMsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDMUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLE9BQU8sQ0FBQTtRQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQ3JCLENBQUM7SUFFRCxLQUFLLENBQUMsbUJBQW1CO1FBQ3ZCLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBQzFGLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN0QyxDQUFDO0lBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUErQjtRQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3BFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtRQUN6QyxDQUFDO1FBQ0QsT0FBTyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDOUQsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBaUM7UUFDbkQsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwRSxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUE7UUFDekMsQ0FBQztRQUNELE9BQU8sTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBQ2hFLENBQUM7SUFFRCxXQUFXLENBQUMsUUFBbUI7UUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDakMsQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUF5QjtRQUMvQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUE7SUFDNUMsQ0FBQztJQUVELGFBQWEsQ0FBQyxJQUF5QjtRQUNyQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUE7SUFDNUMsQ0FBQztJQUVELFVBQVU7UUFDUixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUE7SUFDNUMsQ0FBQztJQUVELGNBQWMsQ0FBQyxJQUF5QjtRQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUE7SUFDNUMsQ0FBQztJQUVELGdCQUFnQixDQUFDLElBQXlCLEVBQUUsT0FBZ0I7UUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO0lBQzVDLENBQUM7Q0FDRiJ9
