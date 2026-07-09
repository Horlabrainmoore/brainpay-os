// providers/registry/ProviderRegistry.ts
import { WorkflowProvider } from "../base/WorkflowProvider";
import { BuyProvider } from "packages/buy-crypto/src/types/BuyProvider";

export class ProviderRegistry {
  private workflowProviders = new Map<string, WorkflowProvider>();
  private buyProviders = new Map<string, BuyProvider>();
  private blockchainProviders = new Map<string, any>();
  private walletProviders = new Map<string, any>();

  registerWorkflowProvider(name: string, provider: WorkflowProvider): void {
    this.workflowProviders.set(name, provider);
  }

  registerBuyProvider(name: string, provider: BuyProvider): void {
    this.buyProviders.set(name, provider);
  }

  registerBlockchainProvider(name: string, provider: any): void {
    this.blockchainProviders.set(name, provider);
  }

  registerWalletProvider(name: string, provider: any): void {
    this.walletProviders.set(name, provider);
  }

  getWorkflowProvider(name: string): WorkflowProvider {
    const p = this.workflowProviders.get(name);
    if (!p) throw new Error(`Workflow provider not found: ${name}`);
    return p;
  }

  getBuyProvider(name: string): BuyProvider {
    const p = this.buyProviders.get(name);
    if (!p) throw new Error(`Buy provider not found: ${name}`);
    return p;
  }

  getBlockchainProvider(name: string): any {
    const p = this.blockchainProviders.get(name);
    if (!p) throw new Error(`Blockchain provider not found: ${name}`);
    return p;
  }

  getWalletProvider(name: string): any {
    const p = this.walletProviders.get(name);
    if (!p) throw new Error(`Wallet provider not found: ${name}`);
    return p;
  }

  listWorkflowProviders(): string[] {
    return Array.from(this.workflowProviders.keys());
  }

  listBuyProviders(): string[] {
    return Array.from(this.buyProviders.keys());
  }

  listBlockchainProviders(): string[] {
    return Array.from(this.blockchainProviders.keys());
  }

  listWalletProviders(): string[] {
    return Array.from(this.walletProviders.keys());
  }
}

export const globalProviderRegistry = new ProviderRegistry();
