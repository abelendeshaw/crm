import { initialDeals, type CrmDeal } from "./dealsManagementData";

// Simple in-memory store for mock persistence within the session
class MockDealStore {
  private static instance: MockDealStore;
  private _deals: CrmDeal[] = [...initialDeals];
  private _subscribers: ((deals: CrmDeal[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): MockDealStore {
    if (!MockDealStore.instance) {
      MockDealStore.instance = new MockDealStore();
    }
    return MockDealStore.instance;
  }

  public get deals(): CrmDeal[] {
    return this._deals;
  }

  public set deals(newDeals: CrmDeal[]) {
    this._deals = newDeals;
    this._notify();
  }

  public getDeal(id: string): CrmDeal | undefined {
    return this._deals.find(d => d.id === id);
  }

  public subscribe(callback: (deals: CrmDeal[]) => void) {
    this._subscribers.push(callback);
    return () => {
      this._subscribers = this._subscribers.filter(s => s !== callback);
    };
  }

  private _notify() {
    this._subscribers.forEach(s => s(this._deals));
  }
}

export const mockDealStore = MockDealStore.getInstance();
