import { initialDeals, type CrmDeal, DEFAULT_PIPELINE_STAGES, type PipelineStage, type ActivityType } from "./dealsManagementData";

// Simple in-memory store for mock persistence within the session
class MockDealStore {
  private static instance: MockDealStore;
  private _deals: CrmDeal[] = [...initialDeals];
  private _stages: PipelineStage[] = [...DEFAULT_PIPELINE_STAGES];
  
  private _dealsSubscribers: ((deals: CrmDeal[]) => void)[] = [];
  private _stagesSubscribers: ((stages: PipelineStage[]) => void)[] = [];
  private _activityTypesSubscribers: ((types: ActivityType[]) => void)[] = [];

  private _activityTypes: ActivityType[] = [
    { id: "act-type-1", name: "Call", icon: "Phone" },
    { id: "act-type-2", name: "Meeting", icon: "Users" },
    { id: "act-type-3", name: "External", icon: "Globe" },
  ];

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
    this._notifyDeals();
  }

  public get stages(): PipelineStage[] {
    return this._stages;
  }

  public set stages(newStages: PipelineStage[]) {
    this._stages = newStages;
    this._notifyStages();
  }

  public get activityTypes(): ActivityType[] {
    return this._activityTypes;
  }

  public set activityTypes(newTypes: ActivityType[]) {
    this._activityTypes = newTypes;
    this._notifyActivityTypes();
  }

  public getDeal(id: string): CrmDeal | undefined {
    return this._deals.find(d => d.id === id);
  }

  public subscribeDeals(callback: (deals: CrmDeal[]) => void) {
    this._dealsSubscribers.push(callback);
    return () => {
      this._dealsSubscribers = this._dealsSubscribers.filter(s => s !== callback);
    };
  }

  public subscribeStages(callback: (stages: PipelineStage[]) => void) {
    this._stagesSubscribers.push(callback);
    return () => {
      this._stagesSubscribers = this._stagesSubscribers.filter(s => s !== callback);
    };
  }

  public subscribeActivityTypes(callback: (types: ActivityType[]) => void) {
    this._activityTypesSubscribers.push(callback);
    return () => {
      this._activityTypesSubscribers = this._activityTypesSubscribers.filter(s => s !== callback);
    };
  }

  private _notifyDeals() {
    this._dealsSubscribers.forEach(s => s(this._deals));
  }

  private _notifyStages() {
    this._stagesSubscribers.forEach(s => s(this._stages));
  }

  private _notifyActivityTypes() {
    this._activityTypesSubscribers.forEach(s => s(this._activityTypes));
  }
}

export const mockDealStore = MockDealStore.getInstance();
